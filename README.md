
  # Assisted Translation Pipeline Interface

  This is a code bundle for Assisted Translation Pipeline Interface. The original project is available at https://www.figma.com/design/8fTAEbr5yrSKh4imt0xyAj/Assisted-Translation-Pipeline-Interface.

  ## Running the code

  Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

Run `npm start` to build the frontend bundle and serve it from `server.js`. Requests to
`/api`, `/docs`, and `/openapi.json` are proxied to the backend URL set by the
`API_PROXY_TARGET` environment variable (defaults to `http://localhost:8000`), so the
REST API, Swagger UI, and OpenAPI schema are reachable from the same public host as the
static site.

When the backend is deployed behind a TLS-terminating proxy (for example, on Azure App
Service), set `AZURE_SITE_HOSTNAME` or `API_PUBLIC_BASE_URL` so the generated OpenAPI
schema uses the external HTTPS URL. You can override the default path prefix with
`API_PREFIX` and restrict CORS origins with `API_CORS_ALLOW_ORIGINS` (comma-separated
hostnames or `*` for all).

  A docker-compose stack is included for local integration testing. The backend now
  defaults to the bundled MariaDB service (`db`) with credentials `dtl`/`dtl`, and the
  frontend container proxies `/api` requests directly to the backend, so the UI and API
  work together without additional configuration.

  The Vite development server also proxies `/api` to `http://localhost:8000` by default.
  Override the target with `VITE_API_PROXY_TARGET` if your backend runs elsewhere.

  ## Database configuration

  The backend is configured to connect to the external MySQL instance at `k2gn.your-database.de` with the database `db_dtal_pipeline` and user `admin_user`.

  Provide the password via the `SQL_DB_PASSWORD` environment variable (or a full override via `DATABASE_URL`). Optional overrides for host, user, and database name are available through `SQL_DB_HOST`, `SQL_DB_USER`, and `SQL_DB_NAME`.
  
## Local development
- Backend API: `PYTHONPATH=src uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`
- Frontend UI: `npm run dev -- --host 0.0.0.0 --port 3000`
- Container stack: `docker-compose up --build --remove-orphans`
