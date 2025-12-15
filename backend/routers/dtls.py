from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_dtlib_or_404, resolve_dtlib, resolve_dtl
from ..llm import llm_service
from ..prompts import prompt_builder

router = APIRouter(prefix="/dtlibs/{dtlib_id}/dtls", tags=["dtls"])


def _serialize_test(test: models.DTLTest) -> schemas.TestCaseRead:
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


def _serialize_comment(comment: models.DTLComment) -> schemas.CommentRead:
    return schemas.CommentRead(
        id=comment.id,
        dtl_id=comment.dtl_id,
        author_id=comment.author_id,
        role=comment.role,
        comment=comment.comment,
        comment_type=comment.comment_type,
        created_at=comment.created_at,
    )


@router.get("", response_model=List[schemas.DTLRead])
def list_dtls(
    dtlib_id: int,
    db: Session = Depends(get_db),
    search: str | None = None,
):
    get_dtlib_or_404(db, dtlib_id)
    query = db.query(models.DTL).filter_by(dtlib_id=dtlib_id)
    if search:
        like = f"%{search}%"
        query = query.filter(models.DTL.title.ilike(like))
    return query.order_by(models.DTL.position).all()


@router.post("", response_model=schemas.DTLRead, status_code=status.HTTP_201_CREATED)
def create_dtl(
    payload: schemas.DTLCreate,
    db: Session = Depends(get_db),
    dtlib: models.DTLIB = Depends(resolve_dtlib),
):
    dtl = models.DTL(dtlib_id=dtlib.id, **payload.dict())
    db.add(dtl)
    db.commit()
    db.refresh(dtl)
    return dtl


@router.get("/{dtl_id}", response_model=schemas.DTLRead)
def get_dtl(dtl: models.DTL = Depends(resolve_dtl)):
    return dtl


@router.put("/{dtl_id}", response_model=schemas.DTLRead)
def update_dtl(
    payload: schemas.DTLUpdate,
    db: Session = Depends(get_db),
    dtl: models.DTL = Depends(resolve_dtl),
):
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(dtl, field, value)
    db.add(dtl)
    db.commit()
    db.refresh(dtl)
    return dtl


