# Dockerfile

# Builder Stage
FROM node:20 AS builder
WORKDIR /app

# Create a non-root user and group
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Copy dependency definition files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Change ownership of the app directory
RUN chown -R nextjs:nextjs /app

# Switch to the non-root user
USER nextjs

# Build the Next.js application
RUN npm run build


# Runner Stage
FROM node:20 AS runner
WORKDIR /app

# Create a non-root user and group
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production

# Copy the standalone output from the builder stage
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
# Copy the public directory
COPY --from=builder --chown=nextjs:nextjs /app/public ./public


# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the command to start the application
CMD ["node", ".next/standalone/server.js"]
