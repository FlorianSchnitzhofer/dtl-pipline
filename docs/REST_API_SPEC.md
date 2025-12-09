# Digital Twins of Legislation (DTL) REST API Specification

## Overview
The DTL REST API exposes endpoints to manage Digital Twin Libraries (DTLIBs) and their Digital Twins of Legislation (DTLs). DTLIBs represent statutes in specific consolidated versions, while DTLs encapsulate self-contained legal rules derived from those statutes. The API is consumed over HTTPS by React TypeScript frontends and implemented with Python backend services.

### Authentication and Authorization
- OAuth2 bearer tokens issued by Microsoft Entra ID (Azure AD).
- Include `Authorization: Bearer <token>` in each request.
- Role-based access control:
  - **Legal Engineers / Modelers (Editors):** create and modify DTLIBs and DTLs.
  - **Domain Experts / Reviewers:** review and approve content (with appropriate permissions).
  - **Viewers:** read-only access.
- Users must have access to a DTLIB to view or modify its contents. Unauthorized requests return `401 Unauthorized`; forbidden actions return `403 Forbidden`.

### Data, Versioning, and Format
- JSON request/response bodies; timestamps are ISO 8601 UTC.
- Each DTLIB and DTL has a stable unique ID and version metadata.
- A new DTLIB is created for each statute version; DTLs inherit their parent DTLIB version.
- Standard HTTP status codes communicate success or failure.

### GitHub Integration
- A DTLIB can be linked to an external repository for artifact synchronization (ontology, configuration, interfaces, tests, logic).
- The backend performs Git operations; the API initiates synchronization and returns summary metadata (e.g., commit ID).

## DTLIB Endpoints
### List DTLIBs — `GET /api/dtlibs`
Returns accessible DTLIBs with key metadata.
- **Query Parameters:** `search`, `jurisdiction`, `status`, pagination options (`limit`/`offset` or `page`/`pageSize`).
- **Response 200:** array of objects with at least `id`, `law_name`, `law_identifier`, `jurisdiction`, `version`, `status`, optional `effective_date`, `authoritative_source_url`.
- **Errors:** 401, 403.

### Create DTLIB — `POST /api/dtlibs`
Creates a new library for a statute.
- **Body:** `law_name` (req), `law_identifier` (req), `jurisdiction` (req), `version` (req), optional `effective_date`, `authoritative_source_url`, `full_text`, `status` (default Draft), `repository_url`, `repository_branch`.
- **Response 201:** full DTLIB object with generated `id`, timestamps, `Location` header.
- **Errors:** 400, 401, 403, 409.

### Get DTLIB — `GET /api/dtlibs/{dtlibId}`
Returns detailed DTLIB metadata including `full_text`.
- **Errors:** 401, 403, 404.

### Update DTLIB — `PUT /api/dtlibs/{dtlibId}`
Updates metadata or law text (not identity fields like `version`/`law_identifier`).
- **Body:** any of `law_name`, `law_identifier`, `jurisdiction`, `effective_date`, `authoritative_source_url`, `full_text`, `status`, `repository_url`, `repository_branch`.
- **Response 200:** updated DTLIB.
- **Errors:** 400, 401, 403, 404.

### Delete DTLIB — `DELETE /api/dtlibs/{dtlibId}`
Deletes a DTLIB and associated DTLs.
- **Response 204** on success.
- **Errors:** 401, 403, 404.

### Segment Law Text — `POST /api/dtlibs/{dtlibId}/segment`
Generates AI-assisted segmentation suggestions for DTL creation.
- **Prerequisite:** `full_text` present.
- **Response 200:** array of suggestions with `suggestion_id`, `title`, `description`, `legal_text`, `legal_reference`.
- **Errors:** 400 (missing text), 401, 403, 404.

### Governance Overview — `GET /api/dtlibs/{dtlibId}/overview`
Aggregated snapshot of DTLIB and DTL statuses, ontology, configuration, interface surface, and traceability.
- **Response 200:** includes `dtlib` metadata, `dtls_status`, `aggregated_ontology`, `aggregated_configuration`, `interface_surface`, `traceability`.
- **Errors:** 401, 403, 404.

### Sync with GitHub — `POST /api/dtlibs/{dtlibId}/sync`
Initiates repository synchronization.
- **Response 200:** summary with `repository_url`, `branch`, `commit_id`, message. **Response 202** optional for async processing.
- **Errors:** 400 (no repo configured), 401, 403, 404.

