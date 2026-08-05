import json
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.upload import Upload
from app.schemas.upload import UploadOut
from app.services.column_mapping import CANONICAL_FIELDS, suggest_column_mapping
from app.services.ingestion import (
    get_columns,
    ingest_financial,
    ingest_utilization,
    insert_financial_records,
    insert_utilization_records,
    parse_financial,
    parse_utilization,
)

router = APIRouter(prefix="/uploads", tags=["uploads"])

DATASET_HANDLERS = {
    "financial": ingest_financial,
    "utilization": ingest_utilization,
}

PARSE_HANDLERS = {
    "financial": parse_financial,
    "utilization": parse_utilization,
}

INSERT_HANDLERS = {
    "financial": insert_financial_records,
    "utilization": insert_utilization_records,
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
        dataset=dataset,
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


@router.post("/{dataset}/preview")
async def preview_upload(
    dataset: str,
    file: UploadFile = File(...),
    column_mapping: str | None = Form(None),
    db: Session = Depends(get_db),
):
    handler = PARSE_HANDLERS.get(dataset)
    if handler is None:
        raise HTTPException(400, f"unknown dataset type: {dataset}")

    content = await file.read()
    parsed_mapping = json.loads(column_mapping) if column_mapping else None

    if parsed_mapping is None:
        try:
            source_columns = get_columns(file.filename, content, dataset=dataset)
        except Exception:  # noqa: BLE001 - unreadable file, fall through to the normal parse-error path below
            source_columns = []
        required = CANONICAL_FIELDS[dataset]
        if source_columns and not set(required) <= set(source_columns):
            suggested = suggest_column_mapping(db, dataset, source_columns)
            return {
                "needs_mapping": True,
                "source_columns": source_columns,
                "suggested_mapping": suggested,
                "unmapped_fields": [f for f in required if not suggested.get(f)],
            }

    rows, errors = handler(db, file.filename, content, column_mapping=parsed_mapping)

    upload = Upload(
        filename=file.filename,
        dataset=dataset,
        status="pending_commit",
        row_errors=errors,
        preview=rows,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    return {
        "needs_mapping": False,
        "upload_id": upload.id,
        "filename": upload.filename,
        "row_count": len(rows),
        "preview": rows[:20],
        "errors": errors,
    }


@router.post("/{upload_id}/commit")
def commit_upload(upload_id: int, db: Session = Depends(get_db)):
    upload = db.get(Upload, upload_id)
    if upload is None:
        raise HTTPException(404, "upload not found")
    if upload.status == "committed":
        raise HTTPException(409, "upload already committed")
    if upload.preview is None:
        raise HTTPException(400, "upload has no pending preview to commit")

    insert_fn = INSERT_HANDLERS[upload.dataset]
    inserted = insert_fn(db, upload.preview)
    upload.status = "committed_with_errors" if upload.row_errors else "committed"
    upload.committed_at = datetime.utcnow()
    db.commit()
    return {"success": True, "rows_inserted": inserted, "message": "upload committed"}


@router.get("/{upload_id}")
def get_upload(upload_id: int, db: Session = Depends(get_db)):
    upload = db.get(Upload, upload_id)
    if upload is None:
        raise HTTPException(404, "upload not found")
    return {
        "id": upload.id,
        "filename": upload.filename,
        "dataset": upload.dataset,
        "status": upload.status,
        "row_errors": upload.row_errors,
        "uploaded_at": upload.uploaded_at,
        "committed_at": upload.committed_at,
    }
