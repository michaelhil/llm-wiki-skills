---
name: wiki-init
description: Create a new LLM-wiki project — scaffold structure, configure, and begin ingestion
command: wiki-init
---

# /wiki-init

Create a new LLM-wiki from source material. Scaffolds the three-layer Karpathy architecture (raw sources → compiled wiki → agent schema), optionally configures MkDocs for web browsing, and ingests the first source as a quality template.

## When to use

- Starting a new wiki from a **collection of documents you already have** (reports, papers, notes, any readable files)
- Setting up the infrastructure for an existing folder of content

**Don't have material yet?** Use `/wiki-discover` instead — it helps you find, evaluate, and acquire sources collaboratively before building the wiki.

## Process

### Phase 1: Gather context (interactive)

Ask the user these questions (skip any already answered):

1. **What is this wiki about?** (domain, topic area)
2. **Who is the audience?** (team, organization, expertise level)
3. **Where are the source files?** (directory path or list of files)
4. **Project name?** (used for directory name and site title — kebab-case)
5. **Set up web view?** (MkDocs Material for browsable site — yes/no)
6. **Set up GitHub Pages + feedback system?** (only if web view is yes)

### Phase 2: Scaffold

Create the minimal project structure:

```
<project-name>/
├── raw/                    # Layer 1: Immutable sources
├── wiki/                   # Layer 2: Compiled knowledge
│   └── summaries/          # One summary per source (always present)
└── .gitignore
```

No content directories yet — those are created in Phase 3. Initialize git repo.

### Phase 3: Discuss and agree wiki structure

The wiki's content directories, page types, and quality rules should be agreed before anything is generated. This phase is the most important planning step.

1. **Scan source material** — read the table of contents or first ~10 lines of each source (not full content). Combined with the domain description from Phase 1, propose:
   - **Content directories** and their corresponding page types. Examples by domain:
     - Human factors wiki: `theories/`, `methods/`, `failure-modes/`, `tools/`
     - Regulatory wiki: `frameworks/`, `standards/`, `requirements/`, `case-studies/`
     - General technical wiki: `concepts/`, `entities/`, `comparisons/`
     - The traditional Karpathy categories (concepts, entities, comparisons) are ONE option, not the default — propose what fits the domain
   - **Index structure** — top-level sections and subsections

2. **Present to user.** Use AskUserQuestion for clear choices. Refine through conversation — the user may rename, merge, split, add, or remove categories.

3. **Keep it proportional.** If the user accepts the proposal, one round and done. For small wikis (fewer than 3 sources), a single content directory (e.g., `articles/`) may be sufficient.

4. **Define quality rules per type.** For each agreed page type, propose a word count minimum and any structural requirements (e.g., "must include a comparison table", "must link to >= 3 related pages"). Propose sensible defaults — 300 words for substantial types, 150 for reference/short types. User confirms.

5. **Create the agreed directories** in `wiki/`.

6. **Write `wiki/index.md` as a skeleton** with the agreed headings and italic placeholders:
   ```markdown
   # Wiki Title

   ## [Section Name]
   ### [Subsection]
   *Pages to be added during ingestion.*
   ```

### Phase 4: Generate config files

With the structure agreed, generate all config files at once:

**A) `wiki.config.md`:**

```markdown
# Wiki Configuration

## Domain
<Free-text from Phase 1: what the wiki covers, who reads it, what level
of explanation is appropriate.>

## Writing Approach
<Confirm with user — "Should pages compile only what sources say, or be
comprehensive reference articles drawing on broader knowledge?">

## Quality Rules
- Summary pages: minimum 300 words
<One rule per type agreed in Phase 3, e.g.:>
- [Type] pages: minimum [N] words
- [Type] pages: minimum [N] words, link to >= 3 related pages
- Source paths in frontmatter must match actual files in raw/
- Lint must pass after every phase (zero dead links, zero orphans)
```

