# ---------- Base ----------
FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app


# ---------- Build ----------
FROM base AS builder

COPY package.json pnpm-lock.yaml ./

# Better caching: fetch first
RUN pnpm fetch

# Install deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build Next
RUN pnpm build


# ---------- Production ----------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3003

# Copy standalone output
COPY --from=builder /app/.next/standalone ./

# Copy static + public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3003

CMD ["node", "server.js"]