# ── Stage 1: Build React SPA ───────────────────────────────────────────────
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
COPY apps/web/package.json ./apps/web/

# Install all dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

# Build shared types and web bundle
RUN pnpm --filter @cloudpulse/shared build && \
    pnpm --filter @cloudpulse/web build

# ── Stage 2: Production Nginx Server ────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets from builder stage
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Run nginx as daemon off
CMD ["nginx", "-g", "daemon off;"]
