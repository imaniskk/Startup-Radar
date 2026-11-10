import logging

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from postgrest.exceptions import APIError
from supabase_auth.errors import AuthApiError

from database import public_auth_config, supabase, user_client

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
            "user_id,email,name,location,phone,linkedin_url,created_at,account_type"
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