## DTL Endpoints
DTLs are scoped under a DTLIB: `/api/dtlibs/{dtlibId}/dtls`.

### List DTLs — `GET /api/dtlibs/{dtlibId}/dtls`
- **Query Parameters:** `search`, `status`, `owner`.
- **Response 200:** array of DTL metadata (`id`, `dtlib_id`, `title`, `description`, `owner`, `version`, `legal_reference`, `status`).
- **Errors:** 401, 403, 404.

### Create DTL — `POST /api/dtlibs/{dtlibId}/dtls`
- **Body:** `title` (req), `legal_text` (req), `legal_reference` (req), optional `description`, `owner`, `classification`.
- **Response 201:** full DTL object with `Location` header.
- **Errors:** 400, 401, 403, 404.

### Get DTL — `GET /api/dtlibs/{dtlibId}/dtls/{dtlId}`
Returns Stage 0 metadata including `legal_text` and `legal_reference`.
- **Errors:** 401, 403, 404.

### Update DTL — `PUT /api/dtlibs/{dtlibId}/dtls/{dtlId}`
Updates metadata/legal snippet.
- **Body:** any of `title`, `description`, `owner`, `legal_text`, `legal_reference`, `source_url`, `classification`, `status` (if allowed).
- **Response 200** with updated DTL.
- **Errors:** 400, 401, 403, 404.

### Delete DTL — `DELETE /api/dtlibs/{dtlibId}/dtls/{dtlId}`
Removes a DTL and its artifacts.
- **Response 204** on success.
- **Errors:** 401, 403, 404.

## DTL Ontology (Stage 1)
### Get Ontology — `GET /api/dtlibs/{dtlibId}/dtls/{dtlId}/ontology`
- **Response 200:** `{ "ontology_owl": "<OWL content>" }`; **204** if none.
- **Errors:** 401, 403, 404.

### Save Ontology — `PUT /api/dtlibs/{dtlibId}/dtls/{dtlId}/ontology`
- **Body:** `{ "ontology_owl": "<OWL content>" }`.
- **Response 200/201** on success.
- **Errors:** 400 (invalid content), 401, 403, 404.

### Generate Ontology Proposal — `POST /api/dtlibs/{dtlibId}/dtls/{dtlId}/ontology/generate`
- **Response 200:** proposed `{ "ontology_owl": "<OWL content>" }`; **202** optional for async.
- **Errors:** 400 (missing legal text), 401, 403, 404.

## DTL Interface Specification (Stage 2)
### Get Interface — `GET /api/dtlibs/{dtlibId}/dtls/{dtlId}/interface`
- **Response 200:** interface JSON (`function_name`, `inputs`, `outputs`); **204** if not defined.
- **Errors:** 401, 403, 404.

### Save Interface — `PUT /api/dtlibs/{dtlibId}/dtls/{dtlId}/interface`
- **Body:** interface JSON with `function_name`, `inputs`, `outputs`.
- **Response 200/201** on success.
- **Errors:** 400, 401, 403, 404.

### Generate Interface Proposal — `POST /api/dtlibs/{dtlibId}/dtls/{dtlId}/interface/generate`
- **Response 200:** suggested interface; **204** if none.
- **Errors:** 401, 403, 404.

## DTL Configuration (Stage 3)
### Get Configuration — `GET /api/dtlibs/{dtlibId}/dtls/{dtlId}/configuration`
- **Response 200:** `{ "parameters": [ { "name", "value", "unit", "description" } ] }`; **204** if none.
- **Errors:** 401, 403, 404.

### Save Configuration — `PUT /api/dtlibs/{dtlibId}/dtls/{dtlId}/configuration`
- **Body:** `{ "parameters": [...] }`.
- **Response 200/201** on success.
- **Errors:** 400, 401, 403, 404.

### Generate Configuration Proposal — `POST /api/dtlibs/{dtlibId}/dtls/{dtlId}/configuration/generate`
- **Response 200:** proposed parameters; **204** if none.
- **Errors:** 401, 403, 404.

## DTL Test Cases (Stage 4)
### List Tests — `GET /api/dtlibs/{dtlibId}/dtls/{dtlId}/tests`
- **Response 200:** array of test cases (`id`, `name`, `input`, `expected_output`, `description`, `last_run`, `last_result`).
- **Errors:** 401, 403, 404.

