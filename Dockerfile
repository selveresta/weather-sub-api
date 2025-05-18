# 1) Build stage: compile TS → JS
FROM node:23-alpine AS builder
WORKDIR /usr/src/app

# Install dev+prod deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code, templates, and migrations, then build
COPY tsconfig*.json ./
COPY src ./src
COPY types ./types
COPY data-source.ts ./
RUN yarn build

# 2) Runtime stage: prod image
FROM node:23-alpine
WORKDIR /usr/src/app

# Install only prod deps
COPY package.json yarn.lock ./
RUN yarn install --production=false --frozen-lockfile \
      && yarn add ts-node tsconfig-paths --silent

# Copy compiled app
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/data-source.ts ./
COPY --from=builder /usr/src/app/tsconfig.json ./
COPY --from=builder /usr/src/app/types ./types   

# Copy Handlebars templates (for mailer)
COPY --from=builder /usr/src/app/src/templates ./dist/src/templates

# Copy migrations (TS→JS) into the folder where TypeORM expects them
COPY --from=builder /usr/src/app/dist/src/migrations/*.js ./dist/src/migrations/


EXPOSE 3001
ENV NODE_ENV=production

# Start the app. Because migrationsRun: true is set in your TypeOrmConfigService,
# TypeORM will automatically load & run all dist/src/migrations/*.js before listening.
  CMD ["sh", "-c", "yarn migration:run && node dist/src/main.js"]
