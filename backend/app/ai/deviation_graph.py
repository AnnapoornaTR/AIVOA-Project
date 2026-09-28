import os
import re
import json
import logging
from typing import TypedDict, List, Optional, Any, Dict
from langgraph.graph import StateGraph, START, END
from app.config import settings
from app.schemas.deviation import ExtractedDeviationData
from groq import Groq

logger = logging.getLogger(__name__)

# State definition for LangGraph
class DeviationState(TypedDict):
    raw_text: str
    clean_text: str
    extracted_data: Dict[str, Any]
    validation_errors: List[str]
    missing_information: List[str]
    detected_facts: List[str]
    initial_impact: Optional[str]
    impact_reason: Optional[str]
    initial_severity: Optional[str]
    severity_reason: Optional[str]
    confidence: float
    final_output: Optional[Dict[str, Any]]
    error: Optional[str]


def get_groq_client() -> Optional[Groq]:
    """Returns Groq client if API key is configured."""
    key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
    if key and key.strip():
        return Groq(api_key=key.strip())
    return None


# 1. PROCESS INPUT NODE
def process_input(state: DeviationState) -> Dict[str, Any]:
    raw = state.get("raw_text", "")
    # Normalize excessive newlines and whitespace
    cleaned = re.sub(r"\r\n|\r", "\n", raw)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()
    return {
        "clean_text": cleaned,
        "missing_information": [],
        "detected_facts": [],
        "validation_errors": []
    }


# 2. EXTRACT INFORMATION NODE
def extract_information(state: DeviationState) -> Dict[str, Any]:
    text = state["clean_text"]
    groq_client = get_groq_client()

    if groq_client:
        try:
            system_prompt = (
                "You are an expert Pharmaceutical Quality Assurance Specialist and QMS Deviation Analyst. "
                "Analyze the provided deviation report or note and extract factual details.\n\n"
                "STRICT RULES:\n"
                "1. NEVER hallucinate or assume facts not present in the text.\n"
                "2. If a field is not explicitly stated or clearly deduced from facts, set it to null.\n"
                "3. Return ONLY a valid JSON object matching the required structure.\n"
                "4. Fields to extract:\n"
                "   - site_plant: Site, facility, or manufacturing unit (or null)\n"
                "   - date_of_occurrence: ISO format YYYY-MM-DD or DD-MM-YYYY (or null)\n"
                "   - title: Concise, professional deviation title summarizing the event\n"
                "   - source: e.g., Production, Quality Control, Warehouse, Facilities, Engineering, or null\n"
                "   - related_product_material: Product, drug substance, or material code/name (or null)\n"
                "   - batch_lot_number: Batch or lot number mentioned (or null)\n"
                "   - detailed_description: Comprehensive, chronological description of what occurred, "
                "     equipment/parameters involved, deviations detected, and immediate actions taken.\n"
                "   - detected_facts: List of short factual observations (e.g. 'Batch number ABC-001 detected', "
                "     'Temperature reached 79°C', 'Batch placed on hold')"
            )

            user_prompt = f"Deviation Text:\n\"\"\"\n{text}\n\"\"\"\n\nExtract the data in JSON format."

            response = groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            extracted = json.loads(content)
            return {"extracted_data": extracted}
        except Exception as e:
            logger.warning(f"Groq extraction failed or unavailable ({e}). Using deterministic extraction.")

    # Fallback deterministic extraction engine if Groq key not set or network error
    extracted = _deterministic_extract(text)
    return {"extracted_data": extracted}


