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

### Phase 2: Scaffold structure

Create the project directory:

```
<project-name>/
├── raw/                    # Layer 1: Immutable sources
├── wiki/                   # Layer 2: Compiled knowledge
│   ├── index.md
│   ├── scope.md            # Topic areas and coverage tracking
│   └── log.md
├── wiki.config.md          # Domain context + quality rules
└── .gitignore
```

If web view requested, also create: `mkdocs.yml`, `wiki/glossary.md`, `wiki/tags.md`.
If feedback requested, also create: `feedback/`.

Initialize git repo.

### Phase 3: Generate wiki.config.md

Write `wiki.config.md` with three sections, using the answers from Phase 1:

```markdown
# Wiki Configuration

## Domain
<Free-text description: what the wiki covers, who reads it, what level of
explanation is appropriate. This description is used to check whether new
sources are relevant and to guide the tone and depth of wiki pages.>

## Writing Approach
<One of two approaches — infer from the domain description, then confirm
with the user: "I've set the writing approach to [X]. Change?">

Source compilation: Pages compile what the sources say. Every factual
claim references a specific source in raw/. Do not add beyond sources.

OR

Comprehensive reference: Write each concept page as a standalone reference
article. Sources in raw/ provide the foundation — cite them in frontmatter.
Supplement with established knowledge, citing original works inline.
Each concept page should cover: definition and mechanism, significance,
current evidence, practical implications, connections to related concepts,
open questions, examples from multiple domains.

## Quality Rules
- Summary pages: minimum 300 words
- Concept pages: minimum 200 words, link to >= 3 related pages
- Entity pages: minimum 120 words, must explain domain relevance
- Comparison pages: minimum 250 words, must include a comparison table
- Source paths in frontmatter must match actual files in raw/
- Lint must pass after every phase (zero dead links, zero orphans)
```

### Phase 3b: Generate wiki/scope.md

Based on the source material, identify the major topic areas the wiki will cover. Write `wiki/scope.md` with checkboxes for each area. This file tracks coverage and prevents scope creep during future `/wiki-discover` sessions. Mark all topics as uncovered initially — they'll be checked off as sources are ingested.

### Phase 3c: Discuss and agree wiki structure

The wiki's category structure should be agreed before content is created. This prevents expensive reorganisation later.

1. **Scan source material** — read the table of contents or first ~10 lines of each source (not full content). Combined with the domain description and scope.md topic areas, propose a hierarchical category structure: top-level sections, subsections, and a brief note on what content goes under each.

2. **Present to user.** Use AskUserQuestion for clear binary choices ("Should trust and automation bias be one section or two?"). Refine through conversation — the user may merge, split, add, or remove categories.

3. **Keep it proportional.** If the user accepts the proposal as-is, that's one round and done. Don't force multiple iterations. For small wikis (fewer than 3 sources), this discussion can be skipped — structure will be obvious from content.

4. **Write `wiki/index.md` as a skeleton** with the agreed headings and italic placeholders:
   ```markdown
   # Wiki Title

   ## Foundations
   ### Cognitive Science
   *Pages to be added during ingestion.*

   ### LLM Technology and Agents
   *Pages to be added during ingestion.*

   ## Human-AI Interaction
   ### Trust and Reliance
   *Pages to be added during ingestion.*
   ```

   This skeleton guides all subsequent ingestion — new pages are placed under these headings. Empty sections show what's still missing.

### Phase 4: Generate CLAUDE.md

Write the project's agent schema with these sections:

1. **Title and description.** One paragraph. Reference `wiki.config.md` for domain context, writing approach, and quality rules — do not duplicate them in CLAUDE.md.

2. **Directory structure.** Describe `raw/` (immutable sources, never modified) and `wiki/` (compiled knowledge) with its subdirectories: `summaries/`, `concepts/`, `entities/`, `comparisons/`. If feedback is enabled, also `feedback/`.

3. **Page format.** YAML frontmatter spec — every wiki page MUST have:
   - `title` (string), `type` (one of: concept, entity, summary, comparison)
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
2. Extract concepts, entities, relationships, comparisons
3. Write all pages with full detail — check each page against quality rules IMMEDIATELY after writing
4. This first source sets the quality bar for all subsequent ingestions