**B) `wiki/scope.md`** — topic areas from the Phase 3 discussion with checkboxes. Mark all as uncovered initially.

**C) `CLAUDE.md`** — the agent schema with these sections:

1. **Title, description, and evolution note.** One paragraph. Reference `wiki.config.md` for domain context, writing approach, and quality rules. State that this schema evolves: "When a session reveals better conventions or missing operations, propose updates to this file."

2. **Directory structure.** Describe `raw/` (immutable sources) and `wiki/` with its subdirectories: `summaries/` plus the content directories agreed in Phase 3. If feedback is enabled, also `feedback/`.

3. **Page format.** YAML frontmatter spec — every wiki page MUST have:
   - `title` (string), `type` (one of the types agreed in Phase 3 — summary is always valid; others per this wiki's structure)
   - `sources` (list of paths relative to project root, e.g., `raw/reports/paper.md`)
   - `related` (list of `[[wikilinks]]` to other pages)
   - `tags` (list of lowercase keywords)
   - `confidence` (high | medium | low)
   - `created` (date), `updated` (date)

4. **Naming conventions.** Kebab-case filenames. Summaries: `summary-<short-name>.md`. No spaces, no underscores.

5. **Interlinking.** Use `[[page-name]]` wikilinks without file extension. Cross-reference liberally.

6. **Operations.** Define procedures for:
   - INGEST: read source → extract → write pages → update index → lint → log
   - QUERY: read index → find relevant pages → synthesise answer with citations
   - LINT: dead links, orphans, missing frontmatter, source path validation
   - UPDATE: update dates, note contradictions, preserve history, log changes
   - PROCESS FEEDBACK (if feedback enabled): retrieve issues → analyse → propose → execute approved → archive

### Phase 5: Copy sources to raw/

Copy all source files into `raw/`. Preserve original filenames. If there are natural groupings (reports, papers, notes), create subdirectories. Do NOT modify source files — `raw/` is immutable.

### Phase 6: Ingest the FIRST source thoroughly

Pick the source that best represents the wiki's scope (ask the user if unclear). Ingest it following the full `/wiki-ingest` process:

1. Read it completely
2. Extract based on the agreed page types and structure from Phase 3
3. Write all pages with full detail — check each page against quality rules IMMEDIATELY after writing
4. This first source sets the quality bar for all subsequent ingestions

**STOP after the first source.** Do not attempt to ingest all sources in one session.

### Phase 7: Populate index

1. If a skeleton index exists from Phase 3: populate it with `[[wikilinks]]` to the pages created during ingestion, replacing the italic placeholders. Keep empty sections for topic areas not yet covered.
2. If no skeleton exists (Phase 3 was skipped for a small wiki): generate `wiki/index.md` from the created pages, organized by type and topic.
3. If web view: generate `wiki/glossary.md` and the `nav:` section of `mkdocs.yml`
4. Write the initial `wiki/log.md` entry

### Phase 8: Quality check

If `scripts/wiki-check.ts` exists, run it: `bun run scripts/wiki-check.ts`. Otherwise check manually:
1. Lint: dead wikilinks, orphan pages, missing frontmatter
2. Quality: word counts, link density against wiki.config.md minimums
3. Fix any issues found
4. Re-run until clean

### Phase 9: Infrastructure (conditional)

**If web view requested:**
- Create MkDocs Material configuration with search, roamlinks, dark mode toggle
- `mkdocs build` to verify

**If GitHub Pages requested:**
- Create `.github/workflows/deploy.yml`
- Create `requirements.txt`
- Create GitHub repo, enable Pages

**If feedback system requested:**

Generate these files using the specs below, then walk the user through deployment.

**A) Create `overrides/main.html`** — MkDocs theme override:
- Inject `<meta name="wiki-version">` from `config.extra.wiki_version`
- Add a `💬` icon to every `h2[id]` and `h3[id]` heading (appears on hover, beside Material's existing permalink icon)
- On click: open a centered modal popover with: section title display, radio group (correction / suggestion / missing / unclear), required textarea for feedback, optional name field, submit button
- Submit sends JSON POST to `config.extra.feedback_worker_url` with fields: `page`, `section`, `sectionTitle`, `category`, `feedback`, `submitter`, `wikiVersion`
- On success: close popover, show "Thank you" toast
- On error: re-enable submit button, show alert with error
- 30-second debounce between submissions (prevent double-submit)
- If no worker URL configured: demo mode (log to console)
- Use Material theme CSS variables for dark mode compatibility
- Close popover on Escape key or backdrop click

**B) Create `api/feedback.ts`** — Vercel serverless function:
- Default export: `async function handler(req, res)`
- Validate JSON body: `page` (string, required), `section` (string), `sectionTitle` (string), `category` (one of: correction, suggestion, missing, unclear), `feedback` (string, 1-5000 chars), `submitter` (string), `wikiVersion` (string)
- CORS: set `Access-Control-Allow-Origin` to the wiki's GitHub Pages URL only. Handle OPTIONS preflight with 204.
- Reject requests from other origins with 403.
- Read `GITHUB_PAT` from `process.env`. Return 500 if not set.
- Create GitHub Issue via `fetch("https://api.github.com/repos/{REPO}/issues")`:
  - Title: `[{page without .md}] {Category capitalised} — "{sectionTitle truncated to 60 chars}"`
  - Body: `<!-- WIKI-FEEDBACK-META\npage: ...\nsection: ...\nsection_title: ...\ncategory: ...\nsubmitter: ...\nwiki_version: ...\ntimestamp: ...\n-->` followed by human-readable section
  - Labels: `["wiki-feedback", "type:{category}", "page:{page-short-name}"]`
