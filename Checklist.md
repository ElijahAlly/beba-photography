# Production deployment checklist

Deploy beba.photography on the **gpa-pics Hetzner server**, which is already a
**Coolify** host. Coolify's proxy (`coolify-proxy`, Traefik) owns ports 80/443 and already
fronts your other app (photos.mytrees.family / gpa-pics). **So deploy cinderella through
Coolify too** — let Traefik handle TLS (Let's Encrypt) and routing. Do **not** add a
hand-rolled nginx + certbot here; it would collide with `coolify-proxy` over 80/443.

> The repo already ships a Traefik-labelled `docker-compose.prod.yml` — that's the right
> shape for Coolify. Coolify can also manage routing for you from the dashboard, in which
> case the labels are optional.

> **Two hostnames, one registrable domain.** Frontend on `beba.photography`, backend on
> `api.beba.photography`. They must be **different** hosts (Coolify/Traefik routers can't
> share one), but because they share the registrable domain `beba.photography`, the
> `sameSite=lax` session cookie still rides along. CORS is handled by `FRONTEND_ORIGIN`.

---

## What cinderella depends on (read first)

cinderella is **not** self-contained. It needs two mytrees services reachable from prod:

1. **mytrees.family** (the `family-trees` app) — the **identity provider**. All OAuth
   login traffic (`/oauth/authorize`, `/api/oauth/token`, `/api/oauth/userinfo`) goes
   here. **Sign-in is broken until this is live in prod.**
2. **photos.mytrees.family** (the `gpapics` app, already on this server) — the **media
   backbone**. Uploads and ownership transfers are proxied here with `PHOTOS_API_KEY`.

All three apps share **one `JWT_SECRET`** (HS256), byte-for-byte. cinderella and
family-trees also share **one client secret** (`OAUTH_CLIENT_SECRET` here =
`CINDERELLA_OAUTH_CLIENT_SECRET` there).

**Prerequisite:** family-trees must already be deployed with these set, or cinderella OAuth
won't work no matter how cleanly cinderella deploys:

```
JWT_SECRET=<prod value>                       # same value goes in cinderella below
CINDERELLA_OAUTH_CLIENT_SECRET=<prod value>   # same value goes in cinderella below
CINDERELLA_OAUTH_REDIRECT_URIS=https://api.beba.photography/api/auth/callback
```

Generate secrets once: `openssl rand -base64 48` (JWT), `openssl rand -base64 32` (client
secret). Use **different** values than local dev.

---

## Phase 1 — DNS

Point the domain (and the `api` subdomain) at this server's IP (the same Hetzner box
running gpa-pics):

- [ ] `A  @    → SERVER_IP`   (frontend, beba.photography)
- [ ] `A  www  → SERVER_IP`
- [ ] `A  api  → SERVER_IP`   (backend, api.beba.photography)
- [ ] Verify before deploying: `dig +short beba.photography` and
      `dig +short api.beba.photography` both return `SERVER_IP`.

Coolify issues the Let's Encrypt cert automatically once DNS resolves and the domain is set
on the resource (Phase 3) — no certbot.

## Phase 2 — Create the resource in Coolify

In the Coolify dashboard (`http://SERVER_IP:8000`):

- [ ] Open your project → **+ New** → **Docker Compose** (Coolify can build the monorepo's
      two Dockerfiles from one compose file).
