"""Import the sourced YC fixture into existing tables, without updating records.

Run with no flags to validate locally; add --apply to write to Supabase.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5


FIXTURE = Path(__file__).resolve().parents[1] / "src/data/startups_seed.json"


def stable_id(value):
    return str(uuid5(NAMESPACE_URL, value))


def load_fixture():
    records = json.loads(FIXTURE.read_text())
    if len(records) != 50 or len({r["source"]["company_url"] for r in records}) != 50:
        raise ValueError("Expected 50 unique sourced startups")
    for record in records:
        for field in ("name", "description", "location", "website", "industry"):
            if not record.get(field):
                raise ValueError("Missing {} for {}".format(field, record.get("name")))
        if record.get("funding_round") is not None:
            raise ValueError("Funding details must be verified before import")
    return records


def read_all(client, table, columns):
    records = []
    start = 0
    while True:
        page = client.table(table).select(columns).range(start, start + 999).execute().data
        records.extend(page)
        if len(page) < 1000:
            return records
        start += 1000


def unique_by_name(records):
    result = {}
    for record in records:
        key = record["name"].strip().casefold()
        if key in result:
            raise ValueError("Ambiguous existing name: " + record["name"])
        result[key] = record
    return result


def import_records(client, records):
    # Reuse visible existing IDs by name. Unseen deterministic IDs are protected
    # by primary-key conflict handling; existing values are never overwritten.
    existing_startups = unique_by_name(read_all(client, "startup", "startup_id,name,website"))
    existing_industries = unique_by_name(read_all(client, "industry", "industry_id,name"))
    startups, industries, links = [], {}, []
    for record in records:
        existing = existing_startups.get(record["name"].strip().casefold())
        if existing:
            normalize = lambda url: (url or "").rstrip("/").casefold()
            if normalize(existing.get("website")) != normalize(record["website"]):
                raise ValueError("Existing startup has a different website: " + record["name"])
        startup_id = existing["startup_id"] if existing else stable_id(record["source"]["company_url"])
        startups.append({
            "startup_id": startup_id,
            "name": record["name"],
            "description": record["description"],
            "location": record["location"],
            "website": record["website"],
            "funding_round": None,
        })
        # Import the primary category; detailed source categories stay in JSON.
        for name in (record["industry"],):
            key = name.strip().casefold()
            existing_industry = existing_industries.get(key)
            industry_id = existing_industry["industry_id"] if existing_industry else stable_id("startup-radar:industry:" + key)
            industries[industry_id] = {"industry_id": industry_id, "name": name}
            links.append({"startup_id": startup_id, "industry_id": industry_id})

    # Separate requests cannot be one database transaction. Stop on failure;
    # completed batches can be safely retried without updating existing records.
    for table, rows, conflict in (
        ("startup", startups, "startup_id"),
        ("industry", list(industries.values()), "industry_id"),
        ("startup_industry", links, None),
    ):
        options = {"ignore_duplicates": True}
        if conflict:
            options["on_conflict"] = conflict
        client.table(table).upsert(rows, **options).execute()
        print("Completed insert-only batch: {} ({} records submitted)".format(table, len(rows)), flush=True)

    ids = [record["startup_id"] for record in startups]
    visible = client.table("startup").select("startup_id").in_("startup_id", ids).execute().data
    if len(visible) != 50:
        raise RuntimeError("Import submitted, but not all 50 startups are visible; check SELECT policies")
    visible_links = client.table("startup_industry").select("startup_id,industry_id").in_("startup_id", ids).execute().data
    actual = {(r["startup_id"], r["industry_id"]) for r in visible_links}
    if any((r["startup_id"], r["industry_id"]) not in actual for r in links):
        raise RuntimeError("An industry link was not created; check existing links and constraints")
    print("Verified: all 50 imported startup IDs are readable.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Insert into the configured Supabase project")
    args = parser.parse_args()
    try:
        records = load_fixture()
        names = {record["industry"] for record in records}
        print("Validated: 50 startups, {} industries, no funding claims or jobs.".format(len(names)), flush=True)
        if not args.apply:
            print("Dry run only. Use --apply to import into existing Supabase tables.")
            return
        from database import supabase
        import_records(supabase, records)
    except Exception as exc:
        message = getattr(exc, "message", str(exc))
        for name in ("SUPABASE_KEY", "SUPABASE_URL"):
            value = os.environ.get(name)
            if value:
                message = message.replace(value, "[redacted]")
        print("Import stopped: {}: {}".format(type(exc).__name__, message), file=sys.stderr)
        print("Error code: {}".format(getattr(exc, "code", "unavailable")), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
