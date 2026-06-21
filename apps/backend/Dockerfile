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
# --prod=false: Coolify passes NODE_ENV=production as a build arg, which would
# make pnpm skip devDependencies — but tsc/nest/drizzle-kit are devDeps we need
# to build. Force a full install regardless of NODE_ENV.
RUN pnpm install --frozen-lockfile --prod=false

# --- build stage: compile shared packages, then the backend ---
FROM base AS build
# Copy the whole installed workspace (root + however pnpm laid out each
# package's node_modules) in one shot. Copying per-package node_modules
# individually breaks when pnpm hoists a package's deps to the root store and
# doesn't create a local node_modules (e.g. api-types). `node_modules` is in
# .dockerignore, so the following `COPY . .` overlays source without clobbering
# what we copied here.
COPY --from=deps /workspace ./
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
ENV NODE_ENV=production

# IMPORTANT: keep the pnpm workspace layout *identical* to the build stage.
# pnpm node_modules are symlinks (e.g. apps/backend/node_modules/reflect-metadata
# -> ../../../node_modules/.pnpm/...). Flattening or relocating them breaks those
# relative links at runtime. So we mirror the same directory tree under /app and
# run from apps/backend, exactly where the symlinks expect to resolve.
COPY --from=build /workspace/package.json ./package.json
COPY --from=build /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /workspace/node_modules ./node_modules

# Shared workspace packages (their dist + their own symlinked node_modules).
COPY --from=build /workspace/packages ./packages

# The backend: compiled output, manifest, and its symlinked node_modules.
COPY --from=build /workspace/apps/backend/dist ./apps/backend/dist
COPY --from=build /workspace/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /workspace/apps/backend/node_modules ./apps/backend/node_modules

EXPOSE 3001
CMD ["node", "apps/backend/dist/main.js"]
