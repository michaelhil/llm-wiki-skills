---
name: wiki-review
description: Process accumulated feedback, update wiki pages, and run maintenance
command: wiki-review
---

# /wiki-review

Process feedback from any source (GitHub Issues, a markdown file, or pasted text), update wiki pages accordingly, and run a maintenance pass.

## When to use

- Feedback has accumulated and it's time to process it
- Someone has provided corrections or suggestions
- The wiki needs a health check and refresh (`--lint-only`)

## Arguments

```
/wiki-review                      # Auto-detect feedback source
/wiki-review --github             # Process open GitHub Issues labelled wiki-feedback
/wiki-review --file feedback.md   # Process feedback from a markdown file
/wiki-review --lint-only          # Skip feedback, just run maintenance
```

## Prerequisites

The wiki must exist with a `CLAUDE.md` agent schema. If `wiki.config.md` is missing, offer to create it interactively before proceeding.

## Process

### Step 1: Collect feedback

**Auto-detect**: Check if `gh` CLI is authenticated and the repo has issues labelled `wiki-feedback`. If yes, use GitHub Issues. If no, ask the user for feedback source.

**From GitHub Issues:**
```bash
gh issue list --label wiki-feedback --state open --json number,title,body,labels,createdAt
```

Parse each issue:
- If `<!-- WIKI-FEEDBACK-META ... -->` block exists → extract structured fields (page, section, category, submitter, wiki_version)
- If no META block (manually created issue) → extract page from title (e.g., `[concepts/hallucination]`), category from labels (e.g., `type:correction`), treat full body as feedback text

**From a markdown file:** Read the file. Adapt to whatever structure is present — look for page references, categories, and feedback text.

**From pasted text:** Ask the user to paste. Parse with best-effort structure detection.

### Step 2: Group and triage

1. Group feedback by page, then by section within each page
2. For each item, check staleness (if wiki_version is available):
   ```bash
   git diff <feedback_version>..HEAD -- wiki/<page>.md
   ```
   - Target section unchanged → feedback is current
   - Target section changed → check if already addressed
   - Section deleted → mark stale
3. Prioritize: corrections first, then missing content, then suggestions, then unclear

### Step 3: Process each page

For each page with actionable feedback:

1. Read the current wiki page
2. Read all feedback items for this page
3. Evaluate each item:
   - **Corrections**: Verify the claim against sources in `raw/`. If the feedback is right, fix the text. If the current text is supported by sources, note why it stands.
   - **Missing content**: Add if supported by sources in `raw/`. If the requested content isn't in any source, note this — it may indicate a new source should be ingested.
   - **Suggestions**: Incorporate if they improve the page without contradicting sources.
   - **Unclear**: Rewrite the flagged section for clarity.
4. Write the updated page
5. **Immediately verify** the update meets quality rules from wiki.config.md

### Step 4: Report per item

**For GitHub Issues:**

Addressed items:
```bash
gh issue comment <number> --body "Addressed in commit <sha>.
Change: <description of what was modified>."
gh issue close <number>
```

Unaddressable items:
```bash
gh issue comment <number> --body "Reviewed but not addressed.
Reason: <explanation>."
gh issue edit <number> --add-label "needs-human-review"
```

Stale items:
```bash
gh issue comment <number> --body "This section was modified since your feedback. Please review the current version and resubmit if the issue persists."
gh issue close <number> --reason "not planned"
```

**For file/text feedback:** Report results to the user — list each item and what was done.

### Step 5: Write batch archive

If feedback was processed, create `feedback/batch-<YYYY-MM-DD>.md`:

```yaml
---
title: "Feedback Batch — <YYYY-MM-DD>"
type: feedback-batch
date: <YYYY-MM-DD>
items_total: <N>
items_addressed: <N>
items_deferred: <N>
items_stale: <N>
---
```

Body lists each item: source reference, page, section, feedback text, action taken, reason if deferred.

### Step 6: Maintenance pass

Run these checks regardless of whether there was feedback. If `scripts/wiki-check.ts` exists, start with `bun run scripts/wiki-check.ts` to get a full report. Then:

1. **Lint**: Dead wikilinks, orphan pages, missing frontmatter
2. **Quality**: Word counts against wiki.config.md minimums
3. **Stale pages**: Pages with `updated:` date older than 90 days — flag for review
4. **Coverage gaps**: Concepts mentioned in summaries but lacking their own page
5. **Index sync**: Verify index.md lists all pages
6. **Nav sync**: If `mkdocs.yml` exists, verify nav matches directory structure
7. Fix any issues found

### Step 7: Commit and log

1. Stage changes: `git add wiki/ feedback/`
2. Commit with message referencing issue numbers if applicable
3. Append to `wiki/log.md`
4. Push if remote is configured

## Key rules

- **Read pages before updating** — understand current content before modifying.
- **Don't blindly accept feedback** — verify corrections against sources in `raw/`. Feedback can be wrong.
- **Don't delete information** — if there's genuine disagreement, note both positions with citations.
- **Explain deferrals** — every unaddressed item gets a reason.
- **The batch archive is permanent** — always write it, even for small batches.
- **Maintenance is part of every review** — lint + quality check runs whether or not there was feedback.
- **Source material is authoritative** — feedback contradicting verified sources should be deferred for human review.
- **Check quality immediately after each page update** — do not defer to the end.
- **Web view is optional** — nav sync only if `mkdocs.yml` exists.
