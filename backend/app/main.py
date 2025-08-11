from fastapi import FastAPI
from .db import Base, engine
from .seed import run_seed
from .routers import api

# Version tracking
VERSION = "1.1.1"
BUILD_DATE = "2024-01-15"

def create_app() -> FastAPI:
    app = FastAPI(title="CASHFLOW Backend", version=VERSION)

    @app.get("/health")
    async def health_check():
        return {"status": "ok", "version": VERSION, "build_date": BUILD_DATE}

    @app.get("/version")
    async def version_info():
        return {"version": VERSION, "build_date": BUILD_DATE}

    # DB init for dev
    Base.metadata.create_all(bind=engine)
    
    # Seed database
    run_seed()

    app.include_router(api, prefix="/api")

    return app


app = create_app()

