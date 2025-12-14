# Build frontend assets
FROM node:18 AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# Runtime image with backend + static assets
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend /app/backend
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

ENV SQL_DB_HOST=db \
    SQL_DB_USER=dtl \
    SQL_DB_NAME=dtl \
    SQL_DB_PASSWORD=dtl \
    API_PREFIX=/api \
    FRONTEND_DIST_PATH=/app/frontend/dist

EXPOSE 80

CMD ["bash", "-lc", "PORT=${PORT:-80}; uvicorn backend.app:app --host 0.0.0.0 --port ${PORT}"]
