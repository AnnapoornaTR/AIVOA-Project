import os
import io
import logging
from typing import Tuple
from fastapi import UploadFile, HTTPException

logger = logging.getLogger(__name__)

async def extract_text_from_file(file: UploadFile) -> Tuple[str, str]:
    """
    Extracts plain text from various file formats: PDF, DOCX, TXT, XLSX/XLS.
    Returns (extracted_text, filename).
    """
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()
    content = await file.read()

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    extracted_text = ""

    try:
        if ext == ".txt":
            try:
                extracted_text = content.decode("utf-8")
            except UnicodeDecodeError:
                extracted_text = content.decode("latin-1", errors="replace")

        elif ext == ".pdf":
            import pypdf
            pdf_file = io.BytesIO(content)
            reader = pypdf.PdfReader(pdf_file)
            pages_text = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    pages_text.append(f"--- Page {i+1} ---\n{text}")
            extracted_text = "\n\n".join(pages_text)
            if not extracted_text.strip():
                raise HTTPException(
                    status_code=400,
                    detail="No extractable text was found in the PDF. It may be a scanned image without a text layer."
                )

        elif ext in [".docx", ".doc"]:
            if ext == ".doc":
                raise HTTPException(
                    status_code=400,
                    detail="Legacy .doc format is not directly supported. Please save or convert the document as .docx or .pdf."
                )
            import docx
            doc_file = io.BytesIO(content)
            doc = docx.Document(doc_file)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    row_data = [cell.text.strip() for cell in row.cells]
                    paragraphs.append(" | ".join(row_data))
            extracted_text = "\n\n".join(paragraphs)

        elif ext in [".xlsx", ".xls"]:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            sheet_texts = []
            for sheetname in wb.sheetnames:
                sheet = wb[sheetname]
                rows_text = []
                for row in sheet.iter_rows(values_only=True):
                    row_vals = [str(v).strip() for v in row if v is not None and str(v).strip()]
                    if row_vals:
                        rows_text.append(" | ".join(row_vals))
                if rows_text:
                    sheet_texts.append(f"Sheet: {sheetname}\n" + "\n".join(rows_text))
            extracted_text = "\n\n".join(sheet_texts)

        elif ext in [".png", ".jpg", ".jpeg"]:
            # Honest OCR check
            raise HTTPException(
                status_code=400,
                detail="Scanned image OCR engine is not configured in this environment. Please upload PDF, DOCX, TXT, or XLSX, or paste the deviation text into the text area."
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Supported formats: PDF, DOCX, TXT, XLSX."
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing file {filename}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read file '{filename}': {str(e)}"
        )

    if not extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail=f"No readable content could be extracted from '{filename}'."
        )

    return extracted_text.strip(), filename
