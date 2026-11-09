from datetime import datetime, timezone
from uuid import UUID

from fastapi import FastAPI, HTTPException
from database import supabase
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary startup data
startups = [
    {
        "id": 1,
        "name": "TechNova",
        "industry": "Technology",
        "location": "California",
        "funding_stage": "Seed"
    },
    {
        "id": 2,
        "name": "HealthAI",
        "industry": "Healthcare",
        "location": "New York",
        "funding_stage": "Series A"
    },
    {
        "id": 3,
        "name": "GreenFuture",
        "industry": "Sustainability",
        "location": "California",
        "funding_stage": "Pre-Seed"
    }
]

@app.get("/startups")
def get_startups():
    response = (
        supabase.table("startup")
        .select("*,startup_industry(industry(name))")
        .order("name")
        .execute()
    )
    startups = []
    for record in response.data:
        links = record.pop("startup_industry", [])
        industries = sorted({
            link["industry"]["name"]
            for link in links
            if link.get("industry") and link["industry"].get("name")
        })
        startups.append({
            **record,
            "industries": industries,
            "industry": ", ".join(industries),
            "is_demo": is_demo_startup(record),
        })
    return startups


def is_demo_startup(record):
    return (record.get("name") or "").startswith("[DEMO] ") and (
        record.get("description") or ""
    ).startswith("[DEMO] ")


@app.get("/startups/{startup_id}/jobs")
def get_startup_jobs(startup_id: UUID):
    """Return this startup's visible, open jobs whose deadlines have not passed."""
    try:
        startup = (
            supabase.table("startup")
            .select("startup_id,name,description")
            .eq("startup_id", str(startup_id))
            .limit(1)
            .execute()
        )
        if not startup.data:
            raise HTTPException(status_code=404, detail="Startup not found or not accessible.")
        jobs = (
            supabase.table("job_listing")
            .select("job_id,startup_id,title,description,location,status,date_posted,application_url,application_deadline")
            .eq("startup_id", str(startup_id))
            .eq("status", "open")
            .or_("application_deadline.is.null,application_deadline.gt." + datetime.now(timezone.utc).isoformat())
            .order("title")
            .execute()
        )
        return {
            "startup_id": str(startup_id),
            "is_demo": is_demo_startup(startup.data[0]),
            "jobs": jobs.data,
        }
    except HTTPException:
        raise
    except Exception:
        # Keep database errors and connection information out of API responses.
        raise HTTPException(status_code=503, detail="Unable to load jobs. Please try again.") from None
