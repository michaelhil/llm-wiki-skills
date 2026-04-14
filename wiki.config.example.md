# Wiki Configuration

## Domain

<!-- Replace this with a description of your wiki's domain, audience, and purpose.
     This is free text that guides the LLM's extraction and writing style.
     Be specific about the audience's expertise level. -->

This wiki covers [your domain here]. The audience is [your team/audience]
with expertise in [their background]. They may not be familiar with [areas
where the wiki should explain more].

## Quality Rules

- Summary pages: minimum 300 words
- Concept pages: minimum 200 words, link to >= 3 related pages
- Entity pages: minimum 120 words, must explain domain relevance
- Comparison pages: minimum 250 words, must include a comparison table
- Every factual claim references a source in frontmatter
- Source paths in frontmatter must match actual files in raw/
- Lint must pass after every phase (zero dead links, zero orphans)
