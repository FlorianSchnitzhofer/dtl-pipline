# Build stage
FROM node:18 AS build
WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Build application
COPY frontend ./
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy Nginx template and entrypoint so the upstream backend and resolver can
# be configured at runtime (e.g., in Azure App Service) instead of being
# hard-coded to the Docker Compose network values.
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
CMD ["/docker-entrypoint.sh"]
