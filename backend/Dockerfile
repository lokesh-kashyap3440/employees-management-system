# Backend Dockerfile
FROM oven/bun:1-slim as base

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Build step (optional with Bun, but good for type checking/transpilation if needed)
# For this setup, we can run TS directly, but let's stick to the "build" script pattern if you prefer,
# or just run the source. Given the package.json "start": "bun src/server.ts", we can just run that.

EXPOSE 3000

CMD ["bun", "run", "start"]