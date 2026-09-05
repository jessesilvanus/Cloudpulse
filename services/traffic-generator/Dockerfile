# ── Stage 1: Build Traffic Generator ─────────────────────────────────────
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

COPY services/traffic-generator/ ./services/traffic-generator/

RUN pnpm --filter @cloudpulse/traffic-generator build

# ── Stage 2: Runner ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV TARGET_URL=http://api-gateway:4000/api/checkout
ENV TRAFFIC_INTERVAL_MS=2000

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

COPY --from=builder /app /app

USER node

CMD ["node", "services/traffic-generator/dist/index.js"]
