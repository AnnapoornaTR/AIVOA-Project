# AI-Powered Deviation Intake Module for Pharmaceutical API Manufacturing

An enterprise-grade, end-to-end Quality Management System (QMS) Deviation Intake workflow built for pharmaceutical and active pharmaceutical ingredient (API) manufacturers. 

![AIVOA QMS UI](frontend/public/vite.svg)

---

## 1. System Architecture & Workflow

The core design principle of this application is that **the user does NOT manually fill the initial deviation form**. Instead, intake flows seamlessly through the **AI Deviation Assistant**:

```
Deviation Document (PDF / DOCX / TXT / XLSX) OR Pasted Notes
                            ↓
                    FastAPI Endpoint
                            ↓
                 Document Text Extraction
                            ↓
                   LangGraph Workflow
                (Multi-Stage AI Pipeline)
                            ↓
                    Groq LLM Engine
              (llama-3.3-70b-versatile)
                            ↓
               Validated Strict JSON Schema
                            ↓
             Frontend Redux Form Auto-Population
                            ↓
            AI Impact & Severity Recommendation
                            ↓
                   User Review & Edits
          (Field badges: "AI generated" / "User edited")
                            ↓
                     Save Deviation
                            ↓
            PostgreSQL Database (DEV-2026-XXXX)
```

---

## 2. Tech Stack

- **Frontend**: React 18, Redux Toolkit, Tailwind CSS v4, Lucide Icons, Axios, Vite
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0
- **AI & Graph**: LangGraph, Groq API (`llama-3.3-70b-versatile`), LangChain Core
- **Database**: PostgreSQL (with automatic development fallback to SQLite if PostgreSQL service is offline)
- **Document Processing**: `pypdf`, `python-docx`, `openpyxl`, raw text

---

## 3. Project Structure

```
project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Navbar.jsx
│   │   │   └── deviation/
│   │   │       ├── DeviationForm.jsx
│   │   │       ├── AiAssistant.jsx
│   │   │       ├── SuccessModal.jsx
│   │   │       ├── DeviationsListModal.jsx
│   │   │       └── DeviationDetailModal.jsx
│   │   ├── pages/
│   │   │   └── LogDeviationPage.jsx
│   │   ├── store/
│   │   │   ├── index.js
│   │   │   └── deviationSlice.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── endpoints.py
│   │   ├── ai/
│   │   │   ├── __init__.py
│   │   │   ├── deviation_graph.py
│   │   │   └── chat.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── deviation.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── deviation.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── document_parser.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   └── requirements.txt
│
├── .env.example
├── .env
├── docker-compose.yml
└── README.md
```

---

## 4. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your configuration variables:

```env
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# PostgreSQL Database URL
DATABASE_URL=postgresql://postgres:password@localhost:5432/deviation_db
```

> **Note**: If `GROQ_API_KEY` is not provided, the application runs a deterministic pharmaceutical entity extraction engine so you can test all UI and database features offline. When `GROQ_API_KEY` is present, it directly uses Groq LLM through LangGraph!
> **Note on Database**: If PostgreSQL is not active locally on port 5432, the system automatically falls back to SQLite (`deviations.db`) so the application never crashes during local testing.

---

## 5. Starting the Database (PostgreSQL)

You can launch a PostgreSQL container using Docker:

```bash
docker-compose up -d
```

---

## 6. Starting the Backend

1. Navigate to the `backend/` directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the FastAPI development server:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive Swagger documentation is available at:
`http://127.0.0.1:8000/docs`

---

## 7. Starting the Frontend

1. Navigate to the `frontend/` directory:
```bash
cd frontend
```

2. Install packages:
```bash
npm install
```

3. Start the Vite development server:
```bash
npm run dev
```

Open your browser to:
`http://localhost:5173`

---

## 8. API Endpoints

- `GET /api/health` - System health and database engine status
- `POST /api/deviations/analyze` - Multi-part file upload or form-data text analysis via LangGraph
- `POST /api/deviations/analyze-text` - JSON body text analysis
- `POST /api/deviations` - Confirms and saves reviewed deviation to database (generates `DEV-2026-0001`)
- `GET /api/deviations` - Lists all logged deviations
- `GET /api/deviations/{id}` - Retrieves single deviation by ID
- `POST /api/deviations/chat` - Grounded AI chat assistant over the uploaded deviation context

---

## 9. Compliance & GxP Design Highlights

- **Field State Tracking**: Visual badges distinguish AI-generated fields from user-edited fields. User edits are strictly preserved and never overwritten by subsequent extraction.
- **No Hallucination**: Fields not explicitly stated in deviation notes return `null` and are reported in `missing_information`. The UI displays `"Review required — AI could not determine this value."`
- **Regulatory Disclaimers**: AI recommendations are explicitly marked as non-final decisions to uphold GxP regulatory compliance.
