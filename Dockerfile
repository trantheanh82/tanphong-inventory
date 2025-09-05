# Dockerfile

# 1. Builder Stage
FROM node:20 AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# 2. Runner Stage
FROM node:20 AS runner

WORKDIR /app

# Copy the standalone Next.js server output from the builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public

# Expose the port the app runs on
EXPOSE 3000

# Set the command to start the server
CMD ["node", ".next/standalone/server.js"]
