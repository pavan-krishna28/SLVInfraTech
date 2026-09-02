"""
SLV Tech Infra - FastAPI Backend
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import os, shutil, uuid

# ─── Setup ────────────────────────────────────────────────────────────────────
app = FastAPI(title="SLV Tech Infra API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Database ─────────────────────────────────────────────────────────────────
SQLALCHEMY_DATABASE_URL = "sqlite:///./slv_infra.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# ─── Models ───────────────────────────────────────────────────────────────────
class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50))  # residential/commercial/infrastructure
    description = Column(Text)
    location = Column(String(200))
    status = Column(String(50), default="ongoing")  # ongoing/completed
    year = Column(Integer)
    cover_image = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

class ProjectMedia(Base):
    __tablename__ = "project_media"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=False)
    file_path = Column(String(500))
    media_type = Column(String(20))  # image/video
    caption = Column(String(500))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class DailyUpdate(Base):
    __tablename__ = "daily_updates"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    tag = Column(String(100))
    project_id = Column(Integer, nullable=True)
    published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UpdateMedia(Base):
    __tablename__ = "update_media"
    id = Column(Integer, primary_key=True, index=True)
    update_id = Column(Integer, nullable=False)
    file_path = Column(String(500))
    media_type = Column(String(20))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class ProgressUpdate(Base):
    __tablename__ = "progress_updates"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=True)
    day_label = Column(String(100))
    title = Column(String(300))
    description = Column(Text)
    completion_pct = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class ContactInquiry(Base):
    __tablename__ = "contact_inquiries"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200))
    phone = Column(String(50))
    service = Column(String(100))
    message = Column(Text)
    status = Column(String(50), default="new")
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# ─── Media Upload ──────────────────────────────────────────────────────────────
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

def save_file(file: UploadFile) -> dict:
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    media_type = "video" if ext.lower() in [".mp4", ".mov", ".avi", ".webm"] else "image"
    return {"path": f"/uploads/{filename}", "type": media_type}

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    category: str
    description: Optional[str] = ""
    location: Optional[str] = ""
    status: Optional[str] = "ongoing"
    year: Optional[int] = None

class UpdateCreate(BaseModel):
    title: str
    description: str
    tag: str
    project_id: Optional[int] = None

class ProgressCreate(BaseModel):
    project_id: Optional[int] = None
    day_label: str
    title: str
    description: str
    completion_pct: int = 0

class ContactCreate(BaseModel):
    name: str
    phone: str
    service: Optional[str] = ""
    message: Optional[str] = ""

# ─── PROJECTS ─────────────────────────────────────────────────────────────────
@app.get("/api/projects")
def list_projects(category: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Project)
    if category: q = q.filter(Project.category == category)
    return q.order_by(Project.created_at.desc()).all()

@app.post("/api/projects")
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    proj = Project(**data.dict())
    db.add(proj); db.commit(); db.refresh(proj)
    return proj

@app.put("/api/projects/{project_id}")
def update_project(project_id: int, data: ProjectCreate, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj: raise HTTPException(status_code=404, detail="Project not found")
    for k, v in data.dict().items(): setattr(proj, k, v)
    db.commit(); db.refresh(proj)
    return proj

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj: raise HTTPException(status_code=404, detail="Not found")
    db.delete(proj); db.commit()
    return {"deleted": True}

@app.post("/api/projects/{project_id}/media")
async def upload_project_media(project_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    results = []
    for f in files:
        saved = save_file(f)
        media = ProjectMedia(project_id=project_id, file_path=saved["path"], media_type=saved["type"])
        db.add(media)
        results.append(saved)
    db.commit()
    return {"uploaded": results}

@app.get("/api/projects/{project_id}/media")
def get_project_media(project_id: int, db: Session = Depends(get_db)):
    return db.query(ProjectMedia).filter(ProjectMedia.project_id == project_id).all()

# ─── DAILY UPDATES ────────────────────────────────────────────────────────────
@app.get("/api/updates")
def list_updates(db: Session = Depends(get_db)):
    return db.query(DailyUpdate).filter(DailyUpdate.published == True).order_by(DailyUpdate.created_at.desc()).all()

@app.post("/api/updates")
def create_update(data: UpdateCreate, db: Session = Depends(get_db)):
    upd = DailyUpdate(**data.dict())
    db.add(upd); db.commit(); db.refresh(upd)
    return upd

@app.delete("/api/updates/{update_id}")
def delete_update(update_id: int, db: Session = Depends(get_db)):
    upd = db.query(DailyUpdate).filter(DailyUpdate.id == update_id).first()
    if not upd: raise HTTPException(status_code=404, detail="Not found")
    db.delete(upd); db.commit()
    return {"deleted": True}

@app.post("/api/updates/{update_id}/media")
async def upload_update_media(update_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    results = []
    for f in files:
        saved = save_file(f)
        media = UpdateMedia(update_id=update_id, file_path=saved["path"], media_type=saved["type"])
        db.add(media)
        results.append(saved)
    db.commit()
    return {"uploaded": results}

# ─── PROGRESS ─────────────────────────────────────────────────────────────────
@app.get("/api/progress")
def list_progress(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(ProgressUpdate)
    if project_id: q = q.filter(ProgressUpdate.project_id == project_id)
    return q.order_by(ProgressUpdate.created_at.asc()).all()

@app.post("/api/progress")
def create_progress(data: ProgressCreate, db: Session = Depends(get_db)):
    p = ProgressUpdate(**data.dict())
    db.add(p); db.commit(); db.refresh(p)
    return p

@app.delete("/api/progress/{progress_id}")
def delete_progress(progress_id: int, db: Session = Depends(get_db)):
    p = db.query(ProgressUpdate).filter(ProgressUpdate.id == progress_id).first()
    if not p: raise HTTPException(status_code=404, detail="Not found")
    db.delete(p); db.commit()
    return {"deleted": True}

# ─── CONTACT ──────────────────────────────────────────────────────────────────
@app.post("/api/contact")
def submit_contact(data: ContactCreate, db: Session = Depends(get_db)):
    inquiry = ContactInquiry(**data.dict())
    db.add(inquiry); db.commit(); db.refresh(inquiry)
    return {"success": True, "id": inquiry.id}

@app.get("/api/contact")
def list_contacts(db: Session = Depends(get_db)):
    return db.query(ContactInquiry).order_by(ContactInquiry.created_at.desc()).all()

# ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "SLV Tech Infra API is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
