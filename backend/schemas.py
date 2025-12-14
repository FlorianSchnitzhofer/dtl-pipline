from __future__ import annotations

from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    external_id: str
    display_name: str
    email: str


class UserRead(UserCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class DTLIBBase(BaseModel):
    law_name: str
    law_identifier: str
    jurisdiction: str
    version: str
    effective_date: Optional[date] = None
    status: Optional[str] = "Draft"
    authoritative_source_url: Optional[str] = None
    repository_url: Optional[str] = None
    repository_branch: Optional[str] = None
    full_text: str


class DTLIBCreate(DTLIBBase):
    created_by: int = Field(..., description="User ID")


class DTLIBUpdate(BaseModel):
    law_name: Optional[str] = None
    law_identifier: Optional[str] = None
    jurisdiction: Optional[str] = None
    effective_date: Optional[date] = None
    status: Optional[str] = None
    authoritative_source_url: Optional[str] = None
    repository_url: Optional[str] = None
    repository_branch: Optional[str] = None
    full_text: Optional[str] = None


class DTLIBRead(DTLIBBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class DTLBase(BaseModel):
    title: str
    description: Optional[str] = None
    owner_user_id: Optional[int] = None
    version: str
    legal_text: str
    legal_reference: str
    source_url: Optional[str] = None
    classification: Optional[Any] = None
    status: Optional[str] = "Draft"
    position: Optional[int] = 0


class DTLCreate(DTLBase):
    pass


class DTLUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    owner_user_id: Optional[int] = None
    legal_text: Optional[str] = None
    legal_reference: Optional[str] = None
    source_url: Optional[str] = None
    classification: Optional[Any] = None
    status: Optional[str] = None
    position: Optional[int] = None


class DTLRead(DTLBase):
    id: int
    dtlib_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class SegmentationSuggestionCreate(BaseModel):
    suggestion_title: str
    suggestion_description: Optional[str] = None
    legal_text: str
    legal_reference: str
    created_by: Optional[int] = None


class SegmentationSuggestionRead(SegmentationSuggestionCreate):
    id: int
    dtlib_id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True


class OntologyPayload(BaseModel):
    ontology_owl: str


class InterfacePayload(BaseModel):
    function_name: str
    inputs: list
    outputs: list
    mcp_spec: Optional[Any] = None


class ConfigurationPayload(BaseModel):
    configuration_owl: str


class TestCaseBase(BaseModel):
    name: str
    input: Any
    expected_output: Any
    description: Optional[str] = None


class TestCaseCreate(TestCaseBase):
    pass


class TestCaseUpdate(BaseModel):
    name: Optional[str] = None
    input: Optional[Any] = None
    expected_output: Optional[Any] = None
    description: Optional[str] = None


class TestCaseRead(TestCaseBase):
    id: int
    dtl_id: int
    last_run_at: Optional[datetime] = None
    last_result: Optional[str] = None

    class Config:
        orm_mode = True


class LogicPayload(BaseModel):
    language: str = "Python"
    code: str


class DTLGenerationResponse(BaseModel):
    ontology: OntologyPayload
    ontology_raw: str
    interface: InterfacePayload
    interface_raw: str
    configuration: ConfigurationPayload
    configuration_raw: str
    tests: List[TestCaseRead]
    tests_raw: str
    logic: LogicPayload
    logic_raw: str


class ReviewPayload(BaseModel):
    comment: Optional[str] = None
    approved_version: Optional[str] = None


class ReviewRead(BaseModel):
    status: str
    approved_version: Optional[str]
    approved_at: Optional[datetime]
    last_comment: Optional[str]


class CommentCreate(BaseModel):
    comment: str
    role: str = "Viewer"
    comment_type: Optional[str] = None
    author_id: int


class CommentRead(CommentCreate):
    id: int
    dtl_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class OverviewSnapshot(BaseModel):
    dtlib: DTLIBRead
    dtls: List[DTLRead]
    dtls_status: dict
    aggregated_ontology: Optional[str] = None
    aggregated_configuration: Optional[str] = None
    interface_surface: Optional[list] = None
    traceability: Optional[list] = None
