from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User


def sync_assignment(
    db: Session, assoc_model, fk_name: str, entity_id: int, user_ids: list[int], expected_role: str
) -> None:
    if not user_ids:
        db.query(assoc_model).filter_by(**{fk_name: entity_id}).delete()
        return

    users = db.query(User).filter(User.id.in_(user_ids)).all()
    found_ids = {u.id for u in users}
    missing = sorted(set(user_ids) - found_ids)
    if missing:
        raise HTTPException(status_code=400, detail=f"unknown user ids: {missing}")

    mismatched = sorted(u.id for u in users if u.role != expected_role)
    if mismatched:
        raise HTTPException(status_code=400, detail=f"users {mismatched} do not have role '{expected_role}'")

    db.query(assoc_model).filter_by(**{fk_name: entity_id}).delete()
    for uid in user_ids:
        db.add(assoc_model(user_id=uid, **{fk_name: entity_id}))
