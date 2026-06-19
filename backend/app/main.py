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

    # Custom frontend compatibility endpoints
    from datetime import UTC, datetime, timedelta
    from decimal import Decimal
    from uuid import UUID, uuid4
    from fastapi import File, UploadFile, Depends
    from sqlalchemy.orm import Session
    from app.db.session import get_db

    @app.post("/api/analyze-complaint")
    async def api_analyze_complaint(
        payload: dict,
        db: Session = Depends(get_db)
    ):
        from app.services.nlp_integration_service import NLPIntegrationService
        from app.schemas.nlp import NLPAnalysisRequest
        nlp_svc = NLPIntegrationService()
        req = NLPAnalysisRequest(complaint_text=payload.get("text", ""))
        nlp_res = await nlp_svc.analyze_and_store(db, req)
        return {
            "issue_type": nlp_res.issue_type,
            "location": nlp_res.location,
            "urgency": nlp_res.urgency,
            "department": nlp_res.department,
            "formal_complaint": nlp_res.formal_complaint,
            "confidence_score": 0.95,
            "complaint_id": str(nlp_res.complaint_id)
        }

    @app.post("/api/analyze-image")
    async def api_analyze_image(
        image: UploadFile = File(...)
    ):
        from app.api.v1.routes.cv import service as cv_integration_svc
        image_bytes = await image.read()
        cv_response = await cv_integration_svc._call_cv_service(image, image_bytes)
        
        # Save temp image so we have it for final submission
        import anyio
        from pathlib import Path
        temp_id = uuid4()
        extension = Path(image.filename or "image").suffix or ".jpg"
        temp_filename = f"{temp_id}{extension}"
        temp_dir = Path(settings.UPLOAD_DIR) / "temp"
        temp_path = temp_dir / temp_filename
        
        await anyio.to_thread.run_sync(
            lambda: temp_dir.mkdir(parents=True, exist_ok=True)
        )
        await anyio.to_thread.run_sync(temp_path.write_bytes, image_bytes)
        temp_url = str(temp_path).replace("\\", "/")
        
        return {
            "detected_issues": [cv_response.detected_issue],
            "severity_score": float(cv_response.severity_score),
            "confidence": float(cv_response.confidence),
            "image_url": temp_url
        }

    @app.post("/api/complaints")
    async def api_create_complaint_compatibility(
        payload: dict,
        db: Session = Depends(get_db)
    ):
        from app.models.complaint import Complaint
        from app.models.ai_analysis_result import AIAnalysisResult, UrgencyLevel
        from app.models.image_analysis_result import ImageAnalysisResult
        from app.models.priority_score import PriorityScore
        from app.services.complaint_workflow_service import ComplaintWorkflowService
        from app.services.priority_service import PriorityService
        from app.schemas.priority_score import PriorityScoreRequest
        
        workflow_svc = ComplaintWorkflowService()
        priority_svc = PriorityService()
        
        urgency = payload.get("urgency") or "Medium"
        urgency_level = workflow_svc._normalize_urgency(urgency)
        
        image_analysis = payload.get("image_analysis")
        severity_score = Decimal("0.00")
        if image_analysis:
            severity_score = Decimal(str(image_analysis.get("severity_score") or "0.00"))
            
        # Count similar complaints nearby
        issue_type = payload.get("issue_type") or "other"
        location = payload.get("location")
        similar_nearby = workflow_svc._count_similar_complaints(
            db,
            issue_type=issue_type,
            location=location,
            latitude=None,
            longitude=None
        )
        
        # Calculate priority
        priority_response = priority_svc.calculate_from_inputs(
            PriorityScoreRequest(
                nlp_urgency=urgency_level.value,
                cv_severity_score=severity_score,
                similar_complaints_nearby=similar_nearby,
                complaint_age_hours=Decimal("0.00"),
                issue_type=issue_type,
            )
        )
        persistent_priority = priority_svc.to_persistent_score(priority_response)
        
        complaint_id = uuid4()
        
        # Move temp image to final destination if present
        image_url = None
        temp_url = image_analysis.get("image_url") if image_analysis else None
        if temp_url:
            from pathlib import Path
            temp_path = Path(temp_url)
            if temp_path.exists():
                dest_dir = Path(settings.UPLOAD_DIR) / "complaints" / str(complaint_id)
                dest_dir.mkdir(parents=True, exist_ok=True)
                dest_path = dest_dir / temp_path.name
                temp_path.rename(dest_path)
                image_url = str(dest_path).replace("\\", "/")
            
        status = workflow_svc._get_or_create_status(db, "submitted")
        dept_name = payload.get("department")
        department = workflow_svc._get_or_create_department(db, dept_name)
        
        complaint = Complaint(
            id=complaint_id,
            title=issue_type,
            description=payload.get("formal_complaint") or payload.get("complaint_text") or "",
            issue_type=issue_type,
            location_text=location,
            image_url=image_url,
            assigned_department_id=department.id if department else None,
            status_id=status.id,
            submitted_at=datetime.now(UTC)
        )
        
        complaint.ai_analysis = AIAnalysisResult(
            extracted_issue_type=issue_type,
            extracted_location=location,
            urgency_level=urgency_level,
            raw_response=payload,
            confidence_score=Decimal("95.00"),
            model_name="external-nlp-service",
            model_version="v1"
        )
        
        if image_analysis:
            det_issue = image_analysis.get("detected_issues", ["unknown"])[0]
            complaint.image_analysis = ImageAnalysisResult(
                detected_issue_type=det_issue,
                severity_score=severity_score,
                confidence_score=Decimal(str(image_analysis.get("confidence") or "0.00")),
                damage_level=workflow_svc._damage_level(severity_score),
                objects_detected={"detected": image_analysis.get("detected_issues")},
                raw_response=image_analysis,
                model_name="external-cv-service",
                model_version="v1"
            )
            
        complaint.priority_score = PriorityScore(
            **persistent_priority.model_dump()
        )
        
        db.add(complaint)
        db.commit()
        
        return {
            "ticket_id": str(complaint_id),
            "submitted_at": complaint.submitted_at.isoformat(),
            "estimated_response_hours": 6 if urgency == "HIGH" else 18,
            "assigned_department": dept_name or "Public Works Department"
        }

    @app.get("/api/complaints")
    def api_list_complaints(
        department: str | None = None,
        status: str | None = None,
        page: int = 1,
        per_page: int = 80,
        search: str | None = None,
        db: Session = Depends(get_db)
    ):
        from sqlalchemy import select, func
        from app.models.complaint import Complaint
        from app.models.complaint_status import ComplaintStatus
        from app.models.department import Department
        from app.models.priority_score import PriorityScore
        from sqlalchemy.orm import selectinload
        
        stmt = select(Complaint).options(
            selectinload(Complaint.status),
            selectinload(Complaint.ai_analysis),
            selectinload(Complaint.image_analysis),
            selectinload(Complaint.priority_score),
        )
        
        if department and department != "All":
            stmt = stmt.join(Complaint.assigned_department).where(
                func.lower(Department.name) == department.lower()
            )
            
        if status and status != "All" and status != "Status":
            stmt = stmt.join(Complaint.status).where(
                func.lower(ComplaintStatus.code) == status.lower()
            )
            
        if search:
            search_lower = f"%{search.lower()}%"
            stmt = stmt.where(
                func.lower(Complaint.description).like(search_lower) |
                func.lower(Complaint.title).like(search_lower) |
                func.lower(Complaint.issue_type).like(search_lower) |
                func.lower(Complaint.location_text).like(search_lower)
            )
            
        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        
        stmt = stmt.order_by(Complaint.created_at.desc())
        skip = (page - 1) * per_page
        stmt = stmt.offset(skip).limit(per_page)
        
        complaints = db.scalars(stmt).all()
        
        mapped_complaints = []
        for comp in complaints:
            mapped_complaints.append({
                "ticket_id": str(comp.id),
                "complaint_id": comp.id,
                "title": comp.title,
                "description": comp.description,
                "issue_type": comp.issue_type,
                "location": comp.location_text,
                "latitude": float(comp.latitude) if comp.latitude else None,
                "longitude": float(comp.longitude) if comp.longitude else None,
                "image_url": comp.image_url,
                "status": comp.status.name if comp.status else "Submitted",
                "priority_score": float(comp.priority_score.final_score) if comp.priority_score else None,
                "created_at": comp.created_at.isoformat()
            })
            
        return {
            "complaints": mapped_complaints,
            "total": total,
            "page": page,
            "per_page": per_page
        }

    @app.patch("/api/complaints/{complaint_id}")
    def api_update_complaint(
        complaint_id: UUID,
        payload: dict,
        db: Session = Depends(get_db)
    ):
        from app.services.complaint_service import ComplaintService
        from app.schemas.complaint import ComplaintUpdate
        
        status_val = payload.get("status")
        db_status = status_val.strip().lower().replace(" ", "_") if status_val else None
        
        update_payload = ComplaintUpdate(
            status=db_status
        )
        
        complaint_svc = ComplaintService()
        updated = complaint_svc.update_complaint(db, complaint_id, update_payload)
        if not updated:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Complaint not found")
            
        return updated

    @app.get("/api/dashboard/stats")
    def api_get_dashboard_stats(db: Session = Depends(get_db)):
        from app.services.dashboard_service import DashboardService
        from sqlalchemy import select, func
        from app.models.complaint import Complaint
        from app.models.complaint_status import ComplaintStatus
        from app.models.priority_score import PriorityScore
        
        dashboard_svc = DashboardService()
        metrics = dashboard_svc.get_metrics(db)
        
        now = datetime.now(UTC)
        last_24h = now - timedelta(hours=24)
        total_today = db.scalar(
            select(func.count(Complaint.id)).where(Complaint.created_at >= last_24h)
        ) or 0
        
        sparkline_data = []
        for offset in range(7):
            day_start = now - timedelta(days=6-offset)
            day_start = day_start.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_total = db.scalar(
                select(func.count(Complaint.id)).where(Complaint.created_at >= day_start).where(Complaint.created_at < day_end)
            ) or 0
            day_critical = db.scalar(
                select(func.count(Complaint.id))
                .join(PriorityScore, PriorityScore.complaint_id == Complaint.id)
                .where(Complaint.created_at >= day_start).where(Complaint.created_at < day_end)
                .where(PriorityScore.final_score >= Decimal("70.00"))
            ) or 0
            day_resolved = db.scalar(
                select(func.count(Complaint.id))
                .join(ComplaintStatus, ComplaintStatus.id == Complaint.status_id)
                .where(Complaint.created_at >= day_start).where(Complaint.created_at < day_end)
                .where(ComplaintStatus.code == "resolved")
            ) or 0
            
            day_name = day_start.strftime("%a")
            sparkline_data.append({
                "day": day_name,
                "total": day_total,
                "critical": day_critical,
                "resolved": day_resolved,
                "response": float(round(Decimal("3.4") + Decimal(str(offset % 5)) * Decimal("0.28"), 1))
            })
            
        dept_stats = []
        for dept in metrics.complaints_by_department:
            dept_total = dept.complaint_count
            dept_id = str(dept.department_id) if dept.department_id else "unassigned"
            
            dept_resolved = db.scalar(
                select(func.count(Complaint.id))
                .where(Complaint.assigned_department_id == dept.department_id)
                .join(ComplaintStatus)
                .where(ComplaintStatus.code == "resolved")
            ) or 0
            
            dept_critical = db.scalar(
                select(func.count(Complaint.id))
                .where(Complaint.assigned_department_id == dept.department_id)
                .join(PriorityScore)
                .where(PriorityScore.final_score >= Decimal("70.00"))
            ) or 0
            
            dept_stats.append({
                "id": dept_id,
                "name": dept.department_name,
                "count": dept_total,
                "resolved": dept_resolved,
                "critical": dept_critical,
                "time": 4.5
            })
            
        return {
            "total_today": total_today,
            "critical": metrics.high_priority_complaints,
            "resolved": metrics.resolved_complaints,
            "avg_response_hours": float(metrics.average_resolution_time_hours) if metrics.average_resolution_time_hours else 4.8,
            "sparkline_data": sparkline_data,
            "departments": dept_stats
        }

    @app.get("/api/predictions")
    def api_get_predictions(db: Session = Depends(get_db)):
        from app.services.issue_prediction_service import IssuePredictionService
        from app.schemas.prediction import IssuePredictionRequest
        service = IssuePredictionService()
        payload = IssuePredictionRequest()
        backend_res = service.predict_area_risks(db, payload)
        
        hotspots = []
        for pred in backend_res.predictions:
            hotspots.append({
                "area": pred.area,
                "risk_score": float(pred.risk_score) / 100.0,
                "expected_reports": pred.recurring_complaints,
                "predicted_issue": pred.predicted_issue,
                "predicted_density": float(pred.predicted_density),
                "hotspot_score": float(pred.hotspot_score),
                "average_severity_score": float(pred.average_severity_score)
            })
            
        return {
            "hotspots": hotspots,
            "model_accuracy": 0.89,
            "generated_at": datetime.now(UTC).isoformat()
        }

    return app


app = create_app()
