# LLM-Wiki Skills

Three [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills for building and maintaining **LLM-wikis** — structured knowledge bases where an LLM compiles raw source material into interlinked markdown pages that serve both human readers and AI agents. Based on [Karpathy's LLM-wiki architecture](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

## What it builds

```
your-wiki/
├── raw/                    # Layer 1: Immutable source material (you curate)
│   └── papers, reports, notes, articles...
├── wiki/                   # Layer 2: Compiled knowledge (LLM maintains)
│   ├── index.md            # Master catalog of all pages
│   ├── summaries/          # One summary per source
│   ├── concepts/           # Concept articles with cross-references
│   ├── entities/           # Organizations, tools, standards
│   ├── comparisons/        # Side-by-side trade-off analyses
│   └── log.md              # Activity log
├── wiki.config.md          # Domain description + quality rules
├── CLAUDE.md               # Agent schema (how to operate the wiki)
└── mkdocs.yml              # Optional: web rendering config
```

Every wiki page has YAML frontmatter (title, type, sources, related pages, tags, confidence, dates) and uses `[[wikilinks]]` for interlinking. The markdown files work in any renderer — Obsidian, VS Code, MkDocs, or plain text.

## Installation

Copy the skill files into your project:

```bash
# Clone this repo
git clone https://github.com/michaelhil/llm-wiki-skills.git

# Copy skills into your project
mkdir -p your-project/.claude/skills
cp llm-wiki-skills/.claude/skills/*.md your-project/.claude/skills/

# Optionally copy the check script
mkdir -p your-project/scripts
cp llm-wiki-skills/scripts/wiki-check.ts your-project/scripts/
```

Or add as a git submodule:

```bash
cd your-project
git submodule add https://github.com/michaelhil/llm-wiki-skills .claude/wiki-skills
ln -s wiki-skills/skills .claude/skills
```

The skills appear in Claude Code when you open a session in the project directory.

## Skills

### `/wiki-init` — Create a new wiki

Start here. Run once per project.

```
/wiki-init
```

Asks you interactively about domain, audience, and sources. Scaffolds the directory structure, generates the agent schema, copies sources, and ingests the **first source** thoroughly as a quality template. Optionally sets up MkDocs, GitHub Pages, and a per-section feedback system.

Remaining sources are ingested one at a time via `/wiki-ingest` in separate sessions — this prevents quality degradation from context exhaustion.

### `/wiki-ingest` — Add or update a source

Run per source. One source per session for best quality.

```
/wiki-ingest path/to/new-paper.md
/wiki-ingest ~/Downloads/research.pdf
```

Reads the source, checks domain relevance against `wiki.config.md`, extracts concepts and entities, creates or updates wiki pages, cross-references with existing pages, and runs quality checks. For large sources (500+ lines), processes section by section.

Handles source revisions too — when a report goes from v12 to v13, it diffs the changes and updates affected pages.

### `/wiki-review` — Process feedback and maintain

Run periodically (e.g., every few weeks).

```
/wiki-review              # Auto-detect feedback source
/wiki-review --github     # Process GitHub Issues
/wiki-review --lint-only  # Just run maintenance checks
```

Collects feedback from GitHub Issues, a markdown file, or pasted text. Evaluates each item against source material, updates pages, closes addressed issues, defers items requiring human judgment. Always includes a maintenance pass: lint, quality check, stale page detection, coverage gaps.

## Quality system

The skills enforce quality rules defined in `wiki.config.md`:

- **Word minimums**: Summaries ≥ 300, concepts ≥ 200, entities ≥ 120, comparisons ≥ 250
- **Link density**: Concept pages link to ≥ 3 related pages
- **Source traceability**: Every claim references a source file in frontmatter
- **Path accuracy**: Source paths match actual files in `raw/`
- **Zero dead links**: Every `[[wikilink]]` resolves to an existing page
- **Zero orphans**: Every page is linked from at least one other page
- **Domain relevance**: New sources are checked against the wiki's domain before ingestion

Quality is checked **per page immediately after writing**, not deferred to the end.

A `scripts/wiki-check.ts` utility runs all mechanical checks in one pass:

```bash
bun run scripts/wiki-check.ts
```

## Optional: web view and feedback

`/wiki-init` can optionally set up:

- **MkDocs Material** — browsable site with search, dark mode, and navigation
- **GitHub Pages** — automatic deployment on push
- **Per-section feedback** — readers click a 💬 icon on any section heading to submit corrections or suggestions. Submissions become GitHub Issues, processed in batches via `/wiki-review`

These are enhancements. The wiki works fully without them — the core value is in the markdown files and their interlinking.

## Design principles

- **Domain-agnostic**: Structure emerges from content, not predefined categories. Works for nuclear engineering, oil & gas, medical devices, aerospace, or any technical domain.
- **Native tools only**: Skills use Read, Write, Grep, Glob, Bash — no custom MCP server dependency.
- **Direct execution**: All file operations done directly, not delegated to sub-agents (avoids permission issues in Claude Code).
- **Content-first**: Web rendering is optional. The markdown files are the product.
- **Quality-enforced**: Mechanical checks prevent the sparse pages and broken links that manual wiki maintenance produces.

## Example

The [Nuclear AI Wiki](https://github.com/michaelhil/nuclear-wiki) was built with these skills — 95 interlinked pages compiled from 6 technical reports on AI agent systems for nuclear power plant operations.

Live site: [michaelhil.github.io/nuclear-wiki](https://michaelhil.github.io/nuclear-wiki/)
