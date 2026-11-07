# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ARG API_URL=http://api-gateway:8080
ENV API_URL=${API_URL}
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN addgroup -S roomix && adduser -S roomix -G roomix
COPY --from=builder --chown=roomix:roomix /app/public ./public
COPY --from=builder --chown=roomix:roomix /app/.next/standalone ./
COPY --from=builder --chown=roomix:roomix /app/.next/static ./.next/static
USER roomix
EXPOSE 3000
CMD ["node", "server.js"]
