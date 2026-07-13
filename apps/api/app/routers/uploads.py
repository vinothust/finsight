from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.upload import Upload
from app.schemas.upload import UploadOut
from app.services.ingestion import ingest_financial, ingest_utilization

router = APIRouter(prefix="/uploads", tags=["uploads"])

DATASET_HANDLERS = {
    "financial": ingest_financial,
    "utilization": ingest_utilization,
}


@router.post("")
async def create_upload(dataset: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    handler = DATASET_HANDLERS.get(dataset)
    if handler is None:
        raise HTTPException(400, f"unknown dataset type: {dataset}")

    content = await file.read()
    created, errors = handler(db, file.filename, content)

    upload = Upload(
        filename=file.filename,
        status="processed" if not errors else "processed_with_errors",
        row_errors=errors,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    return {"upload_id": upload.id, "created_rows": created, "errors": errors}


@router.get("", response_model=list[UploadOut])
def list_uploads(db: Session = Depends(get_db)):
    return db.query(Upload).order_by(Upload.uploaded_at.desc()).all()