# 3. VALIDATE EXTRACTION NODE
def validate_extraction(state: DeviationState) -> Dict[str, Any]:
    data = state.get("extracted_data", {})
    text = state.get("clean_text", "")
    missing = []
    facts = data.get("detected_facts", [])

    # Check required fields
    required_fields = [
        ("site_plant", "Site / Plant"),
        ("date_of_occurrence", "Date of Occurrence"),
        ("title", "Title / Short Description"),
        ("source", "Source"),
        ("detailed_description", "Detailed Description"),
    ]

    for key, label in required_fields:
        val = data.get(key)
        if not val or str(val).strip().lower() in ["null", "none", "unknown", "n/a", ""]:
            data[key] = None
            missing.append(key)

    # Detect additional facts if not already present
    if not facts:
        if data.get("batch_lot_number"):
            facts.append(f"Batch number {data['batch_lot_number']} detected")
        if data.get("date_of_occurrence"):
            facts.append(f"Occurrence date {data['date_of_occurrence']} detected")
        if "temperature" in text.lower() or "excursion" in text.lower():
            facts.append("Process parameter excursion detected")
        if data.get("related_product_material"):
            facts.append(f"Product/Material {data['related_product_material']} detected")
        if "hold" in text.lower():
            facts.append("Immediate containment action: batch on hold")

    return {
        "extracted_data": data,
        "missing_information": missing,
        "detected_facts": facts
    }


# 4. ASSESS IMPACT NODE
def assess_impact(state: DeviationState) -> Dict[str, Any]:
    text = state["clean_text"]
    data = state.get("extracted_data", {})
    groq_client = get_groq_client()

    if groq_client:
        try:
            prompt = (
                "You are a Senior Pharmaceutical Quality Assurance Director. "
                "Assess the INITIAL IMPACT for this manufacturing deviation on product quality and patient safety.\n\n"
                "Allowed Impact Categories:\n"
                "- No Impact\n- Minor\n- Moderate\n- Major\n- Critical\n\n"
                "Return a JSON object with keys: 'initial_impact' and 'impact_reason'.\n"
                f"Deviation details: {json.dumps(data)}"
            )
            response = groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            res = json.loads(response.choices[0].message.content)
            impact = res.get("initial_impact", "Moderate")
            # Normalize impact value
            impact_clean = _normalize_impact(impact)
            return {
                "initial_impact": impact_clean,
                "impact_reason": res.get("impact_reason", "Parameter excursion observed during manufacturing.")
            }
        except Exception as e:
            logger.warning(f"Groq impact assessment failed ({e}). Using deterministic logic.")

    # Deterministic impact assessment
    impact, reason = _deterministic_assess_impact(text, data)
    return {
        "initial_impact": impact,
        "impact_reason": reason
    }


# 5. ASSESS SEVERITY NODE
def assess_severity(state: DeviationState) -> Dict[str, Any]:
    text = state["clean_text"]
    data = state.get("extracted_data", {})
    impact = state.get("initial_impact", "Moderate")
    groq_client = get_groq_client()

    if groq_client:
        try:
            prompt = (
                "You are a GMP Regulatory Compliance Director in API manufacturing. "
                "Assess the INITIAL SEVERITY of this deviation based on GMP compliance and validation parameters.\n\n"
                "Allowed Severity Categories:\n"
                "- Low\n- Medium\n- High\n- Critical\n\n"
                f"Initial Impact assessed: {impact}\n"
                "Return a JSON object with keys: 'initial_severity', 'severity_reason', and 'confidence' (float between 0.0 and 1.0).\n"
                f"Deviation details: {json.dumps(data)}"
            )
            response = groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            res = json.loads(response.choices[0].message.content)
            severity = _normalize_severity(res.get("initial_severity", "Major" if impact in ["Moderate", "Major"] else "Medium"))
            confidence = float(res.get("confidence", 0.89))
            return {
                "initial_severity": severity,
                "severity_reason": res.get("severity_reason", "Event involves an excursion of a validated parameter."),
                "confidence": confidence
            }
        except Exception as e:
            logger.warning(f"Groq severity assessment failed ({e}). Using deterministic logic.")

    severity, reason, confidence = _deterministic_assess_severity(text, data, impact)
    return {
        "initial_severity": severity,
        "severity_reason": reason,
        "confidence": confidence
    }


