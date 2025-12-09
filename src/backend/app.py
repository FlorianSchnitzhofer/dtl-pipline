from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .llm import llm_service
from . import models, schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Digital Twin Legislation API")


# Utility helpers

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


@app.post("/api/users", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    user = models.User(**payload.dict())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# DTLIB endpoints
@app.get("/api/dtlibs", response_model=List[schemas.DTLIBRead])
def list_dtlibs(db: Session = Depends(get_db), search: str | None = None):
    query = db.query(models.DTLIB)
    if search:
        like = f"%{search}%"
        query = query.filter(models.DTLIB.law_name.ilike(like))
    return query.all()


@app.post("/api/dtlibs", response_model=schemas.DTLIBRead, status_code=status.HTTP_201_CREATED)
def create_dtlib(payload: schemas.DTLIBCreate, db: Session = Depends(get_db)):
    creator = db.get(models.User, payload.created_by)
    if not creator:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="creator missing")
    dtlib = models.DTLIB(**payload.dict())
    db.add(dtlib)
    db.commit()
    db.refresh(dtlib)
    return dtlib


@app.get("/api/dtlibs/{dtlib_id}", response_model=schemas.DTLIBRead)
def get_dtlib(dtlib_id: int, db: Session = Depends(get_db)):
    return get_dtlib_or_404(db, dtlib_id)


@app.put("/api/dtlibs/{dtlib_id}", response_model=schemas.DTLIBRead)
def update_dtlib(dtlib_id: int, payload: schemas.DTLIBUpdate, db: Session = Depends(get_db)):
    dtlib = get_dtlib_or_404(db, dtlib_id)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(dtlib, field, value)
    db.add(dtlib)
    db.commit()
    db.refresh(dtlib)
    return dtlib


@app.delete("/api/dtlibs/{dtlib_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dtlib(dtlib_id: int, db: Session = Depends(get_db)):
    dtlib = get_dtlib_or_404(db, dtlib_id)
    db.delete(dtlib)
    db.commit()
    return None


@app.post("/api/dtlibs/{dtlib_id}/segment", response_model=List[schemas.SegmentationSuggestionRead])
def segment_dtlib(dtlib_id: int, db: Session = Depends(get_db)):
    dtlib = get_dtlib_or_404(db, dtlib_id)
    if not dtlib.full_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="full_text required")
    prompt = f"Segment the following law text into high-level functions. Return 3 names with references.\n{dtlib.full_text[:4000]}"
    raw = llm_service.generate_text(prompt)
    # naive stub: create single suggestion
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


@app.get("/api/dtlibs/{dtlib_id}/overview", response_model=schemas.OverviewSnapshot)
def overview(dtlib_id: int, db: Session = Depends(get_db)):
    dtlib = get_dtlib_or_404(db, dtlib_id)
    dtls = db.query(models.DTL).filter_by(dtlib_id=dtlib.id).all()
    status_map = {}
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


@app.post("/api/dtlibs/{dtlib_id}/sync")
def sync(dtlib_id: int, db: Session = Depends(get_db)):
    dtlib = get_dtlib_or_404(db, dtlib_id)
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
    return {"repository_url": dtlib.repository_url, "branch": dtlib.repository_branch, "commit_id": event.commit_id}


# DTL endpoints
@app.get("/api/dtlibs/{dtlib_id}/dtls", response_model=List[schemas.DTLRead])
def list_dtls(dtlib_id: int, db: Session = Depends(get_db), search: str | None = None):
    get_dtlib_or_404(db, dtlib_id)
    query = db.query(models.DTL).filter_by(dtlib_id=dtlib_id)
    if search:
        like = f"%{search}%"
        query = query.filter(models.DTL.title.ilike(like))
    return query.order_by(models.DTL.position).all()


@app.post("/api/dtlibs/{dtlib_id}/dtls", response_model=schemas.DTLRead, status_code=status.HTTP_201_CREATED)
def create_dtl(dtlib_id: int, payload: schemas.DTLCreate, db: Session = Depends(get_db)):
    dtlib = get_dtlib_or_404(db, dtlib_id)
    dtl = models.DTL(dtlib_id=dtlib.id, **payload.dict())
    db.add(dtl)
    db.commit()
    db.refresh(dtl)
    return dtl


