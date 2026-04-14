---
name: wiki-init
description: Create a new LLM-wiki project — scaffold structure, configure, and begin ingestion
command: wiki-init
---

# /wiki-init

Create a new LLM-wiki from source material. Scaffolds the three-layer Karpathy architecture (raw sources → compiled wiki → agent schema), optionally configures MkDocs for web browsing, and ingests the first source as a quality template.

## When to use

- Starting a new wiki from a collection of documents (reports, papers, notes, any readable files)
- Setting up the infrastructure for an existing folder of content
- Creating a team knowledge base from scratch

## Process

### Phase 1: Gather context (interactive)

Ask the user these questions (skip any already answered):

1. **What is this wiki about?** (domain, topic area)
2. **Who is the audience?** (team, organization, expertise level)
3. **Where are the source files?** (directory path or list of files)
4. **Project name?** (used for directory name and site title — kebab-case)
5. **Set up web view?** (MkDocs Material for browsable site — yes/no)
6. **Set up GitHub Pages + feedback system?** (only if web view is yes)

### Phase 2: Scaffold structure

Create the project directory:

```
<project-name>/
├── raw/                    # Layer 1: Immutable sources
├── wiki/                   # Layer 2: Compiled knowledge
│   ├── index.md
│   └── log.md
├── wiki.config.md          # Domain context + quality rules
└── .gitignore
```

If web view requested, also create: `mkdocs.yml`, `wiki/glossary.md`, `wiki/tags.md`.
If feedback requested, also create: `feedback/`.

Initialize git repo.

### Phase 3: Generate wiki.config.md

Write `wiki.config.md` using the answers from Phase 1:

```markdown
# Wiki Configuration

## Domain
<Free-text description: what the wiki covers, who reads it, what level of
explanation is appropriate. This description is used to check whether new
sources are relevant and to guide the tone and depth of wiki pages.>

## Quality Rules
- Summary pages: minimum 300 words
- Concept pages: minimum 200 words, link to >= 3 related pages
- Entity pages: minimum 120 words, must explain domain relevance
- Comparison pages: minimum 250 words, must include a comparison table
- Every factual claim references a source in frontmatter
- Source paths in frontmatter must match actual files in raw/
- Lint must pass after every phase (zero dead links, zero orphans)
```

### Phase 4: Generate CLAUDE.md

Write the agent schema defining:

- Directory structure and purpose of each layer
- Page format (YAML frontmatter spec: title, type, sources, related, tags, confidence, created, updated)
- Naming conventions (kebab-case, type-based prefixes for summaries)
- Wikilink style (`[[page-name]]`)
- Operations: INGEST, QUERY, LINT, UPDATE, PROCESS FEEDBACK
- Writing guidelines adapted to the domain and audience

### Phase 5: Copy sources to raw/

Copy all source files into `raw/`. Preserve original filenames. If there are natural groupings (reports, papers, notes), create subdirectories. Do NOT modify source files — `raw/` is immutable.

### Phase 6: Ingest the FIRST source thoroughly

Pick the source that best represents the wiki's scope (ask the user if unclear). Ingest it following the full `/wiki-ingest` process:

1. Read it completely
2. Extract concepts, entities, relationships, comparisons
3. Write all pages with full detail — check each page against quality rules IMMEDIATELY after writing
4. This first source sets the quality bar for all subsequent ingestions

**STOP after the first source.** Do not attempt to ingest all sources in one session.

### Phase 7: Build index

1. Generate `wiki/index.md` organized by page type and topic
2. If web view: generate `wiki/glossary.md` and the `nav:` section of `mkdocs.yml`
3. Write the initial `wiki/log.md` entry

### Phase 8: Quality check

1. Lint: dead wikilinks, orphan pages, missing frontmatter
2. Quality: word counts, link density against wiki.config.md minimums
3. Fix any issues found
4. Re-lint until clean

### Phase 9: Infrastructure (conditional)

**If web view requested** (Phase 5 in mkdocs.yml generation):
- Create MkDocs Material configuration with search, roamlinks, dark mode toggle
- `mkdocs build` to verify

**If GitHub Pages requested:**
- Create `.github/workflows/deploy.yml`
- Create `requirements.txt`
- Create GitHub repo, enable Pages

**If feedback system requested:**
- Create `overrides/main.html` with per-section feedback icons and form
- Create `api/feedback.ts` (Vercel serverless function)
- Create `vercel.json`
- Create GitHub Issue labels
- Guide user through Vercel deploy and PAT creation

### Phase 10: Report and next steps

1. Report stats: pages created, word counts, source coverage
2. List remaining sources not yet ingested
3. Tell the user: **"Run `/wiki-ingest <source>` for each remaining source. One source per session for best quality."**

## Key rules

- **Ingest only ONE source during init** — remaining sources are ingested in separate sessions via `/wiki-ingest`. This prevents quality degradation from context exhaustion.
- **Check each page against quality rules immediately after writing** — do not defer quality checks to the end.
- **Read source files directly** — do not delegate to sub-agents (they may lack file permissions).
- **Source paths in frontmatter must be exact** — read the actual filenames from `raw/` and use them verbatim.
- **Let the content determine structure** — do not pre-impose concept categories or entity types.
- **Web view is optional** — the wiki's value is in the markdown pages and their interlinking. MkDocs, GitHub Pages, and the feedback system are enhancements, not requirements. Every content step must work without them.
