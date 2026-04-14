/**
 * wiki-check.ts — Lint + quality check for LLM-wikis
 *
 * Runs all mechanical checks in one pass:
 *   - Dead [[wikilinks]]
 *   - Orphan pages (not linked from anywhere)
 *   - Missing frontmatter (title, type)
 *   - Source path validation (paths in frontmatter match actual files)
 *   - Word count minimums (from wiki.config.md)
 *   - Link density (concepts must link to >= 3 pages)
 *
 * Usage:
 *   bun run scripts/wiki-check.ts                  # check wiki/ in current dir
 *   bun run scripts/wiki-check.ts /path/to/wiki    # check specific wiki dir
 *   bun run scripts/wiki-check.ts --fix            # report only (fix = false, reserved for future)
 *
 * Exit code: 0 if clean, 1 if issues found
 */

import { readdir, readFile, stat } from "fs/promises"
import { join, relative, basename, extname, dirname } from "path"

const projectRoot = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : process.cwd()
const wikiDir = join(projectRoot, "wiki")
const rawDir = join(projectRoot, "raw")
const configPath = join(projectRoot, "wiki.config.md")

// --- Defaults (overridden by wiki.config.md if present) ---

interface QualityRules {
  summaryMin: number
  conceptMin: number
  entityMin: number
  comparisonMin: number
  conceptLinkMin: number
}

const defaultRules: QualityRules = {
  summaryMin: 300,
  conceptMin: 200,
  entityMin: 120,
  comparisonMin: 250,
  conceptLinkMin: 3,
}

// --- Helpers ---

const collectMd = async (dir: string): Promise<string[]> => {
  const results: string[] = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) results.push(...await collectMd(full))
      else if (entry.isFile() && extname(entry.name) === ".md") results.push(full)
    }
  } catch { /* directory doesn't exist */ }
  return results
}

const collectAllFiles = async (dir: string): Promise<string[]> => {
  const results: string[] = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) results.push(...await collectAllFiles(full))
      else if (entry.isFile()) results.push(full)
    }
  } catch { /* directory doesn't exist */ }
  return results
}