- Return 201 on success, 400 on validation failure, 502 on GitHub API error

**C) Create `vercel.json`**:
```json
{
  "framework": null,
  "buildCommand": "",
  "outputDirectory": "",
  "installCommand": "",
  "functions": { "api/feedback.ts": { "maxDuration": 10 } }
}
```

**D) Walk through deployment with the user:**

```
Step 1: npx vercel login (browser opens, user authorises)
Step 2: npx vercel deploy --prod --yes
Step 3: Create fine-grained GitHub PAT at github.com/settings/personal-access-tokens/new
        (token name: <project>-feedback, only this repo, Issues read+write)
Step 4: echo "<token>" | npx vercel env add GITHUB_PAT production
Step 5: npx vercel deploy --prod --yes (redeploy with env)
Step 6: gh variable set FEEDBACK_WORKER_URL --body "https://<project>.vercel.app/api/feedback"
Step 7: Create labels: gh label create wiki-feedback --color 0075ca (+ type:correction, type:suggestion, type:missing, type:unclear, needs-human-review)
Step 8: git add -A && git commit -m "Set up feedback system" && git push
Step 9: Test: visit wiki page, click 💬, submit, verify via gh issue list
```

### Phase 10: Report and next steps

1. Report stats: pages created, word counts, source coverage
2. List remaining sources not yet ingested
3. Tell the user: **"Run `/wiki-ingest <source>` for each remaining source. One source per session for best quality."**

## Key rules

- **Ingest only ONE source during init** — remaining sources are ingested in separate sessions via `/wiki-ingest`. This prevents quality degradation from context exhaustion.
- **Structure discussion before config generation** — agree directories, page types, and quality rules before writing any config files.
- **Check each page against quality rules immediately after writing** — do not defer quality checks to the end.
- **Read source files directly** — do not delegate to sub-agents (they may lack file permissions).
- **Source paths in frontmatter must be exact** — read the actual filenames from `raw/` and use them verbatim.
- **Let the content determine structure** — propose directories and types that fit the domain, not a one-size-fits-all template.
- **Web view is optional** — the wiki's value is in the markdown pages and their interlinking. MkDocs, GitHub Pages, and the feedback system are enhancements, not requirements.
