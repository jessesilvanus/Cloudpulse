# ── Stage 1: Build TypeScript Backend ──────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

# Copy workspace package manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/telemetry-engine/package.json ./packages/telemetry-engine/
COPY packages/instrumentation/package.json ./packages/instrumentation/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/telemetry-engine/ ./packages/telemetry-engine/
COPY packages/instrumentation/ ./packages/instrumentation/
COPY apps/api/ ./apps/api/

# Build all dependencies and API application
RUN pnpm --filter @cloudpulse/shared build && \
    pnpm --filter @cloudpulse/telemetry-engine build && \
    pnpm --filter @cloudpulse/instrumentation build && \
    pnpm --filter @cloudpulse/api build

# ── Stage 2: Production Node.js Runner ──────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318

# Enable pnpm in runner for workspace resolution
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

# Copy built node_modules and built dist folders from builder
COPY --from=builder /app /app

# Run as non-root node user for container security
USER node

EXPOSE 3001 4318

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/index.js"]
