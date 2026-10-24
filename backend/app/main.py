"""
GridGenie FastAPI Application Entrypoint.
Autonomous Renewable Energy Microgrid Optimizer & Digital Twin.
IEEE ClimateChain Global Hackathon Submission.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router

app = FastAPI(
    title="GridGenie: Autonomous Renewable Energy Microgrid Optimizer",
    description=(
        "An AI-assisted renewable-energy microgrid digital twin and constrained look-ahead dispatch optimizer. "
        "Simulates solar, wind, battery storage, and dynamic grid pricing while solving linear programming "
        "formulations to minimize operating cost and carbon emissions. Built for the IEEE ClimateChain Global Hackathon."
    ),
    version="1.0.0",
)

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes under /api (standard) and root (for Vercel serverless functions)
app.include_router(router, prefix="/api")
app.include_router(router)


@app.get("/")
@app.get("/api")
def root():
    return {
        "message": "GridGenie Microgrid Digital Twin API is active.",
        "documentation": "/docs",
        "health": "/api/health",
        "notice": "System operates as a deterministic physical simulation digital twin for microgrid optimization research.",
    }
