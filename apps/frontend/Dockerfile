FROM node:22-alpine AS base
WORKDIR /workspace
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/frontend/package.json apps/frontend/
COPY apps/backend/package.json apps/backend/
COPY packages/database/package.json packages/database/
COPY packages/api-types/package.json packages/api-types/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /workspace/packages/api-types/node_modules ./packages/api-types/node_modules
COPY . .

# Shared types need to be compiled before Nuxt can resolve them.
RUN pnpm --filter @cinderella/api-types build
RUN pnpm --filter @cinderella/frontend build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /workspace/apps/frontend/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
