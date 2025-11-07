FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat python3 py3-pip
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

FROM node:18-alpine AS builder
RUN apk add --no-cache python3 py3-pip
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pip3 install --no-cache-dir -r python/requirements.txt
RUN npm run build

FROM node:18-alpine AS runner
RUN apk add --no-cache python3 py3-pip
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY python/requirements.txt ./python/
RUN pip3 install --no-cache-dir -r python/requirements.txt

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/python ./python
COPY --from=builder /app/fixtures ./fixtures

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
