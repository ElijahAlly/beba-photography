COMPOSE := docker compose

.DEFAULT_GOAL := help

.PHONY: help install dev up down build rebuild logs logs-backend logs-frontend ps shell-backend shell-frontend shell-db db-push db-generate db-shell clean nuke

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install workspace deps (requires Node 22+)
	pnpm install

dev: ## Run frontend + backend dev servers (assumes db/redis via `make up-deps`)
	pnpm dev

up-deps: ## Start just postgres + redis (so you can `pnpm dev` locally)
	$(COMPOSE) up -d db redis

up: ## Start the whole stack in Docker
	$(COMPOSE) up -d
	@echo ""
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:3001/api"
	@echo "Postgres: postgres://user:password@localhost:5433/cinderella"
	@echo "Redis:    redis://localhost:6380"

down: ## Stop the stack
	$(COMPOSE) down

build: ## (Re)build both app images
	$(COMPOSE) build

rebuild: ## Rebuild without cache and restart
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

logs: ## Tail all logs
	$(COMPOSE) logs -f --tail=200

logs-backend: ## Tail backend logs
	$(COMPOSE) logs -f --tail=200 backend

logs-frontend: ## Tail frontend logs
	$(COMPOSE) logs -f --tail=200 frontend

ps: ## Show running services
	$(COMPOSE) ps

shell-backend: ## Shell in backend container
	$(COMPOSE) exec backend sh

shell-frontend: ## Shell in frontend container
	$(COMPOSE) exec frontend sh

shell-db: ## psql against the dev DB
	$(COMPOSE) exec db psql -U user -d cinderella

db-push: ## Apply schema to the running DB (drizzle push) — runs on host, reads DATABASE_URL from .env
	pnpm --filter @cinderella/database db:push

db-generate: ## Generate a new SQL migration from the schema — runs on host
	pnpm --filter @cinderella/database db:generate

clean: ## Stop stack and delete volumes (DESTROYS DB DATA)
	$(COMPOSE) down -v

nuke: ## clean + remove built images
	$(COMPOSE) down -v --rmi local
