# Dockerfile

# 1. Builder Stage
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
# Create a non-root user and group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# Use npm ci for reproducible builds if package-lock.json is present
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Change ownership of the files to the non-root user
RUN chown -R nextjs:nodejs /app

# Build the Next.js application
RUN npm run build


# 2. Runner Stage
FROM node:20 AS runner

WORKDIR /app

# Create a non-root user and group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./.next/standalone

# Copy the public folder from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set the user to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the server
CMD ["node", ".next/standalone/server.js"]
