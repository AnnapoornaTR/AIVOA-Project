import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)

# Test database connection and handle fallback
engine = None
db_url = settings.DATABASE_URL

try:
    if db_url.startswith("postgresql"):
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        # Test connection with a short timeout
        test_engine = create_engine(db_url, connect_args={"connect_timeout": 3})
        with test_engine.connect() as conn:
            logger.info("Successfully connected to PostgreSQL database.")
        engine = test_engine
    else:
        engine = create_engine(db_url)
except Exception as e:
    logger.warning(
        f"PostgreSQL connection to {db_url} failed ({e}). Falling back to SQLite for local persistence."
    )
    engine = create_engine(
        settings.FALLBACK_SQLITE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
