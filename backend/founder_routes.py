"""Founder pages and tools."""
from uuid import UUID

from fastapi import HTTPException

from account_routes import execute
from database import supabase


def register_founder_routes(app, authenticated_account):
    @app.get("/founders/{user_id}")
    def founder_public_profile(user_id: UUID):
        rows = execute(supabase.table("founder_public_profile").select("*").eq("user_id", str(user_id)))
        if not rows:
            raise HTTPException(404, "Founder profile not found.")
        return rows[0]