@router.delete("/{dtl_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dtl(db: Session = Depends(get_db), dtl: models.DTL = Depends(resolve_dtl)):
    db.delete(dtl)
    db.commit()
    return None


@router.get("/{dtl_id}/ontology", response_model=schemas.OntologyPayload | None)
def get_ontology(dtl: models.DTL = Depends(resolve_dtl)):
    if not dtl.ontology:
        return None
    return schemas.OntologyPayload(
        ontology_owl=dtl.ontology.ontology_owl, raw_response=dtl.ontology.raw_response
    )


@router.put("/{dtl_id}/ontology", response_model=schemas.OntologyPayload)
def save_ontology(
    payload: schemas.OntologyPayload,
    db: Session = Depends(get_db),
    dtl: models.DTL = Depends(resolve_dtl),
):
    raw_response = payload.raw_response or payload.ontology_owl
    if dtl.ontology:
        dtl.ontology.ontology_owl = payload.ontology_owl
        dtl.ontology.raw_response = raw_response
    else:
        dtl.ontology = models.DTLOntology(
            ontology_owl=payload.ontology_owl, raw_response=raw_response
        )
    db.add(dtl)
    db.add(dtl.ontology)
    db.commit()
    db.refresh(dtl.ontology)
    return schemas.OntologyPayload(ontology_owl=payload.ontology_owl, raw_response=raw_response)


@router.post("/{dtl_id}/ontology/generate", response_model=schemas.OntologyPayload)
def generate_ontology(db: Session = Depends(get_db), dtl: models.DTL = Depends(resolve_dtl)):
    prompt = prompt_builder.ontology(
        title=dtl.title,
        legal_text=dtl.legal_text[:2000],
    )
    raw, parsed = llm_service.generate_structured(prompt)
    ontology_owl = raw
    if isinstance(parsed, dict) and parsed.get("ontology_owl"):
        ontology_owl = parsed["ontology_owl"]

    if dtl.ontology:
        dtl.ontology.ontology_owl = ontology_owl
        dtl.ontology.raw_response = raw
    else:
        dtl.ontology = models.DTLOntology(ontology_owl=ontology_owl, raw_response=raw)

    db.add(dtl)
    db.add(dtl.ontology)
    db.commit()
    db.refresh(dtl.ontology)
    return schemas.OntologyPayload(ontology_owl=dtl.ontology.ontology_owl, raw_response=dtl.ontology.raw_response)


@router.get("/{dtl_id}/interface", response_model=schemas.InterfacePayload | None)
def get_interface(dtl: models.DTL = Depends(resolve_dtl)):
    if not dtl.interface:
        return None
    data = dtl.interface.interface_json
    return schemas.InterfacePayload(
        function_name=data.get("function_name", dtl.title),
        inputs=data.get("inputs", []),
        outputs=data.get("outputs", []),
        mcp_spec=dtl.interface.mcp_spec,
    )


@router.put("/{dtl_id}/interface", response_model=schemas.InterfacePayload)
def save_interface(
    payload: schemas.InterfacePayload,
    db: Session = Depends(get_db),
    dtl: models.DTL = Depends(resolve_dtl),
):
    if dtl.interface:
        dtl.interface.interface_json = payload.dict(exclude={"mcp_spec"})
        dtl.interface.mcp_spec = payload.mcp_spec
    else:
        dtl.interface = models.DTLInterface(
            interface_json=payload.dict(exclude={"mcp_spec"}),
            mcp_spec=payload.mcp_spec,
        )
    db.add(dtl)
    db.commit()
    return payload


@router.post("/{dtl_id}/interface/generate", response_model=schemas.InterfacePayload)
def generate_interface(db: Session = Depends(get_db), dtl: models.DTL = Depends(resolve_dtl)):
    prompt = prompt_builder.interface(title=dtl.title, legal_text=dtl.legal_text[:1500])
    raw, parsed = llm_service.generate_structured(prompt)

    interface_data = {
        "function_name": dtl.title,
        "inputs": [],
        "outputs": [],
        "mcp_spec": {"hint": raw},
    }
    if isinstance(parsed, dict):
        interface_data.update({k: v for k, v in parsed.items() if k in {"function_name", "inputs", "outputs", "mcp_spec"}})

    function_name = interface_data.get("function_name") or dtl.title
    inputs = interface_data.get("inputs") or [{"name": "input", "description": raw[:200]}]
    outputs = interface_data.get("outputs") or [{"name": "result", "description": raw[:200]}]
    mcp_spec = interface_data.get("mcp_spec")

    interface_json = {
        "function_name": function_name,
        "inputs": inputs,
        "outputs": outputs,
    }

    if dtl.interface:
        dtl.interface.interface_json = interface_json
        dtl.interface.mcp_spec = mcp_spec
    else:
        dtl.interface = models.DTLInterface(interface_json=interface_json, mcp_spec=mcp_spec)

    db.add(dtl)
    db.commit()

    return schemas.InterfacePayload(
        function_name=function_name,
        inputs=inputs,
        outputs=outputs,
        mcp_spec=mcp_spec,
    )


@router.get("/{dtl_id}/configuration", response_model=schemas.ConfigurationPayload | None)
def get_configuration(dtl: models.DTL = Depends(resolve_dtl)):
    if not dtl.configuration:
        return None
    return schemas.ConfigurationPayload(configuration_owl=dtl.configuration.configuration_owl)


@router.put("/{dtl_id}/configuration", response_model=schemas.ConfigurationPayload)
def save_configuration(
    payload: schemas.ConfigurationPayload,
    db: Session = Depends(get_db),
    dtl: models.DTL = Depends(resolve_dtl),
):
    if dtl.configuration:
        dtl.configuration.configuration_owl = payload.configuration_owl
    else:
        dtl.configuration = models.DTLConfiguration(configuration_owl=payload.configuration_owl)
    db.add(dtl)
    db.commit()
    return payload


@router.post("/{dtl_id}/configuration/generate", response_model=schemas.ConfigurationPayload)
def generate_configuration(db: Session = Depends(get_db), dtl: models.DTL = Depends(resolve_dtl)):
    prompt = prompt_builder.configuration(title=dtl.title, legal_text=dtl.legal_text[:1500])
    raw, parsed = llm_service.generate_structured(prompt)
    configuration_owl = raw
    if isinstance(parsed, dict) and parsed.get("configuration_owl"):
        configuration_owl = parsed["configuration_owl"]

    if dtl.configuration:
        dtl.configuration.configuration_owl = configuration_owl
    else:
        dtl.configuration = models.DTLConfiguration(configuration_owl=configuration_owl)

    db.add(dtl)
    db.commit()
    return schemas.ConfigurationPayload(configuration_owl=configuration_owl)


@router.get("/{dtl_id}/tests", response_model=List[schemas.TestCaseRead])
def list_tests(dtl: models.DTL = Depends(resolve_dtl)):
    return [_serialize_test(test) for test in dtl.tests]


@router.post("/{dtl_id}/tests", response_model=schemas.TestCaseRead, status_code=status.HTTP_201_CREATED)
def create_test(
    payload: schemas.TestCaseCreate,
    db: Session = Depends(get_db),
    dtl: models.DTL = Depends(resolve_dtl),
):
    test = models.DTLTest(
        dtl_id=dtl.id,
        name=payload.name,
        input_json=payload.input,
        expected_output_json=payload.expected_output,
        description=payload.description,
    )
    db.add(test)
    db.commit()
    db.refresh(test)
    return _serialize_test(test)


@router.get("/{dtl_id}/tests/{test_id}", response_model=schemas.TestCaseRead)
def get_test(
    test_id: int,
    db: Session = Depends(get_db),
    dtl: models.DTL = Depends(resolve_dtl),
):
    test = db.get(models.DTLTest, test_id)
    if not test or test.dtl_id != dtl.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
    return _serialize_test(test)


@router.put("/{dtl_id}/tests/{test_id}", response_model=schemas.TestCaseRead)
def update_test(
    test_id: int,
    payload: schemas.TestCaseUpdate,
    db: Session = Depends(get_db),
    dtl: models.DTL = Depends(resolve_dtl),
):
    test = db.get(models.DTLTest, test_id)
    if not test or test.dtl_id != dtl.id:
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
    return _serialize_test(test)


@router.delete("/{dtl_id}/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test(
    test_id: int,
    db: Session = Depends(get_db),
    dtl: models.DTL = Depends(resolve_dtl),
):
    test = db.get(models.DTLTest, test_id)
    if not test or test.dtl_id != dtl.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
    db.delete(test)
    db.commit()
    return None


@router.post("/{dtl_id}/tests/run")
def run_tests(db: Session = Depends(get_db), dtl: models.DTL = Depends(resolve_dtl)):
    tests = db.query(models.DTLTest).filter_by(dtl_id=dtl.id).all()
    results = []
    for test in tests:
        test.last_run_at = datetime.utcnow()
        test.last_result = "Not Run"
        db.add(test)
        results.append({"test_id": test.id, "result": test.last_result})
    db.commit()
    return {"results": results}


@router.post("/{dtl_id}/tests/generate", response_model=List[schemas.TestCaseRead])
def generate_tests(db: Session = Depends(get_db), dtl: models.DTL = Depends(resolve_dtl)):
    prompt = prompt_builder.tests(title=dtl.title, legal_text=dtl.legal_text[:1500])
    raw, parsed = llm_service.generate_structured(prompt)

    created_tests: list[models.DTLTest] = []
    if isinstance(parsed, dict) and isinstance(parsed.get("tests"), list):
        for index, proposed in enumerate(parsed["tests"]):
            test = models.DTLTest(
                dtl_id=dtl.id,
                name=proposed.get("name") or f"LLM Test {index + 1}",
                input_json=proposed.get("input") or {"hint": raw[:80]},
                expected_output_json=proposed.get("expected_output") or {"expected": raw[:80]},
                description=proposed.get("description") or raw[:255],
            )
            db.add(test)
            created_tests.append(test)

    if not created_tests:
        fallback = models.DTLTest(
            dtl_id=dtl.id,
            name="LLM Proposed Test",
            input_json={"prompt": raw[:120]},
            expected_output_json={"expected": raw[:120]},
            description=raw[:255],
        )
        db.add(fallback)
        created_tests.append(fallback)

    db.commit()
    for test in created_tests:
        db.refresh(test)
    return [_serialize_test(test) for test in created_tests]


@router.get("/{dtl_id}/logic", response_model=schemas.LogicPayload | None)
def get_logic(dtl: models.DTL = Depends(resolve_dtl)):
    if not dtl.logic:
        return None
    return schemas.LogicPayload(language=dtl.logic.language, code=dtl.logic.code)


@router.put("/{dtl_id}/logic", response_model=schemas.LogicPayload)
def save_logic(
    payload: schemas.LogicPayload,
    db: Session = Depends(get_db),
    dtl: models.DTL = Depends(resolve_dtl),
):
    if dtl.logic:
        dtl.logic.language = payload.language
        dtl.logic.code = payload.code
    else:
        dtl.logic = models.DTLLogic(language=payload.language, code=payload.code)
    db.add(dtl)
    db.commit()
    return payload


@router.post("/{dtl_id}/logic/generate", response_model=schemas.LogicPayload)
def generate_logic(db: Session = Depends(get_db), dtl: models.DTL = Depends(resolve_dtl)):
    prompt = prompt_builder.logic(title=dtl.title, legal_text=dtl.legal_text[:1200])
    raw, parsed = llm_service.generate_structured(prompt)

    language = "Python"
    code = raw
    if isinstance(parsed, dict):
        language = parsed.get("language") or language
        if parsed.get("code"):
            code = parsed["code"]

    annotated_code = f"# LLM Hint: {raw[:200]}\n{code}"

    if dtl.logic:
        dtl.logic.language = language
        dtl.logic.code = annotated_code
    else:
        dtl.logic = models.DTLLogic(language=language, code=annotated_code)

    db.add(dtl)
    db.commit()

    return schemas.LogicPayload(language=language, code=annotated_code)


@router.post("/{dtl_id}/generate-all", response_model=schemas.DTLGenerationResponse)
def generate_all_artifacts(db: Session = Depends(get_db), dtl: models.DTL = Depends(resolve_dtl)):
    ontology_prompt = prompt_builder.ontology(
        title=dtl.title, reference=dtl.legal_reference, legal_text=dtl.legal_text[:2000]
    )
    ontology_raw, ontology_parsed = llm_service.generate_structured(ontology_prompt)
    ontology_owl = (
        ontology_parsed.get("ontology_owl")
        if isinstance(ontology_parsed, dict) and ontology_parsed.get("ontology_owl")
        else ontology_raw
    )

    interface_prompt = prompt_builder.interface(title=dtl.title, legal_text=dtl.legal_text[:1500])
    interface_raw, interface_parsed = llm_service.generate_structured(interface_prompt)
    interface_defaults = {
        "function_name": dtl.title,
        "inputs": [],
        "outputs": [],
        "mcp_spec": {"hint": interface_raw},
    }
    interface_data = interface_defaults | (
        {k: v for k, v in interface_parsed.items() if k in interface_defaults}
        if isinstance(interface_parsed, dict)
        else {}
    )
    interface_json = {
        "function_name": interface_data.get("function_name") or dtl.title,
        "inputs": interface_data.get("inputs") or [{"name": "input", "description": interface_raw[:200]}],
        "outputs": interface_data.get("outputs") or [{"name": "result", "description": interface_raw[:200]}],
    }
    mcp_spec = interface_data.get("mcp_spec")

    configuration_prompt = prompt_builder.configuration(title=dtl.title, legal_text=dtl.legal_text[:1500])
    configuration_raw, configuration_parsed = llm_service.generate_structured(configuration_prompt)
    configuration_owl = (
        configuration_parsed.get("configuration_owl")
        if isinstance(configuration_parsed, dict) and configuration_parsed.get("configuration_owl")
        else configuration_raw
    )

    tests_prompt = prompt_builder.tests(title=dtl.title, legal_text=dtl.legal_text[:1500])
    tests_raw, tests_parsed = llm_service.generate_structured(tests_prompt)

    for test in list(dtl.tests):
        db.delete(test)

    generated_tests: list[models.DTLTest] = []
    if isinstance(tests_parsed, dict) and isinstance(tests_parsed.get("tests"), list):
        for index, proposed in enumerate(tests_parsed["tests"]):
            test = models.DTLTest(
                dtl_id=dtl.id,
                name=proposed.get("name") or f"LLM Test {index + 1}",
                input_json=proposed.get("input") or {"hint": tests_raw[:80]},
                expected_output_json=proposed.get("expected_output") or {"expected": tests_raw[:80]},
                description=proposed.get("description") or tests_raw[:255],
            )
            db.add(test)
            generated_tests.append(test)

    if not generated_tests:
        fallback = models.DTLTest(
            dtl_id=dtl.id,
            name="LLM Proposed Test",
            input_json={"prompt": tests_raw[:120]},
            expected_output_json={"expected": tests_raw[:120]},
            description=tests_raw[:255],
        )
        db.add(fallback)
        generated_tests.append(fallback)

    logic_prompt = prompt_builder.logic(title=dtl.title, legal_text=dtl.legal_text[:1200])
    logic_raw, logic_parsed = llm_service.generate_structured(logic_prompt)
    logic_language = "Python"
    logic_code = logic_raw
    if isinstance(logic_parsed, dict):
        logic_language = logic_parsed.get("language") or logic_language
        if logic_parsed.get("code"):
            logic_code = logic_parsed["code"]
    logic_payload = schemas.LogicPayload(
        language=logic_language, code=f"# LLM Hint: {logic_raw[:200]}\n{logic_code}"
    )

    if dtl.ontology:
        dtl.ontology.ontology_owl = ontology_owl
        dtl.ontology.raw_response = ontology_raw
    else:
        dtl.ontology = models.DTLOntology(
            ontology_owl=ontology_owl, raw_response=ontology_raw
        )

    if dtl.interface:
        dtl.interface.interface_json = interface_json
        dtl.interface.mcp_spec = mcp_spec
    else:
        dtl.interface = models.DTLInterface(interface_json=interface_json, mcp_spec=mcp_spec)

    if dtl.configuration:
        dtl.configuration.configuration_owl = configuration_owl
    else:
        dtl.configuration = models.DTLConfiguration(configuration_owl=configuration_owl)

    if dtl.logic:
        dtl.logic.language = logic_payload.language
        dtl.logic.code = logic_payload.code
    else:
        dtl.logic = models.DTLLogic(language=logic_payload.language, code=logic_payload.code)

    db.add(dtl)
    db.add(dtl.ontology)
    db.commit()
    for test in generated_tests:
        db.refresh(test)

    return schemas.DTLGenerationResponse(
        ontology=schemas.OntologyPayload(ontology_owl=ontology_owl),
        ontology_raw=ontology_raw,
        interface=schemas.InterfacePayload(
            function_name=interface_json["function_name"],
            inputs=interface_json.get("inputs", []),
            outputs=interface_json.get("outputs", []),
            mcp_spec=mcp_spec,
        ),
        interface_raw=interface_raw,
        configuration=schemas.ConfigurationPayload(configuration_owl=configuration_owl),
        configuration_raw=configuration_raw,
        tests=[_serialize_test(test) for test in generated_tests],
        tests_raw=tests_raw,
        logic=logic_payload,
        logic_raw=logic_raw,
    )


@router.get("/{dtl_id}/review", response_model=schemas.ReviewRead)
def review_summary(db: Session = Depends(get_db), dtl: models.DTL = Depends(resolve_dtl)):
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


@router.post("/{dtl_id}/approve", response_model=schemas.ReviewRead)
def approve_dtl(
    payload: schemas.ReviewPayload | None = None,
    db: Session = Depends(get_db),
    dtl: models.DTL = Depends(resolve_dtl),
):
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


@router.post("/{dtl_id}/request-revision", response_model=schemas.ReviewRead)
def request_revision(
    payload: schemas.ReviewPayload | None = None,
    db: Session = Depends(get_db),
    dtl: models.DTL = Depends(resolve_dtl),
):
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


@router.get("/{dtl_id}/comments", response_model=List[schemas.CommentRead])
def list_comments(dtl: models.DTL = Depends(resolve_dtl)):
    comments = sorted(dtl.comments, key=lambda c: c.created_at)
    return [_serialize_comment(comment) for comment in comments]


@router.post("/{dtl_id}/comments", response_model=schemas.CommentRead, status_code=status.HTTP_201_CREATED)
def add_comment(
    payload: schemas.CommentCreate,
    db: Session = Depends(get_db),
    dtl: models.DTL = Depends(resolve_dtl),
):
    if not db.get(models.User, payload.author_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="author not found")
    comment = models.DTLComment(
        dtl_id=dtl.id,
        author_id=payload.author_id,
        role=payload.role,
        comment=payload.comment,
        comment_type=payload.comment_type,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _serialize_comment(comment)
