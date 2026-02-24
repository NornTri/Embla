# Contributing to Embla

Thank you for your interest in contributing to Embla! This document provides guidelines and instructions for contributing to the project.

## Development Environment Setup

### Prerequisites

- Docker and Docker Compose
- Bun (for frontend development)
- Python 3.13+ with uv (for backend development)

### Quick Start

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Start the development environment:

   ```bash
   just up
   ```

3. Access the applications:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin interface: http://localhost:8000/admin
   - Mailpit (email testing): http://localhost:8025

### Using Just (Task Runner)

The project uses [Just](https://github.com/casey/just) as a task runner. Key commands:

```bash
# Start all services
just up

# Stop all services
just down

# View logs
just logs

# Run Django management commands
just manage makemigrations
just manage migrate
just manage createsuperuser

# Frontend development
just frontend-dev      # Start frontend dev server
just frontend-logs     # View frontend logs
just frontend-test     # Run frontend tests
just frontend-lint     # Run linting
just frontend-type-check  # TypeScript checking
just frontend-format   # Format code
just frontend-validate # Run all validation steps
```

## Development Workflow

### 1. Branch Strategy

- Create feature branches from `main`
- Use descriptive branch names: `feature/description`, `fix/issue-name`, `docs/topic`
- Keep branches focused on single features or fixes

### 2. Code Standards

#### Frontend (React + TypeScript)

- **Linting**: ESLint with TypeScript, React hooks, import sorting
- **Formatting**: Prettier with Tailwind CSS plugin
- **Type Checking**: TypeScript strict mode enabled
- **Testing**: Vitest + React Testing Library

Run validation:

```bash
cd frontend
bun run validate  # Runs type-check, lint, and tests
```

#### Backend (Django)

- **Code Style**: Black formatting, isort for imports
- **Linting**: Ruff for Python linting
- **Type Checking**: mypy
- **Testing**: pytest with coverage

Run validation:

```bash
uv run mypy embla
uv run ruff check --fix
uv run pytest
```

### 3. Testing

- Write tests for all new functionality
- Maintain or improve test coverage
- Frontend tests should use React Testing Library
- Backend tests should use pytest fixtures

### 4. Commit Messages

Use clear, descriptive commit messages following this format:

```
type(scope): brief description

Detailed description if needed

- Bullet points for changes
- Reference issues with #123
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 5. Pull Request Process

1. **Create PR**: Target the `main` branch
2. **Description**: Include:
   - Purpose of changes
   - Testing performed
   - Screenshots for UI changes
   - Any breaking changes
3. **CI Checks**: All must pass:
   - Frontend linting, type checking, tests, build
   - Backend linting, type checking, tests
4. **Code Review**: Address review comments
5. **Merge**: Squash and merge when approved

## Project Structure

```
Embla/
├── frontend/           # React frontend (Vite + TypeScript)
│   ├── src/           # Source code
│   ├── __tests__/     # Test files
│   └── package.json   # Dependencies and scripts
├── embla/             # Django backend package
│   ├── users/         # User authentication app
│   └── contrib/       # Custom contrib apps
├── config/            # Django configuration
├── .github/           # GitHub Actions workflows
├── compose/           # Docker configurations
├── manage.py          # Django management script
└── justfile           # Task runner commands
```

## Environment Configuration

### Frontend (.env.development)

```
VITE_API_URL=http://localhost:8000
VITE_APP_ENV=development
```

### Backend (.envs/.local/.django)

```
DJANGO_SETTINGS_MODULE=config.settings.local
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
```

## Testing Guidelines

### Frontend Tests

- Use `@testing-library/react` for component testing
- Mock API calls with axios mocks
- Test user interactions with `@testing-library/user-event`
- Use custom render from `test-utils.tsx`

Example:

```typescript
import { render, screen } from '../test-utils';

test('renders login form', () => {
  render(<Login />);
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
});
```

### Backend Tests

- Use pytest fixtures for test data
- Test API endpoints with Django test client
- Mock external services
- Use factory boy for test data creation

## Common Issues & Solutions

### Docker Issues

- **Port conflicts**: Check if ports 3000, 8000, 8025 are in use
- **Build cache**: Use `docker system prune` to clear cache
- **Volume conflicts**: Use `just prune` to remove containers and volumes

### Database Issues

- **Migrations**: Run `just manage migrate`
- **Reset database**: Use `just prune` and restart

### Frontend Issues

- **Node modules**: Run `just frontend-install`
- **Type errors**: Run `just frontend-type-check`
- **Build failures**: Check `.env` configuration

## Getting Help

- Check existing issues for similar problems
- Review project documentation
- Ask in PR discussions

## Code of Conduct

Please be respectful and constructive in all communications. Follow the project's code standards and review guidelines.

---

Thank you for contributing to Embla!
