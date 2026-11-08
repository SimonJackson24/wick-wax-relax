# Frontend (Next.js SSR) Dockerfile for Coolify — individual-resource
# deployment. Build context: ./frontend
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_SITE_URL has a correct fallback in utils/siteConfig.js
# (https://www.wickwaxrelax.co.uk) so no build args are required; pass
# BUILD_SITE_URL to override for previews.
ARG BUILD_SITE_URL=""
# Public API URL for ISR getStaticProps fetches during `next build` in CI.
# GitHub Actions can't reach localhost — without this, the build renders
# the homepage with empty products (the hero fallback, no images) and the
# static HTML ships without its LCP element.
ARG BUILD_API_URL="https://api.wickwaxrelax.co.uk"
ENV NEXT_PUBLIC_SITE_URL=$BUILD_SITE_URL
ENV API_URL=$BUILD_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
CMD ["npm", "start"]
