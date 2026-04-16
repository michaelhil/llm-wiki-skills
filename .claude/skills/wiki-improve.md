---
name: wiki-improve
description: Process GitHub Issues to iteratively improve the wiki skills themselves
command: wiki-improve
---

# /wiki-improve

Process feedback from GitHub Issues to improve the wiki skill files (`.claude/skills/*.md`, `scripts/wiki-check.ts`, and supporting files). This is a meta-skill: it changes how the skills work, not the content of any wiki built with them.

## When to use

- Issues have accumulated in the skill repository and it's time to process them
- A specific cluster of related issues needs to be addressed together
- You want to cut a new version of the skills after making improvements

This skill targets the **skill files themselves**, not wiki content. Use `/wiki-review` to process feedback about a specific wiki's pages.

## Arguments

```
/wiki-improve                     # Full workflow: fetch, cluster, analyse, implement, release
/wiki-improve --dry-run           # Fetch and analyse only — no changes, just assessment
/wiki-improve --issues 3,7,11    # Start with specific issues pre-selected (skip clustering)
```

## Prerequisites

The current directory must be a git repository with a GitHub remote. The `gh` CLI must be authenticated (`gh auth status`). If either condition is not met, tell the user what is missing and stop.

## Process

### Step 1: Fetch and parse issues

Fetch all open issues from the current repository:

```bash
gh issue list --state open --json number,title,body,labels,createdAt --limit 100
```

If no open issues are found, tell the user: "No open issues found. Nothing to improve." Stop.

For each issue, extract:
1. **Issue number and title**
2. **Target file(s)**: which skill or script the issue refers to (parse from title prefix like `wiki-ingest:` or from body references to file paths)
3. **Category**: enhancement, bug, missing-guidance, performance, ux, documentation, cross-cutting (from labels, or infer from title/body if unlabelled)
4. **Substance**: the core request in one sentence (strip context and examples)

Read each issue body completely. Do not summarise from titles alone — the title is a label, the body is the argument.

If `--issues` was provided, fetch only the specified issues and skip to Step 3.

### Step 2: Cluster by theme

Group issues into clusters of related changes. A cluster is a set of issues that should be implemented together because they share a root cause, touch the same logic, or would conflict if done separately.

**Clustering method — do each of these in order:**

1. **Extract the underlying problem for each issue.** Strip the proposed solution. Ask: "What is the user or agent actually struggling with?" Two issues proposing different solutions to the same struggle belong together.

2. **Identify shared touch points.** Issues targeting the same file AND the same step or section are candidates. But also check for cross-file clusters: an issue in wiki-init Phase 6 and an issue in wiki-ingest Step 1 may both be about the init-to-ingest handoff.

3. **Check for logical dependencies.** If implementing issue A would make issue B trivial, redundant, or impossible, they are in the same cluster. If implementing A first would constrain the design space for B, note the dependency direction.

4. **Check for conflicts.** Two issues that propose incompatible changes to the same mechanism must be in the same cluster so the conflict is resolved together, not introduced by sequential implementation.

5. **Separate genuinely independent issues.** Resist over-clustering. Issues that happen to share a label but address different mechanisms in different steps should be separate clusters. A cluster should have a single coherent thesis — if you cannot state it in one sentence, split the cluster.

Name each cluster with a short descriptive phrase (not issue numbers). List constituent issues.

### Step 3: Analyse clusters

For each cluster, produce a structured analysis. This is the most important step — the quality of analysis determines whether changes will actually improve the skills or introduce new problems.

**Mandatory dimensions — apply to every cluster:**