@app.get("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}", response_model=schemas.DTLRead)
def get_dtl(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    return get_dtl_or_404(db, dtlib_id, dtl_id)


@app.put("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}", response_model=schemas.DTLRead)
def update_dtl(dtlib_id: int, dtl_id: int, payload: schemas.DTLUpdate, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(dtl, field, value)
    db.add(dtl)
    db.commit()
    db.refresh(dtl)
    return dtl


@app.delete("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dtl(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    db.delete(dtl)
    db.commit()
    return None


# Stage endpoints
@app.get("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/ontology", response_model=schemas.OntologyPayload | None)
def get_ontology(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    if not dtl.ontology:
        return None
    return schemas.OntologyPayload(ontology_owl=dtl.ontology.ontology_owl)


@app.put("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/ontology", response_model=schemas.OntologyPayload)
def save_ontology(dtlib_id: int, dtl_id: int, payload: schemas.OntologyPayload, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    if dtl.ontology:
        dtl.ontology.ontology_owl = payload.ontology_owl
    else:
        dtl.ontology = models.DTLOntology(ontology_owl=payload.ontology_owl)
    db.add(dtl)
    db.commit()
    return payload


@app.post("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/ontology/generate", response_model=schemas.OntologyPayload)
def generate_ontology(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    prompt = f"Create OWL ontology for the following legal text: {dtl.legal_text[:2000]}"
    content = llm_service.generate_text(prompt)
    return schemas.OntologyPayload(ontology_owl=content)


@app.get("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/interface", response_model=schemas.InterfacePayload | None)
def get_interface(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    if not dtl.interface:
        return None
    data = dtl.interface.interface_json
    return schemas.InterfacePayload(function_name=data.get("function_name", dtl.title), inputs=data.get("inputs", []), outputs=data.get("outputs", []), mcp_spec=dtl.interface.mcp_spec)


@app.put("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/interface", response_model=schemas.InterfacePayload)
def save_interface(dtlib_id: int, dtl_id: int, payload: schemas.InterfacePayload, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    if dtl.interface:
        dtl.interface.interface_json = payload.dict(exclude={"mcp_spec"})
        dtl.interface.mcp_spec = payload.mcp_spec
    else:
        dtl.interface = models.DTLInterface(interface_json=payload.dict(exclude={"mcp_spec"}), mcp_spec=payload.mcp_spec)
    db.add(dtl)
    db.commit()
    return payload


@app.post("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/interface/generate", response_model=schemas.InterfacePayload)
def generate_interface(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    prompt = f"Propose input/output schema for function: {dtl.title}. Context: {dtl.legal_text[:1000]}"
    content = llm_service.generate_text(prompt)
    return schemas.InterfacePayload(function_name=dtl.title, inputs=[{"name": "input", "description": content[:120]}], outputs=[{"name": "result", "description": content[:120]}])


@app.get("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/configuration", response_model=schemas.ConfigurationPayload | None)
def get_configuration(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    if not dtl.configuration:
        return None
    return schemas.ConfigurationPayload(configuration_owl=dtl.configuration.configuration_owl)


@app.put("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/configuration", response_model=schemas.ConfigurationPayload)
def save_configuration(dtlib_id: int, dtl_id: int, payload: schemas.ConfigurationPayload, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    if dtl.configuration:
        dtl.configuration.configuration_owl = payload.configuration_owl
    else:
        dtl.configuration = models.DTLConfiguration(configuration_owl=payload.configuration_owl)
    db.add(dtl)
    db.commit()
    return payload


@app.post("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/configuration/generate", response_model=schemas.ConfigurationPayload)
def generate_configuration(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    prompt = f"Extract configuration parameters (rates, thresholds) as OWL from: {dtl.legal_text[:1500]}"
    content = llm_service.generate_text(prompt)
    return schemas.ConfigurationPayload(configuration_owl=content)


@app.get("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/tests", response_model=List[schemas.TestCaseRead])
def list_tests(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    get_dtl_or_404(db, dtlib_id, dtl_id)
    return db.query(models.DTLTest).filter_by(dtl_id=dtl_id).all()


@app.post("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/tests", response_model=schemas.TestCaseRead, status_code=status.HTTP_201_CREATED)
def create_test(dtlib_id: int, dtl_id: int, payload: schemas.TestCaseCreate, db: Session = Depends(get_db)):
    get_dtl_or_404(db, dtlib_id, dtl_id)
    test = models.DTLTest(dtl_id=dtl_id, name=payload.name, input_json=payload.input, expected_output_json=payload.expected_output, description=payload.description)
    db.add(test)
    db.commit()
    db.refresh(test)
    return schemas.TestCaseRead(
        id=test.id,
        dtl_id=test.dtl_id,
        name=test.name,
        input=test.input_json,
        expected_output=test.expected_output_json,
        description=test.description,
        last_run_at=test.last_run_at,
        last_result=test.last_result,
    )


@app.get("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/tests/{test_id}", response_model=schemas.TestCaseRead)
def get_test(dtlib_id: int, dtl_id: int, test_id: int, db: Session = Depends(get_db)):
    get_dtl_or_404(db, dtlib_id, dtl_id)
    test = db.get(models.DTLTest, test_id)
    if not test or test.dtl_id != dtl_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
    return schemas.TestCaseRead(
        id=test.id,
        dtl_id=test.dtl_id,
        name=test.name,
        input=test.input_json,
        expected_output=test.expected_output_json,
        description=test.description,
        last_run_at=test.last_run_at,
        last_result=test.last_result,
    )


@app.put("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/tests/{test_id}", response_model=schemas.TestCaseRead)
def update_test(dtlib_id: int, dtl_id: int, test_id: int, payload: schemas.TestCaseUpdate, db: Session = Depends(get_db)):
    get_dtl_or_404(db, dtlib_id, dtl_id)
    test = db.get(models.DTLTest, test_id)
    if not test or test.dtl_id != dtl_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
    for field, value in payload.dict(exclude_unset=True).items():
        if field == "input":
            test.input_json = value
        elif field == "expected_output":
            test.expected_output_json = value
        else:
            setattr(test, field, value)
    db.add(test)
    db.commit()
    db.refresh(test)
    return schemas.TestCaseRead(
        id=test.id,
        dtl_id=test.dtl_id,
        name=test.name,
        input=test.input_json,
        expected_output=test.expected_output_json,
        description=test.description,
        last_run_at=test.last_run_at,
        last_result=test.last_result,
    )


@app.delete("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test(dtlib_id: int, dtl_id: int, test_id: int, db: Session = Depends(get_db)):
    get_dtl_or_404(db, dtlib_id, dtl_id)
    test = db.get(models.DTLTest, test_id)
    if not test or test.dtl_id != dtl_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
    db.delete(test)
    db.commit()
    return None


@app.post("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/tests/run")
def run_tests(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    get_dtl_or_404(db, dtlib_id, dtl_id)
    tests = db.query(models.DTLTest).filter_by(dtl_id=dtl_id).all()
    results = []
    for test in tests:
        test.last_run_at = datetime.utcnow()
        test.last_result = "Not Run"
        db.add(test)
        results.append({"test_id": test.id, "result": test.last_result})
    db.commit()
    return {"results": results}


@app.post("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/tests/generate", response_model=List[schemas.TestCaseRead])
def generate_tests(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    prompt = f"Generate 2 JSON test cases for DTL: {dtl.title}."
    content = llm_service.generate_text(prompt)
    test = models.DTLTest(dtl_id=dtl_id, name="LLM Proposed Test", input_json={"prompt": content[:30]}, expected_output_json={"expected": content[:30]}, description=content[:120])
    db.add(test)
    db.commit()
    db.refresh(test)
    return [schemas.TestCaseRead(
        id=test.id,
        dtl_id=test.dtl_id,
        name=test.name,
        input=test.input_json,
        expected_output=test.expected_output_json,
        description=test.description,
        last_run_at=test.last_run_at,
        last_result=test.last_result,
    )]


@app.get("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/logic", response_model=schemas.LogicPayload | None)
def get_logic(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    if not dtl.logic:
        return None
    return schemas.LogicPayload(language=dtl.logic.language, code=dtl.logic.code)


@app.put("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/logic", response_model=schemas.LogicPayload)
def save_logic(dtlib_id: int, dtl_id: int, payload: schemas.LogicPayload, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    if dtl.logic:
        dtl.logic.language = payload.language
        dtl.logic.code = payload.code
    else:
        dtl.logic = models.DTLLogic(language=payload.language, code=payload.code)
    db.add(dtl)
    db.commit()
    return payload


@app.post("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/logic/generate", response_model=schemas.LogicPayload)
def generate_logic(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    prompt = f"Draft executable pseudo-code for: {dtl.title}. Context: {dtl.legal_text[:1000]}"
    code = llm_service.generate_text(prompt)
    return schemas.LogicPayload(language="Python", code=code)


@app.get("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/review", response_model=schemas.ReviewRead)
def review_summary(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    if not dtl.review:
        dtl.review = models.DTLReview(status="Pending")
        db.add(dtl)
        db.commit()
        db.refresh(dtl)
    return schemas.ReviewRead(
        status=dtl.review.status,
        approved_version=dtl.review.approved_version,
        approved_at=dtl.review.approved_at,
        last_comment=dtl.review.last_comment,
    )


@app.post("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/approve", response_model=schemas.ReviewRead)
def approve_dtl(dtlib_id: int, dtl_id: int, payload: schemas.ReviewPayload | None = None, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    if not dtl.review:
        dtl.review = models.DTLReview()
    dtl.review.status = "Approved"
    dtl.review.approved_at = datetime.utcnow()
    dtl.review.approved_version = payload.approved_version if payload else dtl.version
    dtl.review.last_comment = payload.comment if payload else None
    db.add(dtl)
    db.commit()
    return schemas.ReviewRead(
        status=dtl.review.status,
        approved_version=dtl.review.approved_version,
        approved_at=dtl.review.approved_at,
        last_comment=dtl.review.last_comment,
    )


@app.post("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/request-revision", response_model=schemas.ReviewRead)
def request_revision(dtlib_id: int, dtl_id: int, payload: schemas.ReviewPayload | None = None, db: Session = Depends(get_db)):
    dtl = get_dtl_or_404(db, dtlib_id, dtl_id)
    if not dtl.review:
        dtl.review = models.DTLReview()
    dtl.review.status = "Revision Requested"
    dtl.review.last_comment = payload.comment if payload else None
    db.add(dtl)
    db.commit()
    return schemas.ReviewRead(
        status=dtl.review.status,
        approved_version=dtl.review.approved_version,
        approved_at=dtl.review.approved_at,
        last_comment=dtl.review.last_comment,
    )


@app.get("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/comments", response_model=List[schemas.CommentRead])
def list_comments(dtlib_id: int, dtl_id: int, db: Session = Depends(get_db)):
    get_dtl_or_404(db, dtlib_id, dtl_id)
    comments = db.query(models.DTLComment).filter_by(dtl_id=dtl_id).order_by(models.DTLComment.created_at).all()
    return [schemas.CommentRead(
        id=c.id,
        dtl_id=c.dtl_id,
        author_id=c.author_id,
        role=c.role,
        comment=c.comment,
        comment_type=c.comment_type,
        created_at=c.created_at,
    ) for c in comments]


@app.post("/api/dtlibs/{dtlib_id}/dtls/{dtl_id}/comments", response_model=schemas.CommentRead, status_code=status.HTTP_201_CREATED)
def add_comment(dtlib_id: int, dtl_id: int, payload: schemas.CommentCreate, db: Session = Depends(get_db)):
    get_dtl_or_404(db, dtlib_id, dtl_id)
    if not db.get(models.User, payload.author_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="author not found")
    comment = models.DTLComment(
        dtl_id=dtl_id,
        author_id=payload.author_id,
        role=payload.role,
        comment=payload.comment,
        comment_type=payload.comment_type,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return schemas.CommentRead(
        id=comment.id,
        dtl_id=comment.dtl_id,
        author_id=comment.author_id,
        role=comment.role,
        comment=comment.comment,
        comment_type=comment.comment_type,
        created_at=comment.created_at,
    )
