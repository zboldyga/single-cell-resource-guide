#!/usr/bin/env python3
"""Validate YAML and emit a file://-compatible catalog JavaScript asset."""
import argparse
import json
import sys
from pathlib import Path

from validate import ROOT, CatalogError, add_catalog_arguments, validated_catalog, write_output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    add_catalog_arguments(parser)
    parser.add_argument("--output", type=Path, default=ROOT / "site" / "resources.js")
    parser.add_argument("--force", action="store_true", help="Explicitly allow replacing the output")
    args = parser.parse_args()
    try:
        catalog = validated_catalog(args.data, acceptance=args.acceptance, as_of=args.as_of)
        payload = json.dumps(catalog, ensure_ascii=True, indent=2).replace("<", "\\u003c")
        write_output("// Generated from the authoritative catalog; do not edit.\n"
                     "window.RESOURCE_CATALOG = " + payload + ";\n", args.output, args.force)
    except (CatalogError, OSError, ValueError, RecursionError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    print(f"PASS: built {len(catalog['resources'])} resources to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
