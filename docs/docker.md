# CLOUDPULSE — Docker & Containerization Guide

## 1. Overview

Every service and application in CLOUDPULSE is fully containerized using multi-stage Docker builds. This ensures minimal image footprints, deterministic dependency installation, non-root execution, and complete reproducibility across local and cloud environments.

---

## 2. Containerized Services Matrix

| Service | Base Image | Build Stage | Runtime Image | Exposed Ports | Health Endpoint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`cloudpulse-web`** | `node:20-alpine` | Vite + TypeScript compile | `nginx:1.27-alpine` | `80` (HTTP) | `GET /health` |
| **`cloudpulse-api`** | `node:20-alpine` | pnpm workspace compile | `node:20-alpine` (user `node`) | `3001` (API), `4318` (OTLP) | `GET /health`, `GET /ready` |
| **`api-gateway`** | `node:20-alpine` | pnpm workspace compile | `node:20-alpine` (user `node`) | `4000` (HTTP) | `GET /health`, `GET /ready` |
| **`order-service`** | `node:20-alpine` | pnpm workspace compile | `node:20-alpine` (user `node`) | `4001` (HTTP) | `GET /health`, `GET /ready` |
| **`payment-service`**| `node:20-alpine` | pnpm workspace compile | `node:20-alpine` (user `node`) | `4002` (HTTP) | `GET /health`, `GET /ready` |
| **`traffic-generator`**| `node:20-alpine`| pnpm workspace compile | `node:20-alpine` (user `node`) | N/A (Client) | N/A |

---

## 3. Multi-Stage Dockerfile Patterns

Every backend Dockerfile follows the standard hardened pattern:

```dockerfile
# Stage 1: Build TypeScript workspace
FROM node:20-alpine AS builder
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
...
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter <target-package> build

# Stage 2: Minimal runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app
USER node
EXPOSE <port>
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:<port>/health || exit 1
CMD ["node", "<dist-entrypoint>"]
```

---

## 4. Docker Compose Local Operations

To launch the complete production-like stack locally:

```bash
# Start all containers in background
docker compose up -d

# Check status of all containers and healthchecks
docker compose ps

# Follow logs from a specific microservice
docker compose logs -f api-gateway

# Tear down the stack and remove persistent volumes
docker compose down -v
```

---

## 5. Container DNS Networking

Inside the Docker network (`cloudpulse-net`), services do not communicate via `localhost`. Instead, standard container DNS hostnames are used:

- `http://api-gateway:4000`
- `http://order-service:4001`
- `http://payment-service:4002`
- `http://otel-collector:4318`
- `http://prometheus:9090`
- `http://loki:3100`
- `http://tempo:3200`