const extractFrontmatter = (content: string): Record<string, string | string[]> => {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const fm: Record<string, string | string[]> = {}
  let currentKey = ""
  let currentList: string[] | null = null
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (kv) {
      if (currentList && currentKey) fm[currentKey] = currentList
      currentList = null
      const [, key, value] = kv
      if (value === "") { currentKey = key; currentList = [] }
      else { fm[key] = value.replace(/^["']|["']$/g, ""); currentKey = key }
    } else if (line.match(/^\s+-\s+/) && currentList !== null) {
      currentList.push(line.replace(/^\s+-\s+/, "").replace(/^["']|["']$/g, ""))
    }
  }
  if (currentList && currentKey) fm[currentKey] = currentList
  return fm
}

const countWords = (content: string): number => {
  const body = content.replace(/^---\n[\s\S]*?\n---\n/, "")
  return body.split(/\s+/).filter(w => w.length > 0).length
}

const extractWikilinks = (content: string): string[] => {
  const matches = content.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) ?? []
  return matches.map(m => m.replace(/\[\[|\]\]/g, "").split("|")[0])
}

const parseConfig = async (): Promise<QualityRules> => {
  try {
    const content = await readFile(configPath, "utf-8")
    const rules = { ...defaultRules }
    const summaryMatch = content.match(/[Ss]ummary.*?(\d+)\s*words/)
    const conceptMatch = content.match(/[Cc]oncept.*?(\d+)\s*words/)
    const entityMatch = content.match(/[Ee]ntity.*?(\d+)\s*words/)
    const compMatch = content.match(/[Cc]omparison.*?(\d+)\s*words/)
    const linkMatch = content.match(/link.*?>=?\s*(\d+)/)
    if (summaryMatch) rules.summaryMin = parseInt(summaryMatch[1])
    if (conceptMatch) rules.conceptMin = parseInt(conceptMatch[1])
    if (entityMatch) rules.entityMin = parseInt(entityMatch[1])
    if (compMatch) rules.comparisonMin = parseInt(compMatch[1])
    if (linkMatch) rules.conceptLinkMin = parseInt(linkMatch[1])
    return rules
  } catch {
    return defaultRules
  }
}

const fileExists = async (path: string): Promise<boolean> => {
  try { await stat(path); return true } catch { return false }
}

// --- Main ---

const run = async () => {
  const rules = await parseConfig()
  const files = await collectMd(wikiDir)
  const rawFiles = await collectAllFiles(rawDir)
  const rawRelPaths = new Set(rawFiles.map(f => relative(projectRoot, f)))

  const pageNames = new Set(files.map(f => basename(f, ".md")))
  const infraPages = new Set(["index", "log", "tags", "glossary"])

  interface Issue { severity: "error" | "warning"; category: string; message: string }
  const issues: Issue[] = []

  const linkedPages = new Set<string>()

  for (const file of files) {
    const relPath = relative(wikiDir, file)
    const name = basename(file, ".md")
    const content = await readFile(file, "utf-8")
    const fm = extractFrontmatter(content)
    const words = countWords(content)
    const links = extractWikilinks(content)
    const dir = basename(dirname(file))

    // Track linked pages
    for (const link of links) linkedPages.add(link)

    // Skip infrastructure pages for content checks
    if (infraPages.has(name)) continue

    // --- Frontmatter checks ---
    if (!fm.title) {
      issues.push({ severity: "error", category: "MISSING_TITLE", message: `${relPath}: no title in frontmatter` })
    }
    if (!fm.type) {
      issues.push({ severity: "error", category: "MISSING_TYPE", message: `${relPath}: no type in frontmatter` })
    }

    // --- Dead link check ---
    for (const link of links) {
      if (!pageNames.has(link)) {
        issues.push({ severity: "error", category: "DEAD_LINK", message: `${relPath}: [[${link}]] does not exist` })
      }
    }

    // --- Source path validation ---
    const sources = fm.sources
    if (Array.isArray(sources)) {
      for (const src of sources) {
        if (!rawRelPaths.has(src)) {
          issues.push({ severity: "error", category: "BAD_SOURCE", message: `${relPath}: source "${src}" not found in raw/` })
        }
      }
    }

    // --- Word count checks ---
    const pageType = fm.type as string
    const minWords =
      pageType === "summary" ? rules.summaryMin :
      pageType === "concept" ? rules.conceptMin :
      pageType === "entity" ? rules.entityMin :
      pageType === "comparison" ? rules.comparisonMin :
      0

    if (minWords > 0 && words < minWords) {
      issues.push({
        severity: "warning",
        category: "SPARSE",
        message: `${relPath}: ${words} words (minimum: ${minWords})`,
      })
    }

    // --- Link density check (concepts) ---
    if (pageType === "concept" && links.length < rules.conceptLinkMin) {
      issues.push({
        severity: "warning",
        category: "LOW_LINKS",
        message: `${relPath}: ${links.length} wikilinks (minimum: ${rules.conceptLinkMin})`,
      })
    }
  }

  // --- Orphan check ---
  for (const file of files) {
    const name = basename(file, ".md")
    if (!infraPages.has(name) && !linkedPages.has(name)) {
      issues.push({
        severity: "warning",
        category: "ORPHAN",
        message: `${relative(wikiDir, file)}: not linked from any other page`,
      })
    }
  }

  // --- Report ---
  const errors = issues.filter(i => i.severity === "error")
  const warnings = issues.filter(i => i.severity === "warning")

  console.log(`wiki-check: scanned ${files.length} pages, ${rawRelPaths.size} raw files\n`)

  if (issues.length === 0) {
    console.log("✓ All checks passed")
    process.exit(0)
  }

  const grouped: Record<string, Issue[]> = {}
  for (const issue of issues) {
    const key = issue.category
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(issue)
  }

  for (const [category, items] of Object.entries(grouped).sort()) {
    const sev = items[0].severity === "error" ? "✗" : "△"
    console.log(`${sev} ${category} (${items.length}):`)
    for (const item of items) {
      console.log(`  ${item.message}`)
    }
    console.log()
  }

  console.log(`${errors.length} errors, ${warnings.length} warnings`)
  process.exit(errors.length > 0 ? 1 : 0)
}

run()
