---
name: wiki-review
description: Process accumulated feedback, update wiki pages, and run maintenance
command: wiki-review
---

# /wiki-review

Process feedback from any source (GitHub Issues, a markdown file, or pasted text), update wiki pages accordingly, and run a maintenance pass.

## When to use

- Feedback has accumulated and it's time to process it (every few weeks)
- Someone has provided corrections or suggestions
- The wiki needs a health check and refresh

## Arguments

```
/wiki-review                      # Auto-detect: GitHub Issues if available, else ask
/wiki-review --github             # Process open GitHub Issues labelled wiki-feedback
/wiki-review --file feedback.md   # Process feedback from a markdown file
/wiki-review --lint-only          # Skip feedback, just run maintenance
```

## Prerequisites

The wiki must exist (created by `/wiki-init`). Verify by checking for `wiki.config.md` and `CLAUDE.md`.

## Process

### Step 1: Collect feedback

**From GitHub Issues** (default if `gh` CLI is authenticated and repo has `wiki-feedback` label):

```bash
gh issue list --label wiki-feedback --state open --json number,title,body,labels,createdAt
```

Parse the `<!-- WIKI-FEEDBACK-META ... -->` block from each issue body to extract: page, section, category, submitter, wiki_version, timestamp.

**From a markdown file**: Read the file. Expect entries in this format (flexible — adapt to what's actually in the file):

```markdown
## Page: concepts/hallucination
### Section: The Core Danger
Type: correction
Feedback: This understates the problem...
```

**From pasted text**: Ask the user to paste feedback. Parse it with best-effort structure detection.

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
   - **Corrections**: Verify the claim. If the feedback is right, fix it. If the current text is right, note why.
   - **Missing content**: Add if supported by sources in `raw/`. If the requested content isn't in any source, note this.
   - **Suggestions**: Incorporate if they improve the page without contradicting sources.
   - **Unclear**: Rewrite the flagged section for clarity.
4. Write the updated page
5. Verify the update meets quality rules from wiki.config.md

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

**For file/text feedback:**

Report results to the user directly — list each item and what was done.

### Step 5: Write batch archive

Create `feedback/batch-<YYYY-MM-DD>.md`:

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

Body lists each item with: source reference (issue number or file line), page, section, feedback text, action taken, and reason if deferred.

### Step 6: Maintenance pass

Run these checks regardless of whether there was feedback:

1. **Lint**: Dead links, orphan pages, missing frontmatter
2. **Quality**: Word counts against wiki.config.md minimums
3. **Stale pages**: Pages not updated in 90+ days — flag for review
4. **Coverage gaps**: Concepts mentioned in summaries but lacking their own page
5. **Index sync**: Verify index.md lists all pages and nav matches directory structure
6. Fix any issues found.

### Step 7: Commit and log

1. Stage all changes: `git add wiki/ feedback/`
2. Commit with message referencing issue numbers if applicable: `"Process feedback batch <date> (Fixes #12, #15, ...)"
3. Append to `wiki/log.md`
4. Push if remote is configured

## Key rules

- **Read pages before updating** — understand current content before modifying
- **Don't blindly accept feedback** — verify corrections against sources. Feedback can be wrong.
- **Don't delete information** — if feedback says something is wrong, update the text but preserve the original claim with context if there's genuine disagreement
- **Explain deferrals** — every unaddressed item gets a reason, whether in a GitHub Issue comment or in the batch archive
- **The batch archive is permanent** — it's the audit trail. Always write it, even for small batches
- **Maintenance is part of review** — every review pass includes a lint + quality check, not just feedback processing
- **Source material is authoritative** — feedback that contradicts verified source material should be deferred for human review, not automatically accepted
