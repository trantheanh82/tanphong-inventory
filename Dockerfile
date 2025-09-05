# Stage 1: Builder - Install dependencies and build the application
FROM node:20-bookworm-slim AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building native modules
RUN apt-get update && apt-get install -y openssl

# Create a non-root user and group
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Copy package files and install dependencies
COPY --chown=nextjs:nextjs package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY --chown=nextjs:nextjs . .

# Set environment variables from .env at build time (if needed for build process)
# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the Next.js application
RUN npm run build

# Stage 2: Runner - Create the final, minimal production image
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Create a non-root user and group for the runner
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone Next.js server output from the builder stage
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
# Copy the static assets from the builder stage
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
# Copy the public assets from the builder stage
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

# Set the user to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the default command to start the Next.js server
CMD ["node", "server.js"]
