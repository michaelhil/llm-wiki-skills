# Wiki Configuration

## Domain

<!-- Replace this with a description of your wiki's domain, audience, and purpose.
     This is free text that guides the LLM's extraction and writing style.
     Be specific about the audience's expertise level.
     This description is used to:
     - Check whether new sources are relevant before ingestion
     - Guide the tone and depth of wiki pages
     - Shape what counts as wiki-worthy vs background knowledge -->

This wiki covers [your domain here]. The audience is [your team/audience]
with expertise in [their background]. They may not be familiar with [areas
where the wiki should explain more].

## Writing Approach

<!-- How should wiki pages be written? Choose and adapt one approach.
     The skill reads this section and follows it during ingestion. -->

<!-- Approach A: Source compilation (for traceability-focused wikis)

Pages compile and organise what the sources say. Every factual claim
references a specific source in raw/. Do not add beyond sources. -->

<!-- Approach B: Comprehensive reference (for educational/reference wikis) -->

Write each page as a standalone reference article. Sources in raw/
provide the foundation — cite them in frontmatter. Supplement with
established knowledge, citing original works inline. Each substantial
page should cover: definition and mechanism, significance, current
evidence, practical implications, connections to related pages,
and open questions.

<!-- Approach C: Synthesis from proprietary sources

Some source material in raw/private/ is proprietary and not distributed.
When writing pages informed by private sources:
- Write as original synthesis, not extraction or paraphrasing
- Cite the public works referenced within the private sources, not
  the private sources themselves
- Pages should stand alone for a reader with no access to private material

Can be combined with Approach B for wikis that mix private and public sources. -->

## Quality Rules

<!-- One rule per page type agreed in the structure discussion.
     wiki-check.ts parses these dynamically — any "X pages: minimum N words"
     pattern is automatically enforced. -->

- Summary pages: minimum 300 words
- [Type] pages: minimum [N] words, link to >= 3 related pages
- [Type] pages: minimum [N] words
- Source paths in frontmatter must match actual files in raw/
- Lint must pass after every phase (zero dead links, zero orphans)
