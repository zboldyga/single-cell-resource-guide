# Handoff

The Single-Cell Resource Guide contains **33 resources; 33 core-verified, 0 provisional**. It is a static, dependency-free page with full-text search, multi-select category/data-type filters, sorting, resource-detail dialogs, and a one-click GTEx/DepMap/CELLxGENE comparison. The hosted guide is at https://zboldyga.github.io/single-cell-resource-guide/.

The October 22 revision uses modern component styling, sans-serif typography, colored resource-type badges, removable filter chips, and a wider four-column comparison. All 33 summaries were enriched using `gemini-4-argon-high` at high effort, then condensed into labeled data/design bullets and reviewed against primary evidence. GTEx now explains donor-linked tissues and its separately scoped single-nucleus atlas; AlphaFold DB includes its 2026 complex predictions. The interface uses native local CSS rather than a remote Tailwind runtime.

Access & details opens a modal over a dimmed table, with a persistent resource title and Close button, independent scrolling, Escape/backdrop dismissal, keyboard focus containment, and focus restoration to the triggering row. The table stays in place. Inside the modal, browser, API, and file-download routes have separate cards, followed by licensing and terminal examples. Dataset metadata and source evidence have their own collapsed disclosures. There are 31 curated Bash snippets across 30 resources, each with scope, prerequisites, provenance, and a Copy button. DepMap, HCA, and MSigDB instead provide portal instructions where a reliable standalone command was not verified. Some examples require choosing a file first; sample exports and shards are labeled explicitly. The larger typography remains in place.

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

Acceptance validation passes with 33 resources / 33 verified. All 13 offline regression tests and JavaScript syntax checks pass; all 31 snippets previously passed `bash -n` without execution and remain unchanged. The modal was visually checked in Chrome at 1280 and 390 CSS pixels, including a long resource title. Copy matched the displayed command, Escape and backdrop dismissal restored focus, page/table scroll positions were preserved, and Tab/Shift+Tab wrapped within the modal. The persistent header remained visible while its content scrolled; the mobile content had no horizontal overflow. Previous checks covered metadata disclosures, category/data-type filtering, sorting, no-results/reset, and trio comparison. The classic scripts support local loading without fetch; HTTP was used because browser automation disallows file URLs.

The latest 2026-10-22 link audit covered 172 distinct catalog/provenance URLs: all 172 live, none dead, blocked, or inconclusive. Literal URLs embedded in Bash commands are reviewed separately. The metadata audit found fresh core-source and download-example checks and 29 unknown release dates. The scripts above reproduce link and metadata reports using current conditions; field-specific evidence is retained in the catalog, and unresolved questions are summarized in `COVERAGE_GAPS.md`.

## Limits and next useful work

Core verification is not exhaustive metadata completion: 25 scale dates and 29 release dates remain unknown, and 11 entries have wholly unknown licensing. Expanded details visibly flag unknowns. Inspect provider terms before reusing data, fill important release/licensing gaps, and recheck provider retirements. Scientific use-case wording and limitations are editorial synthesis grounded in provider documentation. Download examples were checked against official documentation; selected file endpoints were checked with headers or bounded responses, and the read-only Open Targets sample query returned the expected target without GraphQL errors. Complete large transfers and installed provider CLI workflows were not executed. Clipboard fallback behavior is implemented for unavailable browser permissions but was not forced in the browser check.
