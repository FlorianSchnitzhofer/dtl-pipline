from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import resolve_dtlib
from ..llm import llm_service

router = APIRouter(prefix="/dtlibs", tags=["dtlibs"])


@router.get("", response_model=List[schemas.DTLIBRead])
def list_dtlibs(db: Session = Depends(get_db), search: str | None = None):
    query = db.query(models.DTLIB)
    if search:
        like = f"%{search}%"
        query = query.filter(models.DTLIB.law_name.ilike(like))
    return query.all()


@router.post("", response_model=schemas.DTLIBRead, status_code=status.HTTP_201_CREATED)
def create_dtlib(payload: schemas.DTLIBCreate, db: Session = Depends(get_db)):
    creator = db.get(models.User, payload.created_by)
    if not creator:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="creator missing")
    dtlib = models.DTLIB(**payload.dict())
    db.add(dtlib)
    db.commit()
    db.refresh(dtlib)
    return dtlib


@router.get("/{dtlib_id}", response_model=schemas.DTLIBRead)
def get_dtlib(dtlib: models.DTLIB = Depends(resolve_dtlib)):
    return dtlib


@router.put("/{dtlib_id}", response_model=schemas.DTLIBRead)
def update_dtlib(
    payload: schemas.DTLIBUpdate,
    db: Session = Depends(get_db),
    dtlib: models.DTLIB = Depends(resolve_dtlib),
):
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(dtlib, field, value)
    db.add(dtlib)
    db.commit()
    db.refresh(dtlib)
    return dtlib


@router.delete("/{dtlib_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dtlib(db: Session = Depends(get_db), dtlib: models.DTLIB = Depends(resolve_dtlib)):
    db.delete(dtlib)
    db.commit()
    return None


@router.post("/{dtlib_id}/segment", response_model=List[schemas.SegmentationSuggestionRead])
def segment_dtlib(db: Session = Depends(get_db), dtlib: models.DTLIB = Depends(resolve_dtlib)):
    if not dtlib.full_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="full_text required")
    prompt = (
        "Segment the following law text into high-level functions. Return 3 names with references.\n"
        f"{dtlib.full_text[:4000]}"
    )
    raw = llm_service.generate_text(prompt)
    suggestion = models.SegmentationSuggestion(
        dtlib_id=dtlib.id,
        suggestion_title="LLM Proposed Segment",
        suggestion_description=raw[:255],
        legal_text=dtlib.full_text[:500],
        legal_reference="Auto",
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return [suggestion]


@router.get("/{dtlib_id}/overview", response_model=schemas.OverviewSnapshot)
def overview(db: Session = Depends(get_db), dtlib: models.DTLIB = Depends(resolve_dtlib)):
    dtls = db.query(models.DTL).filter_by(dtlib_id=dtlib.id).all()
    status_map: dict[str, int] = {}
    for dtl in dtls:
        status_map[dtl.status] = status_map.get(dtl.status, 0) + 1
    return schemas.OverviewSnapshot(
        dtlib=dtlib,
        dtls=dtls,
        dtls_status=status_map,
        aggregated_ontology=None,
        aggregated_configuration=None,
        interface_surface=[dtl.interface.interface_json for dtl in dtls if dtl.interface],
        traceability=[{"dtl_id": dtl.id, "legal_reference": dtl.legal_reference} for dtl in dtls],
    )


@router.post("/{dtlib_id}/sync")
def sync(db: Session = Depends(get_db), dtlib: models.DTLIB = Depends(resolve_dtlib)):
    if not dtlib.repository_url or not dtlib.repository_branch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="repository not configured")
    event = models.GithubSyncEvent(
        dtlib_id=dtlib.id,
        repository_url=dtlib.repository_url,
        branch=dtlib.repository_branch,
        commit_id="stub",
        message="Sync placeholder",
        status="Completed",
        completed_at=datetime.utcnow(),
    )
    db.add(event)
    db.commit()
    return {
        "repository_url": dtlib.repository_url,
        "branch": dtlib.repository_branch,
        "commit_id": event.commit_id,
    }
