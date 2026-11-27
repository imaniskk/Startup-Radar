"""Founder pages and tools."""
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, Depends
from pydantic import BaseModel, ConfigDict, Field, field_validator, HttpUrl

from account_routes import execute
from database import supabase
from job_routes import require_role

class StartupInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=5000)
    location: Optional[str] = Field(default=None, max_length=300)
    funding_round: Optional[str] = Field(default=None, max_length=100)
    website: Optional[str] = Field(default=None, max_length=500)
    industry_id: Optional[UUID] = None

    @field_validator("name", "description", "location", "funding_round", "website", mode="before")
    @classmethod
    def trim_fields(cls, value):
        return value.strip() if isinstance(value, str) else value

def register_founder_routes(app, authenticated_account):
    @app.post("/founder/startups", status_code=201)
    def register_startup(body: StartupInput, account=Depends(authenticated_account)):
        client, user = require_role(account, "founder")
        result = execute(
            client.rpc(
                "radar_register_startup",
                {
                    "p_name": body.name,
                    "p_description": body.description,
                    "p_location": body.location,
                    "p_funding_round": body.funding_round,
                    "p_website": body.website,
                    "p_industry_id": str(body.industry_id) if body.industry_id else None,
                },
            )
        )
        if not result:
            raise HTTPException(503, "Startup was created but nothing was returned.")
        return result[0] if isinstance(result, list) else result
    @app.get("/founders/{user_id}")
    def founder_public_profile(user_id: UUID):
        rows = execute(supabase.table("founder_public_profile").select("*").eq("user_id", str(user_id)))
        if not rows:
            raise HTTPException(404, "Founder profile not found.")
        return rows[0]

