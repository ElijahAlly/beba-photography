FROM node:22-alpine AS base
WORKDIR /workspace
RUN corepack enable

# --- deps stage: install all workspace deps (cached on lockfile) ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/database/package.json packages/database/
COPY packages/api-types/package.json packages/api-types/
RUN pnpm install --frozen-lockfile

# --- build stage: compile shared packages, then the backend ---
FROM base AS build
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /workspace/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /workspace/packages/api-types/node_modules ./packages/api-types/node_modules
COPY . .

# Build shared packages first — they emit to dist/ which the backend's
# tsc resolves via the package.json `main`/`types` fields.
RUN pnpm --filter @cinderella/api-types build
RUN pnpm --filter @cinderella/database build
RUN pnpm --filter @cinderella/backend build

# --- runtime stage ---
FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable

# Backend compiled output
COPY --from=build /workspace/apps/backend/dist ./dist
COPY --from=build /workspace/apps/backend/package.json ./package.json

# Shared package dist (the symlinks resolve through node_modules below)
COPY --from=build /workspace/packages ./packages

# Manifest + lockfile so the prod install can reproduce
COPY --from=build /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /workspace/package.json ./root-package.json

# Carry over the resolved node_modules — workspace symlinks point at ./packages.
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/backend/node_modules ./node_modules-app
RUN cp -rn ./node_modules-app/* ./node_modules/ 2>/dev/null || true && rm -rf ./node_modules-app

EXPOSE 3001
CMD ["node", "dist/main.js"]