- [ ] **Source:** the `cinderella-photography` Git repo (add a deploy key / GitHub app if
      it's private).
- [ ] **Compose file:** `docker-compose.yml`. Coolify reads the `backend` and `frontend`
      services and builds each from its `apps/*/Dockerfile`.
- [ ] Leave the `db` / `redis` services in for a self-contained stack, **or** delete them
      and use a dedicated Coolify Postgres/Redis resource (see Phase 5).

## Phase 3 — Domains & routing (subdomain split)

In Coolify, the Docker Compose resource shows a **domain field per service**. Give the two
services **different hostnames** — they must not share a host, or Traefik routers collide:

- [ ] **Domains for frontend** → `https://beba.photography` (Coolify maps it to the
      `frontend` service on port `3000`).
- [ ] **Domains for backend** → `https://api.beba.photography` (maps to `backend` on
      port `3001`).
- [ ] Coolify auto-issues Let's Encrypt certs for both hostnames once DNS resolves.
- [ ] (Optional) add `www.beba.photography` → redirect to the apex.

> **Why a subdomain, not a `/api` path:** NestJS already serves under a global `/api`
> prefix. Coolify's proxy strips a routed path prefix before forwarding, which would turn
> `/api/auth/...` into `/auth/...` and 404 every route. A dedicated `api.` host avoids
> that. `beba.photography` and `api.beba.photography` share one registrable domain, so the
> `sameSite=lax` session cookie still rides along; CORS is handled by `FRONTEND_ORIGIN`.

The browser flow that makes this work: the frontend (`beba.photography`) calls the backend
at `api.beba.photography` with `credentials: include`. OAuth callback is served by the
backend, so it lands on `api.beba.photography/api/auth/callback`; the backend sets the
session cookie on the `api.` host and redirects back to a `beba.photography` page.

## Phase 4 — Environment variables (Coolify → each service)

```
NODE_ENV=production
DATABASE_URL=postgres://<user>:<pass>@<coolify-pg-host>:5432/cinderella
REDIS_URL=redis://<coolify-redis-host>:6379

JWT_SECRET=<same as family-trees prod>
OAUTH_CLIENT_ID=cinderella
OAUTH_CLIENT_SECRET=<same as family-trees CINDERELLA_OAUTH_CLIENT_SECRET>
OAUTH_REDIRECT_URI=https://api.beba.photography/api/auth/callback
OAUTH_SCOPES=profile photos:read photos:write

IDP_AUTHORIZE_URL=https://mytrees.family/oauth/authorize
IDP_TOKEN_URL=https://mytrees.family/api/oauth/token
IDP_USERINFO_URL=https://mytrees.family/api/oauth/userinfo

PHOTOS_API_URL=https://photos.mytrees.family
PHOTOS_API_KEY=<from the gpapics / photos admin on this server>

BACKEND_PORT=3001
FRONTEND_ORIGIN=https://beba.photography
NUXT_PUBLIC_API_BASE=https://api.beba.photography
```

> `NUXT_PUBLIC_API_BASE` is baked in at **build** time — change it and you must
> **rebuild** the frontend (a normal Coolify redeploy does this), not just restart.

## Phase 5 — Database

gpa-pics already has its own Postgres/Redis on this box — **don't reuse its database**.
Give cinderella its own:

- [ ] Coolify → **+ New → Database → PostgreSQL** (and Redis if you want a managed one).
      Create a `cinderella` database; copy its internal connection string into
      `DATABASE_URL` above.
- [ ] Or keep the `db` / `redis` services from `docker-compose.yml` (named volume
      `cinderella_postgres` survives redeploys). Either is fine — just don't point at
      gpa-pics's DB.

## Phase 6 — Deploy & apply schema

- [ ] Click **Deploy** in Coolify. First build is slow (pnpm install + two image builds).
- [ ] Apply the Drizzle schema **once** (cinderella uses push, not auto-migrate on boot).
      In the backend container's terminal (Coolify → service → **Terminal**), from a repo
      checkout with `DATABASE_URL` set:
      ```bash
      pnpm --filter @cinderella/database db:push
      ```
      (Or run it locally against the prod `DATABASE_URL` before first traffic.)

## Phase 7 — Smoke test

- [ ] `curl https://api.beba.photography/api/health` → ok, **no cert warning**.
- [ ] Open `https://beba.photography` → **Sign in** → lands on
      `mytrees.family/oauth/authorize` consent → approve → bounces to
      `api.beba.photography/api/auth/callback` → home, logged in.
- [ ] `https://api.beba.photography/api/auth/me` returns your user (session JWT valid).
- [ ] Create a shoot, upload a photo (proxies to photos.mytrees.family), **Mark as paid**,
      confirm ownership transfers.

---

## Updating later

Push to the tracked branch → Coolify auto-deploys (or click **Redeploy**). Run
`db:push` again only if the schema changed.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Cert not issued / TLS error | DNS isn't resolving to this server yet, or Let's Encrypt isn't enabled on the domain in Coolify. Fix DNS, re-trigger SSL. |
| 404 / wrong app on the domain | The two services share a hostname. Frontend must own `beba.photography`, backend must own `api.beba.photography` — not the same host. |
| API 404s on every route | Backend was put on a `/api` *path* and the proxy stripped the prefix. Use the `api.beba.photography` subdomain instead (this is why we don't use a path). |
| `redirect_uri mismatch` | family-trees prod missing/incorrect `CINDERELLA_OAUTH_REDIRECT_URIS`. Set it, restart family-trees so its OAuth seed re-runs. |
| `Invalid identity token` / 401 on callback | `JWT_SECRET` differs between cinderella and family-trees. Make them identical. |
| `client_secret invalid` on token exchange | `OAUTH_CLIENT_SECRET` (here) ≠ `CINDERELLA_OAUTH_CLIENT_SECRET` (family-trees). |
| Cookie not set after callback | `OAUTH_REDIRECT_URI`, `NUXT_PUBLIC_API_BASE`, and the family-trees registered URI must all point at `api.beba.photography`. A mismatch means the cookie is set on the wrong host. |
| Backend crash-loops `Cannot find module 'reflect-metadata'` (or any dep) | The runtime image broke pnpm's symlinked `node_modules` by flattening them. Fixed in `apps/backend/Dockerfile` (runtime stage mirrors the workspace layout and runs `apps/backend/dist/main.js`). Rebuild after pulling the fix. |
| Uploads 502 / fail | `PHOTOS_API_KEY` wrong, or photos.mytrees.family unreachable from the container. |

## Notes

- **Use Coolify on this server** — it already runs gpa-pics and owns 80/443. A parallel
  nginx/certbot stack (the slop-ai pattern) is for a clean box with no orchestrator; it
  would fight `coolify-proxy` here.
- **Don't share gpa-pics's database.** Give cinderella its own Postgres (Phase 5).
- **Vanity subdomains** (`<studio>.beba.photography`) need a wildcard cert (DNS-01)
  and a wildcard host rule in Coolify/Traefik. Skip until you actually use them.
- The repo's `docker-compose.prod.yml` carries Traefik labels using the **old**
  `cinderella.photography` host (backend on `api.`, frontend on apex). Deploying via the
  Coolify dashboard, you set the domains in the UI (Phase 3) and Coolify manages routing,
  so those stale labels are ignored — update or delete them only if you switch to raw
  `docker compose` with your own Traefik.
