# Wiki Configuration

## Domain

<!-- Replace this with a description of your wiki's domain, audience, and purpose.
     This is free text that guides the LLM's extraction and writing style.
     Be specific about the audience's expertise level.
     This description is used to:
     - Check whether new sources are relevant before ingestion
     - Guide the tone and depth of wiki pages
     - Shape what counts as a "concept" vs background knowledge -->

This wiki covers [your domain here]. The audience is [your team/audience]
with expertise in [their background]. They may not be familiar with [areas
where the wiki should explain more].

## Writing Approach

<!-- How should wiki pages be written? Choose and adapt one approach.
     The skill reads this section and follows it during ingestion. -->

<!-- Approach A: Source compilation (for traceability-focused wikis)

Pages compile and organise what the sources say. Every factual claim
references a specific source in raw/. Do not add knowledge beyond
the sources. -->

<!-- Approach B: Comprehensive reference (for educational/reference wikis) -->

Write each concept page as a standalone reference article. Sources in
raw/ provide the foundation — cite them in frontmatter for specific
claims and data. Supplement with established knowledge from the broader
field, citing original works inline (e.g., "Endsley, 1995").

Each concept page should cover:
- Definition and core mechanism
- Why it matters (significance for the field)
- Current evidence and state of research
- Practical implications for system design
- Connections to related concepts (with wikilinks)
- Open questions or limitations
- Examples from multiple domains, not just the source reports' domain

Each entity page should cover:
- What it is and its role in the field
- Why it matters for this wiki's audience
- Key publications, standards, or outputs
- Connections to wiki concepts

## Quality Rules

- Summary pages: minimum 300 words
- Concept pages: minimum 200 words, link to >= 3 related pages
- Entity pages: minimum 120 words, must explain domain relevance
- Comparison pages: minimum 250 words, must include a comparison table
- Source paths in frontmatter must match actual files in raw/
- Lint must pass after every phase (zero dead links, zero orphans)
