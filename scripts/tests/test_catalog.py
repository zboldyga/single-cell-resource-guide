"""Contract failures and HTTP classifications; no network or curated fixtures."""
import copy
import json
import sys
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from validate import CatalogLoader, CatalogError, validation_errors
from check_links import check_url, classify_status, collect_urls
from stale_report import make_report
import yaml


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.catalog = json.loads((ROOT / "scripts" / "tests" / "fixtures" / "catalog.json").read_text())
        self.resource = self.catalog["resources"][0]

    def errors(self, acceptance=False):
        return validation_errors(self.catalog, as_of=date(2026, 10, 21), acceptance=acceptance)

    def test_contract_fixture_valid(self):
        self.assertEqual([], self.errors())

    def test_schema_negative_cases(self):
        for mutate in (
            lambda r: r.update(resource_type="database"),
            lambda r: r.update(url="javascript:alert(1)"),
            lambda r: r.update(categories=[]),
            lambda r: r.update(key_data=[]),
            lambda r: r.update(extra="unexpected"),
            lambda r: r["access"]["web"].update(url=None),
            lambda r: r["release"].update(date="2026-02-30"),
        ):
            with self.subTest(mutate=mutate):
                catalog = copy.deepcopy(self.catalog)
                mutate(catalog["resources"][0])
                self.assertTrue(validation_errors(catalog, as_of=date(2026, 10, 21)))

    def test_unique_ids_related_and_future_dates(self):
        self.catalog["resources"].append(copy.deepcopy(self.resource))
        self.resource["related"] = ["example", "missing"]
        self.resource["release"]["date"] = "2026-10-22"
        errors = "\n".join(self.errors())
        for fragment in ("duplicate resource ID", "itself", "unknown related", "future date"):
            self.assertIn(fragment, errors)

    def test_verified_requires_official_core_evidence(self):
        self.resource["verification"].update(status="verified", checked_on="2026-10-21")
        self.assertIn("supporting access", "\n".join(self.errors()))
        self.resource["sources"][0]["supports"].extend(["access.web", "key_data"])
        self.assertEqual([], self.errors())
        self.resource["sources"][0]["type"] = "paper"
        self.assertIn("supporting purpose", "\n".join(self.errors()))

    def test_verified_requires_check_date(self):
        self.resource["verification"]["status"] = "verified"
        self.assertTrue(self.errors())

    def test_html_rejected(self):
        self.resource["purpose"] = "A <script>alert(1)</script>"
        self.assertIn("HTML", "\n".join(self.errors()))

    def test_acceptance_thresholds(self):
        errors = "\n".join(self.errors(acceptance=True))
        self.assertIn("30–60", errors)
        self.assertIn("at least 25", errors)
        self.resource["verification"].update(status="verified", checked_on="2026-10-21")
        self.resource["sources"][0]["supports"].extend(["access", "key_data"])
        self.catalog["resources"] = [dict(copy.deepcopy(self.resource), id=f"fixture-{i}") for i in range(30)]
        self.assertEqual([], self.errors(acceptance=True))

    def test_yaml_duplicate_key_and_safe_loading(self):
        with self.assertRaises(CatalogError):
            yaml.load("id: first\nid: second\n", Loader=CatalogLoader)
        with self.assertRaises(yaml.constructor.ConstructorError):
            yaml.load("!!python/object/apply:os.system ['echo unsafe']", Loader=CatalogLoader)
        self.assertEqual("2026-10-21", yaml.load("2026-10-21", Loader=CatalogLoader))

    def test_link_classifications(self):
        for code in (200, 204, 206):
            self.assertEqual("live", classify_status(code))
        for code in (401, 403, 429):
            self.assertEqual("blocked_not_confirmed", classify_status(code))
        for code in (404, 410):
            self.assertEqual("dead", classify_status(code))
        for code in (None, 302, 400, 500, 503):
            self.assertEqual("not_confirmed", classify_status(code))

    def test_get_fallback_and_deduplication(self):
        def response(code):
            return {"status": code, "final_url": "https://example.org", "redirects": [], "error": None}
        with patch("check_links.request_once", side_effect=[response(405), response(200)]) as request:
            result = check_url("https://example.org")
            self.assertEqual("live", result["classification"])
            self.assertEqual("HEAD", request.call_args_list[0].args[1])
            self.assertEqual("GET", request.call_args_list[1].args[1])
        self.assertEqual(["https://example.org"], collect_urls(self.catalog))

    def test_release_age_separate_from_check_age(self):
        self.resource["verification"]["checked_on"] = "2026-10-21"
        self.resource["release"].update(date="2010-01-01", label="archived foundational release")
        report = make_report(self.catalog, date(2026, 10, 21))
        row = report["resources"][0]
        self.assertEqual("recent", row["check_state"])
        self.assertEqual("older_release", row["release_state"])
        self.resource["release"]["date"] = None
        self.assertEqual("unknown", make_report(self.catalog, date(2026, 10, 21))["resources"][0]["release_state"])

    def test_download_examples_require_dated_provenance(self):
        example = {"label": "One file", "description": "A selected public file.",
                   "command": "curl --fail --location \\\n  --output example.tsv 'https://example.org/data.tsv'",
                   "requirements": ["curl"], "source_url": "https://example.org/downloads",
                   "checked_on": "2026-10-21"}
        self.resource["download_examples"] = [example]
        self.assertEqual([], self.errors())
        self.assertIn(example["source_url"], collect_urls(self.catalog))
        for change in ({"source_url": "javascript:alert(1)"}, {"checked_on": "2026-10-22"},
                       {"requirements": []}, {"command": ""}):
            with self.subTest(change=change):
                self.resource["download_examples"] = [dict(example, **change)]
                self.assertTrue(self.errors())
        self.resource["download_examples"] = [dict(example)]
        del self.resource["download_examples"][0]["source_url"]
        self.assertTrue(self.errors())

    def test_download_check_age_independent_of_core_verification(self):
        self.resource["verification"]["checked_on"] = "2026-10-21"
        self.resource["download_examples"] = [{"label": "Old example", "source_url": "https://example.org",
                                               "checked_on": "2020-01-01"}]
        report = make_report(self.catalog, date(2026, 10, 21))
        self.assertEqual("recent", report["resources"][0]["check_state"])
        self.assertTrue(report["resources"][0]["download_review_due"])
        self.assertEqual(1, report["counts"]["download_reviews_due"])


if __name__ == "__main__":
    unittest.main()
