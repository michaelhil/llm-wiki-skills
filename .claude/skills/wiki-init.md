---
name: wiki-init
description: Create a new LLM-wiki project — scaffold structure, configure web view, and ingest initial sources
command: wiki-init
---

# /wiki-init

Create a new LLM-wiki from source material. This skill scaffolds the three-layer Karpathy wiki architecture (raw sources → compiled wiki → agent schema), configures MkDocs for web browsing, and performs the first ingestion.

## When to use

- Starting a new wiki from a collection of documents (reports, papers, notes, any readable files)
- Setting up the infrastructure for an existing folder of markdown/PDF content
- Creating a team knowledge base from scratch

## Process

### Phase 1: Gather context (interactive)

Ask the user these questions (skip any already answered in arguments):

1. **What is this wiki about?** (domain, topic area)
2. **Who is the audience?** (team, organization, expertise level)
3. **Where are the source files?** (directory path or list of files)
4. **Project name?** (used for directory name and site title — kebab-case)
5. **Set up web hosting?** (GitHub Pages — yes/no)
6. **Set up feedback system?** (per-section feedback via GitHub Issues + Vercel proxy — yes/no)

### Phase 2: Scaffold structure

Create the project directory:

```
<project-name>/
├── raw/                    # Layer 1: Immutable sources
├── wiki/                   # Layer 2: Compiled knowledge
│   ├── index.md
│   ├── log.md
│   ├── glossary.md
│   └── tags.md
├── feedback/               # Batch archives (if feedback enabled)
├── wiki.config.md          # Domain context + quality rules
├── mkdocs.yml              # MkDocs Material configuration
└── .gitignore
```

Initialize git repo.

### Phase 3: Generate wiki.config.md

Write `wiki.config.md` using the answers from Phase 1:

```markdown
# Wiki Configuration

## Domain
<Free-text description from user answers: domain, audience, purpose>

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

Write the agent schema file. Use the CLAUDE.md from this skill's parent repo as a template, adapting the domain context from wiki.config.md. The schema defines:

- Directory structure and purpose of each layer
- Page format (YAML frontmatter spec: title, type, sources, related, tags, confidence, created, updated)
- Naming conventions (kebab-case, type-based prefixes for summaries)
- Wikilink style (`[[page-name]]`)
- Operations: INGEST, QUERY, LINT, UPDATE, PROCESS FEEDBACK
- Writing guidelines adapted to the domain and audience

### Phase 5: Generate mkdocs.yml

Create MkDocs Material configuration with:

- Material theme with light/dark toggle
- `custom_dir: overrides` (for feedback system if enabled)
- Plugins: search, tags, roamlinks
- Extensions: admonition, tables, superfences (mermaid), tasklist, highlight
- `wiki_version` and `feedback_worker_url` as env-injected extras
- Nav structure: auto-generated from wiki directory after ingestion

### Phase 6: Copy sources to raw/

Copy all source files into `raw/`. Preserve original filenames. Do NOT modify source files — `raw/` is immutable.

### Phase 7: Ingest all sources

For EACH source file in `raw/`, run the wiki-ingest process (see `/wiki-ingest` skill). This is the bulk of the work. For each source:

1. Read the source completely
2. Identify key concepts, entities, relationships, and comparisons
3. Write wiki pages (summaries, concepts, entities, comparisons)
4. Interlink pages with `[[wikilinks]]`

Do the ingestion DIRECTLY — do not delegate to sub-agents (they may lack file permissions).

### Phase 8: Build index and nav

After all sources are ingested:

1. Read all created wiki pages via `ls wiki/**/*.md`
2. Generate `wiki/index.md` organized by page type and topic
3. Generate `wiki/glossary.md` — alphabetical term → page reference table
4. Generate the `nav:` section of `mkdocs.yml` from the directory structure
5. Write the initial `wiki/log.md` entry documenting what was ingested

### Phase 9: Quality check

1. Run lint: check for dead `[[wikilinks]]`, orphan pages, missing frontmatter
2. Run quality check: verify word counts against wiki.config.md minimums
3. Fix any issues found — expand sparse pages, add missing links
4. Re-lint until clean

### Phase 10: Infrastructure (conditional)

**If GitHub Pages requested:**
- Create `.github/workflows/deploy.yml` (MkDocs build + Pages deploy, with git SHA and feedback URL injection)
- Create `requirements.txt` with `mkdocs-material` and `mkdocs-roamlinks-plugin`
- Create GitHub repo: `gh repo create <name> --public --source=. --push`
- Enable Pages: `gh api repos/<owner>/<name>/pages -X POST -f build_type=workflow`

**If feedback system requested:**
- Create `overrides/main.html` with per-section feedback icons, popover form, and submit logic
- Create `api/feedback.ts` (Vercel serverless function: validate POST → create GitHub Issue)
- Create `vercel.json` (framework: null, function config)
- Create GitHub Issue labels: `wiki-feedback`, `type:correction`, `type:suggestion`, `type:missing`, `type:unclear`, `needs-human-review`, `stale`
- Guide user through: Vercel login, deploy, PAT creation, env variable setup
- Update `CLAUDE.md` with PROCESS FEEDBACK operation

### Phase 11: Verify

1. Build MkDocs locally: `mkdocs build` (must succeed)
2. Report final stats: total pages, pages by type, total words
3. If GitHub Pages enabled: push and confirm deployment
4. Print the wiki URL and next steps

## Key rules

- **Read source files DIRECTLY** — do not use sub-agents for reading (they may lack permissions)
- **Write pages DIRECTLY** — do not use sub-agents for writing (same reason)
- **Source paths in frontmatter must be exact** — read the actual filenames from `raw/` and use them verbatim
- **Lint after ingestion** — every phase that creates pages must end with a lint pass
- **Quality minimums are enforced** — if a page is under the minimum word count, expand it before moving on
- **Let the content determine structure** — do not pre-impose concept categories or entity types. Discover them from the source material.
- **The wiki.config.md domain description guides tone and terminology** — but the LLM's judgment determines what concepts and entities to extract
