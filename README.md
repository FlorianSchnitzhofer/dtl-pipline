
  # Assisted Translation Pipeline Interface

  This is a code bundle for Assisted Translation Pipeline Interface. The original project is available at https://www.figma.com/design/8fTAEbr5yrSKh4imt0xyAj/Assisted-Translation-Pipeline-Interface.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  A docker-compose stack is included for local integration testing. The backend now
  defaults to the bundled MariaDB service (`db`) with credentials `dtl`/`dtl`, and the
  frontend container proxies `/api` requests directly to the backend, so the UI and API
  work together without additional configuration.

  ## Database configuration

  The backend is configured to connect to the external MySQL instance at `k2gn.your-database.de` with the database `db_dtal_pipeline` and user `admin_user`.

  Provide the password via the `SQL_DB_PASSWORD` environment variable (or a full override via `DATABASE_URL`). Optional overrides for host, user, and database name are available through `SQL_DB_HOST`, `SQL_DB_USER`, and `SQL_DB_NAME`.
  
## Local development
- Backend API: `PYTHONPATH=src uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`
- Frontend UI: `npm run dev -- --host 0.0.0.0 --port 5173`
- Container stack: `docker-compose up --build --remove-orphans`
