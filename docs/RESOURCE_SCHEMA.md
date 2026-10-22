# Resource schema and maintenance checks

`data/resources.yaml` is the authoritative catalog. JSON is accepted for fixtures and exchange. The root is an object, not a list. `schema/resources.schema.json` uses JSON Schema 2020-12; `scripts/validate.py` adds semantic checks. All fields below are required, even when their value is unknown, except the explicitly optional download examples. Extra properties are rejected.

## Root and resource fields

| Field | Meaning and shape |
|---|---|
| `schema_version` | Literal string `"1.0"`. |
| `title` | Nonempty catalog title. |
| `updated_at` | Catalog editing date, `YYYY-MM-DD`; distinct from any data release. |
| `resources` | Array of resource objects; development permits any count, acceptance requires 30–60. |
| `id` | Stable lowercase hyphenated slug; globally unique. |
| `name`, `url` | Canonical display name and official HTTP(S) landing URL. |
| `purpose` | One-sentence concrete definition. |
| `question` | Scientific question the resource helps answer. |
| `categories` | One or more controlled labels listed below. |
| `key_data` | Nonempty array of concrete measurements or annotations the resource contains; aim for 3–5 concise bullets explaining distinctive data or study design, rather than repeating broad modality labels. |
| `modalities` | One or more readable data-type labels. |
| `species` | One or more species names; `unknown` or `not applicable` is allowed. |
| `biological_scope` | Text explaining tissues, cell lines, disease contexts, or other scope. |
| `granularity` | One or more readable units such as Cell, Tissue, Gene, Protein. |
| `resource_type` | `primary`, `aggregator`, `standard`, or `tool`. |
| `maintainer` | Responsible organization or consortium, or `unknown`. |
| `scale` | Object: `summary` text, `as_of` date or null, `source_url` HTTP(S) URL or null. Record approximate numbers with their date and evidence; use `unknown` when not established. |
| `release` | Object: `label` text, `date` date or null, `source_url` URL or null, `note` text. Refers to substantive data release, never a page-edit timestamp. A known version with unknown date can retain its label and a null date. |
| `access` | Object with required `web`, `api`, and `bulk` objects. Each has `status`, `url`, and `note`. Status is `yes`, `no`, `unknown`, or `not_applicable`; `yes` requires an HTTP(S) URL. |
| `download_examples` | Optional array of 1–3 curated Bash examples. Each requires `label`, `description`, `command`, a nonempty `requirements` string array, official `source_url`, and `checked_on` date. Omit when a reliable standalone workflow is not verified. |
| `licensing` | Object: `summary` describing known licensing/access restrictions and `source_url` URL or null. `unknown` is preferable to an invented permission claim. |
| `not_for` | Short, concrete limitation or non-use case. |
| `sources` | Nonempty array of source records: `url`, `title`, `type` (`official` or `paper`), `checked_on` date, and nonempty `supports` array of field paths such as `purpose`, `biological_scope`, `access.bulk`, `release`. |
| `verification` | Object: `status` (`verified` or `provisional`), `checked_on` date or null, `note` text. |
| `related` | Array of distinct existing resource IDs; may be empty, must not include self. |

Categories: `Expression & cell atlases`; `Perturbation & dependencies`; `Genes & genomes`; `Proteins & structures`; `Pathways & interactions`; `Regulation & epigenomics`; `Disease & drug discovery`; `Archives & standards`.

Use literal `unknown` for unknown text, `not applicable` for genuinely inapplicable text, and `null` for unknown/inapplicable dates and optional URLs, explaining ambiguity in a relevant note. Dates are full calendar dates; do not invent a day for a year-only release. All dates must be nonfuture relative to UTC today or explicit `--as-of`. Text is plain text: HTML is rejected. URLs must use HTTP(S). Arrays are distinct and nonempty except `related`; duplicate YAML mapping keys are rejected. YAML is parsed with a safe loader, with dates preserved as strings.

## What verified means

A verified entry has a nonnull `verification.checked_on` and official source evidence covering all four core fields: `purpose`, `biological_scope`, `access`, and `key_data`. Coverage may be spread across sources; a child path such as `access.bulk` counts for access. Paper-only evidence does not satisfy verification. Dates on the source records document when their claims were checked. Verification does not imply that every access method, scale, release date, or license is known: those uncertainties must remain visible. The validator checks the presence and shape of evidence metadata; a human curator must check source contents and whether a source is genuinely official. Automated link liveness cannot establish either fact.

