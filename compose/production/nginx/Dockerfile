# Build React frontend
FROM oven/bun:latest AS builder
WORKDIR /app
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend/ ./
ARG VITE_API_URL=/api
# Must match Django's production CSRF_COOKIE_NAME (config/settings/production.py)
ARG VITE_CSRF_COOKIE_NAME=__Secure-csrftoken
# Enables the production-only frontend branches (error reporting, health
# payload); the dev-only /health route checks === 'development' and stays out.
ARG VITE_APP_ENV=production
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_CSRF_COOKIE_NAME=${VITE_CSRF_COOKIE_NAME}
ENV VITE_APP_ENV=${VITE_APP_ENV}
RUN bun run build

# Nginx server
FROM docker.io/nginx:1.29.5-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./compose/production/nginx/default.conf /etc/nginx/conf.d/default.conf
