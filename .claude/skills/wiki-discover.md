---
name: wiki-discover
description: Explore, evaluate, and acquire sources for the wiki through collaborative research
command: wiki-discover
---

# /wiki-discover

Collaboratively explore a domain, find relevant sources, evaluate their fit, and acquire them for the wiki. Works with an existing wiki (to fill gaps) or from scratch (to define scope and find initial material).

## When to use

- Starting a new wiki with no material — "I want to build a wiki about X"
- Expanding an existing wiki — "My wiki needs better coverage of Y"
- Evaluating a specific source — "Would this paper fit my wiki?"
- Systematic literature/standards gathering for a topic area

## Arguments

```
/wiki-discover                        # Start collaborative discovery
/wiki-discover "topic or question"    # Start with a specific search focus
/wiki-discover path/to/file.pdf       # Evaluate a specific file's fit
```

## Process

### Step 1: Establish scope

**If `wiki/scope.md` exists:** Read it. Know what topics are defined, which are covered, which are gaps.

**If wiki exists but no `scope.md`:** Generate one from the current index — list covered topic areas, ask the user what's missing or out of scope. Write `wiki/scope.md`.

**If no wiki exists at all:**
1. Ask the user about domain and audience (same questions as `/wiki-init` Phase 1)
2. Scaffold minimal structure: create project directory, `raw/`, `wiki/`, `wiki.config.md`, `CLAUDE.md`
3. Collaboratively define initial topic areas — suggest categories based on the domain, let the user refine
4. Propose a category structure and write a skeleton `wiki/index.md` with agreed headings (same process as `/wiki-init` Phase 3c). This structures the wiki before any sources are acquired.
4. Write `wiki/scope.md` with the agreed topic areas

### Scope file format

`wiki/scope.md`:

```markdown
# Wiki Scope

## Topic Areas
- [ ] Topic A — brief description of what this covers
- [ ] Topic B — brief description
- [x] Topic C — covered by: source1.md, source2.md (3 wiki pages)

## Out of Scope
- Thing X (reason)
- Thing Y (reason)

## Coverage: 1/3 topic areas have at least one source
```

The skill maintains this file throughout the discovery process.

### Step 2: Identify gaps

Compare `wiki/scope.md` against `wiki/index.md` (if wiki exists):

- **Uncovered topics** (no checkbox) → primary discovery targets
- **Thinly covered topics** (one source, few wiki pages) → depth expansion candidates
- **Well-covered topics** → skip unless user wants more

Present the gap analysis. Use AskUserQuestion:

```
"Which area should we explore first?"
Options: [list uncovered/thin topics from scope.md]
```

If the user provided a specific query or file as an argument, skip to Step 3 or Step 4 accordingly.

### Step 3: Search and preview

For the selected topic area (or user's query):

1. **WebSearch** for authoritative sources — papers, standards, government publications, technical reports
2. For the top 3-5 results, **WebFetch** to read the abstract, introduction, or summary
3. Assess **source quality tier**:
   - **Tier 1 — Authoritative**: Peer-reviewed papers, official standards (ISO, IEC, NORSOK), government/regulatory publications
   - **Tier 2 — Established**: Technical reports from recognised institutions, conference proceedings, established textbooks
   - **Tier 3 — Informational**: Industry whitepapers, technical blog posts, curated guides

### Step 4: Present fit assessment

For each candidate source, present:

```
Source: [Title]
URL/Path: [url or file path]
Quality: Tier [1/2/3] — [brief reason]

Expected contribution (based on preview):
  New concepts:  [list of concepts this would introduce]
  New entities:  [organizations, tools, standards mentioned]
  Enriches:      [existing wiki pages that would be updated]
  Fills gap:     [which scope.md topic area this covers]
```

Then use AskUserQuestion:

```
"How should we handle: [Source Title]?"
Options:
  - Add to wiki (download and queue for ingestion)
  - Add with guidance (you'll describe how to integrate it)
  - Skip (not relevant for this wiki)
  - Find alternative (search for something more specific on this topic)
```

**If "Add with guidance":** Ask the user to describe their integration direction. Examples of guidance:
- "Focus on sections 3-5, skip the introduction"
- "Mainly the regulatory comparison with EU AI Act"
- "Should update [[existing-page]], not create new concepts"
- "Background context only, not a primary source"

Write their guidance to `raw/<source-name>.notes.md`.

### Step 5: Acquire

For each approved source, **ask explicit user permission before any download**:

- **Free PDF / document**: Download to `raw/`. State filename and source URL in the permission request.
- **Web page**: WebFetch the content, save as markdown in `raw/`
- **Paywalled / restricted**: Inform the user. Suggest they download manually and provide the file path, then re-run `/wiki-discover path/to/downloaded-file`
- **User-provided file** (from argument): Copy to `raw/`

After acquisition, write `.notes.md` if the user provided integration guidance.

### Step 6: Update scope

After each batch of evaluations:

1. Update `wiki/scope.md` — check off topic areas that now have sources, update coverage count
2. Add any new topic areas that emerged during discovery (with user agreement)

### Step 7: Coverage check

Use AskUserQuestion:

```
"Coverage: [N/M] topic areas have sources. Uncovered: [list]. What next?"
Options:
  - Continue discovering (search for uncovered topics)
  - Go deeper (find additional sources for covered topics)
  - Expand scope (add new topic areas)
  - Done (list queued sources and next steps)
```

**If "Done":** List all sources in `raw/` that haven't been ingested yet, with their `.notes.md` guidance summaries. Tell the user:

> "Run `/wiki-ingest <source>` for each queued source. One source per session for best quality. The integration notes in `.notes.md` files will guide each ingestion."

### Step 8: Repeat or finish

If continuing, loop back to Step 2 (re-read scope, identify current gaps). Each cycle narrows the remaining gaps.

## Key rules

- **User approves every source** — never download without explicit permission. Present the fit assessment first so the user evaluates value, not just rubber-stamps a download.
- **User can guide integration** — "Add with guidance" captures editorial direction in `.notes.md` files that persist to the ingestion session.
- **Scope is a living document** — `wiki/scope.md` evolves during discovery. Topics can be added, removed, or marked out of scope at any time.
- **Prefer authoritative sources** — present quality tier alongside each suggestion. Flag Tier 3 sources so the user makes an informed choice.
- **Fit assessment is speculative** — based on preview/abstract, not full document. Frame as "expected contribution" not "will add."
- **Discovery and ingestion are separate** — discover acquires to `raw/` with notes; ingestion happens via `/wiki-ingest` in focused sessions. Exception: sources under ~200 lines can be ingested inline if the user wants.
- **Bootstraps new wikis** — if no wiki exists, creates minimal scaffold and scope.md before starting discovery.
- **Use AskUserQuestion** at every decision point — source evaluation, scope changes, coverage checks. Structured options, not open-ended questions.
- **Scope prevents creep** — every source must map to a defined topic area in scope.md. If a great source falls outside scope, the user explicitly expands scope first.
