# Assisted Translation Pipeline Interface

This is a code bundle for Assisted Translation Pipeline Interface. The original project is available at https://www.figma.com/design/8fTAEbr5yrSKh4imt0xyAj/Assisted-Translation-Pipeline-Interface.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server. Set `VITE_API_BASE_URL` in a `.env` file or your shell to point directly to the backend API (for example, `http://localhost:8000/api`).

## Building a Docker image

The frontend can be containerized for deployment (for example, alongside a backend in Azure Container Apps) using the included Dockerfile:

```bash
docker build -t dtl-frontend .
```

To run the container locally and expose it on port 8080:

```bash
docker run -p 8080:80 dtl-frontend
```

To point the built image at a specific backend API, provide the `VITE_API_BASE_URL` build argument so the frontend makes direct calls to the backend:

```bash
docker build -t dtl-frontend \
  --build-arg VITE_API_BASE_URL="https://your-backend.example.com/api" \
  .
```

The image serves the static site with Nginx only; configure the backend to allow CORS from the frontend origin.