**STOP after the first source.** Do not attempt to ingest all sources in one session.

### Phase 7: Populate index

1. If a skeleton index exists from Phase 3c: populate it with `[[wikilinks]]` to the pages created during ingestion, replacing the italic placeholders. Keep empty sections for topic areas not yet covered — they show what's still missing.
2. If no skeleton exists (Phase 3c was skipped for a small wiki): generate `wiki/index.md` from the created pages, organized by type and topic.
3. If web view: generate `wiki/glossary.md` and the `nav:` section of `mkdocs.yml`
4. Write the initial `wiki/log.md` entry

### Phase 8: Quality check

If `scripts/wiki-check.ts` exists, run it: `bun run scripts/wiki-check.ts`. Otherwise check manually:
1. Lint: dead wikilinks, orphan pages, missing frontmatter
2. Quality: word counts, link density against wiki.config.md minimums
3. Fix any issues found
4. Re-run until clean

### Phase 9: Infrastructure (conditional)

**If web view requested** (Phase 5 in mkdocs.yml generation):
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
- Use Material theme CSS variables (`--md-default-bg-color`, `--md-primary-fg-color`, etc.) for dark mode compatibility
- Close popover on Escape key or backdrop click

**B) Create `api/feedback.ts`** — Vercel serverless function:
- Default export: `async function handler(req, res)`
- Validate JSON body: `page` (string, required), `section` (string), `sectionTitle` (string), `category` (one of: correction, suggestion, missing, unclear), `feedback` (string, 1-5000 chars), `submitter` (string), `wikiVersion` (string)
- CORS: set `Access-Control-Allow-Origin` to the wiki's GitHub Pages URL only. Handle OPTIONS preflight with 204.
- Reject requests from other origins with 403.
- Read `GITHUB_PAT` from `process.env`. Return 500 if not set.
- Create GitHub Issue via `fetch("https://api.github.com/repos/{REPO}/issues")`:
  - Title: `[{page without .md}] {Category capitalised} — "{sectionTitle truncated to 60 chars}"`
  - Body: `<!-- WIKI-FEEDBACK-META\npage: ...\nsection: ...\nsection_title: ...\ncategory: ...\nsubmitter: ...\nwiki_version: ...\ntimestamp: ...\n-->` (machine-parseable block) followed by human-readable section with page link, section, version, type, horizontal rule, feedback text, submitter
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

**D) Walk through deployment with the user** — these are interactive steps:

```
Step 1: Login to Vercel
  npx vercel login
  (Browser opens — user authorises)

Step 2: Deploy
  npx vercel deploy --prod --yes
  (Note the deployment URL — e.g., https://project-name.vercel.app)

Step 3: Create a fine-grained GitHub PAT
  Open: github.com/settings/personal-access-tokens/new
  - Token name: <project>-feedback
  - Repository access: Only this repo
  - Permissions: Issues → Read and write (nothing else)
  - Generate and copy the token

Step 4: Set PAT as Vercel environment variable
  echo "<token>" | npx vercel env add GITHUB_PAT production

Step 5: Redeploy with the env var
  npx vercel deploy --prod --yes

Step 6: Set Vercel URL as GitHub repo variable
  gh variable set FEEDBACK_WORKER_URL --body "https://<project>.vercel.app/api/feedback"

Step 7: Create GitHub Issue labels
  gh label create wiki-feedback --color 0075ca --description "Feedback submitted via wiki"
  gh label create "type:correction" --color d73a4a --description "Something is factually wrong"
  gh label create "type:suggestion" --color a2eeef --description "Could be improved"
  gh label create "type:missing" --color 7057ff --description "Content should exist but doesn't"
  gh label create "type:unclear" --color fbca04 --description "Hard to understand"
  gh label create "needs-human-review" --color e4e669 --description "Deferred for editorial decision"

Step 8: Push to trigger GitHub Pages rebuild
  git add -A && git commit -m "Set up feedback system" && git push

Step 9: Test end-to-end
  Visit a wiki page, hover a section heading, click 💬, submit test feedback
  Verify: gh issue list --label wiki-feedback
  Close test issue: gh issue close <number> --comment "Setup test"
```

Walk through each step with the user. If any step fails, debug before proceeding to the next.

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
