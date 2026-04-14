---
name: wiki-review
description: Process accumulated feedback with owner approval, update wiki pages, and run maintenance
command: wiki-review
---

# /wiki-review

Process feedback from any source (GitHub Issues, a markdown file, or pasted text), propose changes for owner approval, execute approved changes, and run a maintenance pass.

## When to use

- Feedback has accumulated and it's time to process it
- Someone has provided corrections or suggestions
- The wiki needs a health check and refresh (`--lint-only`)

## Arguments

```
/wiki-review                      # Interactive: propose changes, owner approves
/wiki-review --auto               # Automatic: apply all changes, owner reviews archive after
/wiki-review --github             # Source: GitHub Issues (default if gh CLI authenticated)
/wiki-review --file feedback.md   # Source: markdown file
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
3. Classify each item as **trivial** or **substantive**:
   - **Trivial**: Adding a wikilink or cross-reference, fixing a typo-level error, adding a tag, formatting correction. These can be verified mechanically.
   - **Substantive**: Changing factual content, rewriting a section, adding new claims, contradicting existing text, removing content. These require editorial judgment.
4. Prioritize: corrections first, then missing content, then suggestions, then unclear

### Step 3: Analyse each item

For each non-stale feedback item, read the target wiki page and determine:
- What change is implied
- Whether it's supported by sources in `raw/` (read the relevant source section if needed)
- What the specific edit would be

This is analysis only — do not write any changes yet.

### Step 4: Apply trivial changes

Auto-apply trivial changes (link additions, cross-references, tag additions). Check each page against quality rules immediately after writing.

Present a summary to the owner:

```
Auto-applied (trivial):
  #18 concepts/hallucination — added [[trust-calibration]] to related links
  #22 entities/nrc — added missing tag
  #25 comparisons/rag-vs-fine-tuning — fixed wikilink syntax
```

### Step 5: Propose substantive changes

**In interactive mode (default):**

Present substantive proposals grouped by page. Use AskUserQuestion:

```
"Proposed changes to concepts/hallucination.md (2 items):"

  #12 (correction) "understates the problem"
   → Expand "Core Danger" section with LabSafety Bench data
     Source support: Report 1 §5.1 cites this

  #15 (missing) "no domain-specific benchmarks mentioned"
   → Add paragraph on benchmark limitations
     Source support: Report 1 §5.1 discusses this

Options:
  - Approve all for this page
  - Review individually
  - Skip page (leave issues open)
```

If "Review individually", present each item with:
  - Approve (make this change)
  - Modify (owner gives different direction — ask them how)
  - Skip (keep issue open, no change)

If "Modify": ask the owner what they want instead. Capture their direction verbatim — it goes in the batch archive.

**In auto mode (`--auto`):**

Skip this step. Apply all changes. Note "auto mode" in the batch archive.

### Step 6: Execute approved changes

Write pages for approved changes only. For each page:

1. Read the current page
2. Apply the approved changes (and any owner-modified directions)
3. Write the updated page
4. Immediately verify quality rules (word count, links, source paths)

Skipped items remain as open issues.

### Step 7: Close and comment on issues

**For GitHub Issues:**

Addressed items:
```bash
gh issue comment <number> --body "Addressed in commit <sha>.
Change: <description of what was modified>."
gh issue close <number>
```

Owner-skipped items: leave open, no comment (owner may revisit later).

Owner-deferred items (explicitly decided not to address):
```bash
gh issue comment <number> --body "Reviewed by wiki owner. Decision: not addressed.
Reason: <owner's reason or 'editorial decision'>."
gh issue edit <number> --add-label "needs-human-review"
```

Stale items:
```bash
gh issue comment <number> --body "This section was modified since your feedback was submitted. Please review the current version and resubmit if the issue persists."
gh issue close <number> --reason "not planned"
```

**For file/text feedback:** Report results to the user — list each item and what was done.

### Step 8: Write batch archive

Create `feedback/batch-<YYYY-MM-DD>.md`:

```yaml
---
title: "Feedback Batch — <YYYY-MM-DD>"
type: feedback-batch
date: <YYYY-MM-DD>
mode: interactive  # or "auto"
items_total: <N>
items_addressed: <N>
items_trivial_auto: <N>
items_owner_modified: <N>
items_skipped: <N>
items_stale: <N>
---
```

Body lists each item with:
- Feedback source (issue number / file line)
- Page and section
- Feedback text
- Classification (trivial / substantive)
- Proposed action
- Owner decision (approved / modified / skipped / auto-applied)
- Owner direction if modified (verbatim)
- Final change made

### Step 9: Maintenance pass

Run these checks regardless of whether there was feedback. If `scripts/wiki-check.ts` exists, start with `bun run scripts/wiki-check.ts`. Then:

1. **Lint**: Dead wikilinks, orphan pages, missing frontmatter
2. **Quality**: Word counts against wiki.config.md minimums
3. **Stale pages**: Pages with `updated:` date older than 90 days — flag for review
4. **Coverage gaps**: Concepts mentioned in summaries but lacking their own page
5. **Index sync**: Verify index.md lists all pages
6. **Nav sync**: If `mkdocs.yml` exists, verify nav matches directory structure
7. Fix any issues found

### Step 10: Commit and log

1. Stage changes: `git add wiki/ feedback/`
2. Commit with message referencing issue numbers: `"Process feedback batch <date> (Fixes #12, #15, ...)"`
3. Append to `wiki/log.md`:
   ```
   ## <YYYY-MM-DD> — Feedback batch
   - Mode: interactive / auto
   - Processed: N items (N addressed, N trivial auto-applied, N skipped, N stale)
   - Pages modified: [list]
   ```
4. Push if remote is configured

## Key rules

- **Propose before executing** (interactive mode) — the owner sees what Claude plans to do and approves, modifies, or skips. Claude does the analysis; the owner makes the decisions.
- **Trivial changes don't need approval** — link additions, cross-references, and formatting fixes are auto-applied and reported. This keeps the approval burden proportional to change significance.
- **Don't blindly accept feedback** — verify corrections against sources in `raw/`. Feedback can be wrong. Note this in the proposal.
- **Don't delete information** — if there's genuine disagreement between feedback and sources, note both positions. Propose deferral for human review.
- **Capture owner decisions** — the batch archive records what was proposed, what the owner decided, and why. This is the editorial audit trail.
- **Source material is authoritative** — feedback contradicting verified sources should be proposed as a deferral, not as a change.
- **Check quality immediately after each page update** — do not defer to the end.
- **Maintenance runs every time** — lint + quality check happens whether or not there was feedback.
- **Web view is optional** — nav sync only if `mkdocs.yml` exists.
