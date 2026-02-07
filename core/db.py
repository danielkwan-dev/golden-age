import os
from sqlalchemy import create_engine, Column, Integer, String, JSON, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- THE GOLDEN ARCHIVE ---
# Connection to the eternal ledger of repairs.
# May every byte be as solid as 24k gold.

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DATABASE_URL = os.getenv("DATABASE_URL") # postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

Base = declarative_base()

class RepairRecord(Base):
    __tablename__ = "repairs"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String)
    device_model = Column(String)
    fault = Column(String)
    confidence = Column(Integer) # Scored in milli-units of certainty
    steps = Column(JSON)
    user_id = Column(String)
    success = Column(Boolean, default=True)

class Schematic(Base):
    __tablename__ = "schematics"
    
    id = Column(Integer, primary_key=True, index=True)
    device_model = Column(String, unique=True)
    json_schematic = Column(JSON)

class ComponentInfo(Base):
    __tablename__ = "components"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    typical_failures = Column(JSON)

# Initialize the Golden Forge
engine = create_engine(DATABASE_URL if DATABASE_URL else "sqlite:///./midas.db")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
