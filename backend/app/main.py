from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles

from app.config import ROOT, get_settings
from app.contract import META
from app.db import init_db
from app.routers import admin, auth, demo, lab, vendor


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="MANTIKA CHECK API",
        version="1.0.0",
        summary="Shared research API for vendor observations and separate laboratory TPC models.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origin_list(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(auth.router)
    app.include_router(vendor.router)
    app.include_router(lab.router)
    app.include_router(admin.router)
    app.include_router(demo.router)
    demo_dir = ROOT.parent / "demo"
    if demo_dir.is_dir():
        app.mount("/demo", StaticFiles(directory=demo_dir, html=True), name="demo")

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    @app.get("/")
    def root() -> dict:
        return {
            "name": "MANTIKA CHECK API",
            "docs": "/docs",
            "contract": "/api/v1/meta",
            "vendor_demo": "/demo/",
            "research_desk": "/demo/research.html",
        }

    @app.get("/api/v1/meta")
    def meta() -> dict:
        return META

    return app


app = create_app()
