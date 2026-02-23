FROM oven/bun:latest

WORKDIR /app

# Copy package.json and bun.lock
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy the rest of the application
COPY . .

# Expose port for dev server
EXPOSE 3000

# Start development server
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]