from fastapi import FastAPI
from .db import Base, engine
from .seed import run_seed
from .routers import api

# Version tracking
VERSION = "1.4.3"
BUILD_DATE = "2024-01-15"

def create_app(database_engine=None) -> FastAPI:
    app = FastAPI(title="CASHFLOW Backend", version=VERSION)

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

