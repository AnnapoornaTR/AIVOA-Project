from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field

# Extraction schema used by LangGraph / Groq
class ExtractedDeviationData(BaseModel):
    site_plant: Optional[str] = Field(None, description="Site or plant where deviation occurred, or null if unknown")
    date_of_occurrence: Optional[str] = Field(None, description="Date of occurrence (YYYY-MM-DD or DD-MM-YYYY), or null if unknown")
    title: Optional[str] = Field(None, description="Short summary title of the deviation, or null if unknown")
    source: Optional[str] = Field(None, description="Deviation source (e.g. Production, Quality Control, Warehouse, Facilities), or null if unknown")
    related_product_material: Optional[str] = Field(None, description="Name or code of the related product or raw material, or null if unknown")
    batch_lot_number: Optional[str] = Field(None, description="Batch or lot number, or null if unknown")
    detailed_description: Optional[str] = Field(None, description="Detailed chronological description of the event, or null if unknown")
    initial_impact: Optional[str] = Field(None, description="Recommended impact: No Impact, Minor, Moderate, Major, or Critical")
    initial_severity: Optional[str] = Field(None, description="Recommended severity: Low, Medium, High, or Critical")
    impact_reason: Optional[str] = Field(None, description="Scientific rationale for the recommended impact")
    severity_reason: Optional[str] = Field(None, description="Regulatory and GMP rationale for the recommended severity")
    confidence: float = Field(default=0.85, description="Confidence score between 0.0 and 1.0")
    missing_information: List[str] = Field(default_factory=list, description="List of required fields that could not be determined")
    detected_facts: List[str] = Field(default_factory=list, description="Key facts detected from document")

# Request for analyzing raw text
class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Pasted deviation text or notes")

# Save deviation request (validated form from UI)
class DeviationCreate(BaseModel):
    site_plant: str
    date_of_occurrence: str
    title: str
    source: str
    related_product_material: Optional[str] = None
    batch_lot_number: Optional[str] = None
    detailed_description: str
    initial_impact: str
    initial_severity: str
    impact_reason: Optional[str] = None
    severity_reason: Optional[str] = None
    ai_confidence: Optional[float] = None
    status: Optional[str] = "Draft"
    created_by: Optional[str] = "Quality Operator"

# Response model for deviations
class DeviationResponse(BaseModel):
    id: int
    deviation_id: str
    site_plant: str
    date_of_occurrence: str
    title: str
    source: str
    related_product_material: Optional[str] = None
    batch_lot_number: Optional[str] = None
    detailed_description: str
    initial_impact: str
    initial_severity: str
    impact_reason: Optional[str] = None
    severity_reason: Optional[str] = None
    ai_confidence: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: str

    class Config:
        from_attributes = True

# Chat assistance request & response
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    question: str
    document_text: Optional[str] = ""
    extracted_data: Optional[dict] = None
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    answer: str
    grounded: bool = True
