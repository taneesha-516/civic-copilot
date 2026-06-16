from fastapi import APIRouter

from app.api.v1.routes import (
    complaints,
    cv,
    dashboard,
    departments,
    heatmap,
    health,
    nlp,
    predictions,
    priority,
    statuses,
    users,
    workflow,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["complaints"])
api_router.include_router(nlp.router, prefix="/nlp", tags=["nlp"])
api_router.include_router(cv.router, prefix="/cv", tags=["cv"])
api_router.include_router(priority.router, prefix="/priority", tags=["priority"])
api_router.include_router(heatmap.router, prefix="/heatmap", tags=["heatmap"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
api_router.include_router(workflow.router, prefix="/workflow", tags=["workflow"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(statuses.router, prefix="/statuses", tags=["statuses"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
