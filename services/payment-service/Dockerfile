# ── Stage 1: Build Payment Service ─────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/telemetry-engine/package.json ./packages/telemetry-engine/
COPY packages/instrumentation/package.json ./packages/instrumentation/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY services/api-gateway/package.json ./services/api-gateway/
COPY services/order-service/package.json ./services/order-service/
COPY services/payment-service/package.json ./services/payment-service/
COPY services/traffic-generator/package.json ./services/traffic-generator/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ ./packages/shared/
COPY packages/instrumentation/ ./packages/instrumentation/
COPY services/payment-service/ ./services/payment-service/

RUN pnpm --filter @cloudpulse/shared build && \
    pnpm --filter @cloudpulse/instrumentation build && \
    pnpm --filter @cloudpulse/payment-service build

# ── Stage 2: Production Runner ──────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4002
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

COPY --from=builder /app /app

USER node

EXPOSE 4002

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4002/health || exit 1

CMD ["node", "services/payment-service/dist/index.js"]
