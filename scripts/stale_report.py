#!/usr/bin/env python3
"""Separate metadata check age from known substantive release age."""
import argparse
import json
import sys
from datetime import date
from pathlib import Path

from validate import CatalogError, add_catalog_arguments, validated_catalog, write_output


def age(value, as_of):
    return None if value is None else (as_of - date.fromisoformat(value)).days


def make_report(catalog, as_of, check_days=180, release_days=730):
    rows = []
    for resource in catalog["resources"]:
        verification = resource["verification"]
        check_age = age(verification["checked_on"], as_of)
        source_ages = [{"url": source["url"], "checked_on": source["checked_on"],
                        "age_days": age(source["checked_on"], as_of)} for source in resource["sources"]]
        download_ages = [{"label": example["label"], "url": example["source_url"],
                          "checked_on": example["checked_on"],
                          "age_days": age(example["checked_on"], as_of)}
                         for example in resource.get("download_examples", [])]
        release = resource["release"]
        release_age = age(release["date"], as_of)
        rows.append({"id": resource["id"], "name": resource["name"],
                     "verification_status": verification["status"],
                     "verification_checked_on": verification["checked_on"], "check_age_days": check_age,
                     "check_state": "unknown" if check_age is None else "review_due" if check_age > check_days else "recent",
                     "source_checks": source_ages,
                     "download_checks": download_ages,
                     "download_review_due": any(d["age_days"] > check_days for d in download_ages),
                     "oldest_source_check_age_days": max(s["age_days"] for s in source_ages),
                     "source_review_due": any(s["age_days"] > check_days for s in source_ages),
                     "release_label": release["label"], "release_date": release["date"],
                     "release_age_days": release_age,
                     "release_state": "unknown" if release_age is None else "older_release" if release_age > release_days else "within_window",
                     "release_note": release["note"],
                     "scale_date_unknown": resource["scale"]["as_of"] is None,
                     "license_unknown": resource["licensing"]["summary"].lower() == "unknown"})
    return {"as_of": as_of.isoformat(), "check_threshold_days": check_days,
            "release_context_threshold_days": release_days,
            "note": "Check age measures verification currency. Release age describes dated data, not usefulness, "
                    "maintenance status, or link liveness. Archived foundational datasets may remain valuable. "
                    "Unknown release dates are unknown, not evidence of staleness.",
            "counts": {"resources": len(rows),
                       "checks_review_due": sum(r["check_state"] == "review_due" for r in rows),
                       "checks_unknown": sum(r["check_state"] == "unknown" for r in rows),
                       "source_reviews_due": sum(r["source_review_due"] for r in rows),
                       "download_reviews_due": sum(r["download_review_due"] for r in rows),
                       "release_dates_unknown": sum(r["release_state"] == "unknown" for r in rows),
                       "older_releases": sum(r["release_state"] == "older_release" for r in rows)},
            "resources": rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    add_catalog_arguments(parser)
    parser.add_argument("--output", type=Path, help="JSON output; default stdout")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--check-days", type=int, default=180)
    parser.add_argument("--release-days", type=int, default=730)
    args = parser.parse_args()
    if args.check_days < 0 or args.release_days < 0:
        parser.error("Age thresholds must be nonnegative")
    try:
        catalog = validated_catalog(args.data, acceptance=args.acceptance, as_of=args.as_of)
        report = make_report(catalog, args.as_of, args.check_days, args.release_days)
        write_output(json.dumps(report, indent=2) + "\n", args.output, args.force)
    except (CatalogError, OSError, ValueError, RecursionError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
