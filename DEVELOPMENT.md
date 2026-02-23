# Development Guide

This guide provides detailed instructions for developing the Embla application, including local setup, testing, debugging, and deployment.

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Development Tools](#development-tools)
3. [Testing Strategy](#testing-strategy)
4. [Debugging](#debugging)
5. [Code Quality](#code-quality)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

## Local Development Setup

### Option 1: Docker Compose (Recommended)

1. **Prerequisites**:
   - Docker Desktop 4.25+
   - Docker Compose 2.23+

2. **Environment Setup**:
   ```bash
   # Clone the repository
   git clone <repository-url>

   # Copy environment files
   cp .envs/.local/.django.example .envs/.local/.django
   cp .envs/.local/.postgres.example .envs/.local/.postgres
   cp frontend/.env.example frontend/.env.development

   # Generate Django secret key
   echo "DJANGO_SECRET_KEY=$(openssl rand -hex 64)" >> .envs/.local/.django
   ```

3. **Start Services**:
   ```bash
   # Start all services
   just up

   # Or start specific services
   docker compose up django postgres redis -d
   docker compose up frontend -d
   ```

4. **Initial Setup**:
   ```bash
   # Run migrations
   just manage migrate

   # Create superuser
   just manage createsuperuser

   # Load test data (if available)
   just manage loaddata initial_data
   ```

### Option 2: Local Development Without Docker

#### Frontend:
```bash
cd frontend

# Install dependencies
bun install

# Start development server
bun run dev
```

#### Backend:
```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync

# Run migrations
uv run python manage.py migrate

# Start development server
uv run python manage.py runserver
```

## Development Tools

### Just Commands
The project uses [Just](https://github.com/casey/just) as a task runner. Key commands:

```bash
# Development
just up                 # Start all services
just down              # Stop all services
just logs              # View logs
just logs frontend     # View frontend logs
just logs django       # View backend logs

# Frontend
just frontend-dev      # Start frontend dev server
just frontend-test     # Run tests
just frontend-test-watch # Tests in watch mode
just frontend-lint     # Run ESLint
just frontend-type-check # TypeScript checking
just frontend-format   # Format with Prettier
just frontend-validate # Run all validation
just frontend-build    # Build production bundle
just frontend-shell    # Open shell in container

# Backend
just manage <command>  # Django management commands
just manage makemigrations
just manage migrate
just manage createsuperuser
just manage shell
```

### Code Quality Tools

#### Frontend:
- **ESLint**: `bun run lint` - Code linting with TypeScript, React, import sorting
- **Prettier**: `bun run format` - Code formatting with Tailwind CSS plugin
- **TypeScript**: `bun run type-check` - Type checking
- **Vitest**: `bun run test` - Unit testing with coverage

#### Backend:
- **Ruff**: `uv run ruff check --fix` - Python linting and formatting
- **mypy**: `uv run mypy embla` - Type checking
- **pytest**: `uv run pytest` - Testing with coverage

## Testing Strategy

### Frontend Testing

#### Test Structure:
```
frontend/src/
├── __tests__/
│   ├── setup.ts              # Global test setup
│   ├── test-utils.tsx        # Custom render function
│   ├── AuthContext.test.tsx  # Context tests
│   ├── Login.test.tsx        # Component tests
│   └── ...
├── __mocks__/
│   └── axios.ts              # Axios mock
└── ...
```

#### Running Tests:
```bash
# All tests with coverage
bun run test:ci

# Watch mode
bun run test:watch

# Specific test file
bun test src/__tests__/Login.test.tsx

# Coverage report
bun run test:coverage
```

#### Writing Tests:
- Use React Testing Library for component testing
- Mock API calls with manual axios mocks
- Test user interactions with `@testing-library/user-event`
- Use custom render from `test-utils.tsx`

Example:
```typescript
import { render, screen, waitFor } from '../test-utils';
import { Login } from '../pages/Login';

test('login form submits credentials', async () => {
  const user = userEvent.setup();
  render(<Login />);

  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /login/i }));

  await waitFor(() => {
    expect(mockAxios.post).toHaveBeenCalledWith('/api/token/', {
      username: 'testuser',
      password: 'password123'
    });
  });
});
```

### Backend Testing

#### Running Tests:
```bash
# All tests
uv run pytest

# Specific test file
uv run pytest embla/users/tests/test_views.py

# With coverage
uv run coverage run -m pytest
uv run coverage html
uv run coverage report

# Test specific module
uv run pytest -k "test_login"
```

#### Writing Tests:
- Use pytest fixtures for test data
- Test API endpoints with Django test client
- Use factory boy for test data creation
- Mock external services

Example:
```python
import pytest
from django.test import Client
from embla.users.models import User

@pytest.mark.django_db
def test_user_login(client: Client):
    user = User.objects.create_user(
        username="testuser",
        password="testpass123"
    )

    response = client.post("/api/token/", {
        "username": "testuser",
        "password": "testpass123"
    })

    assert response.status_code == 200
    assert "access" in response.json()
```

## Debugging

### Frontend Debugging

#### Browser DevTools:
- **React DevTools**: Install extension for component inspection
- **Network Tab**: Monitor API requests and responses
- **Console**: View logs and errors
- **Sources**: Debug TypeScript source maps

#### Docker Container Debugging:
```bash
# Open shell in frontend container
just frontend-shell

# View logs
just frontend-logs

# Restart container
just frontend-restart
```

#### Environment Variables:
Check `.env.development` for correct API URL:
```bash
VITE_API_URL=http://localhost:8000
VITE_APP_ENV=development
```

### Backend Debugging

#### Django Debug Toolbar:
Enabled in local development. Access at `/__debug__/`.

#### Logging:
Configured in `config/settings/local.py`:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}
```

#### Docker Container Debugging:
```bash
# Open shell in Django container
docker compose exec django /bin/bash

# View logs
just logs django

# Run Django shell
just manage shell
```

## Code Quality

### Pre-commit Validation
Run before committing code:
```bash
cd frontend
bun run validate  # type-check + lint + tests

cd ..
uv run ruff check --fix
uv run mypy embla
uv run pytest
```

### CI/CD Pipeline
GitHub Actions runs on PR and push to main:
1. **Frontend Job**: Lint, type-check, test, build
2. **Backend Job**: Docker build, migrations, pytest
3. **Docker Build**: Frontend and backend image builds

### Code Review Checklist
- [ ] Tests added/updated
- [ ] TypeScript/Type hints added
- [ ] Documentation updated
- [ ] No console.log/debug statements
- [ ] Code follows project conventions
- [ ] All CI checks pass

## Deployment

### Production Build
```bash
# Build frontend
cd frontend
bun run build

# The dist/ directory contains production assets
# These are served by Django in production
```

### Docker Production
```bash
# Build production images
docker compose -f docker-compose.production.yml build

# Run production stack
docker compose -f docker-compose.production.yml up -d
```

### Environment Configuration
Production requires:
- `DJANGO_SECRET_KEY` (secure random string)
- `DJANGO_DEBUG=False`
- Database connection string
- Redis connection string
- Email configuration
- CORS allowed origins

## Troubleshooting

### Common Issues

#### 1. Docker Port Conflicts
```bash
# Check what's using ports
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :8025  # Mailpit

# Stop conflicting services or change ports in docker-compose.local.yml
```

#### 2. Database Issues
```bash
# Reset database
just prune
just up
just manage migrate

# Check PostgreSQL logs
docker compose logs postgres
```

#### 3. Frontend Build Issues
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules bun.lock
bun install

# Check environment variables
cat .env.development

# Clear Docker cache
docker system prune -a
```

#### 4. Backend Type Errors
Pre-existing type errors in Django files are being tracked separately:
- `embla/users/api/authentication.py`
- `embla/users/api/jwt_views.py`
- `embla/users/api/views.py`
- `config/settings/` files

These are known issues not caused by current development work.

#### 5. Authentication Issues
- Ensure CORS is configured correctly
- Check JWT token expiration
- Verify cookie settings (httpOnly, secure, sameSite)
- Test with browser devtools Network tab

### Getting Help
1. Check existing GitHub issues
2. Review CONTRIBUTING.md
3. Use debugging tools above
4. Ask in PR discussions

## Performance Tips

### Frontend:
- Use React.memo for expensive components
- Implement code splitting with React.lazy
- Optimize Tailwind CSS purge configuration
- Use Vite's built-in optimizations

### Backend:
- Use Django's `select_related` and `prefetch_related`
- Implement caching with Redis
- Use database indexes
- Monitor with Django Debug Toolbar

## Monitoring

### Health Checks
- Frontend: `http://localhost:3000/health`
- Backend: `http://localhost:8000/health/`
- Database: Django admin interface

### Logging
- Application logs in Docker container output
- Access logs for HTTP requests
- Error tracking with Sentry (configured)

---

This document is maintained by the development team. Please update it when making significant changes to the development workflow.
