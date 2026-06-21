FROM node:22-alpine AS base
WORKDIR /workspace
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/frontend/package.json apps/frontend/
COPY apps/backend/package.json apps/backend/
COPY packages/database/package.json packages/database/
COPY packages/api-types/package.json packages/api-types/
# --prod=false: Coolify passes NODE_ENV=production as a build arg, which would
# make pnpm skip devDependencies — but tsc/nuxt are devDeps we need to build.
# Force a full install regardless of NODE_ENV.
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS build
# Copy the whole installed workspace in one shot (pnpm may not create a local
# node_modules for a package whose deps hoist to the root store, e.g.
# api-types — copying it explicitly fails the build). `node_modules` is in
# .dockerignore, so `COPY . .` overlays source without clobbering this.
COPY --from=deps /workspace ./
COPY . .

# Shared types need to be compiled before Nuxt can resolve them.
RUN pnpm --filter @cinderella/api-types build
RUN pnpm --filter @cinderella/frontend build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /workspace/apps/frontend/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
