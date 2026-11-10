import logging
from typing import Optional
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from postgrest.exceptions import APIError
from supabase_auth.errors import AuthApiError

from database import public_auth_config, supabase, user_client
from account_routes import register_account_routes
from founder_routes import register_founder_routes
from job_routes import register_job_routes

app = FastAPI()
logger = logging.getLogger(__name__)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
bearer = HTTPBearer(auto_error=False)


@app.get("/auth/config")
def auth_config():
    try:
        return public_auth_config()
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None


def authenticated_account(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Please log in.", headers={"WWW-Authenticate": "Bearer"})
    try:
        client = user_client(credentials.credentials)
        result = client.auth.get_user(credentials.credentials)
        if result is None or result.user is None:
            raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.")
        return client, result.user
    except AuthApiError:
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.") from None
    except ValueError:
        raise HTTPException(status_code=503, detail="Authentication is not configured.") from None
    except HTTPException:
        raise
    except Exception:
        # Do not log exception objects that might contain credentials or tokens.
        logger.warning("Auth provider request failed")
        raise HTTPException(status_code=503, detail="Unable to verify your session. Please try again.") from None


@app.get("/account/me")
def account_me(account=Depends(authenticated_account)):
    client, user = account
    try:
        profiles = client.table("user").select(
            "user_id,email,name,location,phone,linkedin_url,created_at,bio,account_type"
        ).eq("user_id", str(user.id)).execute().data
        if not profiles:
            raise HTTPException(status_code=409, detail="Your profile is missing. Check the registration trigger in Supabase.")
        account_type = profiles[0]["account_type"]
        if account_type == "founder":
            rows = client.table("founder").select("user_id").eq("user_id", str(user.id)).execute().data
        else:
            rows = client.table("applicant").select("user_id,default_resume_path").eq("user_id", str(user.id)).execute().data
    except APIError:
        raise HTTPException(status_code=503, detail="Unable to load your account. Check the account migration and access policies.") from None
    if not rows:
        raise HTTPException(status_code=409, detail=f"Your {account_type} profile is missing. Check the registration trigger in Supabase.")
    return {"profile": profiles[0], "account_type": account_type, account_type: rows[0]}


@app.get("/startups")
def get_startups():
    response = supabase.table("startup").select("*").execute()
    return response.data


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=200)
    bio: Optional[str] = Field(default=None, max_length=500)
    location: Optional[str] = Field(default=None, max_length=300)
    phone: Optional[str] = Field(default=None, max_length=50)
    linkedin_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator("name", "bio", "location", "phone", "linkedin_url", mode="before")
    @classmethod
    def trim_fields(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("linkedin_url")
    @classmethod
    def valid_linkedin(cls, value):
        if not value:
            return None
        parsed = urlparse(value)
        host = (parsed.hostname or "").lower()
        if parsed.scheme != "https" or not (host == "linkedin.com" or host.endswith(".linkedin.com")) or parsed.username or parsed.password:
            raise ValueError("Use an https://linkedin.com profile URL.")
        return value


@app.patch("/account/me")
def update_profile(body: ProfileUpdate, account=Depends(authenticated_account)):
    client, user = account
    changes = body.model_dump(exclude_unset=True)
    try:
        rows = client.table("user").update(changes).eq("user_id", str(user.id)).execute().data
    except APIError:
        raise HTTPException(status_code=503, detail="Unable to save your profile. Please try again.") from None
    if not rows:
        raise HTTPException(status_code=409, detail="Your profile is missing or cannot be updated.")
    return {"profile": rows[0]}


register_account_routes(app, authenticated_account)
register_founder_routes(app, authenticated_account)
register_job_routes(app, authenticated_account)
