# cinderella.photography

Photographer storefront tied into the mytrees.family ecosystem.

- **apps/frontend** — Nuxt 4 (SPA mode). Public site + photographer dashboard.
- **apps/backend** — NestJS 10. OAuth client for mytrees.family + upload proxy to photos.mytrees.family.
- **packages/database** — Drizzle schema (photographers / clients / shoots / shoot_media / mytrees_users).
- **packages/api-types** — Shared TS DTOs.

## Quick start

```bash
cp .env.example .env     # defaults already line up for local dev
make install             # pnpm install (needs Node 22+)
make up-deps             # postgres :5433 + redis :6380 (Docker)
make db-push             # apply the Drizzle schema
pnpm dev                 # backend :3001 + frontend :3002, hot reload
```

Then open **http://localhost:3002**. Sign-in needs the **family-trees** IdP running on
`:3000` — see [Local OAuth setup](#local-oauth-setup). Everything else (browsing the
dashboard shell) works without it.

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3002 |
| Backend API | http://localhost:3001/api |
| family-trees (IdP, separate repo) | http://localhost:3000 |

> Deploying? See [`Checklist.md`](./Checklist.md).

## How it talks to the rest of the ecosystem

```
                +---------------------+
                |   mytrees.family    |
                |  (IdP + Postgres)   |
                +----------+----------+
                           |
        OAuth2 (code+PKCE) |  + shared JWT_SECRET
                           v
+---------------+    forwards    +-----------------------+
|  cinderella   | -------------> | photos.mytrees.family |
|   backend     |   upload +     |  (media backbone)     |
+---------------+   transfer     +-----------------------+
        ^                                 |
        | $fetch (cookie session)         | x-api-key + x-on-behalf-of
        v                                 v
+---------------+                +---------------------+
|  cinderella   |                | mytrees / photos    |
|   frontend    |                |   Hetzner volume    |
+---------------+                +---------------------+
```

## Quick start (local dev)

Backend + frontend run on the host with hot reload; only Postgres + Redis run in Docker. **For OAuth to work locally you also need family-trees running on `:3000`** — it's the IdP. See ["Local OAuth setup"](#local-oauth-setup) below.

```bash
cp .env.example .env
# Fill in: OAUTH_CLIENT_SECRET (must match family-trees's CINDERELLA_OAUTH_CLIENT_SECRET),
#         JWT_SECRET (must match family-trees's JWT_SECRET — byte for byte),
#         PHOTOS_API_KEY.

make install           # pnpm install (Node 22+)
make up-deps           # start postgres (host :5433) + redis (host :6380)
make db-push           # apply Drizzle schema to the running DB
pnpm dev               # backend (:3001) + cinderella frontend (:3002), hot reload
```

Ports used by local dev:

| App | Port |
| --- | --- |
| family-trees (IdP) | 3000 |
| cinderella backend | 3001 |
| cinderella frontend | 3002 |
| postgres | 5433 |
| redis | 6380 |

If anything else on the machine holds 3000–3002, stop it first or the dev servers will fail to bind.

### Stopping things

```bash
# Stop the host dev servers
# In the terminal running `pnpm dev`, press Ctrl+C.
# If anything is stranded, kill listeners on dev ports:
lsof -ti :3001,:3002 | xargs -r kill

# Stop the docker dependencies (keeps data volumes)
make down

# Nuclear: stop + delete the postgres volume (DESTROYS LOCAL DB DATA)
make clean
```

## Run the whole stack in Docker

When you'd rather not run Node locally at all:

```bash
make up                # build images + start db, redis, backend, frontend
make logs              # tail everything
make down              # stop the stack (keeps data)
```

In the docker stack, `docker-compose.yml` overrides `DATABASE_URL` / `REDIS_URL` to the internal hostnames `db:5432` / `redis:6379`, so the same `.env` works for both flows.

## Auth flow

1. Frontend hits `GET /api/auth/login?return_to=…` on the backend.
2. Backend mints a PKCE pair, stashes verifier + return_to in an httpOnly cookie, redirects to `mytrees.family/oauth/authorize`.
3. User signs into mytrees, approves the consent screen.
4. mytrees redirects to `cinderella.photography/api/auth/callback?code=…&state=…`.
5. Backend verifies state, exchanges the code at `mytrees.family/api/oauth/token`, validates the access token JWT (shared `JWT_SECRET`), caches the user locally, sets the session cookie.
6. Browser is redirected to `return_to`.

## Local OAuth setup

OAuth requires three things to line up:

1. **Both apps share the same `JWT_SECRET`** (HS256 signing key).
2. **Both apps share the same `CINDERELLA_OAUTH_CLIENT_SECRET`** (in family-trees → cinderella's `OAUTH_CLIENT_SECRET`).
3. **The redirect URI cinderella sends matches one of family-trees's registered URIs** for `clientId='cinderella'`.

The default `.env.example` here, plus the seed in `family-trees/server/plugins/oauth-seed.ts`, already line up for these local dev URLs:

- `IDP_AUTHORIZE_URL=http://localhost:3000/oauth/authorize`
- `IDP_TOKEN_URL=http://localhost:3000/api/oauth/token`
- `OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/callback`

Run both stacks in two terminals:

```bash
# Terminal 1 — family-trees (IdP)
cd ~/Desktop/family-trees
pnpm dev              # listens on :3000, seeds OAuth clients on boot

# Terminal 2 — cinderella
cd ~/Desktop/cinderella-photography
make up-deps && make db-push
pnpm dev              # backend :3001, frontend :3002
```

Then open `http://localhost:3002`, click "Sign in", and you should land on the family-trees consent screen and bounce back authenticated.

## Upload flow

`POST /api/shoots/:id/media` → multipart `file` → backend forwards to `${PHOTOS_API_URL}/api/upload` with:

- `x-api-key: $PHOTOS_API_KEY`
- `x-on-behalf-of: <photographer's mytrees userId>`
- form field `source=cinderella`
- form field `sourceRef=shoot:<id>`

photos.mytrees.family stores the file with `photographerId` set (no owner) until `POST /api/media/:id/transfer` fires, which the backend triggers when a shoot is marked paid (or when you re-run `POST /api/shoots/:id/transfer` after the client links their account).

## Backend API (current)

| Method & path | Purpose |
| --- | --- |
| `GET /api/auth/login` · `GET /api/auth/callback` · `GET /api/auth/session` · `POST /api/auth/logout` | OAuth + session |
| `GET /api/photographers/me` · `POST /api/photographers` · `PATCH /api/photographers/me` | Studio onboarding / profile |
| `GET /api/clients` · `POST /api/clients` · `GET /api/clients/:id` · `GET /api/clients/:id/shoots` | Clients |
| `GET /api/shoots` · `POST /api/shoots` · `GET /api/shoots/:id` · `GET /api/shoots/:id/media` | Shoots |
| `POST /api/shoots/:id/mark-paid` · `POST /api/shoots/:id/transfer` | Payment + ownership transfer |
| `POST /api/shoots/:shootId/media` | Upload (photographer-owned shoots only) |
| `GET /api/shoots/:shootId/media/:mediaId/thumb` · `.../raw` | Media proxy |
| `GET /api/my/shoots` | Client-facing galleries |