# Single-Cell Resource Guide

A curated field guide to datasets, atlases, and reference resources for **single-cell, perturbation, and adjacent omics research**.

**[Browse the guide →](https://zboldyga.github.io/single-cell-resource-guide/)**

Compare **33 resources** in one searchable, filterable table: what each contains, when to use it, what it lacks, and how to access it. The collection includes CELLxGENE, GTEx, DepMap, Tahoe, and scPerturb, alongside supporting resources for genes, proteins, pathways, regulation, and disease.

The organizing principle is usefulness to this research workflow. Resources can include bulk tissue data, cell-line screens, ontologies, and molecular references as well as single-cell measurements.

## Browse locally

Clone the repository and open `site/index.html` in your browser. The page and catalog are bundled together; no installation or application server is needed.

Alternatively, serve the repository locally:

```sh
git clone https://github.com/zboldyga/single-cell-resource-guide.git
cd single-cell-resource-guide
python3 -m http.server 8765 --bind 127.0.0.1
```

Open **http://127.0.0.1:8765/site/**.

## GitHub Pages

Pushes to `main` publish the contents of `site/` at the [website's root URL](https://zboldyga.github.io/single-cell-resource-guide/) through [the Pages workflow](.github/workflows/pages.yml). In repository **Settings → Pages**, the source is **GitHub Actions**. The workflow can also be run manually from the Actions tab.

Rebuild `site/resources.js` after editing the YAML, as described below; the workflow publishes the committed static files.

## What the guide provides

- Side-by-side descriptions of data, experimental design, use cases, and limitations.
- Full-text search, category and data-type filters, and sorting.
- A quick GTEx / DepMap / CELLxGENE comparison.
- Expandable scope, scale, access, licensing, release information, and source citations.
- Explicit unknown values where evidence is incomplete.

All 33 entries have official-source support for their core purpose, data, scope, and access, checked on **2026-10-22**. Core verification does not imply that every metadata field is complete or every access route has been execution-tested. See [coverage and remaining gaps](docs/COVERAGE_GAPS.md).

## Update the catalog

Edit [data/resources.yaml](data/resources.yaml), the authoritative catalog, following the [inclusion policy](docs/INCLUSION_POLICY.md) and [resource schema](docs/RESOURCE_SCHEMA.md). Add dated, field-specific official sources and preserve unknown values where evidence is missing.

The browser has no external runtime dependencies. Catalog validation and maintenance use Python with PyYAML and jsonschema:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r scripts/requirements.txt
python -B scripts/validate.py --acceptance
python -B -m unittest discover -s scripts/tests -p 'test_*.py'
python -B scripts/build.py --acceptance --force
```

The build updates `site/resources.js` from the YAML. Commit both files when changing the catalog.

Optional maintenance reports:

```sh
python -B scripts/stale_report.py --acceptance
python -B scripts/check_links.py --acceptance --workers 4 --timeout 8
```

Link liveness, source-check dates, and substantive data-release dates are separate signals. A working website alone does not establish that its data are current.

## Contribute

Corrections and focused resource suggestions are welcome through issues or pull requests. Include an official source and explain the research question the correction or addition helps answer. The guide is deliberately selective; overlapping resources need a clear reason for inclusion.

See the [handoff and maintenance notes](docs/HANDOFF.md) for implementation details and remaining checks. Each linked provider's data and access terms apply to its own resources.
