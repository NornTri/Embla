# Embla

A batteries-included starter template for building full-stack web applications with **React** + **Django REST Framework** + **PostgreSQL**.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Django 5.2, Django REST Framework |
| Database | PostgreSQL |
| Auth | django-allauth + JWT (httpOnly cookies) |
| Task queue | Celery + Redis |
| Email (dev) | Mailpit |
| API docs | drf-spectacular (Swagger) |
| Dev environment | Docker Compose, Just |

## Quick Start

### Prerequisites

- Docker Desktop 4.25+
- [Just](https://github.com/casey/just) (task runner)

### 1. Clone and configure

```bash
git clone <repository-url>
cd Embla

# Copy environment files
cp .envs/.local/.django.example .envs/.local/.django
cp .envs/.local/.postgres.example .envs/.local/.postgres
cp frontend/.env.example frontend/.env.development
```

### 2. Start services

```bash
just up
```

This starts Django, PostgreSQL, Redis, Celery, Mailpit, and the React frontend.

### 3. Set up the database

```bash
just manage migrate
just manage createsuperuser
```

### 4. Access the app

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| API Docs (Swagger) | http://localhost:8000/api/docs/ |
| Django Admin | http://localhost:8000/admin/ |
| Mailpit | http://localhost:8025 |
| Flower (Celery) | http://localhost:5555 |

## Development Without Docker

### Backend

```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

### Frontend

```bash
cd frontend
bun install
bun run dev
```

## Useful Commands

```bash
just up                  # Start all services
just down                # Stop all services
just logs                # View logs
just manage <command>    # Django management commands
just frontend-test       # Run frontend tests
just frontend-validate   # Lint + type-check + test frontend
```

See `just --list` for all available commands.

## Project Structure

```
├── config/              # Django settings, URLs, ASGI/WSGI
│   └── settings/        # Split settings (base, local, production, test)
├── embla/               # Django apps
│   └── users/           # User model, auth, API views
├── frontend/            # React + Vite + TypeScript
│   └── src/
│       ├── components/  # Reusable components
│       ├── contexts/    # React contexts (auth)
│       ├── pages/       # Page components
│       └── utils/       # Utilities
├── compose/             # Docker build files
├── docs/                # Sphinx documentation
└── justfile             # Task runner commands
```

## Documentation

- [Development Guide](DEVELOPMENT.md) — local setup, testing, debugging
- [Contributing](CONTRIBUTING.md) — how to contribute

## License

MIT