Summaries should explain what changes a researcher's choice: how samples connect across donors or assays, which readouts accompany perturbations, whether values are measured or inferred, and which subcollections have narrower coverage. For example, GTEx's donor-linked tissue collection and its separate single-nucleus subset both belong in the visible row; the subset must not be presented as covering the whole cohort. Keep modality labels consistent across resources, with methodological detail in `key_data`. A model-assisted summary still requires supporting sources; model confidence is not verification.

## Commands

Download examples are displayed as plain text and copied to the clipboard; the site never executes them. Describe exactly what each retrieves (one file, one record, a shard, or a complete archive), its release/species scope, prerequisites, authentication, and any manual file selection. Use documented direct file URLs or documented provider tools. A landing page must never be substituted for a data URL. Keep credentials out of examples, explain mutable latest-release targets, and avoid defaulting to unnecessarily large transfers. Portal-only workflows belong in `access.bulk.note`.

Check each example with `bash -n` without executing it. Verify official documentation and, where practical, HTTP headers or a bounded response; these checks do not establish that a complete large transfer will succeed. Link checks cover provenance URLs, while download-specific dates appear separately in the stale report. Recheck literal file URLs and provider CLI syntax when reviewing examples.

Install dependencies into an environment of your choice:

```sh
python3 -m pip install -r scripts/requirements.txt
python3 scripts/validate.py
python3 scripts/validate.py --acceptance
python3 scripts/build.py --acceptance
```

The build validates before emitting `site/resources.js` containing `window.RESOURCE_CATALOG`. The page can load that script over `file://` or HTTP without fetching YAML. JSON escapes `<` and uses ASCII escapes so inline-script delimiters and Unicode line separators cannot become executable markup. Treat the asset as generated: update YAML and rebuild.

All default input/schema/output paths derive from the script location, independent of the current directory. `--data PATH` selects another YAML/JSON input. Build/report scripts accept `--output PATH`; reports otherwise print JSON to stdout. Existing files are protected by exclusive creation; intentionally replacing a generated artifact requires explicit `--force`:

```sh
python3 scripts/build.py --acceptance --force
python3 scripts/stale_report.py --acceptance --output reports/stale.json
python3 scripts/check_links.py --acceptance --workers 4 --timeout 10 --output reports/links.json
```

Run these CI checks after installing requirements:

```sh
python3 scripts/validate.py --acceptance
python3 -B -m unittest discover -s scripts/tests -p 'test_*.py' -v
python3 scripts/build.py --acceptance --output build/resources.js
python3 scripts/stale_report.py --acceptance --output build/stale.json
```

Use fresh output paths in CI or explicitly authorize replacing generated output with `--force`. Regression tests and their deliberately synthetic fixture are in `scripts/tests/`. Keep this fixture out of `data/resources.yaml` and the site catalog. `--as-of YYYY-MM-DD` makes validation and stale reports reproducible; a link report always records actual request time, even when historical validation uses `--as-of`.

## Link and freshness reports

The link checker deduplicates all URL fields, limits concurrent workers to 1–4, uses a configurable per-request timeout capped at 60 seconds, follows and records redirects, and retries an unsuccessful HEAD with GET without reading the body. TLS verification is never disabled. HTTP 2xx means live; 404/410 means dead; 401/403/429 means blocked/not confirmed; other status or network failures remain not confirmed. A blocked site is not labeled dead. Exit code 1 means validation/output failure or at least one dead link; blocked/inconclusive links remain in the report for manual review and do not alone fail CI. Live links do not prove that an API, dataset, or release claim is correct.

The stale report separates entry verification age, individual source-check ages, and dated substantive-release age. Default check review threshold is 180 days (`--check-days`); release-age context threshold is 730 days (`--release-days`). An old data release is labeled `older_release`, not obsolete. An unknown date stays `unknown`. Archived foundational datasets can remain valuable; neither a live link nor a recent metadata check establishes a recent data release. Recheck uncertain claims periodically and update evidence, not just timestamps.
