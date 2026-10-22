#!/usr/bin/env python3
"""Validate authoritative YAML/JSON against the catalog contract and semantics."""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "data" / "resources.yaml"
DEFAULT_SCHEMA = ROOT / "schema" / "resources.schema.json"
HTML = re.compile(r"<\s*/?\s*[A-Za-z][^>]*>|<!--|<!DOCTYPE", re.I)
DATE_KEYS = {"updated_at", "as_of", "date", "checked_on"}


class CatalogError(ValueError):
    pass


class CatalogLoader(yaml.SafeLoader):
    """Safe YAML without implicit date conversion or duplicate mapping keys."""
    yaml_implicit_resolvers = {
        key: [(tag, regex) for tag, regex in values
              if tag != "tag:yaml.org,2002:timestamp"]
        for key, values in yaml.SafeLoader.yaml_implicit_resolvers.items()
    }

    def construct_mapping(self, node, deep=False):
        self.flatten_mapping(node)
        keys = set()
        for key_node, _ in node.value:
            key = self.construct_object(key_node, deep=deep)
            try:
                if key in keys:
                    raise CatalogError(f"Duplicate YAML key: {key!r}")
                keys.add(key)
            except TypeError as exc:
                raise CatalogError("YAML mapping keys must be scalar") from exc
        return super().construct_mapping(node, deep=deep)


def utc_today():
    return datetime.now(timezone.utc).date()


def parse_day(value):
    try:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            raise ValueError
        return date.fromisoformat(value)
    except (TypeError, ValueError) as exc:
        raise argparse.ArgumentTypeError("Use a valid YYYY-MM-DD date") from exc


def load_catalog(path):
    try:
        with Path(path).open(encoding="utf-8") as handle:
            return yaml.load(handle, Loader=CatalogLoader)
    except (OSError, yaml.YAMLError) as exc:
        raise CatalogError(f"Cannot read {path}: {exc}") from exc


def walk(value, path=()):
    if isinstance(value, dict):
        for key, child in value.items():
            yield from walk(child, path + (str(key),))
    elif isinstance(value, list):
        for i, child in enumerate(value):
            yield from walk(child, path + (str(i),))
    else:
        yield path, value


def validation_errors(catalog, *, schema_path=DEFAULT_SCHEMA, acceptance=False, as_of=None):
    today = as_of or utc_today()
    schema = json.loads(Path(schema_path).read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors = [f"{'.'.join(map(str, error.absolute_path)) or '<root>'}: {error.message}"
              for error in sorted(validator.iter_errors(catalog), key=lambda e: str(list(e.absolute_path)))]
    if errors:
        return errors
    for path, value in walk(catalog):
        location = ".".join(path)
        if isinstance(value, str) and HTML.search(value):
            errors.append(f"{location}: HTML is not allowed")
        if path[-1] in DATE_KEYS and value is not None and date.fromisoformat(value) > today:
            errors.append(f"{location}: future date relative to {today.isoformat()}")
    resources = catalog["resources"]
    ids = [r["id"] for r in resources]
    seen = set()
    for resource in resources:
        rid = resource["id"]
        if rid in seen:
            errors.append(f"{rid}: duplicate resource ID")
        seen.add(rid)
        for related in resource["related"]:
            if related == rid:
                errors.append(f"{rid}: related must not refer to itself")
            elif related not in ids:
                errors.append(f"{rid}: unknown related ID {related}")
        if resource["verification"]["status"] == "verified":
            supported = {field for source in resource["sources"] if source["type"] == "official"
                         for field in source["supports"]}
            for required in ("purpose", "biological_scope", "access", "key_data"):
                if not any(field == required or field.startswith(required + ".") for field in supported):
                    errors.append(f"{rid}: verified requires official evidence supporting {required}")
    if acceptance:
        if not 30 <= len(resources) <= 60:
            errors.append(f"Acceptance requires 30–60 resources; found {len(resources)}")
        count = sum(r["verification"]["status"] == "verified" for r in resources)
        if count < 25:
            errors.append(f"Acceptance requires at least 25 verified resources; found {count}")
    return errors


def validated_catalog(path=DEFAULT_DATA, *, acceptance=False, as_of=None, schema_path=DEFAULT_SCHEMA):
    catalog = load_catalog(path)
    errors = validation_errors(catalog, acceptance=acceptance, as_of=as_of, schema_path=schema_path)
    if errors:
        raise CatalogError("\n".join(errors))
    return catalog


def add_catalog_arguments(parser):
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA, help="Authoritative YAML or JSON")
    parser.add_argument("--as-of", type=parse_day, default=utc_today(), help="Audit date in UTC (YYYY-MM-DD)")
    parser.add_argument("--acceptance", action="store_true", help="Also require 30–60 entries and >=25 verified")


def write_output(text, output=None, force=False):
    """Default reports go to stdout. Existing files require explicit --force."""
    if output is None:
        print(text, end="" if text.endswith("\n") else "\n")
        return
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w" if force else "x", encoding="utf-8") as handle:
        handle.write(text)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    add_catalog_arguments(parser)
    args = parser.parse_args()
    try:
        catalog = validated_catalog(args.data, acceptance=args.acceptance, as_of=args.as_of)
    except (CatalogError, OSError, ValueError, RecursionError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    resources = catalog["resources"]
    verified = sum(r["verification"]["status"] == "verified" for r in resources)
    print(f"PASS: {len(resources)} resources; {verified} verified; "
          f"{'acceptance' if args.acceptance else 'development'} validation")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
