FROM node:22-bookworm AS base

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies
RUN npm ci || npm install

# Development stage
FROM base AS development

# Copy source code
COPY . .

# Create .dockerignore to prevent old compiled files
RUN echo "*.js" > .dockerignore && \
    echo "dist/" >> .dockerignore && \
    echo "build/" >> .dockerignore && \
    echo "node_modules/" >> .dockerignore

# Clean any existing compiled files (only files, not directories)
RUN find . -name "*.js" -not -path "./node_modules/*" -type f -delete

# Expose port
EXPOSE 5173

# Start development server with clean slate
CMD ["npm", "run", "dev", "--", "--config", "vite.config.docker.ts", "--host", "--force"]

# Production stage (for future use)
FROM base AS production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5173

# Start production server
CMD ["npm", "run", "preview", "--", "--host"]

