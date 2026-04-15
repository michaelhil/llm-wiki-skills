---
name: wiki-init
description: Set up a new LLM-wiki project — with or without initial source material
command: wiki-init
---

# /wiki-init

Set up a new LLM-wiki project. Scaffolds the three-layer Karpathy architecture (raw sources → compiled wiki → agent schema), optionally discusses category structure, and optionally configures MkDocs for web browsing. Works with or without initial source material.

## When to use

- Starting any new wiki project — whether you have documents ready or just a topic
- This is always the first skill to run for a new wiki

**After init:** Use `/wiki-discover` to find sources, `/wiki-ingest` to process them.

## Process

### Phase 1: Gather context (interactive)

Ask the user these questions (skip any already answered):

1. **What is this wiki about?** (domain, topic area)
2. **Who is the audience?** (team, organization, expertise level)
3. **Do you have source files to start with?** (directory path, list of files, or "none yet")
4. **Project name?** (used for directory name and site title — kebab-case)
5. **Set up web view?** (MkDocs Material for browsable site — yes/no)
6. **Set up GitHub Pages + feedback system?** (only if web view is yes)

### Phase 2: Scaffold

Create the minimal project structure:

```
<project-name>/
├── raw/                    # Layer 1: Immutable sources
│   └── private/            # Proprietary material (gitignored, not cited)
├── wiki/                   # Layer 2: Compiled knowledge
│   └── summaries/          # One summary per source (always present)
└── .gitignore              # Includes raw/private/
```

Initialize git repo.

### Phase 3: Discuss wiki structure (or defer)

Ask the user:

> "Would you like to discuss the wiki's category structure now, or defer until you've gathered more material via `/wiki-discover`?"

**If now:**

1. **Scan available material** — if sources were provided, read their TOCs or first ~10 lines. If no sources, use the domain description and LLM field knowledge to propose categories.

2. **Propose content directories and page types.** Examples by domain:
   - Human factors wiki: `theories/`, `methods/`, `failure-modes/`, `tools/`
   - Regulatory wiki: `frameworks/`, `standards/`, `requirements/`, `case-studies/`
   - General technical wiki: `topics/`, `references/`, `comparisons/`
   - Propose what fits the domain — there are no default categories

3. **Refine with user.** Use AskUserQuestion for clear choices. Keep it proportional — one round if the user accepts.

4. **Define quality rules per type.** For each agreed type, propose a word count minimum and any structural requirements. User confirms.

5. **Create the agreed directories** in `wiki/`.

6. **Write `wiki/index.md` as a skeleton** with agreed headings and italic placeholders:
   ```markdown
   # Wiki Title

   ## [Section Name]
   ### [Subsection]
   *Pages to be added during ingestion.*
   ```

**If defer:**

- Create minimal `wiki/index.md` with just the wiki title, no section headings
- No content directories created yet
- Quality rules will include only summary minimum
- The STRUCTURE DISCUSSION operation in CLAUDE.md allows this to be revisited at any time

### Phase 4: Generate config files

