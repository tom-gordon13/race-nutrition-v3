# Use Node.js 20 Alpine for a smaller image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Accept DATABASE_URL as a build argument
ARG DATABASE_URL

# Set it as an environment variable for the build
ENV DATABASE_URL=$DATABASE_URL

# Copy root package files for Prisma access
COPY package.json package-lock.json ./

# Copy Prisma files BEFORE npm ci (needed for postinstall hook)
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install dependencies (this will run postinstall -> prisma generate)
RUN npm ci

# Copy API source files
COPY api ./api

# Expose the API port
EXPOSE 3001

# Start the API server
CMD ["npx", "tsx", "watch", "api/src/server.ts"]
