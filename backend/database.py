import base64
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client
from supabase.lib.client_options import SyncClientOptions

load_dotenv(Path(__file__).with_name(".env"))

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_KEY"]
supabase = create_client(url, key)


def public_auth_config():
    """Only a publishable/legacy anon key may be delivered to the browser."""
    public_key = os.environ.get("SUPABASE_PUBLISHABLE_KEY", key)
    safe = public_key.startswith("sb_publishable_")
    if not safe:
        try:
            payload = public_key.split(".")[1]
            claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
            safe = claims.get("role") == "anon"
        except (IndexError, ValueError, TypeError):
            safe = False
    if not safe:
        raise ValueError("Set SUPABASE_PUBLISHABLE_KEY to a publishable key for browser authentication.")
    return {"url": url, "publishableKey": public_key}


def user_client(token):
    """Separate client per request; never mutate the shared anonymous client."""
    config = public_auth_config()
    client = create_client(
        config["url"], config["publishableKey"],
        options=SyncClientOptions(persist_session=False, auto_refresh_token=False),
    )
    client.postgrest.auth(token)
    return client
