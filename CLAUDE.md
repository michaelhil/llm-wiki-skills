# LLM-Wiki Skills

This repo contains three Claude Code skills for building and maintaining LLM-wikis — structured knowledge bases following the Karpathy three-layer architecture (raw sources → compiled wiki → agent schema).

## Skills

- **`/wiki-init`** — Create a new wiki project from source material. Run once per project.
- **`/wiki-ingest`** — Add a new source or update from a revised source. Run per source.
- **`/wiki-review`** — Process accumulated feedback and run maintenance. Run periodically.

## Installation

Copy the skills into your project's `.claude/skills/` directory:

```bash
cp -r .claude/skills/ /path/to/your-project/.claude/skills/
```

Or add this repo as a submodule:

```bash
cd your-project
git submodule add https://github.com/michaelhil/llm-wiki-skills .claude/wiki-skills
ln -s wiki-skills/skills .claude/skills
```

## Architecture

The skills use only native Claude Code tools (Read, Write, Grep, Glob, Bash, Edit). No custom MCP tools, no running server processes, no external dependencies beyond what Claude Code provides.

```
Skills (process)          →  /wiki-init, /wiki-ingest, /wiki-review
                              │
Native tools (capabilities)  →  Read, Write, Grep, Glob, Bash, Edit
                              │
Wiki structure (data)     →  raw/ (sources), wiki/ (compiled pages),
                              wiki.config.md, CLAUDE.md (per-project schema)
```

## Domain agnostic

The skills discover structure from content rather than imposing predefined categories. The `wiki.config.md` file provides domain context (what the wiki is about, who reads it) and quality rules (word minimums, link density) — but entity types, concept categories, and page organization emerge from the source material.
