import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file from project root or backend root
load_dotenv()
load_dotenv("../.env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Deviation Intake Module"
    API_V1_STR: str = "/api"
    
    # AI & Groq Configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/deviation_db")
    FALLBACK_SQLITE_URL: str = "sqlite:///./deviations.db"
    
    # File upload limits
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
    
    class Config:
        case_sensitive = True

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
