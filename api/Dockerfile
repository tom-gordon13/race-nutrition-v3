# Use Node.js 20 Alpine for a smaller image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set DATABASE_URL for build time (Prisma needs this)
ENV DATABASE_URL="file:./prisma/dev.db"

# Copy root package files for Prisma access
COPY package.json package-lock.json ./

# Install dependencies first
RUN npm ci

# Copy Prisma files
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma client after dependencies are installed
RUN npx prisma generate

# Copy API source files
COPY api ./api

# Expose the API port
EXPOSE 3001

# Start the API server
CMD ["npx", "tsx", "watch", "api/src/server.ts"]
