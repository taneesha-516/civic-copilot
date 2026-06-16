from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.api.v1.routes import (
    complaints,
    cv,
    dashboard,
    heatmap,
    nlp,
    predictions,
    priority,
    workflow,
)
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.PROJECT_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    app.include_router(complaints.router, prefix="/complaints", tags=["complaints"])
    app.include_router(nlp.router, prefix="/nlp", tags=["nlp"])
    app.include_router(cv.router, prefix="/cv", tags=["cv"])
    app.include_router(priority.router, prefix="/priority", tags=["priority"])
    app.include_router(heatmap.router, prefix="/heatmap", tags=["heatmap"])
    app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
    app.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
    app.include_router(workflow.router, prefix="/workflow", tags=["workflow"])

    @app.get("/")
    def root() -> dict[str, str]:
        return {
            "service": settings.PROJECT_NAME,
            "version": settings.PROJECT_VERSION,
            "status": "running",
        }

    return app


app = create_app()
