# LLM-Wiki Skills

Four [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills for building and maintaining **LLM-wikis** — structured knowledge bases where an LLM compiles raw source material into interlinked markdown pages that serve both human readers and AI agents. Based on [Karpathy's LLM-wiki architecture](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

## Getting started

**Always start with `/wiki-init`** — it creates the wiki project, with or without initial material.

Then populate: `/wiki-discover` to find sources, `/wiki-ingest` to process them, `/wiki-review` to maintain quality.

## What it builds

```
your-wiki/
├── raw/                    # Layer 1: Immutable source material (you curate)
│   ├── papers, reports, notes, articles...
│   └── source.notes.md    # Optional: integration guidance from /wiki-discover
├── wiki/                   # Layer 2: Compiled knowledge (LLM maintains)
│   ├── index.md            # Master catalog — structure agreed before content
│   ├── scope.md            # Topic areas and coverage tracking
│   ├── summaries/          # One summary per source (always present)
│   ├── <your-types>/       # Content directories agreed in structure discussion
│   ├── ...                 # (e.g., theories/, methods/, tools/, standards/)
│   └── log.md              # Activity log
├── wiki.config.md          # Domain, writing approach, quality rules
├── CLAUDE.md               # Agent schema — evolves with use
└── mkdocs.yml              # Optional: web rendering config
```

The directory structure is a recommended starting point, not a constraint. The `/wiki-init` structure discussion (Phase 3c) determines how YOUR wiki is organised — new page types and directories are added as the content demands. The schema (CLAUDE.md) evolves alongside.

Every wiki page has YAML frontmatter (title, type, sources, related pages, tags, confidence, dates) and uses `[[wikilinks]]` for interlinking. The markdown files work in any renderer — Obsidian, VS Code, MkDocs, or plain text.

## Installation

Copy the skill files into your project:

```bash
# Clone this repo
git clone https://github.com/michaelhil/llm-wiki-skills.git

# Copy skills into your project
mkdir -p your-project/.claude/skills
cp llm-wiki-skills/.claude/skills/*.md your-project/.claude/skills/

# Optionally copy the check script
mkdir -p your-project/scripts
cp llm-wiki-skills/scripts/wiki-check.ts your-project/scripts/
```

Or add as a git submodule:

```bash
cd your-project
git submodule add https://github.com/michaelhil/llm-wiki-skills .claude/wiki-skills
ln -s wiki-skills/skills .claude/skills
```

The skills appear in Claude Code when you open a session in the project directory.

## Skills

### `/wiki-discover` — Explore and acquire sources

Find sources for an existing wiki. Run iteratively after `/wiki-init`.

```
/wiki-discover                        # Start collaborative exploration
/wiki-discover "topic or question"    # Search for a specific topic
/wiki-discover path/to/file.pdf       # Evaluate a specific file's fit
```

Searches for relevant sources, evaluates each candidate with a fit assessment (what it would add, which pages it would enrich, which gaps it fills), and acquires approved sources to `raw/`. The user controls every decision — what to include, what to skip, and how each source should be integrated.

**Scope tracking**: Maintains `wiki/scope.md` with defined topic areas and coverage checkboxes. Each discovery cycle narrows the remaining gaps.

**Integration guidance**: When the user has specific direction ("focus on sections 3-5", "update [[existing-page]]"), the skill writes a `.notes.md` file alongside the source that persists to the ingestion session.

### `/wiki-init` — Set up a new wiki project

**Always start here.** Run once per project. Works with or without initial source material.

```
/wiki-init
```

Asks about domain, audience, and sources (optional). Scaffolds the directory structure, discusses category organization (or defers for later exploration), generates the agent schema, and optionally sets up MkDocs, GitHub Pages, and feedback. If sources are provided and structure is agreed, ingests the first source as a quality template.

Structure discussion can be deferred — useful when you want to explore the field via `/wiki-discover` before committing to categories.

### `/wiki-ingest` — Add or update a source

Run per source. One source per session for best quality.

```
/wiki-ingest path/to/new-paper.md
/wiki-ingest ~/Downloads/research.pdf
```

Reads the source, checks domain relevance, extracts concepts and entities, creates or updates wiki pages, and runs quality checks. If a `.notes.md` guidance file exists (from `/wiki-discover`), uses the user's integration direction to shape extraction and page creation.

For large sources (500+ lines), processes section by section. Handles source revisions (v12 → v13) by diffing and updating affected pages.

### `/wiki-review` — Process feedback and maintain

Run periodically (e.g., every few weeks).

```
/wiki-review              # Interactive: propose changes, owner approves
/wiki-review --auto       # Automatic: apply all, review archive after
/wiki-review --lint-only  # Just run maintenance checks
```

Collects feedback from GitHub Issues, markdown files, or pasted text. Classifies each item as trivial (auto-applied) or substantive (proposed to the owner for approval). The owner reviews proposals grouped by page and approves, modifies, or skips each one. Only approved changes are written. Every decision is recorded in a batch archive.

Always includes a maintenance pass: lint, quality check, stale page detection, coverage gaps.

## Quality system

The skills enforce quality rules defined in `wiki.config.md`:

- **Word minimums**: Per page type, defined during structure discussion (e.g., "Theory pages: minimum 400 words")
- **Link density**: Configurable per type (e.g., "link to >= 3 related pages")
- **Path accuracy**: Source paths in frontmatter match actual files in `raw/`
- **Zero dead links**: Every `[[wikilink]]` resolves to an existing page
- **Zero orphans**: Every page is linked from at least one other page
- **Domain relevance**: New sources are checked against the wiki's domain before ingestion
- **Scope boundary**: Every source maps to a defined topic area in `wiki/scope.md`

Quality is checked **per page immediately after writing**, not deferred to the end.

A `scripts/wiki-check.ts` utility runs all mechanical checks in one pass:

```bash
bun run scripts/wiki-check.ts
```

## Key files

| File | Purpose | Created by |
|------|---------|-----------|
| `wiki.config.md` | Domain description + quality rules | `/wiki-init` |
| `wiki/scope.md` | Topic areas with coverage tracking | `/wiki-init` (maintained by `/wiki-discover` and `/wiki-ingest`) |
| `CLAUDE.md` | Agent schema (ingest/query/lint/update operations) | `/wiki-init` |
| `raw/<source>.notes.md` | Integration guidance for a specific source | `/wiki-discover` |
| `feedback/batch-*.md` | Archived feedback processing records | `/wiki-review` |

## Private sources

Place proprietary material in `raw/private/` — it's gitignored by default. During ingestion, private sources inform wiki pages but are not cited in frontmatter. Pages are written as original synthesis citing the public works referenced within the private material. Describe your citation policy in wiki.config.md's Writing Approach section. The ingestion log tracks which pages were informed by private sources.

## Optional: web view and feedback

`/wiki-init` can optionally set up:

- **MkDocs Material** — browsable site with search, dark mode, and navigation
- **GitHub Pages** — automatic deployment on push
- **Per-section feedback** — readers click a 💬 icon on any section heading to submit corrections or suggestions, without needing a GitHub account. A Vercel serverless function proxies submissions into GitHub Issues. The wiki owner processes feedback in batches via `/wiki-review`, with full editorial control over what changes are made.

The feedback pipeline:
```
Reader clicks 💬 → popover form → Vercel function → GitHub Issue
                                                         ↓
Owner runs /wiki-review → Claude proposes changes → owner approves → wiki updated
                                                         ↓
                                                  Issue closed with explanation
```

These are enhancements. The wiki works fully without them — the core value is in the markdown files and their interlinking.

## Design principles

- **Domain-agnostic**: Structure emerges from content, not predefined categories. Works for nuclear engineering, oil & gas, medical devices, aerospace, or any technical domain.
- **Single entry point**: `/wiki-init` creates the project (with or without material). `/wiki-discover` expands it.
- **Scope-tracked**: `wiki/scope.md` defines what the wiki covers, tracks progress, and prevents unbounded growth.
- **User-guided**: The user controls every decision — what sources to include, how to integrate them, when to stop. The LLM is a research partner, not an autonomous agent.
- **Native tools only**: Skills use Read, Write, Grep, Glob, Bash, WebSearch, WebFetch — no custom MCP server dependency.
- **Direct execution**: All file operations done directly, not delegated to sub-agents (avoids permission issues in Claude Code).
- **Content-first**: Web rendering is optional. The markdown files are the product.
- **Quality-enforced**: Mechanical checks prevent the sparse pages and broken links that manual wiki maintenance produces.

## Adopting for an existing wiki

If your wiki was built before these skills existed:

1. Copy skills into `.claude/skills/` and optionally `scripts/wiki-check.ts`
2. Run `/wiki-review --lint-only` — checks wiki health and offers to create `wiki.config.md` if missing
3. Optionally create `wiki/scope.md` to track topic coverage
4. Use `/wiki-ingest` and `/wiki-discover` normally from here

## Deleting pages and reorganising

Page deletion and structural reorganisation are conversational operations — ask Claude directly. These are rare enough that formal skill steps would be over-engineering.

## Using with other tools

The wiki output (markdown files, frontmatter, wikilinks, MkDocs) is completely tool-agnostic. The skills are written for Claude Code but the process they describe works with any LLM coding agent. To adapt:

| Claude Code | Cursor | Codex / Copilot | Generic |
|-------------|--------|-----------------|---------|
| `.claude/skills/*.md` | `.cursorrules` | `AGENTS.md` | Project instructions file |
| `CLAUDE.md` (project schema) | `.cursorrules` | `AGENTS.md` | `CONVENTIONS.md` |
| `AskUserQuestion` tool | Conversational prompts | Conversational prompts | Conversational prompts |
| `bun run scripts/wiki-check.ts` | `npx ts-node scripts/wiki-check.ts` | Same | Any TS runner |

To port: copy the skill content into your tool's instruction format. The process steps, quality rules, and wiki architecture are the same regardless of which LLM agent executes them.

## Example

The [Nuclear AI Wiki](https://github.com/michaelhil/nuclear-wiki) was built with these skills — 95 interlinked pages compiled from 6 technical reports on AI agent systems for nuclear power plant operations.

Live site: [michaelhil.github.io/nuclear-wiki](https://michaelhil.github.io/nuclear-wiki/)
