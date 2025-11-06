.PHONY: help up down build logs restart clean seed shell-backend shell-mongo

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

build: ## Build all services
	docker-compose build

rebuild: ## Rebuild and restart all services
	docker-compose up -d --build

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-mongo: ## Show MongoDB logs
	docker-compose logs -f mongodb

restart: ## Restart all services
	docker-compose restart

restart-backend: ## Restart backend only
	docker-compose restart backend

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v

seed: ## Seed default user
	docker-compose exec backend npm run seed

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-mongo: ## Open MongoDB shell
	docker-compose exec mongodb mongosh -u admin -p admin123 --authenticationDatabase admin farmdb

status: ## Show status of all services
	docker-compose ps

