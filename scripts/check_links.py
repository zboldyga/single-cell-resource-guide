#!/usr/bin/env python3
"""Audit link liveness; this makes no claim about substantive data freshness."""
from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener

from validate import CatalogError, add_catalog_arguments, validated_catalog, walk, write_output


class RecordingRedirects(HTTPRedirectHandler):
    def __init__(self):
        self.redirects = []

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.redirects.append({"from": req.full_url, "to": newurl, "status": code})
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def classify_status(status):
    if status is None:
        return "not_confirmed"
    if 200 <= status < 300:
        return "live"
    if status in (401, 403, 429):
        return "blocked_not_confirmed"
    if status in (404, 410):
        return "dead"
    return "not_confirmed"


def request_once(url, method, timeout):
    redirect_handler = RecordingRedirects()
    opener = build_opener(redirect_handler)  # Default TLS certificate validation remains enabled.
    request = Request(url, method=method, headers={"User-Agent": "MolBioFieldGuide-LinkAudit/1.0"})
    result = {"method": method, "status": None, "final_url": url, "redirects": redirect_handler.redirects,
              "error": None}
    try:
        with opener.open(request, timeout=timeout) as response:
            result.update(status=response.status, final_url=response.url)
            # GET checks headers only: do not download a dataset body.
    except HTTPError as exc:
        result.update(status=exc.code, final_url=exc.url, error=str(exc))
        exc.close()
    except (URLError, OSError, ValueError) as exc:
        result["error"] = str(exc)
    return result


def check_url(url, timeout=10.0):
    attempts = [request_once(url, "HEAD", timeout)]
    if classify_status(attempts[-1]["status"]) != "live":
        attempts.append(request_once(url, "GET", timeout))
    final = attempts[-1]
    return {"url": url, "checked_on": datetime.now(timezone.utc).date().isoformat(),
            "classification": classify_status(final["status"]), "status": final["status"],
            "final_url": final["final_url"], "attempts": attempts}


def collect_urls(catalog):
    return sorted({value for path, value in walk(catalog)
                   if path[-1] in {"url", "source_url"} and isinstance(value, str)})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    add_catalog_arguments(parser)
    parser.add_argument("--output", type=Path, help="JSON output; default stdout")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--workers", type=int, default=4, choices=range(1, 5))
    parser.add_argument("--timeout", type=float, default=10.0, help="Per-request timeout, 0 < seconds <= 60")
    args = parser.parse_args()
    if not 0 < args.timeout <= 60:
        parser.error("--timeout must be greater than 0 and at most 60 seconds")
    try:
        catalog = validated_catalog(args.data, acceptance=args.acceptance, as_of=args.as_of)
        urls = collect_urls(catalog)
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            results = list(executor.map(lambda url: check_url(url, args.timeout), urls))
        counts = {name: sum(row["classification"] == name for row in results)
                  for name in ("live", "dead", "blocked_not_confirmed", "not_confirmed")}
        report = {"checked_at": datetime.now(timezone.utc).isoformat(),
                  "note": "Link liveness is separate from substantive data release freshness. "
                          "Blocked and inconclusive results require human review.",
                  "unique_urls": len(urls), "counts": counts, "results": results}
        write_output(json.dumps(report, indent=2) + "\n", args.output, args.force)
    except (CatalogError, OSError, ValueError, RecursionError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    return 1 if counts["dead"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
