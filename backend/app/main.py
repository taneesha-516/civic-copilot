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

    placeholder_values = {"", "string", "null", "undefined", "none", "n/a", "other", "unknown"}

    def clean_text(value) -> str | None:
        if value is None:
            return None
        cleaned = str(value).strip()
        if cleaned.lower() in placeholder_values:
            return None
        return cleaned

    def decimal_or_none(value) -> Decimal | None:
        if value is None or value == "":
            return None
        try:
            return Decimal(str(value))
        except Exception:
            return None

    def float_or_none(value):
        return float(value) if value is not None else None

    def detected_issue_from_image(image_analysis: dict | None) -> str | None:
        if not image_analysis:
            return None
        detected = image_analysis.get("detected_issue") or image_analysis.get("detected_issue_type")
        if not detected:
            detected_issues = image_analysis.get("detected_issues")
            if isinstance(detected_issues, list) and detected_issues:
                detected = detected_issues[0]
        return clean_text(detected)

    def confidence_from_payload(payload: dict | None) -> Decimal | None:
        if not payload:
            return None
        return decimal_or_none(payload.get("confidence") or payload.get("confidence_score"))

    def infer_location_from_text(value) -> str | None:
        import re

        text = clean_text(value)
        if not text:
            return None

        summary_match = re.search(
            r"Issue Summary:\s*(.+?)(?:\n\s*\n|Impact on Citizens:|Urgency Level:|$)",
            text,
            flags=re.IGNORECASE | re.DOTALL,
        )
        search_text = summary_match.group(1).strip() if summary_match else text
        normalized = re.sub(r"\s+", " ", search_text).strip()
        lowered = normalized.lower()

        landmarks = [
            ("rajiv chowk metro", "Rajiv Chowk Metro Station"),
            ("rajiv chowk gate 4", "Rajiv Chowk Gate 4"),
            ("rajiv chowk", "Rajiv Chowk, New Delhi"),
            ("india gate", "India Gate, New Delhi"),
            ("bangla sahib", "Bangla Sahib Road, New Delhi"),
            ("central park", "Central Park, New Delhi"),
        ]
        for needle, label in landmarks:
            if needle in lowered:
                return label

        pattern = re.search(
            r"\b(?:near|at|beside|around|opposite)\s+(.+?)(?:\s+(?:causing|with|and|is|has|ke pass|near)|[.,;]|$)",
            normalized,
            flags=re.IGNORECASE,
        )
        if pattern:
            candidate = clean_text(pattern.group(1))
            if candidate:
                return candidate[:80].strip()

        return None

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
        resolved_location = clean_text(nlp_res.location) or clean_text(payload.get("location"))
        return {
            "issue_type": nlp_res.issue_type,
            "location": resolved_location,
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
        issue_type = (
            clean_text(payload.get("issue_type"))
            or detected_issue_from_image(image_analysis)
            or "Civic Issue"
        )
        location = clean_text(payload.get("location") or payload.get("location_text"))
        latitude = Decimal(str(payload["latitude"])) if payload.get("latitude") is not None else None
        longitude = Decimal(str(payload["longitude"])) if payload.get("longitude") is not None else None

        similar_nearby = workflow_svc._count_similar_complaints(
            db,
            issue_type=issue_type,
            location=location,
            latitude=latitude,
            longitude=longitude
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
        
        complaint_id = UUID(str(payload["complaint_id"])) if payload.get("complaint_id") else uuid4()
        
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
        
        complaint = db.get(Complaint, complaint_id)
        if complaint is None:
            complaint = Complaint(
                id=complaint_id,
                submitted_at=datetime.now(UTC)
            )

        complaint.title = issue_type
        complaint.description = payload.get("formal_complaint") or payload.get("complaint_text") or ""
        complaint.issue_type = issue_type
        complaint.location_text = location
        complaint.latitude = latitude
        complaint.longitude = longitude
        complaint.image_url = image_url or complaint.image_url
        complaint.assigned_department_id = department.id if department else None
        complaint.status_id = status.id
        
        if complaint.ai_analysis is None:
            complaint.ai_analysis = AIAnalysisResult()

        complaint.ai_analysis.extracted_issue_type = issue_type
        complaint.ai_analysis.extracted_location = location
        complaint.ai_analysis.urgency_level = urgency_level
        complaint.ai_analysis.raw_response = payload
        complaint.ai_analysis.confidence_score = decimal_or_none(payload.get("confidence_score")) or Decimal("0.95")
        complaint.ai_analysis.model_name = "external-nlp-service"
        complaint.ai_analysis.model_version = "v1"
        
        if image_analysis:
            det_issue = detected_issue_from_image(image_analysis) or "Civic Issue"
            detected_issues = image_analysis.get("detected_issues")
            if not isinstance(detected_issues, list) or not detected_issues:
                detected_issues = [det_issue]
            if complaint.image_analysis is None:
                complaint.image_analysis = ImageAnalysisResult()
            complaint.image_analysis.detected_issue_type = det_issue
            complaint.image_analysis.severity_score = severity_score
            complaint.image_analysis.confidence_score = confidence_from_payload(image_analysis) or Decimal("0.00")
            complaint.image_analysis.damage_level = workflow_svc._damage_level(severity_score)
            complaint.image_analysis.objects_detected = {"detected": detected_issues}
            complaint.image_analysis.raw_response = image_analysis
            complaint.image_analysis.model_name = "external-cv-service"
            complaint.image_analysis.model_version = "v1"
            
        if complaint.priority_score is None:
            complaint.priority_score = PriorityScore(
                **persistent_priority.model_dump()
            )
        else:
            for field, value in persistent_priority.model_dump().items():
                setattr(complaint.priority_score, field, value)
        
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
        from sqlalchemy import select, func, cast, String, or_
        from app.models.complaint import Complaint
        from app.models.complaint_status import ComplaintStatus
        from app.models.department import Department
        from app.models.priority_score import PriorityScore
        from sqlalchemy.orm import selectinload
        
        stmt = select(Complaint).outerjoin(
            Department, Department.id == Complaint.assigned_department_id
        ).outerjoin(
            ComplaintStatus, ComplaintStatus.id == Complaint.status_id
        ).options(
            selectinload(Complaint.status),
            selectinload(Complaint.assigned_department),
            selectinload(Complaint.ai_analysis),
            selectinload(Complaint.image_analysis),
            selectinload(Complaint.priority_score),
        )
        
        if department and department != "All":
            department_lower = department.lower()
            department_aliases = {
                "pwd": ["pwd", "public works department", "public_works_department"],
                "municipal": ["municipal", "municipal sanitation department", "municipal_sanitation_department", "municipal corporation", "municipal_corporation"],
                "water dept": ["water dept", "water_dept", "delhi jal board", "delhi_jal_board"],
                "utility dept": ["utility dept", "utility_dept", "electricity department", "electricity_department"],
                "electricity dept": ["electricity dept", "electricity_dept", "electricity department", "electricity_department"],
            }
            department_matches = department_aliases.get(department_lower, [department_lower])
            stmt = stmt.where(
                or_(
                    func.lower(Department.name).in_(department_matches),
                    func.lower(Department.code).in_(department_matches),
                )
            )
            
        if status and status != "All" and status != "Status":
            stmt = stmt.where(
                func.lower(ComplaintStatus.code) == status.lower()
            )
            
        if search:
            search_lower = search.lower().strip()
            search_like = f"%{search_lower}%"
            search_code = search_lower.replace(" ", "_").replace("-", "_")
            search_code_like = f"%{search_code}%"
            
            conditions = [
                func.lower(Complaint.description).like(search_like),
                func.lower(Complaint.title).like(search_like),
                func.lower(Complaint.issue_type).like(search_like),
                func.lower(Complaint.location_text).like(search_like),
                cast(Complaint.id, String).like(search_like),
                func.lower(Department.name).like(search_like),
                func.lower(Department.code).like(search_code_like),
                func.lower(ComplaintStatus.name).like(search_like),
                func.lower(ComplaintStatus.code).like(search_code_like),
            ]
            
            # Map "works", "public", "pwd" to PWD
            if any(x in search_lower for x in ["works", "public", "pwd"]):
                conditions.append(func.lower(Department.code) == "pwd")
                conditions.append(func.lower(Department.name) == "pwd")
            
            # Map "sanitation", "garbage", "mcd", "municipal" to Municipal Corporation
            if any(x in search_lower for x in ["sanitation", "garbage", "mcd", "municipal"]):
                conditions.append(func.lower(Department.code) == "municipal_corporation")
                conditions.append(func.lower(Department.name) == "municipal corporation")

            # Map public-facing department labels to their stored civic department names/codes
            if any(x in search_lower for x in ["water", "jal", "water dept"]):
                conditions.append(func.lower(Department.code).in_(["water_dept", "delhi_jal_board"]))
                conditions.append(func.lower(Department.name).like("%jal%"))

            if any(x in search_lower for x in ["utility", "electric", "electricity"]):
                conditions.append(func.lower(Department.code).in_(["utility_dept", "electricity_department"]))
                conditions.append(func.lower(Department.name).like("%electric%"))
                
            # Map "pending", "open", "active" to processing/submitted/assigned/in_progress
            if any(x in search_lower for x in ["pending", "open", "active"]):
                conditions.append(func.lower(ComplaintStatus.code).in_(["submitted", "processing", "assigned", "in_progress"]))
                conditions.append(func.lower(ComplaintStatus.name).in_(["submitted", "processing", "assigned", "in_progress"]))

            if "progress" in search_lower:
                conditions.append(func.lower(ComplaintStatus.code) == "in_progress")
            
            stmt = stmt.where(or_(*conditions))
            
        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        
        stmt = stmt.order_by(Complaint.created_at.desc())
        skip = (page - 1) * per_page
        stmt = stmt.offset(skip).limit(per_page)
        
        complaints = db.scalars(stmt).all()
        
        mapped_complaints = []
        for comp in complaints:
            ai_analysis = comp.ai_analysis
            image_analysis = comp.image_analysis
            priority_score = comp.priority_score
            ai_issue_type = clean_text(ai_analysis.extracted_issue_type if ai_analysis else None)
            ai_location = clean_text(ai_analysis.extracted_location if ai_analysis else None)
            image_issue_type = clean_text(image_analysis.detected_issue_type if image_analysis else None)
            issue_type = clean_text(comp.issue_type) or ai_issue_type or image_issue_type
            location = clean_text(comp.location_text) or ai_location or infer_location_from_text(comp.description)
            mapped_complaints.append({
                "ticket_id": str(comp.id),
                "complaint_id": comp.id,
                "title": clean_text(comp.title) or issue_type or "Civic Issue",
                "description": comp.description,
                "issue_type": issue_type,
                "location": location,
                "latitude": float(comp.latitude) if comp.latitude else None,
                "longitude": float(comp.longitude) if comp.longitude else None,
                "image_url": comp.image_url,
                "status": comp.status.name if comp.status else "Submitted",
                "priority_score": float(priority_score.final_score) if priority_score else None,
                "priority_level": priority_score.priority_level.value if priority_score else None,
                "severity_score": float_or_none(image_analysis.severity_score if image_analysis else None),
                "detected_issue": image_issue_type,
                "created_at": comp.created_at.isoformat(),
                "department": comp.assigned_department.name if comp.assigned_department else None,
                "ai_analysis": {
                    "issue_type": ai_issue_type,
                    "extracted_issue_type": ai_issue_type,
                    "location": ai_location,
                    "extracted_location": ai_location,
                    "urgency": ai_analysis.urgency_level.value if ai_analysis and ai_analysis.urgency_level else None,
                    "confidence_score": float_or_none(ai_analysis.confidence_score if ai_analysis else None),
                } if ai_analysis else None,
                "image_analysis": {
                    "detected_issue": image_issue_type,
                    "detected_issue_type": image_issue_type,
                    "severity_score": float_or_none(image_analysis.severity_score if image_analysis else None),
                    "confidence": float_or_none(image_analysis.confidence_score if image_analysis else None),
                    "confidence_score": float_or_none(image_analysis.confidence_score if image_analysis else None),
                    "damage_level": image_analysis.damage_level.value if image_analysis and image_analysis.damage_level else None,
                } if image_analysis else None,
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
        if db_status == "resolved":
            from app.models.complaint import Complaint
            complaint = db.get(Complaint, complaint_id)
            if complaint and complaint.resolved_at is None:
                complaint.resolved_at = datetime.now(UTC)
                db.add(complaint)
                db.commit()
            
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
            day_response = db.scalar(
                select(
                    func.avg(
                        func.extract(
                            "epoch",
                            Complaint.resolved_at - Complaint.created_at,
                        )
                    ) / 3600
                )
                .join(ComplaintStatus, ComplaintStatus.id == Complaint.status_id)
                .where(Complaint.resolved_at >= day_start)
                .where(Complaint.resolved_at < day_end)
                .where(ComplaintStatus.code == "resolved")
                .where(Complaint.resolved_at.is_not(None))
            )
            
            day_name = day_start.strftime("%a")
            sparkline_data.append({
                "day": day_name,
                "total": day_total,
                "critical": day_critical,
                "resolved": day_resolved,
                "response": float(round(Decimal(str(day_response)), 1)) if day_response is not None else None,
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
            dept_avg_response = db.scalar(
                select(
                    func.avg(
                        func.extract(
                            "epoch",
                            Complaint.resolved_at - Complaint.created_at,
                        )
                    ) / 3600
                )
                .where(Complaint.assigned_department_id == dept.department_id)
                .join(ComplaintStatus, ComplaintStatus.id == Complaint.status_id)
                .where(ComplaintStatus.code == "resolved")
                .where(Complaint.resolved_at.is_not(None))
            )
            
            dept_stats.append({
                "id": dept_id,
                "name": dept.department_name,
                "count": dept_total,
                "resolved": dept_resolved,
                "critical": dept_critical,
                "time": float(round(Decimal(str(dept_avg_response)), 1)) if dept_avg_response is not None else None,
            })
            
        return {
            "total_today": total_today,
            "critical": metrics.high_priority_complaints,
            "resolved": metrics.resolved_complaints,
            "avg_response_hours": float(metrics.average_resolution_time_hours) if metrics.average_resolution_time_hours else None,
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
