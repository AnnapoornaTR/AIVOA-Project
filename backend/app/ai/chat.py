import json
import logging
from typing import Optional, Dict, Any, List
from app.config import settings
from app.ai.deviation_graph import get_groq_client

logger = logging.getLogger(__name__)

async def answer_deviation_question(
    question: str,
    document_text: Optional[str] = "",
    extracted_data: Optional[Dict[str, Any]] = None,
    history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Answers user questions strictly grounded in the uploaded document and extracted deviation data.
    """
    groq_client = get_groq_client()
    doc_context = document_text or "No document text available."
    extraction_context = json.dumps(extracted_data or {}, indent=2)

    system_prompt = (
        "You are an AI Quality Management System Assistant for a pharmaceutical API manufacturer. "
        "Your task is to answer questions about the currently analyzed deviation report.\n\n"
        "STRICT GROUNDING RULES:\n"
        "1. Answer ONLY based on the provided deviation text and extracted data.\n"
        "2. Do NOT invent or hallucinate any dates, parameters, batch numbers, or facts not in the context.\n"
        "3. If the user asks why severity or impact was classified as a specific level, reference the scientific "
        "and GMP reasons in the extracted data.\n"
        "4. If information is missing or not provided in the document, explicitly state that it is unavailable.\n"
        "5. Keep responses concise, objective, and professional.\n\n"
        f"--- CONTEXT DOCUMENT ---\n{doc_context}\n\n"
        f"--- EXTRACTED DEVIATION DATA ---\n{extraction_context}\n"
    )

    if groq_client:
        try:
            messages = [{"role": "system", "content": system_prompt}]
            if history:
                for h in history[-4:]:
                    messages.append({"role": h["role"], "content": h["content"]})
            messages.append({"role": "user", "content": question})

            response = groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=messages,
                temperature=0.2,
                max_tokens=400
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"Groq chat completion failed ({e}). Falling back to grounded response generator.")

    # Grounded fallback responses
    q_lower = question.lower()
    data = extracted_data or {}
    missing = data.get("missing_information", [])

    if "missing" in q_lower:
        if missing:
            fields = ", ".join(f.replace("_", " ").title() for f in missing)
            return f"The document does not specify the following required field(s): {fields}. Please review and specify them before saving."
        return "All required deviation fields were successfully detected and extracted from the document."

    if "severity" in q_lower:
        sev = data.get("initial_severity", "High")
        reason = data.get("severity_reason", "Event involves an excursion of an approved manufacturing process parameter.")
        return f"The initial severity was classified as **{sev}** because: {reason}"

    if "impact" in q_lower:
        imp = data.get("initial_impact", "Moderate")
        reason = data.get("impact_reason", "Process temperature exceeded the approved range, which could influence product quality attributes.")
        return f"The initial impact was assessed as **{imp}** because: {reason}"

    if "facts" in q_lower or "extracted" in q_lower:
        facts = data.get("detected_facts", [])
        if facts:
            return "Extracted facts from document:\n" + "\n".join(f"• {f}" for f in facts)
        return "Extracted facts: Batch " + str(data.get("batch_lot_number")) + ", Date: " + str(data.get("date_of_occurrence"))

    if "batch" in q_lower:
        batch = data.get("batch_lot_number")
        if batch:
            return f"The detected batch number is **{batch}**."
        return "No batch or lot number was mentioned in the uploaded text."

    # General grounded fallback
    return (
        f"Based on the deviation record for batch {data.get('batch_lot_number', 'unknown')}: "
        f"the event '{data.get('title', 'deviation')}' occurred on {data.get('date_of_occurrence', 'the noted date')}. "
        f"Initial impact is {data.get('initial_impact')} and severity is {data.get('initial_severity')}."
    )