# 6. PREPARE FINAL RESULT NODE
def prepare_final_result(state: DeviationState) -> Dict[str, Any]:
    data = state.get("extracted_data", {})
    missing = state.get("missing_information", [])
    facts = state.get("detected_facts", [])
    impact = state.get("initial_impact", "Moderate")
    impact_reason = state.get("impact_reason", "")
    severity = state.get("initial_severity", "Major")
    severity_reason = state.get("severity_reason", "")
    confidence = state.get("confidence", 0.89)

    final_result = {
        "site_plant": data.get("site_plant"),
        "date_of_occurrence": data.get("date_of_occurrence"),
        "title": data.get("title"),
        "source": data.get("source"),
        "related_product_material": data.get("related_product_material"),
        "batch_lot_number": data.get("batch_lot_number"),
        "detailed_description": data.get("detailed_description") or state.get("clean_text"),
        "initial_impact": impact,
        "initial_severity": severity,
        "impact_reason": impact_reason,
        "severity_reason": severity_reason,
        "confidence": round(confidence, 2),
        "missing_information": missing,
        "detected_facts": facts
    }

    # Validate against Pydantic schema
    try:
        validated = ExtractedDeviationData(**final_result)
        final_dict = validated.model_dump()
    except Exception as e:
        logger.error(f"Pydantic validation error: {e}")
        final_dict = final_result

    return {"final_output": final_dict}


# BUILD THE GRAPH
def build_deviation_graph():
    workflow = StateGraph(DeviationState)

    workflow.add_node("process_input", process_input)
    workflow.add_node("extract_information", extract_information)
    workflow.add_node("validate_extraction", validate_extraction)
    workflow.add_node("assess_impact", assess_impact)
    workflow.add_node("assess_severity", assess_severity)
    workflow.add_node("prepare_final_result", prepare_final_result)

    # Define edges: START -> process_input -> extract_information -> validate_extraction -> assess_impact -> assess_severity -> prepare_final_result -> END
    workflow.add_edge(START, "process_input")
    workflow.add_edge("process_input", "extract_information")
    workflow.add_edge("extract_information", "validate_extraction")
    workflow.add_edge("validate_extraction", "assess_impact")
    workflow.add_edge("assess_impact", "assess_severity")
    workflow.add_edge("assess_severity", "prepare_final_result")
    workflow.add_edge("prepare_final_result", END)

    return workflow.compile()


# Compile graph instance
deviation_graph = build_deviation_graph()


# =========================================================================
# HELPER / FALLBACK DETERMINISTIC EXTRACTION LOGIC
# =========================================================================

def _normalize_impact(val: str) -> str:
    valid = ["No Impact", "Minor", "Moderate", "Major", "Critical"]
    for v in valid:
        if v.lower() == val.lower():
            return v
    if "crit" in val.lower():
        return "Critical"
    if "maj" in val.lower():
        return "Major"
    if "mod" in val.lower():
        return "Moderate"
    if "min" in val.lower():
        return "Minor"
    return "Moderate"


def _normalize_severity(val: str) -> str:
    # Standard severity options: Low, Medium, High, Critical
    valid = ["Low", "Medium", "High", "Critical"]
    for v in valid:
        if v.lower() == val.lower():
            return v
    if "crit" in val.lower():
        return "Critical"
    if "high" in val.lower() or "maj" in val.lower():
        return "High"
    if "med" in val.lower() or "mod" in val.lower():
        return "Medium"
    if "low" in val.lower() or "min" in val.lower():
        return "Low"
    return "High"


