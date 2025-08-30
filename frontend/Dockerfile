FROM node:20-bookworm AS base

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with proper rollup native bindings handling
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    # Remove lockfile to avoid architecture-specific native binding issues \
    rm -f package-lock.json && \
    # Install dependencies without optional to avoid native binding conflicts \
    npm install --no-audit --no-fund --no-optional && \
    # Explicitly install the correct rollup native binding for current architecture \
    arch=$(uname -m) && \
    echo "Detected architecture: $arch" && \
    if [ "$arch" = "aarch64" ] || [ "$arch" = "arm64" ]; then \
        echo "Installing ARM64 rollup bindings" && \
        npm install --no-audit --no-fund @rollup/rollup-linux-arm64-gnu; \
    elif [ "$arch" = "x86_64" ] || [ "$arch" = "amd64" ]; then \
        echo "Installing x64 rollup bindings" && \
        npm install --no-audit --no-fund @rollup/rollup-linux-x64-gnu; \
    else \
        echo "Unknown arch $arch; using JS fallback" && export ROLLUP_SKIP_NODEJS_NATIVE=true; \
    fi

# Development stage
FROM base AS development

# Copy source code
COPY . .

# Force JS-only Rollup mode - skip native bindings entirely
RUN echo "Using JS-only Rollup implementation for maximum compatibility"

# Set fallback environment for rollup if native bindings fail
ENV ROLLUP_SKIP_NODEJS_NATIVE=false

# Expose port
EXPOSE 5173

# Start development server with JS fallback as default
ENV ROLLUP_SKIP_NODEJS_NATIVE=true
CMD ["npx", "vite", "--config", "vite.config.docker.ts", "--host", "0.0.0.0", "--port", "5173"]

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

