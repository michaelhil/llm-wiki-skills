---
name: wiki-ingest
description: Add a new source to the wiki or update from a revised source
command: wiki-ingest
---

# /wiki-ingest

Add new source material to an existing LLM-wiki, or update the wiki when a source has been revised.

## When to use

- A new paper, report, article, or document should be incorporated into the wiki
- An existing source has been revised (new version) and the wiki should reflect changes
- You want to expand the wiki's coverage of a topic

## Arguments

```
/wiki-ingest <path-to-source>
/wiki-ingest raw/reports/new-paper.md
/wiki-ingest ~/Downloads/research-paper.pdf
```

If no path is provided, ask the user which source to ingest.

## Prerequisites

The wiki must already exist with a `CLAUDE.md` agent schema. If `wiki.config.md` is missing (e.g., the wiki was built before the skills were installed), offer to create it interactively before proceeding — ask for domain description and audience, then write the file.

## Process

### Step 1: Read context

1. Read `wiki.config.md` — domain description, writing approach, and quality rules
2. Read `CLAUDE.md` — page format, naming conventions, frontmatter spec
3. List existing page NAMES: `ls wiki/**/*.md` — know what exists (do not read all page content yet; read individual pages only when needed for merging)
4. Read `wiki/index.md` — current wiki structure (including skeleton headings for where to place new pages)
5. Read `wiki/scope.md` if it exists — know what topic areas are defined and which are covered
6. **Check for content directories**: `ls wiki/` (excluding summaries/, and files like index.md, scope.md, log.md, glossary.md, tags.md). If no content directories exist, the wiki structure hasn't been discussed yet. Ask the user:
   > "No content directories found — the wiki structure hasn't been discussed yet."
   - **Discuss structure now** — propose categories based on sources in `raw/` and domain description, agree with user, create directories (follow the STRUCTURE DISCUSSION operation from CLAUDE.md). Then proceed with ingestion.
   - **Place pages in wiki/ root** — flat structure, fine for small wikis. Proceed with ingestion directly.

### Step 2: Prepare source

1. If the source is not already in `raw/`:
   - Check the existing `raw/` structure (`ls raw/`). If subdirectories exist (e.g., `raw/reports/`), ask the user where to place the file. If `raw/` is flat, copy to `raw/` root.
   - Copy the file, preserving the original filename.
2. Note the **exact filename as it exists in `raw/`** — this path goes in every frontmatter `sources:` field.
3. **Private source check**: If the source is in `raw/private/`, it is proprietary material that should not be cited in frontmatter. Do not add it to `sources:` fields. Instead, follow the private source policy in wiki.config.md's Writing Approach — typically: write as original synthesis, cite the public works referenced within the private source, not the source itself.
4. Check for a **guidance file**: `raw/<source-name>.notes.md` (or `raw/private/<source-name>.notes.md`). If present, read it — it contains the user's integration direction (e.g., "focus on sections 3-5", "extract general principles, not nuclear-specific framing"). This guidance shapes what to extract and how to integrate throughout the remaining steps.

### Step 3: Domain relevance check

Read the first ~50 lines of the source (or its abstract/introduction). Compare against the domain description in `wiki.config.md`. If the source appears to be outside the wiki's domain, ask the user:

> "This source appears to be about [detected topic]. This wiki covers [domain from config]. Should I proceed with ingestion?"

Only continue if the user confirms. This prevents cross-domain contamination (e.g., O&G content ingested into a nuclear wiki).

If a `.notes.md` guidance file exists, the user already approved this source during `/wiki-discover` — skip the relevance check.

### Step 4: Read the source

Read the source file completely. For sources over 500 lines, read in sections (one major section/chapter at a time) and process each section through Steps 5-7 before moving to the next. This keeps context focused and prevents quality degradation on later sections.

If guidance notes specify particular sections to focus on (e.g., "focus on sections 3-5"), read those sections first and with priority. Still read other sections but extract less aggressively from them.

### Step 5: Extract (LLM judgment)

From the source (or current section), identify:

- **Concepts**: Ideas, methods, frameworks, principles, failure modes, design patterns. A concept deserves its own page if (a) it would be more than one paragraph as a subsection of another page, AND (b) it is referenced from at least two other places in the source or existing wiki. When in doubt, create the separate page — pages can be merged later but splitting is harder.
- **Entities**: Organizations, tools, standards, people, systems — named things with specific identities. An entity deserves a page if it plays a meaningful role in the domain (not just a passing mention).
- **Comparisons**: Trade-offs, alternatives, versus discussions.
- **Relationships**: How extracted items connect to each other and to existing wiki pages.

Do NOT pre-impose categories. Let the content determine what emerges.

### Step 6: Check for existing pages

For each extracted item, check whether an equivalent wiki page already exists:

