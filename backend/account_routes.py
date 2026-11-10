"""Basic applicant collections. All private queries use the verified user's client."""
from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator, field_validator
from postgrest.exceptions import APIError
from httpx import HTTPError

from database import supabase


class EducationInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    institution: str = Field(min_length=1, max_length=200)
    degree: Optional[str] = Field(default=None, max_length=200)
    field_of_study: Optional[str] = Field(default=None, max_length=200)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = Field(default=None, max_length=5000)

    @field_validator("institution", mode="before")
    @classmethod
    def trim_institution(cls, value):
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def check_dates(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("End date must not be before start date.")
        return self


class ExperienceInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    organization: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=200)
    location: Optional[str] = Field(default=None, max_length=300)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    description: Optional[str] = Field(default=None, max_length=5000)

    @field_validator("organization", "title", mode="before")
    @classmethod
    def trim_required(cls, value):
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def check_dates(self):
        if self.is_current and self.end_date:
            raise ValueError("A current position must not have an end date.")
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("End date must not be before start date.")
        return self


def execute(query):
    try:
        return query.execute().data
    except (APIError, HTTPError):
        raise HTTPException(503, "Unable to load or save account data. Please try again.") from None


def insert_once(client, table, row):
    try:
        client.table(table).insert(row).execute()
    except APIError as exc:
        if exc.code != "23505":
            raise HTTPException(503, "Unable to save this selection. Check that the item still exists and is accessible.") from None
    except HTTPError:
        raise HTTPException(503, "Unable to reach the database. Please try again.") from None
    return {"ok": True}


def register_account_routes(app, authenticated_account):
    @app.get("/industries")
    def industries():
        return execute(supabase.table("industry").select("industry_id,name").order("name"))

    @app.get("/applicants/{user_id}")
    def public_profile(user_id: UUID):
        try:
            rows = supabase.table("applicant_public_profile").select("*").eq("user_id", str(user_id)).execute().data
        except APIError as exc:
            if exc.code == "42501":
                raise HTTPException(503, "Public profile access is not configured. Apply the public-profile access migration.") from None
            raise HTTPException(503, "Unable to load the public profile. Please try again.") from None
        except HTTPError:
            raise HTTPException(503, "Unable to reach the database. Please try again.") from None
        if not rows:
            raise HTTPException(404, "Candidate profile not found.")
        return rows[0]

    @app.get("/account/interests")
    def interests(account=Depends(authenticated_account)):
        client, user = account
        return execute(client.table("interested_in").select("industry_id").eq("user_id", str(user.id)))

    @app.put("/account/interests/{industry_id}")
    def add_interest(industry_id: UUID, account=Depends(authenticated_account)):
        client, user = account
        return insert_once(client, "interested_in", {"user_id": str(user.id), "industry_id": str(industry_id)})

    @app.delete("/account/interests/{industry_id}")
    def remove_interest(industry_id: UUID, account=Depends(authenticated_account)):
        client, user = account
        execute(client.table("interested_in").delete().eq("user_id", str(user.id)).eq("industry_id", str(industry_id)))
        return {"ok": True}

    @app.get("/account/saved-startups")
    def saved_startups(account=Depends(authenticated_account)):
        client, user = account
        return execute(client.table("saved_startup").select(
            "startup_id,saved_at,startup:startup(startup_id,name,description,location,funding_round)"
        ).eq("user_id", str(user.id)).order("saved_at", desc=True))

    @app.put("/account/saved-startups/{startup_id}")
    def save_startup(startup_id: UUID, account=Depends(authenticated_account)):
        client, user = account
        return insert_once(client, "saved_startup", {"user_id": str(user.id), "startup_id": str(startup_id)})

    @app.delete("/account/saved-startups/{startup_id}")
    def unsave_startup(startup_id: UUID, account=Depends(authenticated_account)):
        client, user = account
        execute(client.table("saved_startup").delete().eq("user_id", str(user.id)).eq("startup_id", str(startup_id)))
        return {"ok": True}

    # Fixed routes/models for each collection: never accept arbitrary table names.
    @app.get("/account/education")
    def education(account=Depends(authenticated_account)):
        client, user = account
        return execute(client.table("education").select("*").eq("user_id", str(user.id)).order("start_date", desc=True))

    @app.post("/account/education", status_code=201)
    def create_education(body: EducationInput, account=Depends(authenticated_account)):
        client, user = account
        return execute(client.table("education").insert({**body.model_dump(mode="json"), "user_id": str(user.id)}))[0]

    @app.put("/account/education/{entry_id}")
    def update_education(entry_id: UUID, body: EducationInput, account=Depends(authenticated_account)):
        client, user = account
        rows = execute(client.table("education").update(body.model_dump(mode="json")).eq("user_id", str(user.id)).eq("education_id", str(entry_id)))
        if not rows:
            raise HTTPException(404, "Education entry not found.")
        return rows[0]

    @app.delete("/account/education/{entry_id}")
    def delete_education(entry_id: UUID, account=Depends(authenticated_account)):
        client, user = account
        execute(client.table("education").delete().eq("user_id", str(user.id)).eq("education_id", str(entry_id)))
        return {"ok": True}

    @app.get("/account/experience")
    def experience(account=Depends(authenticated_account)):
        client, user = account
        return execute(client.table("experience").select("*").eq("user_id", str(user.id)).order("start_date", desc=True))

    @app.post("/account/experience", status_code=201)
    def create_experience(body: ExperienceInput, account=Depends(authenticated_account)):
        client, user = account
        return execute(client.table("experience").insert({**body.model_dump(mode="json"), "user_id": str(user.id)}))[0]

    @app.put("/account/experience/{entry_id}")
    def update_experience(entry_id: UUID, body: ExperienceInput, account=Depends(authenticated_account)):
        client, user = account
        rows = execute(client.table("experience").update(body.model_dump(mode="json")).eq("user_id", str(user.id)).eq("experience_id", str(entry_id)))
        if not rows:
            raise HTTPException(404, "Experience entry not found.")
        return rows[0]

    @app.delete("/account/experience/{entry_id}")
    def delete_experience(entry_id: UUID, account=Depends(authenticated_account)):
        client, user = account
        execute(client.table("experience").delete().eq("user_id", str(user.id)).eq("experience_id", str(entry_id)))
        return {"ok": True}