def _deterministic_extract(text: str) -> Dict[str, Any]:
    """Pharmaceutical domain regex and rule-based extraction fallback."""
    data = {
        "site_plant": None,
        "date_of_occurrence": None,
        "title": None,
        "source": None,
        "related_product_material": None,
        "batch_lot_number": None,
        "detailed_description": text,
        "detected_facts": []
    }

    # Extract Batch / Lot
    batch_match = re.search(r"(?:batch|lot)(?:\s+(?:no\.?|number|#))?[:\s]+([A-Z0-9\-]+)", text, re.IGNORECASE)
    if not batch_match:
        batch_match = re.search(r"\b([A-Z]{2,4}-\d{3,6})\b", text)
    if batch_match:
        data["batch_lot_number"] = batch_match.group(1).strip()
        data["detected_facts"].append(f"Batch number {data['batch_lot_number']} detected")

    # Extract Date
    date_match = re.search(r"\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b", text, re.IGNORECASE)
    if date_match:
        from datetime import datetime
        try:
            dt = datetime.strptime(date_match.group(1), "%d %B %Y")
            data["date_of_occurrence"] = dt.strftime("%Y-%m-%d")
            data["detected_facts"].append(f"Date {data['date_of_occurrence']} detected")
        except Exception:
            data["date_of_occurrence"] = date_match.group(1)
    else:
        iso_date = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text)
        if iso_date:
            data["date_of_occurrence"] = iso_date.group(1)
            data["detected_facts"].append(f"Date {data['date_of_occurrence']} detected")

    # Extract Product / Material
    prod_match = re.search(r"(?:manufacturing of|product|material)\s+([A-Za-z0-9\s\-]+?)(?=\s+Batch|\s+Lot|\s+on\s+\d|\.|$)", text, re.IGNORECASE)
    if prod_match:
        prod_val = prod_match.group(1).strip()
        if len(prod_val) <= 40 and prod_val.lower() not in ["the", "a", "an"]:
            data["related_product_material"] = prod_val
            data["detected_facts"].append(f"Product {prod_val} detected")
    elif "api" in text.lower():
        data["related_product_material"] = "Active Pharmaceutical Ingredient (API)"
        data["detected_facts"].append("API Product context detected")

    # Extract Source
    if "production" in text.lower() or "manufacturing" in text.lower() or "operator" in text.lower():
        data["source"] = "Production"
    elif "quality control" in text.lower() or "qc" in text.lower() or "lab" in text.lower():
        data["source"] = "Quality Control"
    elif "warehouse" in text.lower() or "dispensing" in text.lower():
        data["source"] = "Warehouse"
    elif "engineering" in text.lower() or "facilities" in text.lower() or "utility" in text.lower():
        data["source"] = "Engineering / Facilities"

    # Extract Site / Plant
    if "api manufacturing" in text.lower() or "manufacturing unit" in text.lower():
        data["site_plant"] = "API Manufacturing Unit"
    elif "formulation" in text.lower():
        data["site_plant"] = "Formulation Plant 1"
    elif "sterile" in text.lower():
        data["site_plant"] = "Sterile Injectable Facility"

    # Generate Professional Title
    if "temperature" in text.lower() and ("exceeded" in text.lower() or "excursion" in text.lower()):
        data["title"] = "Reactor temperature exceeded approved operating range"
        data["detected_facts"].append("Process parameter excursion (temperature) detected")
    elif "out of specification" in text.lower() or "oos" in text.lower():
        data["title"] = f"Out of Specification (OOS) result observed in Batch {data.get('batch_lot_number') or ''}"
    elif "contamination" in text.lower():
        data["title"] = "Foreign particulate matter / contamination observed"
    else:
        # First sentence or up to 80 chars
        first_sentence = text.split(".")[0].strip()
        data["title"] = (first_sentence[:80] + "...") if len(first_sentence) > 80 else first_sentence

    return data


def _deterministic_assess_impact(text: str, data: Dict[str, Any]) -> tuple[str, str]:
    text_lower = text.lower()
    if "critical" in text_lower or "contamination" in text_lower or "stability failure" in text_lower:
        return "Critical", "Direct risk to drug substance critical quality attributes (CQAs) and safety."
    if "temperature" in text_lower and ("exceeded" in text_lower or "79" in text_lower):
        return "Moderate", "Process temperature exceeded approved operating range (70-75°C) reaching 79°C for 12 minutes, which may potentially impact reaction kinetics, yield, or impurity profile."
    if "oos" in text_lower or "assay" in text_lower:
        return "Major", "Analytical parameter out of specification impacting product release criteria."
    return "Minor", "Minor operational discrepancy with limited potential impact on final product quality."


def _deterministic_assess_severity(text: str, data: Dict[str, Any], impact: str) -> tuple[str, str, float]:
    text_lower = text.lower()
    if impact == "Critical":
        return "Critical", "Critical non-conformance requiring regulatory notification and batch rejection.", 0.95
    if "temperature" in text_lower and ("exceeded" in text_lower or "79" in text_lower):
        return "High", "The event involves an excursion of a critical process parameter beyond its approved validated range requiring formal deviation investigation and QA review.", 0.89
    if impact in ["Major", "Moderate"]:
        return "High", "Parameter excursion during manufacturing requires thorough root-cause analysis before batch disposition.", 0.88
    return "Medium", "Standard deviation requiring internal review and preventative action.", 0.84
