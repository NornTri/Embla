# Build React frontend
FROM oven/bun:latest AS builder
WORKDIR /app
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN bun run build

# Nginx server
FROM docker.io/nginx:1.29.5-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./compose/production/nginx/default.conf /etc/nginx/conf.d/default.conf
