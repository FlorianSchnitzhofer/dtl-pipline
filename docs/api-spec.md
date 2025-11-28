# DTAL Assistant REST API Specification

This document defines the REST over HTTPS interface for the DTAL Assistant backend. All endpoints accept and return JSON unless stated otherwise.

## General Conventions
- **Base URL:** `/api/v1`
- **Authentication:** Bearer tokens via `Authorization: Bearer <token>` header. Endpoints requiring elevated permissions are noted.
- **Content-Type:** `application/json; charset=utf-8`
- **Idempotency:** `PUT` and `DELETE` operations are idempotent. `POST` operations that mutate state are not unless otherwise stated.
- **Pagination:** Responses returning collections support `?limit` (default 20, max 100) and `?offset` (default 0).
- **Filtering & Sorting:** Collection endpoints MAY accept `?q=<string>` (full-text search), `?sort=<field>:<asc|desc>`.
- **Error Format:**
  ```json
  {
    "error": "short_machine_readable_code",
    "message": "Human-readable description",
    "details": {"field": "explanation"},
    "trace_id": "uuid"
  }
  ```

## Domain Identifiers
- `project_id`: Unique UUID for a DTAL drafting project.
- `function_id`, `ontology_id`, `config_id`, `test_id`, `logic_id`, `segment_id`, `api_id`, `decision_id`: UUIDs per resource type.

## Project & Legal Text Management
### Create Project
`POST /projects`
- **Body:**
  ```json
  {
    "name": "Municipal Tax DTAL",
    "description": "Drafting DTAL for municipal tax statute"
  }
  ```
- **201 Response:** Project resource with timestamps.

### List Projects
`GET /projects`
- **Query:** `?q`, `?limit`, `?offset`
- **200 Response:** Paginated list of projects.

### Get Project
`GET /projects/{project_id}`
- **200 Response:** Project details, creation metadata.

### Update Project
`PUT /projects/{project_id}`
- **Body:** `name`, `description`, optional status `draft|in_review|published`.
- **200 Response:** Updated project.

### Delete Project
`DELETE /projects/{project_id}` (requires admin)
- **204 Response:** No body.

### Upload Legal Text
`POST /projects/{project_id}/legal-text`
- **Body:**
  ```json
  {
    "source_type": "text|url|file",
    "content": "Full statute text or URL",
    "language": "en",
    "metadata": {"jurisdiction": "", "citation": "", "version_date": "YYYY-MM-DD"}
  }
  ```
- **202 Response:** Upload accepted; returns `segment_job_id` for preprocessing.

### Check Preprocessing Status
`GET /projects/{project_id}/legal-text/jobs/{segment_job_id}`
- **200 Response:** `{ "status": "pending|running|succeeded|failed", "message": "..." }`

### List Segments
`GET /projects/{project_id}/segments`
- **200 Response:** Array of segmented legal text portions with anchors (paragraph/sentence references) and tokens for traceability.

## Function Slicing (Legal Functions)
### Create Function
`POST /projects/{project_id}/functions`
- **Body:**
  ```json
  {
    "label": "Compute municipal tax base",
    "source_segment_id": "segment_id",
    "summary": "Determines taxable base for municipal property tax",
    "order": 1
  }
  ```
- **201 Response:** Function resource with traceability link to segment.

### List Functions
`GET /projects/{project_id}/functions`
- Supports `?order_by=order` sorting.

### Update Function
`PUT /projects/{project_id}/functions/{function_id}`
- **Body:** Fields from creation plus optional `status` (`draft|approved|deprecated`).

### Reorder Functions
`POST /projects/{project_id}/functions:reorder`
- **Body:** `{ "order": ["function_id1", "function_id2", ...] }`
- **200 Response:** Functions with updated `order` values.

### Delete Function
`DELETE /projects/{project_id}/functions/{function_id}`
- **204 Response.**

## Ontology Creation
### Create Ontology Concept
`POST /projects/{project_id}/ontology`
- **Body:**
  ```json
  {
    "term": "TaxableEntity",
    "type": "class|property|relation",
    "description": "Legal entity subject to taxation",
    "source_segment_id": "segment_id",
    "attributes": [{"name": "residency", "datatype": "string", "required": false}]
  }
  ```
- **201 Response:** Ontology concept with version and traceability data.

### List Ontology Concepts
`GET /projects/{project_id}/ontology`

### Update Ontology Concept
`PUT /projects/{project_id}/ontology/{ontology_id}`
- Supports version increment via `"increment_version": true` flag.

### Delete Ontology Concept
`DELETE /projects/{project_id}/ontology/{ontology_id}`
- **204 Response.**

