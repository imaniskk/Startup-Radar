from fastapi import FastAPI
from database import supabase
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
    response = supabase.table("startup").select("*").execute()
    return response.data