# LLM-Wiki Skills

This repo contains four Claude Code skills for building and maintaining LLM-wikis — structured knowledge bases following the Karpathy three-layer architecture (raw sources → compiled wiki → agent schema).

## Skills

- **`/wiki-discover`** — Explore a domain, find sources, evaluate fit, acquire to `raw/`. Start here if you have a topic but no material.
- **`/wiki-init`** — Scaffold a wiki project from existing material. Start here if you already have documents.
- **`/wiki-ingest`** — Add a new source or update from a revised source. Run per source.
- **`/wiki-review`** — Process accumulated feedback and run maintenance. Run periodically.

## Installation

Copy the skills into your project's `.claude/skills/` directory:

```bash
cp -r .claude/skills/ /path/to/your-project/.claude/skills/
```

Optionally copy the check script:

```bash
mkdir -p /path/to/your-project/scripts
cp scripts/wiki-check.ts /path/to/your-project/scripts/
```

## Architecture

The skills use only native Claude Code tools (Read, Write, Grep, Glob, Bash, Edit, WebSearch, WebFetch). No custom MCP tools, no running server processes, no external dependencies beyond what Claude Code provides.

```
Skills (process)          →  /wiki-discover, /wiki-init, /wiki-ingest, /wiki-review
                              │
Native tools (capabilities)  →  Read, Write, Grep, Glob, Bash, Edit, WebSearch, WebFetch
                              │
Wiki structure (data)     →  raw/ (sources + .notes.md), wiki/ (compiled pages + scope.md),
                              wiki.config.md, CLAUDE.md (per-project schema)
```

## Key files the skills produce

- `wiki.config.md` — Domain description + quality rules
- `wiki/scope.md` — Topic areas with coverage tracking (prevents scope creep)
- `CLAUDE.md` — Per-project agent schema
- `raw/<source>.notes.md` — Integration guidance from `/wiki-discover`
- `feedback/batch-*.md` — Feedback processing archives from `/wiki-review`

## Domain agnostic

The skills discover structure from content rather than imposing predefined categories. The `wiki.config.md` file provides domain context (what the wiki is about, who reads it) and quality rules (word minimums, link density). Entity types, concept categories, and page organization emerge from the source material.
