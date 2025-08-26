FROM node:20-bookworm AS base

WORKDIR /app

# Avoid npm optional native deps and skip Rollup native bindings (use JS/wasm fallback)
ENV npm_config_optional=false \
    ROLLUP_SKIP_NODEJS_NATIVE=true

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies deterministically (keep lockfile, avoid --force)
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

# Development stage
FROM base AS development

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--config", "vite.config.docker.ts", "--host"]

# Production stage (for future use)
FROM base AS production

# Copy source code
COPY . .

# Build the application using JS/wasm Rollup fallback
RUN ROLLUP_SKIP_NODEJS_NATIVE=true npm run build

# Expose port
EXPOSE 5173

# Start production server
CMD ["npm", "run", "preview", "--", "--host"]

