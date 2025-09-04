# Dockerfile

# 1. Base image for installing dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the lock file
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects ENV variables at build time.
# You can copy the .env file into the build container and build the app.
# Alternatively, you can provide build-time secrets.
# More info: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
RUN npm run build

# 3. Production image, copy all the files and run next server
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# The official Next.js example creates a non-root user for security reasons.
# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", ".next/standalone/server.js"]