### Create Test — `POST /api/dtlibs/{dtlibId}/dtls/{dtlId}/tests`
- **Body:** `name`, `input`, `expected_output`, optional `description`.
- **Response 201:** created test.
- **Errors:** 400, 401, 403, 404.

### Get Test — `GET /api/dtlibs/{dtlibId}/dtls/{dtlId}/tests/{testId}`
- **Response 200:** test case.
- **Errors:** 401, 403, 404.

### Update Test — `PUT /api/dtlibs/{dtlibId}/dtls/{dtlId}/tests/{testId}`
- **Body:** updated test fields.
- **Response 200:** updated test.
- **Errors:** 400, 401, 403, 404.

### Delete Test — `DELETE /api/dtlibs/{dtlibId}/dtls/{dtlId}/tests/{testId}`
- **Response 204:** deleted.
- **Errors:** 401, 403, 404.

### Run Tests — `POST /api/dtlibs/{dtlibId}/dtls/{dtlId}/tests/run`
- **Response 200:** execution summary with results per test; includes `actual_output` on failures.
- **Errors:** 400 (logic missing/invalid tests), 401, 403, 404, 500.

### Generate Test Proposals — `POST /api/dtlibs/{dtlibId}/dtls/{dtlId}/tests/generate`
- **Response 200:** suggested test cases; **204** if none.
- **Errors:** 401, 403, 404.

## DTL Logic (Stage 5)
### Get Logic — `GET /api/dtlibs/{dtlibId}/dtls/{dtlId}/logic`
- **Response 200:** `{ "language": "Python", "code": "<implementation>" }`; **204** if none.
- **Errors:** 401, 403, 404.

### Save Logic — `PUT /api/dtlibs/{dtlibId}/dtls/{dtlId}/logic`
- **Body:** `{ "language": "Python", "code": "<implementation>" }`.
- **Response 200:** confirmation; may include `updated_at`.
- **Errors:** 400 (syntax/validation errors), 401, 403, 404.

### Generate Logic Proposal — `POST /api/dtlibs/{dtlibId}/dtls/{dtlId}/logic/generate`
- **Response 200:** proposed `{ "language", "code" }`; **204** if none.
- **Errors:** 401, 403, 404.

## DTL Review and Approval (Stage 6)
### Review Summary — `GET /api/dtlibs/{dtlibId}/dtls/{dtlId}/review`
Aggregates metadata, ontology summary, configuration, interface, test results, logic snippet, and traceability for review.
- **Response 200:** review summary payload.
- **Errors:** 401, 403, 404.

### Approve DTL — `POST /api/dtlibs/{dtlibId}/dtls/{dtlId}/approve`
- **Body (optional):** `comment`, `approved_version`.
- **Response 200:** updated status (`Approved`) with `approved_at`.
- **Errors:** 400 (invalid state), 401, 403, 404.

### Request Revision — `POST /api/dtlibs/{dtlibId}/dtls/{dtlId}/request-revision`
- **Body (optional):** `comment` explaining required changes.
- **Response 200:** status set to `Revision Requested`.
- **Errors:** 400, 401, 403, 404.

### List Comments — `GET /api/dtlibs/{dtlibId}/dtls/{dtlId}/comments`
- **Response 200:** array of comments with `id`, `author`, `role`, `comment`, `timestamp`.
- **Errors:** 401, 403, 404.

### Add Comment — `POST /api/dtlibs/{dtlibId}/dtls/{dtlId}/comments`
- **Body:** `comment` text, optional `type`.
- **Response 201:** created comment with metadata.
- **Errors:** 400, 401, 403, 404.

## HTTP Status Codes
- **200 OK:** success with response data.
- **201 Created:** resource created; `Location` header when applicable.
- **202 Accepted:** async processing accepted.
- **204 No Content:** success without body or data absent.
- **400 Bad Request:** invalid input or business rule conflict.
- **401 Unauthorized:** missing/invalid authentication.
- **403 Forbidden:** authenticated but insufficient permissions.
- **404 Not Found:** resource missing or inaccessible.
- **409 Conflict:** duplicate resource conflicts.
- **500 Internal Server Error:** unexpected server error.

## Traceability and Workflow Notes
- DTLs maintain traceability to legal text via `legal_text` and `legal_reference`; ontology, interface, configuration, and logic should align with these references.
- Editing `full_text` or `legal_text` may require revisiting downstream artifacts for consistency; clients should warn users accordingly.
- GitHub sync captures ontology, configuration, interface definitions, logic, tests, and traceability documentation for auditability.
