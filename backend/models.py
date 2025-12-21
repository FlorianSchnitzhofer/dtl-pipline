from __future__ import annotations

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    external_id = Column(String(191), unique=True, nullable=False)
    display_name = Column(String(191), nullable=False)
    email = Column(String(191), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DTLIB(Base):
    __tablename__ = "dtlibs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    law_name = Column(String(255), nullable=False)
    law_identifier = Column(String(191), nullable=False)
    jurisdiction = Column(String(191), nullable=False)
    version = Column(String(64), nullable=False)
    effective_date = Column(Date, nullable=True)
    status = Column(String(32), default="Draft", nullable=False)
    authoritative_source_url = Column(Text, nullable=True)
    repository_url = Column(Text, nullable=True)
    repository_branch = Column(String(191), nullable=True)
    full_text = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dtls = relationship("DTL", back_populates="dtlib", cascade="all, delete-orphan")


class DTL(Base):
    __tablename__ = "dtls"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dtlib_id = Column(Integer, ForeignKey("dtlibs.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner_user_id = Column(String(191), nullable=True)
    version = Column(String(64), nullable=False)
    legal_text = Column(Text, nullable=False)
    legal_reference = Column(Text, nullable=False)
    source_url = Column(Text, nullable=True)
    classification = Column(JSON, nullable=True)
    status = Column(String(32), default="Draft", nullable=False)
    position = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dtlib = relationship("DTLIB", back_populates="dtls")
    ontology = relationship("DTLOntology", uselist=False, back_populates="dtl", cascade="all, delete-orphan")
    interface = relationship("DTLInterface", uselist=False, back_populates="dtl", cascade="all, delete-orphan")
    configuration = relationship("DTLConfiguration", uselist=False, back_populates="dtl", cascade="all, delete-orphan")
    logic = relationship("DTLLogic", uselist=False, back_populates="dtl", cascade="all, delete-orphan")
    review = relationship("DTLReview", uselist=False, back_populates="dtl", cascade="all, delete-orphan")
    tests = relationship("DTLTest", back_populates="dtl", cascade="all, delete-orphan")
    comments = relationship("DTLComment", back_populates="dtl", cascade="all, delete-orphan")


class SegmentationSuggestion(Base):
    __tablename__ = "dtl_segmentation_suggestions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dtlib_id = Column(Integer, ForeignKey("dtlibs.id"), nullable=False)
    suggestion_title = Column(String(255), nullable=False)
    suggestion_description = Column(Text, nullable=True)
    legal_text = Column(Text, nullable=False)
    legal_reference = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(32), default="Proposed", nullable=False)


class DTLOntology(Base):
    __tablename__ = "dtl_ontology"

    dtl_id = Column(Integer, ForeignKey("dtls.id"), primary_key=True)
    ontology_owl = Column(Text, nullable=False)
    raw_response = Column(Text, nullable=True)
    generated_by = Column(String(191), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dtl = relationship("DTL", back_populates="ontology")


class DTLInterface(Base):
    __tablename__ = "dtl_interface"

    dtl_id = Column(Integer, ForeignKey("dtls.id"), primary_key=True)
    interface_json = Column(JSON, nullable=False)
    mcp_spec = Column(JSON, nullable=True)
    generated_by = Column(String(191), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dtl = relationship("DTL", back_populates="interface")


class DTLConfiguration(Base):
    __tablename__ = "dtl_configuration"

    dtl_id = Column(Integer, ForeignKey("dtls.id"), primary_key=True)
    configuration_owl = Column(Text, nullable=False)
    generated_by = Column(String(191), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dtl = relationship("DTL", back_populates="configuration")


class DTLLogic(Base):
    __tablename__ = "dtl_logic"

    dtl_id = Column(Integer, ForeignKey("dtls.id"), primary_key=True)
    language = Column(String(64), default="Python", nullable=False)
    code = Column(Text, nullable=False)
    generated_by = Column(String(191), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dtl = relationship("DTL", back_populates="logic")


class DTLReview(Base):
    __tablename__ = "dtl_reviews"

    dtl_id = Column(Integer, ForeignKey("dtls.id"), primary_key=True)
    status = Column(String(32), default="Pending", nullable=False)
    approved_version = Column(String(64), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    last_comment = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dtl = relationship("DTL", back_populates="review")


class DTLTest(Base):
    __tablename__ = "dtl_tests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dtl_id = Column(Integer, ForeignKey("dtls.id"), nullable=False)
    name = Column(String(255), nullable=False)
    input_json = Column(JSON, nullable=False)
    expected_output_json = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    last_run_at = Column(DateTime, nullable=True)
    last_result = Column(String(16), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dtl = relationship("DTL", back_populates="tests")
    runs = relationship("DTLTestRun", back_populates="test", cascade="all, delete-orphan")


class DTLTestRun(Base):
    __tablename__ = "dtl_test_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey("dtl_tests.id"), nullable=False)
    executed_at = Column(DateTime, default=datetime.utcnow)
    result = Column(String(16), nullable=False)
    actual_output_json = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)

    test = relationship("DTLTest", back_populates="runs")


class DTLComment(Base):
    __tablename__ = "dtl_comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dtl_id = Column(Integer, ForeignKey("dtls.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(32), nullable=False)
    comment = Column(Text, nullable=False)
    comment_type = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dtl = relationship("DTL", back_populates="comments")


class GithubSyncEvent(Base):
    __tablename__ = "github_sync_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dtlib_id = Column(Integer, ForeignKey("dtlibs.id"), nullable=False)
    repository_url = Column(Text, nullable=False)
    branch = Column(String(191), nullable=False)
    commit_id = Column(String(191), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String(32), default="Started", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
