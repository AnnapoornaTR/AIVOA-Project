from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from app.database import Base

class Deviation(Base):
    __tablename__ = "deviations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    deviation_id = Column(String(50), unique=True, index=True, nullable=False)
    site_plant = Column(String(255), nullable=False)
    date_of_occurrence = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    source = Column(String(100), nullable=False)
    related_product_material = Column(String(255), nullable=True)
    batch_lot_number = Column(String(100), nullable=True)
    detailed_description = Column(Text, nullable=False)
    initial_impact = Column(String(50), nullable=False)
    initial_severity = Column(String(50), nullable=False)
    impact_reason = Column(Text, nullable=True)
    severity_reason = Column(Text, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    status = Column(String(50), default="Draft", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(String(100), default="Quality Operator", nullable=False)
