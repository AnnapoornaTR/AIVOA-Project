import os
import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db, Base, engine
from app.models.deviation import Deviation
from app.schemas.deviation import (
    ExtractedDeviationData,
    AnalyzeTextRequest,
    DeviationCreate,
    DeviationResponse,
    ChatRequest,
    ChatResponse,
)
from app.services.document_parser import extract_text_from_file
from app.ai.deviation_graph import deviation_graph
from app.ai.chat import answer_deviation_question

router = APIRouter()

# Auto-create tables on import or initialization
Base.metadata.create_all(bind=engine)


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI-Powered Deviation Intake Module",
        "timestamp": datetime.utcnow().isoformat(),
        "database": engine.name
    }


@router.post("/deviations/analyze")
async def analyze_deviation(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    """
    Analyzes uploaded document (PDF, DOCX, TXT, XLSX) or pasted text.
    Executes LangGraph workflow -> Groq -> returns strictly validated JSON.
    """
    raw_content = ""
    source_filename = None

    if file and file.filename:
        # File upload route
        raw_content, source_filename = await extract_text_from_file(file)
    elif text and text.strip():
        # Pasted text route
        raw_content = text.strip()
    else:
        raise HTTPException(
            status_code=400,
            detail="Please provide a document file or paste deviation text."
        )

    if len(raw_content.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="The provided deviation text is too short to analyze. Please provide detailed notes."
        )

    try:
        # Execute LangGraph workflow
        initial_state = {
            "raw_text": raw_content,
            "clean_text": "",
            "extracted_data": {},
            "validation_errors": [],
            "missing_information": [],
            "detected_facts": [],
            "initial_impact": None,
            "impact_reason": None,
            "initial_severity": None,
            "severity_reason": None,
            "confidence": 0.85,
            "final_output": None,
            "error": None
        }

        graph_result = deviation_graph.invoke(initial_state)
        final_output = graph_result.get("final_output")

        if not final_output:
            raise HTTPException(
                status_code=500,
                detail="AI analysis workflow could not generate a result. Please retry."
            )

        # Include original text for contextual AI chat
        final_output["source_text"] = raw_content
        final_output["source_file"] = source_filename

        return final_output

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis could not be completed: {str(e)}. Your input has not been lost."
        )


@router.post("/deviations/analyze-text")
async def analyze_deviation_json(payload: AnalyzeTextRequest):
    """
    JSON endpoint for pasted deviation text analysis.
    """
    return await analyze_deviation(file=None, text=payload.text)


@router.post("/deviations", response_model=DeviationResponse, status_code=status.HTTP_201_CREATED)
def create_deviation(deviation_in: DeviationCreate, db: Session = Depends(get_db)):
    """
    Stores reviewed and confirmed deviation into PostgreSQL database.
    Generates sequential ID like DEV-2026-0001.
    """
    current_year = datetime.utcnow().year
    prefix = f"DEV-{current_year}-"

    # Query last deviation ID for the current year
    last_dev = (
        db.query(Deviation)
        .filter(Deviation.deviation_id.like(f"{prefix}%"))
        .order_by(Deviation.id.desc())
        .first()
    )

    if last_dev and last_dev.deviation_id:
        try:
            last_num = int(last_dev.deviation_id.split("-")[-1])
            new_num = last_num + 1
        except Exception:
            new_num = 1
    else:
        new_num = 1

    generated_id = f"{prefix}{new_num:04d}"

    db_deviation = Deviation(
        deviation_id=generated_id,
        site_plant=deviation_in.site_plant,
        date_of_occurrence=deviation_in.date_of_occurrence,
        title=deviation_in.title,
        source=deviation_in.source,
        related_product_material=deviation_in.related_product_material,
        batch_lot_number=deviation_in.batch_lot_number,
        detailed_description=deviation_in.detailed_description,
        initial_impact=deviation_in.initial_impact,
        initial_severity=deviation_in.initial_severity,
        impact_reason=deviation_in.impact_reason,
        severity_reason=deviation_in.severity_reason,
        ai_confidence=deviation_in.ai_confidence,
        status=deviation_in.status or "Draft",
        created_by=deviation_in.created_by or "Quality Operator"
    )

    try:
        db.add(db_deviation)
        db.commit()
        db.refresh(db_deviation)
        return db_deviation
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save deviation record to database: {str(e)}"
        )


@router.get("/deviations", response_model=List[DeviationResponse])
def list_deviations(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Retrieves list of deviations.
    """
    deviations = db.query(Deviation).order_by(Deviation.created_at.desc()).offset(skip).limit(limit).all()
    return deviations


@router.get("/deviations/{dev_id}", response_model=DeviationResponse)
def get_deviation(dev_id: str, db: Session = Depends(get_db)):
    """
    Retrieves deviation by integer ID or deviation_id (e.g. DEV-2026-0001).
    """
    if dev_id.isdigit():
        dev = db.query(Deviation).filter(Deviation.id == int(dev_id)).first()
    else:
        dev = db.query(Deviation).filter(Deviation.deviation_id == dev_id).first()

    if not dev:
        raise HTTPException(status_code=404, detail=f"Deviation '{dev_id}' not found.")
    return dev


@router.post("/deviations/chat", response_model=ChatResponse)
async def chat_deviation(req: ChatRequest):
    """
    Grounded Q&A over the currently analyzed deviation context.
    """
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    answer = await answer_deviation_question(
        question=req.question.strip(),
        document_text=req.document_text,
        extracted_data=req.extracted_data,
        history=[msg.model_dump() for msg in (req.history or [])]
    )
    return ChatResponse(answer=answer, grounded=True)
