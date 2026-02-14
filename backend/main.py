import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.models import *  # noqa: F401 - Import all models for table creation
from app.routers import auth, projects, files, comparisons, anomalies, rules, reports, dashboard

# Create upload directory
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="DataCompare AI",
    description="Professional data comparison, validation, and anomaly detection platform",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(files.router)
app.include_router(comparisons.router)
app.include_router(anomalies.router)
app.include_router(rules.router)
app.include_router(reports.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "DataCompare AI API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