- Search by exact name: `ls wiki/concepts/<name>.md`, `ls wiki/entities/<name>.md`
- Search by common abbreviations and aliases (e.g., "RAG" → "retrieval-augmented-generation")
- Search by key phrases in existing page titles: `grep -rl "<phrase>" wiki/ --include="*.md" -l`

If a page exists → it will be UPDATED (Step 7, merge path).
If no page exists → it will be CREATED (Step 7, new path).

### Step 7: Write pages

**Write the summary page first** (`wiki/summaries/summary-<short-name>.md`):
- 300-800 words covering what the source is about, key findings, significance
- Link to every concept and entity page this source contributes to
- YAML frontmatter with exact source path, related wikilinks, tags, confidence, dates

**Then write concept, entity, and comparison pages:**

For EACH page, **immediately after writing it**, verify:
- Word count meets the minimum from wiki.config.md
- At least 3 `[[wikilinks]]` to other pages (for concepts)
- `sources:` path in frontmatter matches actual file in `raw/`
- If it fails any check, fix it before moving to the next page

**New page path:**
- Place in the appropriate content directory per the wiki's agreed structure (read existing directories via `ls wiki/`). If the wiki has no content directories (only summaries/), place in `wiki/` root.
- If a page doesn't fit any existing directory, ask the user whether to create a new directory or place it in the closest match.
- YAML frontmatter with all required fields. The `type:` field should match one of the types defined in wiki.config.md's quality rules (summary is always valid; others per this wiki's structure).
- **Follow the Writing Approach from wiki.config.md.** If it specifies structural elements for this page type (e.g., definition, evidence, implications, open questions), include each element. If no Writing Approach section exists, default to source-bounded writing (extract what the source says, cite everything).
- Related links to at least 3 other pages

**Merge path (existing page):**
Read the existing page. Read the new source material for this topic. **Rewrite the page to integrate both sources into a coherent article.** The merged page should read as if written from scratch with all sources available — not as the original with new material appended. Update the `sources:` list, add new `related:` links, update `updated:` date. If new information contradicts existing content, note the disagreement and cite both sources.

### Step 8: Update index and navigation

1. Read current `wiki/index.md`
2. Add entries for all new pages in appropriate sections
3. If the source introduces a new topic area, add a new section
4. If a new page doesn't fit any existing index section, ask the user whether to create a new section or place it under the closest existing one
5. If `wiki/glossary.md` exists, add any new terms
6. If `mkdocs.yml` exists, regenerate its `nav:` section from the directory structure

### Step 9: Lint

If `scripts/wiki-check.ts` exists, run it: `bun run scripts/wiki-check.ts`. Otherwise check manually across the entire wiki:
1. Dead `[[wikilinks]]` pointing to nonexistent pages
2. Orphan pages not linked from anywhere
3. Missing frontmatter fields (title, type)
4. Source paths that don't match actual files in `raw/`
5. Word counts below wiki.config.md minimums
6. Fix any issues found. Re-run until clean.

### Step 10: Update scope

If `wiki/scope.md` exists, update it: check off any topic areas now covered by this source. Update the coverage count.

### Step 11: Schema reflection

If this session revealed that CLAUDE.md or wiki.config.md needs updating — a new page type was needed, a naming convention was ambiguous, an operation step was missing, a frontmatter field was needed, or a quality rule was too strict or too loose — propose the specific change to the user.

### Step 12: Log

Append to `wiki/log.md`:

```markdown
## <YYYY-MM-DD> — Ingested <source-filename>
- Created: <list of new pages>
- Updated: <list of modified pages>
- Private source: <yes/no>
- Guidance: <summary of .notes.md if present, or "none">
```

## Update mode (revised source)

When a source has been revised (e.g., `report-v12.md` → `report-v13.md`):

1. Copy new version to `raw/` (keep old version — both preserved)
2. Read both versions. Identify what actually changed in meaning (ignore formatting)
3. Update the summary page
4. Update affected concept/entity pages with changed information
5. Update `sources:` paths in frontmatter from old filename to new
6. Log the revision

## Key rules

- **Domain relevance check before ingestion** — compare source against wiki.config.md. Ask the user if there's a mismatch.
- **Check each page immediately after writing** — word count, link density, source path validity. Do not defer quality checks to the end.
- **Read the full source** — not just headers. Sparse pages come from incomplete reading.
- **For large sources (500+ lines), process section by section** — extract, check existing, write pages for one section before reading the next.
- **Read existing pages before merging** — rewrite to integrate, don't append.
- **Search for duplicates before creating** — check exact names, abbreviations, aliases, and key phrases.
- **Source paths must be exact** — use the actual filename from `raw/`, verified by `ls`.
- **Read source files directly** — do not delegate to sub-agents.
- **Update index and nav** — new pages must be discoverable.
- **Interlink aggressively** — the link graph IS the wiki's value.
- **Web view is optional** — MkDocs nav and glossary updates only if those files exist.
