# Inclusion policy

This is a finite desk reference for single-cell RNA-seq and perturbation-response research. It helps readers compare what resources contain and avoid using a familiar name as a substitute for checking its actual data. The first edition targets 30–60 entries, with at least 25 whose core details have been checked against official sources.

## What belongs

Include widely used databases, consortium atlases, shared ontologies, major reference collections, and broadly reusable datasets that answer a distinct question in this workflow. Cover cellular expression, experimental perturbation, genes and genomes, protein function and structure, pathways and interactions, regulation, disease/target evidence, and primary archives. Species scope may extend beyond humans where the resource is foundational.

Treat related services as one row only when their relationship can be explained clearly: CELLxGENE Discover and Census share a row with separate access notes; GDC includes TCGA but is broader than TCGA. GEO and SRA remain separate because processed functional-genomics submissions and sequence reads serve different jobs. Ensembl and GENCODE remain separate because a genome annotation platform and a particular annotation project are different reference choices.

## What stays out

Exclude general search engines, wholesale registry imports, obscure mirrors, most single-use software packages, isolated papers and small project caches. A paper can substantiate an entry but is not itself an entry. Resources already on a local drive receive no automatic preference. Overlapping alternatives may be omitted to preserve scanning speed; omission does not judge their scientific quality.

## Editorial scoring

Use four ordinal dimensions, each 0–3: foundational relevance to this researcher, community adoption, breadth of reuse, and maintenance evidence. For relevance, 3 means a frequent direct task, 2 an adjacent task, 1 an occasional niche, and 0 no clear use. For adoption, 3 means an established community reference, 2 a well-recognized specialist resource, 1 emerging use, and 0 insufficient evidence. For breadth, 3 means many tissues, organisms, assays or downstream uses, 2 a substantial bounded domain, and 1 a narrow collection. Maintenance is 3 for checked recent release/development evidence, 2 for an actively supported reference without a confirmed latest release, 1 for a stable archived/versioned collection, and 0 for lost access without a usable archive. Use `?` when evidence is insufficient.

Scores are editorial judgments, not measured citation/download counts. They guide selection and do not imply numerical scientific quality. Do not calculate a misleading total when a dimension is unknown. Keep inclusion rationales and notable exclusions in `COVERAGE_GAPS.md`.

## Exceptions and uncertainty

Tahoe is eligible as a major emerging perturbation dataset because of direct workflow relevance; its newer adoption record must remain explicit. Frozen datasets may remain useful: an old data release is not by itself a reason to exclude a reproducible reference. A retired portal must not be described as an available analysis service; name the archived dataset and its surviving official access route instead.

A verified entry means inspected official sources support its purpose, concrete data, biological scope and access. It does not mean all metadata are known, every API was executed, or the resource is appropriate for clinical decisions. Limitations are conservative editorial interpretations unless explicitly stated by the provider. Scales need a source and a date; latest substantive releases need release evidence. Website updates, HTTP success and source-check dates do not establish data freshness. Use unknown/null instead of extrapolating.

## Maintenance

When adding a resource, identify the question it answers and the existing row it complements or could replace. Inspect provider documentation and access pages, record field-specific sources and dates, write a concrete limitation, then validate and rebuild. Review source checks approximately every six months and after provider migration/retirement announcements. Recheck licenses before reuse; collection-level licensing does not automatically cover every contributed dataset. Review the finite collection rather than growing it indefinitely.