## API Definition Layer
### Generate API from Function
`POST /projects/{project_id}/functions/{function_id}/api`
- **Body:**
  ```json
  {
    "summary": "Calculates municipal tax base",
    "input_parameters": [{"name": "assessed_value", "type": "number", "required": true, "description": "Property value"}],
    "output_schema": {"type": "object", "properties": {"tax_base": {"type": "number"}}},
    "validation_rules": ["assessed_value >= 0"],
    "ontology_refs": ["TaxableEntity"],
    "mcp_schema": {"name": "calcTaxBase", "version": "1.0"}
  }
  ```
- **201 Response:** API definition linked to function.

### Get API Definition
`GET /projects/{project_id}/functions/{function_id}/api/{api_id}`

### Update API Definition
`PUT /projects/{project_id}/functions/{function_id}/api/{api_id}`

### List APIs
`GET /projects/{project_id}/apis`
- Aggregated across functions.

## Configuration Extraction
### Create Configuration Item
`POST /projects/{project_id}/config`
- **Body:**
  ```json
  {
    "key": "municipal_tax_rate",
    "type": "number|string|boolean|enum|date",
    "value": 0.015,
    "description": "Default municipal tax rate",
    "source_segment_id": "segment_id",
    "version": 1
  }
  ```
- **201 Response.**

### List Configuration Items
`GET /projects/{project_id}/config`

### Update Configuration Item
`PUT /projects/{project_id}/config/{config_id}`
- Supports `"version": <int>` bump and `"is_active": true|false`.

### Delete Configuration Item
`DELETE /projects/{project_id}/config/{config_id}`
- **204 Response.**

## Test Case Drafting
### Create Test Case
`POST /projects/{project_id}/functions/{function_id}/tests`
- **Body:**
  ```json
  {
    "title": "Typical residential property",
    "description": "Base calculation for standard property",
    "inputs": {"assessed_value": 250000},
    "expected_output": {"tax_base": 250000},
    "kind": "typical|edge|exceptional"
  }
  ```
- **201 Response:** Test case with `status` (`draft|approved`).

### List Test Cases
`GET /projects/{project_id}/functions/{function_id}/tests`

### Update Test Case
`PUT /projects/{project_id}/functions/{function_id}/tests/{test_id}`

### Delete Test Case
`DELETE /projects/{project_id}/functions/{function_id}/tests/{test_id}`
- **204 Response.**

## Logic Drafting
### Submit Logic Draft
`POST /projects/{project_id}/functions/{function_id}/logic`
- **Body:**
  ```json
  {
    "language": "python|dsl",
    "content": "def compute_tax(...): ...",
    "references": ["segment_id", "ontology_id"],
    "configuration_dependencies": ["config_id1", "config_id2"]
  }
  ```
- **201 Response:** Logic draft with version and author metadata.

### Get Logic Drafts
`GET /projects/{project_id}/functions/{function_id}/logic`
- Supports `?version=<int>` to fetch a specific version.

### Promote Logic Draft
`POST /projects/{project_id}/functions/{function_id}/logic/{logic_id}:promote`
- Marks logic as `approved` and ready for execution.

### Delete Logic Draft
`DELETE /projects/{project_id}/functions/{function_id}/logic/{logic_id}`

## Traceability & Decision Logs
### Record Decision
`POST /projects/{project_id}/decisions`
- **Body:**
  ```json
  {
    "related_resource": {"type": "function|ontology|config|logic|test", "id": "uuid"},
    "reasoning": "LLM interpreted paragraph 3 as...",
    "source_segment_id": "segment_id",
    "author": "string"
  }
  ```
- **201 Response:** Decision log entry.

### List Decisions
`GET /projects/{project_id}/decisions`
- Supports filtering by `?resource_type` and `?resource_id`.

## DTAL Overview
### Get Project Overview
`GET /projects/{project_id}/overview`
- **200 Response:** Aggregated view including functions, ontology, configurations, API definitions, logic drafts, tests, and traceability links.

## MCP Integration
### Export MCP Schema
`GET /projects/{project_id}/functions/{function_id}/api/{api_id}/mcp`
- Returns machine-readable Model Context Protocol schema JSON for tooling integration.

## Health & Metadata
### Service Health
`GET /health`
- **200 Response:** `{ "status": "ok", "version": "semver" }`

### API Version Metadata
`GET /meta`
- **200 Response:** Supported feature flags, maximum payload sizes, and rate limit policy.

## Security & Compliance Notes
- All write endpoints require authentication; some destructive actions additionally require an admin or project-owner role.
- Audit logging is enabled for all state-changing requests, including user and timestamp.
- For statutory traceability, endpoints accept `source_segment_id` to link resources back to the original legal text.

## Validation Highlights
- All UUID path parameters must be valid RFC 4122 strings.
- Numeric configuration values enforce type checking and optional ranges via `validation_rules` where applicable.
- Text inputs must be UTF-8 and may be length-limited per backend configuration.

## Rate Limiting
- Suggested default: 120 requests/minute per token; responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers when applicable.

## Versioning
- Breaking changes result in a new base path (e.g., `/api/v2`). Deprecations are signaled via `Deprecation` headers and changelog entries in `/meta`.
