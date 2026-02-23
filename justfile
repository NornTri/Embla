export COMPOSE_FILE := "docker-compose.local.yml"

## Just does not yet manage signals for subprocesses reliably, which can lead to unexpected behavior.
## Exercise caution before expanding its usage in production environments.
## For more information, see https://github.com/casey/just/issues/2473 .


# Default command to list all available commands.
default:
    @just --list

# build: Build python image.
build *args:
    @echo "Building python image..."
    @docker compose build {{args}}

# up: Start up containers.
up:
    @echo "Starting up containers..."
    @docker compose up -d --remove-orphans

# down: Stop containers.
down:
    @echo "Stopping containers..."
    @docker compose down

# prune: Remove containers and their volumes.
prune *args:
    @echo "Killing containers and removing volumes..."
    @docker compose down -v {{args}}

# logs: View container logs
logs *args:
    @docker compose logs -f {{args}}

# manage: Executes `manage.py` command.
manage +args:
    @docker compose run --rm django python ./manage.py {{args}}

# frontend-dev: Start frontend development server
frontend-dev:
    @echo "Starting frontend development server..."
    @docker compose up frontend -d --remove-orphans

# frontend-logs: View frontend container logs
frontend-logs:
    @docker compose logs -f frontend

# frontend-test: Run frontend tests
frontend-test:
    @echo "Running frontend tests..."
    @docker compose exec frontend bun run test:ci

# frontend-test-watch: Run frontend tests in watch mode
frontend-test-watch:
    @echo "Running frontend tests in watch mode..."
    @docker compose exec frontend bun run test:watch

# frontend-lint: Run frontend linting
frontend-lint:
    @echo "Running frontend linting..."
    @docker compose exec frontend bun run lint

# frontend-type-check: Run frontend TypeScript type checking
frontend-type-check:
    @echo "Running frontend type checking..."
    @docker compose exec frontend bun run type-check

# frontend-format: Format frontend code with Prettier
frontend-format:
    @echo "Formatting frontend code..."
    @docker compose exec frontend bun run format

# frontend-format-check: Check frontend code formatting
frontend-format-check:
    @echo "Checking frontend code formatting..."
    @docker compose exec frontend bun run format:check

# frontend-build: Build frontend production bundle
frontend-build:
    @echo "Building frontend production bundle..."
    @docker compose exec frontend bun run build

# frontend-validate: Run all frontend validation steps (lint, type-check, test)
frontend-validate:
    @echo "Running frontend validation..."
    @docker compose exec frontend bun run validate

# frontend-install: Install frontend dependencies
frontend-install:
    @echo "Installing frontend dependencies..."
    @docker compose run --rm frontend bun install

# frontend-shell: Open shell in frontend container
frontend-shell:
    @docker compose exec frontend /bin/sh

# frontend-restart: Restart frontend container
frontend-restart:
    @echo "Restarting frontend container..."
    @docker compose restart frontend
