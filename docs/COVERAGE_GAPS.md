# Coverage and remaining gaps

The first edition contains **33 entries, all 33 with official-source support for core purpose, data, scope and access**, checked on 2026-10-22 UTC. This is a deliberately bounded guide, not an exhaustive ranking of biological databases.

## Decisions worth making visible

- **CELLxGENE, GTEx and DepMap:** a one-click comparison distinguishes contributed single-cell expression, donor-linked multi-tissue genetic/expression data (including GTEx's smaller single-nucleus subset), and cancer-model fitness screens matched to baseline omics. These are different experimental endpoints.
- **Tahoe-100M:** included despite a newer adoption record because chemical perturbation data directly serve this audience. The source distinction between drug-dose conditions and distinct compounds is preserved. The Arc copy has access/cost caveats separate from the provider's Hugging Face distribution.
- **LINCS / Connectivity Map:** retained as archived L1000 data. CLUE announced retirement of its tools effective 2026-01-31; the main row and access notes make the archival status explicit. The official guide identifies GEO accessions GSE92742 and GSE70138. Legacy API availability is unknown.
- **Ensembl and GENCODE:** both retained because platform integration and a specific reference annotation project answer different questions. Ensembl's new and legacy services must not be assumed interchangeable.
- **GO and Cell Ontology:** vocabularies/annotations, not measurement matrices. **MSigDB and Reactome:** gene sets and curated reactions/pathways are different evidence objects.
- **PDB and AlphaFold DB:** experimental archive entries and structure predictions are distinguished; AlphaFold DB includes selected protein-complex predictions added in 2026. RCSB can also expose computed models, so portal search results need provenance checks.
- **Complex Portal:** newer predicted-complex content is explicitly distinguished from expert-curated records.

These scientific distinctions are supported by the field-specific official sources in `data/resources.yaml` and the page's expanded evidence panels. The rationale for inclusion is editorial judgment.

## Incomplete metadata

Only **8 of 33** entries have a verified date for their approximate scale, and **4 of 33** have a precise substantive-release date. The remaining **29 release dates are unknown**, not assumed stale. Known labels or historical snapshots appear with explicit notes; no webpage-update date is substituted for a data release. GTEx's V11 label is known, but its exact release date remains unconfirmed. Future audits should prioritize release and licensing documentation over adding rows.

License terms remain wholly unknown or unverified for 11 entries: ClinVar, Complex Portal, CZ CELLxGENE Discover / Census, DepMap, GENCODE, Gene Expression Omnibus (GEO), Genome Aggregation Database (gnomAD), GTEx, HuBMAP, LINCS / Connectivity Map (archived L1000), scPerturb. Other entries may still have dataset-specific terms. API flags mean a documented access mechanism, not an executed integration test; documented SDK/file access is distinguished in the notes. Download endpoints were not transfer-tested with large datasets.

Some dynamic or protected pages were verified using readable indexed official documentation. Those limits are recorded in entry notes; source provenance is official, but automated access may differ from an interactive browser. The revised live link audit found **156 live URLs, 0 confirmed dead URLs, and 1 timeout** among 157 distinct URLs. The timeout was the June 2026 Ensembl legacy information page; current-platform documentation provides separate core evidence. HTTP status does not validate scientific claims or establish data freshness.

## Deliberate omissions / candidates for later assessment

These are not source-verified entries in this edition; omission is about this guide's scope, not a verdict on quality.

| Candidate | Why outside this edition / when to reconsider |
|---|---|
| Tabula Sapiens | A specific atlas could add experimental-design contrast; first use the existing atlas portals to keep the table compact. |
| Expression Atlas / Single Cell Expression Atlas | Useful additional curated-expression routes, deferred while the first edition covers CELLxGENE, HCA, GTEx and archives. |
| Cellosaurus | A strong future addition if cell-line reconciliation becomes a common task. |
| GDSC | Consider when comparing drug sensitivity becomes more prominent than transcriptional response. |
| NCBI Gene | Broad gene-centric lookup deferred to keep identifier/reference rows bounded. |
| IntAct | Additional interaction-evidence detail may justify a row; current selection already includes BioGRID, STRING and Complex Portal. |
| CORUM | Reconsider for mammalian-complex-specific workflows rather than automatically duplicating complex coverage. |
| KEGG | Further pathway coverage can be considered when its distinct value and reuse terms are explicitly checked. |
| PRIDE | Proteomics deposition/reanalysis is adjacent but less central to this initial single-cell/perturbation workflow. |
| ReMap / eQTL Catalogue | Potential additions for specialized regulatory workflows; evaluate against ENCODE, JASPAR and GTEx coverage. |
| Alliance of Genome Resources | Broader model-organism workflows may justify a dedicated row. |
| BioPlex, huMAP, HuRI, OpenCell, Unknome | Consider for more specialized interaction, localization, and understudied-protein questions; assess distinct value against the existing protein resources. |

Metabolomics, microbiome resources, comprehensive model-organism databases, cell-cell communication tools, and clinical interpretation workflows remain thinly covered. Add rows only when a concrete reader question warrants them, with a replacement/overlap check against the current 33.