With context gathered, generate all config files at once:

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
<If structure was agreed in Phase 3, one rule per agreed type, e.g.:>
- [Type] pages: minimum [N] words
- [Type] pages: minimum [N] words, link to >= 3 related pages
- Source paths in frontmatter must match actual files in raw/
- Lint must pass after every phase (zero dead links, zero orphans)
```

**B) `wiki/scope.md`** — if structure was discussed, topic areas from Phase 3. If deferred, an empty scope file noting that topics will be defined later.

**C) `CLAUDE.md`** — the agent schema with these sections:

1. **Title, description, and evolution note.** One paragraph. Reference `wiki.config.md` for domain context, writing approach, and quality rules. State that this schema evolves: "When a session reveals better conventions or missing operations, propose updates to this file."

2. **Directory structure.** Describe `raw/` (immutable sources) and `wiki/` with `summaries/` plus any content directories agreed in Phase 3. If structure was deferred, note that content directories will be created during the STRUCTURE DISCUSSION operation.

3. **Page format.** YAML frontmatter spec — every wiki page MUST have:
   - `title` (string), `type` (summary is always valid; other types per this wiki's structure, listed in wiki.config.md quality rules)
   - `sources` (list of paths relative to project root)
   - `related` (list of `[[wikilinks]]`)
   - `tags` (list of lowercase keywords)
   - `confidence` (high | medium | low)
   - `created` (date), `updated` (date)

4. **Naming conventions.** Kebab-case filenames. Summaries: `summary-<short-name>.md`. No spaces, no underscores.

5. **Interlinking.** Use `[[page-name]]` wikilinks without file extension. Cross-reference liberally.

6. **Operations:**
   - INGEST: read source → extract → write pages → update index → lint → log
   - QUERY: read index → find relevant pages → synthesise answer with citations
   - LINT: dead links, orphans, missing frontmatter, source path validation
   - UPDATE: update dates, note contradictions, preserve history, log changes
   - PROCESS FEEDBACK (if feedback enabled): retrieve issues → analyse → propose → execute approved → archive
   - STRUCTURE DISCUSSION: When the user is ready to organize the wiki:
     1. List sources in `raw/` (including `raw/private/`) and scan their headings/TOCs
     2. Propose content directories and page types based on sources and domain
     3. Refine with user until agreed
     4. Define quality rules per type (word minimums, structural requirements)
     5. Create agreed directories in `wiki/`
     6. Write or update `wiki/index.md` with section headings
     7. Add quality rules per type to `wiki.config.md`
     8. Update the page format section of this CLAUDE.md with agreed types

### Phase 5: Copy sources to raw/

If sources were provided in Phase 1, copy them into `raw/`. Preserve original filenames. If there are natural groupings, create subdirectories. Do NOT modify source files — `raw/` is immutable.

If no sources were provided, skip this phase.

### Phase 6: Ingest the FIRST source

**Only if** sources were provided in Phase 1 **AND** structure was agreed in Phase 3.

Pick the source that best represents the wiki's scope (ask the user if unclear). Ingest it following the full `/wiki-ingest` process:

1. Read it completely
2. Extract based on the agreed page types and structure
3. Write all pages with full detail — check each page against quality rules IMMEDIATELY after writing
4. This first source sets the quality bar for all subsequent ingestions

**STOP after the first source.** Do not attempt to ingest all sources in one session.

If sources were provided but structure was deferred, skip — sources wait in `raw/` until structure is discussed.

### Phase 7: Populate index

If ingestion happened in Phase 6: populate the skeleton index with `[[wikilinks]]` to created pages, replacing italic placeholders. Keep empty sections for uncovered areas.

If no ingestion happened: keep the index as-is (skeleton or minimal).

If web view: generate `wiki/glossary.md` and the `nav:` section of `mkdocs.yml`.

Write the initial `wiki/log.md` entry.

### Phase 8: Quality check

If ingestion happened: run `scripts/wiki-check.ts` if available, otherwise check manually. Fix issues, re-run until clean.

If no ingestion: skip (nothing to check).

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
- Add a `💬` icon to every `h2[id]` and `h3[id]` heading (appears on hover)
- On click: centered modal popover with radio group (correction / suggestion / missing / unclear), required textarea, optional name field, submit button
- Submit sends JSON POST to `config.extra.feedback_worker_url`
- 30-second debounce, dark mode compatible, demo mode if no worker URL

**B) Create `api/feedback.ts`** — Vercel serverless function:
- Validate JSON body, CORS check, create GitHub Issue via API
- Issue with `WIKI-FEEDBACK-META` comment block + human-readable section + labels

**C) Create `vercel.json`**: framework null, function config

**D) Walk through deployment:**
```
Step 1: npx vercel login
Step 2: npx vercel deploy --prod --yes
Step 3: Create fine-grained GitHub PAT (this repo, Issues read+write only)
Step 4: echo "<token>" | npx vercel env add GITHUB_PAT production
Step 5: npx vercel deploy --prod --yes
Step 6: gh variable set FEEDBACK_WORKER_URL --body "https://<project>.vercel.app/api/feedback"
Step 7: Create labels (wiki-feedback, type:correction, type:suggestion, type:missing, type:unclear, needs-human-review)
Step 8: git push (triggers Pages rebuild)
Step 9: Test end-to-end
```

### Phase 10: Report and next steps

Report stats and provide context-appropriate next steps:

- **Sources + structure agreed**: "Run `/wiki-ingest <source>` for each remaining source. One per session."
- **Sources + structure deferred**: "Sources copied to raw/. Explore more with `/wiki-discover` if needed. When ready, say 'let's discuss the wiki structure'. Then `/wiki-ingest` per source."
- **No sources + structure agreed**: "Use `/wiki-discover` to find sources, then `/wiki-ingest` per source."
- **No sources + structure deferred**: "Use `/wiki-discover` to find and evaluate sources. When ready, discuss structure. Then `/wiki-ingest` per source."

## Key rules

- **Init is always the starting point** for any new wiki, with or without material.
- **Structure discussion before config generation** — if the user chooses "now." If deferred, config is generated with minimal rules and the STRUCTURE DISCUSSION operation in CLAUDE.md handles it later.
- **Ingest requires both sources AND structure** — if either is missing, ingestion is skipped during init.
- **Check each page against quality rules immediately after writing.**
- **Read source files directly** — do not delegate to sub-agents.
- **Source paths in frontmatter must be exact.**
- **Let the content determine structure** — propose directories and types that fit the domain.
- **Web view is optional** — every content step works without it.