1. **Root cause.** Trace from the symptom (what the issue reporter observed) to the mechanism (what the skill text says or fails to say) to the cause (why the skill was written that way — was it an oversight, a deliberate simplification, or a gap the author didn't encounter?). Name the cause explicitly.

2. **Architectural fit.** Read the skill that would be modified. Read its neighbours (skills that hand off to or receive from it). Where does this cluster's fix sit in the overall workflow? Does it change a handoff boundary, an internal step, or a key rule? Changes to handoff boundaries are high-risk because they affect multiple skills.

3. **Unintended consequences.** For each proposed change, ask: "What would a naive agent do if it read only this section in isolation?" Look for instructions that are safe in context but dangerous if taken literally. Check whether the change creates new failure modes: an agent that skips a step because the new instruction made it seem optional, or an agent that loops because a new conditional has no termination path.

4. **Cross-skill interaction.** Trace data flow. If the change alters what wiki-init produces, check whether wiki-ingest and wiki-review still consume it correctly. If the change modifies a file format (frontmatter, config, scope), check all skills that read that format.

5. **Backward compatibility.** Would existing wikis built with the current skills still work after this change? If a change modifies the expected directory structure, frontmatter schema, or config format, it needs a migration note or must be non-breaking.

**Conditional dimensions — apply where relevant, state which apply and why:**

6. **Consistency and coherence.** Apply when the change introduces or modifies a pattern. Do the existing skills handle analogous situations differently? Check: naming conventions, conditional branch style, user interaction patterns, language register. If wiki-ingest has a pattern for X and this cluster would introduce a different pattern for the same X in wiki-init, that is a consistency problem.

7. **Bloat assessment.** Apply when the change adds more than 10 lines to a single step. Count the words the proposed change would add. Read the surrounding context. Ask: "Would an agent reading this section for the first time be able to hold all the instructions in working memory?" If a step is already 15+ lines and the change adds 10 more, consider restructuring rather than appending.

8. **Simplicity.** Apply when the change adds conditional branches or new sub-steps. Could the same improvement be achieved with fewer words, fewer conditions, or fewer steps? If the proposed change adds a conditional branch, ask whether the branch can be eliminated by changing a default or merging two steps.

9. **Guidance precision.** Apply when the change is instructional text (not structural). Too vague ("consider the context") and the agent improvises unpredictably. Too specific ("always add exactly 3 wikilinks to section 2") and the agent cannot adapt to unusual sources. The target is instructions that constrain the decision space without scripting the answer.

10. **User control.** Apply when the change adds or removes a decision point. Does the change preserve the user's ability to direct, override, or skip? Every substantive decision must pass through the user. If the change automates something that was previously interactive, it must have an explicit user-approval gate.

11. **Testability.** Apply when the change modifies observable behaviour. How would someone verify this change works? If the only way to test is "build a full wiki and see," the change is hard to validate. Prefer changes that produce observable, checkable artefacts.

### Step 4: Present clusters with impact assessment

Present each cluster to the user:

```
Cluster: [descriptive name]
Issues: #N, #M, #P
Target files: [list]
Root cause: [one sentence]
Impact: [Low / Medium / High] — [reason]
  Low = single step in one skill, no cross-skill effects
  Medium = multiple steps in one skill, or touches a handoff
  High = cross-cutting, changes architecture or file formats
Risk: [Low / Medium / High] — [reason]
  Low = additive (new guidance), no existing behaviour changes
  Medium = modifies existing behaviour in one skill
  High = changes behaviour across skills or modifies data formats
Estimated scope: [N lines added, M lines modified, P lines removed]
Dependencies: [other cluster names, if any]
Conflicts: [other cluster names, if any]
```

Use AskUserQuestion:

```
"Which cluster(s) should we tackle? Select one or more, or ask for details on any cluster."
Options:
  - [Cluster A name] (Impact: X, Risk: Y)
  - [Cluster B name] (Impact: X, Risk: Y)
  - ... (list all clusters)
  - Show details for a cluster
  - Skip — no changes this session
```

If "Show details": present the full Step 3 analysis for the requested cluster, then re-present the selection.

If selected clusters have noted conflicts between them, warn the user: "Clusters [A] and [B] have conflicting changes to [mechanism]. Which takes priority?" Resolve the conflict before proceeding.

If `--dry-run`: present the analysis and stop. Do not proceed to Step 5.

### Step 5: Draft specific changes

For each selected cluster, read the target file(s) completely before drafting. Then draft the exact changes.

For each change, specify:
- **File**: exact path
- **Location**: step number, section name, or line range
- **Operation**: add, modify, or remove
- **Current text**: quote the exact text being changed (or "N/A" for additions)
- **Proposed text**: the exact new text
- **Justification**: which issues this addresses and why this wording was chosen

**Drafting discipline:**

- Match the existing conventions exactly: frontmatter fields, section order, step format, conditional branches ("If X:" / "If not X:"), AskUserQuestion with bounded options, imperative language for agent instructions.
- Read the three lines before and after each insertion point to ensure the new text flows naturally.
- If adding a conditional branch, include both paths and ensure each path terminates.
- If adding a key rule, keep it to one or two short sentences with reasoning.

### Step 6: Present plan for approval

Present the complete change plan to the user. Group by file. For each file, show changes in the order they appear in the file.

Use AskUserQuestion:

```
"Review the proposed changes. What should I do?"
Options:
  - Approve all — proceed to adversarial review
  - Approve with modifications — tell me what to change
  - Review file by file — I'll present each file separately
  - Reject — discard this plan
```

If "Approve with modifications": ask the user for their modifications. Apply them to the plan. Re-present the modified plan for final confirmation.

If "Review file by file": present each file's changes separately with per-file approve/modify/skip options.

### Step 7: Adversarial review

Conduct a thorough adversarial review of the approved plan. This is a structured self-critique — not a rubber stamp.

**Work through each of these challenges. For each one, produce a finding (what you found) and a verdict (no change needed / change required — with the specific fix).**

1. **The naive agent test.** For each modified section, imagine an agent encountering this skill for the first time, reading only the step containing the change. Does the instruction make sense without the surrounding context? Could it be misread to produce harmful output? Read the instruction literally, not charitably.

2. **The adversarial user test.** Could a user's unusual but legitimate request cause the new logic to fail? Examples: a wiki with zero sources, a wiki with 500 pages, a single-page wiki, a wiki where all sources are private, a wiki with no scope.md.

3. **The interaction test.** Walk through the full workflow that passes through the changed section. Start from the skill's entry point. At each branch, take the path that exercises the new code. Does the flow complete? Are there dead ends, infinite loops, or missing transitions?

4. **The regression test.** What worked before this change? Read the original text. Identify the behaviours it produced. Verify that each of those behaviours is preserved in the new text, or that the behavioural change is intentional and listed in the justification.

5. **The bloat test.** Re-read the entire step (not just the diff) with the change applied. Is it still scannable? Could an agent hold all the instructions in this step simultaneously? If the step exceeds 20 lines of instruction, consider splitting it or moving details to a key rule.

6. **The consistency test.** Grep the other skill files for the same concept, pattern, or term that this change introduces or modifies. Are there contradictions? If wiki-ingest says "read the source completely" and the change adds "skim for relevant sections," that is a consistency violation.

7. **The reverse test.** Argue the opposite position. What would be lost if this change were NOT made? If the answer is "nothing significant," the change may not be worth the added complexity. What is the strongest argument against this change?

**After all challenges:** present a summary of findings.

Use AskUserQuestion:

```
"Adversarial review complete. [N] findings require changes, [M] findings are informational."
Options:
  - Apply all required changes and proceed to implementation
  - Review findings individually
  - Revise the plan manually — I'll describe what to change
  - Abandon — the review revealed fundamental problems
```

If "Review findings individually": present each finding with apply/skip options.

After resolving all findings, re-present only the modified sections of the plan for user confirmation. Do not proceed to implementation on a plan the user has not seen in its final form.

### Step 8: Implement approved changes

Apply the approved, reviewed plan. For each file:

1. Read the current file completely
2. Apply changes in reverse order (bottom-up) to preserve line numbers
3. Write the updated file
4. Verify the file is valid markdown with correct frontmatter

If `scripts/wiki-check.ts` is being modified, run it after modification to verify it still executes:
```bash
bun run scripts/wiki-check.ts --help 2>&1 || echo "Script execution failed"
```

Do not modify any files outside the approved plan.

### Step 9: Full audit

After all changes are implemented, conduct a comprehensive post-implementation review.

**Audit checklist:**

1. **Read every modified file end-to-end.** Not just the changed sections — the full file. Check that the new text integrates with its surroundings. Look for duplicated guidance, contradictory instructions, or orphaned references.

2. **Cross-file consistency check.** For each concept or term introduced or modified, grep all skill files and CLAUDE.md to verify consistent usage. Check that handoff points between skills still align (what one skill produces, the next skill expects).

3. **Convention compliance.** Verify each modified file still follows the project conventions:
   - Frontmatter: only name, description, command
   - Section order: # /command, ## When to use, ## Arguments (if applicable), ## Process, ## Key rules
   - Steps: ### Step N: Title (or ### Phase N: Title for wiki-init)
   - Conditionals: "If X:" / "If not X:"
   - User interaction: AskUserQuestion with bounded options
   - Language: imperative for agent instructions, softer for user-facing text

4. **README consistency.** If any skill's behaviour changed in a way visible to users, check whether README.md describes the old behaviour and needs updating.

5. **Example file consistency.** Check `scope.example.md` and `wiki.config.example.md` — do they still match what the skills produce?

Present audit findings. Use AskUserQuestion:

```
"Audit complete. [N] issues found."
Options:
  - Fix all issues — apply corrections
  - Review issues individually
  - Accept as-is — issues are minor
  - Revert all changes — start over
```

If fixing: apply corrections, then re-run the audit on corrected files until clean.

### Step 10: Version release

Prepare and push a version update so rollback is always possible.

1. **Determine version bump.** Read the current version from the latest git tag:
   ```bash
   git tag --sort=-v:refname | head -1
   ```
   If no tags exist, start at v0.1.0.

   Bump rules:
   - Patch (e.g., 0.1.0 → 0.1.1): bug fixes, clarifications, added guidance that doesn't change behaviour
   - Minor (e.g., 0.1.0 → 0.2.0): new features, behavioural changes, new steps or sections
   - Major (e.g., 0.1.0 → 1.0.0): breaking changes to data formats, removed features, architectural restructuring

2. **Write commit message.** Reference all addressed issue numbers:
   ```
   Improve [cluster name]: [one-sentence summary]

   Addresses: #N, #M, #P

   Changes:
   - [file]: [what changed and why]
   ```

3. **Stage, commit, and tag:**
   ```bash
   git add .claude/skills/ scripts/ README.md CLAUDE.md
   git commit -m "<message>"
   git tag v<new-version>
   ```

4. **Present release summary.** Use AskUserQuestion:
   ```
   "Ready to push v<new-version> to origin. [N] files changed, [M] issues addressed."
   Options:
     - Push now (git push && git push --tags)
     - Push without tags — I'll tag later
     - Don't push — I'll review locally first
     - Make further changes before releasing
   ```

   If "Make further changes": return to Step 5 with the user's new direction.

5. **Close addressed issues:**
   ```bash
   gh issue close <number> --comment "Addressed in v<version>. Change: <description>."
   ```

   Only close issues that were fully addressed. If a cluster partially addressed an issue, comment on it noting what was done and what remains, but leave it open.

6. **Comment on skipped and rejected issues.** For every issue that was fetched in Step 1 but not addressed — whether the user skipped it in Step 4, the adversarial review rejected it in Step 7, or it was in a cluster that wasn't selected — leave a comment explaining why:
   ```bash
   gh issue comment <number> --body "Reviewed in v<version> improvement session. Decision: <reason>. Leaving open for future reconsideration."
   ```
   Be specific about the reason: "Skipped — user prioritised [other cluster] this session", "Rejected in adversarial review — change would break backward compatibility with existing wikis", "Deferred — depends on [other issue] being resolved first." This prevents future sessions from re-analysing issues without context on prior decisions.

## Key rules

- **This skill modifies skill files, not wiki content.** The targets are `.claude/skills/*.md`, `scripts/wiki-check.ts`, `README.md`, `CLAUDE.md`, and example files. Never modify a user's wiki content.
- **Issues are the only input.** Do not invent improvements. Every change must trace to a specific issue number. If the adversarial review reveals a problem not covered by any issue, file a new issue rather than scope-creeping the current batch.
- **Cluster before solving.** Individual issues often share root causes. Implementing them separately risks inconsistent fixes or conflicting changes. Clustering forces holistic thinking.
- **Analysis before drafting.** Steps 2–3 are analysis only. Do not write proposed text until Step 5. Premature drafting anchors on the first solution considered rather than the best one.
- **User approves at every gate.** Cluster selection (Step 4), plan approval (Step 6), adversarial review resolution (Step 7), audit findings (Step 9), and release (Step 10). The user controls the pace and direction.
- **Adversarial review is mandatory.** Skip it and you ship the first draft. The review must produce specific findings, not "looks good." If every finding says "no change needed," the review was not rigorous enough — go deeper.
- **Match conventions exactly.** New text must be indistinguishable in style from surrounding text. Read three lines above and below every insertion point.
- **Version and tag every release.** Git tags make rollback trivial. Never push untagged changes to skills.
- **Minimum effective change.** Prefer the smallest edit that addresses the issue. Every added line is a line the agent must process and may misinterpret. If in doubt, leave it out.
- **Cross-skill effects require cross-skill reading.** Before modifying any skill, read the skills that interact with it. Changes to handoff points require verifying both sides.
