from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .seed import run_seed
from .routers import api

# Version tracking
VERSION = "1.4.4"
BUILD_DATE = "2024-12-15"

def create_app(database_engine=None) -> FastAPI:
    app = FastAPI(title="CASHFLOW Backend", version=VERSION)

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health_check():
        return {"status": "ok", "version": VERSION, "build_date": BUILD_DATE}

    @app.get("/version")
    async def version_info():
        return {"version": VERSION, "build_date": BUILD_DATE}

    # Use provided engine or default engine
    db_engine = database_engine or engine
    
    # DB init for dev
    Base.metadata.create_all(bind=db_engine)
    
    # Seed database
    run_seed()

    app.include_router(api, prefix="/api")

    return app


app = create_app()

