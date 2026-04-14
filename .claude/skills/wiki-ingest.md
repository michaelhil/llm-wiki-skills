---
name: wiki-ingest
description: Add a new source to the wiki or update from a revised source
command: wiki-ingest
---

# /wiki-ingest

Add new source material to an existing LLM-wiki, or update the wiki when a source has been revised.

## When to use

- A new paper, report, article, or document should be incorporated into the wiki
- An existing source has been revised (new version) and the wiki should reflect the changes
- You want to expand the wiki's coverage of a topic

## Arguments

```
/wiki-ingest <path-to-source>
/wiki-ingest raw/reports/new-paper.md
/wiki-ingest ~/Downloads/research-paper.pdf
```

If no path is provided, ask the user which source to ingest.

## Prerequisites

The wiki must already exist (created by `/wiki-init`). Verify by checking for `wiki.config.md` and `CLAUDE.md` in the project root.

## Process

### Step 1: Read context

1. Read `wiki.config.md` — domain description and quality rules
2. Read `CLAUDE.md` — page format, naming conventions, frontmatter spec
3. List existing pages: `ls wiki/**/*.md` — know what already exists to avoid duplication and to find pages to update
4. Read `wiki/index.md` — current wiki structure

### Step 2: Prepare source

1. If the source is not already in `raw/`, copy it there (preserve original filename)
2. Read the source file completely — every section, not just headers
3. Note the exact filename as it exists in `raw/` — this will be used in frontmatter `sources:` fields

### Step 3: Extract (LLM judgment)

From the source, identify:

- **Key concepts**: Ideas, methods, frameworks, principles, failure modes, design patterns — anything that deserves its own article. A concept is wiki-worthy if it is (a) referenced by other concepts, (b) requires explanation for the target audience, or (c) represents a significant idea in the domain.
- **Entities**: Organizations, tools, standards, frameworks, people, systems — named things with specific identities. An entity is wiki-worthy if it is (a) referenced in multiple contexts, (b) plays a significant role in the domain, or (c) readers may need to look it up.
- **Comparisons**: Trade-offs, alternatives, versus discussions — wherever the source compares approaches.
- **Relationships**: How concepts and entities connect to each other and to existing wiki pages.

Do NOT pre-impose categories. Let the content determine what emerges.

### Step 4: Check for existing pages

For each extracted item, check if a wiki page already exists:
- Search by name: `ls wiki/concepts/<name>.md`, `ls wiki/entities/<name>.md`
- Search by content: `grep -rl "keyword" wiki/` for related pages
- If a page exists, it will be UPDATED (merged), not replaced
- If no page exists, it will be CREATED

### Step 5: Write summary page

Create `wiki/summaries/summary-<source-short-name>.md`:

- YAML frontmatter: title, type: summary, sources (exact path in `raw/`), related (wikilinks to key concepts/entities), tags, confidence: high, created/updated dates
- 300-800 words covering: what the source is about, key findings, methodology, significance for the domain
- Link to every concept and entity page that the source contributes to

### Step 6: Write concept pages

For each concept extracted in Step 3:

**If new page:**
- File: `wiki/concepts/<kebab-case-name>.md`
- YAML frontmatter with all required fields
- 200-500 words: definition, significance, how it works, domain implications
- Related links: `[[wikilinks]]` to at least 3 other pages
- Source attribution in frontmatter

**If existing page:**
- Read the current page
- Add new information from this source — merge, don't replace
- Add this source to the `sources:` list in frontmatter
- Add any new `related:` links
- Update the `updated:` date
- If new information contradicts existing content, note the disagreement and cite both sources

### Step 7: Write entity pages

Same pattern as concepts but in `wiki/entities/`. Minimum 120 words. Must explain why this entity matters in the domain context.

### Step 8: Write comparison pages

For trade-offs and alternatives discussed in the source:
- File: `wiki/comparisons/<a>-vs-<b>.md`
- Must include a comparison table with dimensions
- 250+ words covering when to use each, trade-offs, domain recommendation

### Step 9: Update index

1. Read current `wiki/index.md`
2. Add entries for all new pages in appropriate sections
3. If the source introduces a new topic area, add a new section to the index
4. Update `wiki/glossary.md` with any new terms

### Step 10: Update MkDocs nav

Regenerate the `nav:` section in `mkdocs.yml` from the current directory structure:
- List all `.md` files in each subdirectory of `wiki/`
- Organize into the nav hierarchy matching the index structure

### Step 11: Quality check

1. **Word count check**: Verify every new/updated page meets the minimums from wiki.config.md
2. **Link density**: Every concept page links to >= 3 related pages
3. **Source paths**: Every `sources:` entry in frontmatter matches an actual file in `raw/`
4. **Lint**: Run dead-link and orphan check across entire wiki
5. Fix any issues found — expand sparse pages, add missing links, correct paths

### Step 12: Log

Append to `wiki/log.md`:

```markdown
## <YYYY-MM-DD> — Ingested <source-filename>
- Created: <list of new pages>
- Updated: <list of modified pages>
- New concepts: <count>
- New entities: <count>
```

## Key rules

- **Read the full source** — not just headers or first 100 lines. Sparse pages come from incomplete reading.
- **Read existing pages before updating** — merge information, don't overwrite.
- **Source paths must be exact** — use the actual filename from `raw/`, not a simplified version.
- **Lint after every ingestion** — zero dead links, zero orphans.
- **Quality minimums are hard requirements** — if a page is under minimum, expand it immediately.
- **Do not use sub-agents for file operations** — do all reading and writing directly.
- **Update the index and nav** — new pages must be discoverable.
- **Interlink aggressively** — the link graph IS the wiki's value. Every new page should connect to the existing knowledge network.

## Update mode (revised source)

When a source has been revised (e.g., `report-v12.md` → `report-v13.md`):

1. Copy new version to `raw/`
2. Diff old and new versions to identify what changed
3. Update the summary page to reflect new content
4. Update affected concept/entity pages with new or changed information
5. Update `sources:` paths in frontmatter from old filename to new
6. Do NOT delete old source from `raw/` — both versions are preserved
7. Log the revision in `wiki/log.md`
