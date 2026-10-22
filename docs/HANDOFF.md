# Handoff

The Single-Cell Resource Guide contains **33 resources; 33 core-verified, 0 provisional**. It is a static, dependency-free page with full-text search, multi-select category/data-type filters, sorting, expandable access/evidence, and a one-click GTEx/DepMap/CELLxGENE comparison. The hosted guide is at https://zboldyga.github.io/single-cell-resource-guide/.

The October 22 revision uses modern component styling, sans-serif typography, colored resource-type badges, removable filter chips, and a wider four-column comparison. All 33 summaries were enriched using `gemini-4-argon-high` at high effort, then condensed into labeled data/design bullets and reviewed against primary evidence. GTEx now explains donor-linked tissues and its separately scoped single-nucleus atlas; AlphaFold DB includes its 2026 complex predictions. The interface uses native local CSS rather than a remote Tailwind runtime.

## Open it

Open `site/index.html` directly in a browser; the catalog is bundled locally and needs no application server. Or run from the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then visit http://127.0.0.1:8765/site/. GitHub Pages uses `.github/workflows/pages.yml` to publish the contents of `site/` as the document root on every push to `main`; repository Settings → Pages uses **GitHub Actions** as the source. The workflow publishes committed static files, so rebuild and commit `site/resources.js` after catalog edits. All asset paths are relative; no database, custom deployment keys, remote fonts or runtime network calls are required.

## Files

- `data/resources.yaml`: authoritative, editable entries with dated field-specific citations.
- `schema/resources.schema.json`: strict schema; `docs/RESOURCE_SCHEMA.md` explains unknown values and verification.
- `site/index.html`, `app.js`, `styles.css`: user interface; `site/resources.js` is the generated catalog.
- `scripts/`: validation, build, bounded link audit, metadata-freshness report, and regression tests.
- `docs/INCLUSION_POLICY.md` and `docs/COVERAGE_GAPS.md`: scope, exceptions, exclusions and unresolved metadata.

## Update and check

Use a Python environment with the two dependencies in `scripts/requirements.txt`:

```sh
python3 -m pip install -r scripts/requirements.txt
python3 -B scripts/validate.py --acceptance
python3 -B -m unittest discover -s scripts/tests -p 'test_*.py'
python3 -B scripts/build.py --acceptance --force
python3 -B scripts/stale_report.py --acceptance
python3 -B scripts/check_links.py --acceptance --workers 4 --timeout 8
```

`--force` intentionally replaces the generated `resources.js`, not the curated YAML. Reports default to standard output; use a new `--output` filename to save an audit. The commands above are also suitable CI checks after dependency installation; scheduled network checks should be separate from offline schema/build checks.

## Verification performed

Acceptance validation passes with 33 resources / 33 verified. All 11 offline regression tests and JavaScript syntax checks pass after integration. The redesigned shell was visually checked at 1280 pixels, and category/data-type filtering, selected chips and popover dismissal were exercised in Chrome. Chrome automation subsequently stalled, preventing the final enriched-content screenshot and mobile recheck. The earlier edition passed desktop/mobile search, sorting, no-results/reset, evidence and trio-comparison checks; those earlier checks are not a substitute for a fresh mobile check of this revision. The classic scripts support local loading without fetch; HTTP was used because browser automation disallows file URLs.

The 2026-10-22 link audit covered 157 distinct URLs: 156 live, no confirmed dead links, one timeout on a legacy Ensembl page. The metadata audit found fresh core-source checks and 29 unknown release dates. The scripts above reproduce link and metadata reports using current conditions; field-specific evidence is retained in the catalog, and unresolved questions are summarized in `COVERAGE_GAPS.md`.

## Limits and next useful work

Core verification is not exhaustive metadata completion: 25 scale dates and 29 release dates remain unknown, and 11 entries have wholly unknown licensing. Expanded details visibly flag unknowns. Inspect provider terms before reusing data. Recheck the final mobile layout when Chrome responds normally, then fill important release/licensing gaps and recheck provider retirements. Scientific use-case wording and limitations are editorial synthesis grounded in provider documentation; APIs and large downloads were not execution-tested.
