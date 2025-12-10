# Assisted Translation Pipeline Interface

This is a code bundle for Assisted Translation Pipeline Interface. The original project is available at https://www.figma.com/design/8fTAEbr5yrSKh4imt0xyAj/Assisted-Translation-Pipeline-Interface.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Building a Docker image

The frontend can be containerized for deployment (for example, alongside a backend in Azure Container Apps) using the included Dockerfile:

```bash
docker build -t dtl-frontend ./frontend
```

To run the container locally and expose it on port 8080:

```bash
docker run -p 8080:80 dtl-frontend
```

The image now ships with an HTTPS listener (self-signed for local use). To expose HTTPS on port 8443 instead of HTTP:

```bash
docker run -p 8443:443 dtl-frontend
```

For production deployments, mount your own certificate and key into `/etc/nginx/certs` so that the HTTPS listener presents a trusted certificate:

```bash
docker run \
  -p 80:80 -p 443:443 \
  -v /path/to/fullchain.pem:/etc/nginx/certs/server.crt:ro \
  -v /path/to/privkey.pem:/etc/nginx/certs/server.key:ro \
  dtl-frontend
```

If you need to point the application at a specific backend API, you can either:

1. Set the `VITE_API_BASE_URL` build argument so the frontend makes direct calls to the backend:

```bash
docker build -t dtl-frontend \
  --build-arg VITE_API_BASE_URL="https://your-backend.example.com/api" \
  ./frontend
```

2. Configure the runtime Nginx reverse proxy using environment variables when running the container (useful in platforms like Azure App Service where the backend is reachable via a DNS name instead of the Docker Compose service name):

```bash
docker run \
  -e BACKEND_BASE_URL="https://your-backend.example.com/api" \
  -e NGINX_RESOLVER="1.1.1.1 8.8.8.8" \
  -p 8080:80 \
  dtl-frontend
```

`BACKEND_BASE_URL` defaults to `http://backend:8000`. If you do not provide `NGINX_RESOLVER`, the container will automatically use the nameservers from `/etc/resolv.conf` (falling back to `127.0.0.11`), keeping local Docker Compose behaviour unchanged while enabling hosted deployments to resolve the backend correctly.

