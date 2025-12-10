from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db
from . import models


def get_dtlib_or_404(db: Session, dtlib_id: int) -> models.DTLIB:
    dtlib = db.get(models.DTLIB, dtlib_id)
    if not dtlib:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DTLIB not found")
    return dtlib


def get_dtl_or_404(db: Session, dtlib_id: int, dtl_id: int) -> models.DTL:
    dtl = db.get(models.DTL, dtl_id)
    if not dtl or dtl.dtlib_id != dtlib_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DTL not found")
    return dtl


def resolve_dtlib(dtlib_id: int, db: Session = Depends(get_db)) -> models.DTLIB:
    return get_dtlib_or_404(db, dtlib_id)


def resolve_dtl(
    dtlib_id: int,
    dtl_id: int,
    db: Session = Depends(get_db),
) -> models.DTL:
    return get_dtl_or_404(db, dtlib_id, dtl_id)
