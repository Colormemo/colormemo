# Образ бэкенда. Контекст сборки — КОРЕНЬ репозитория, а не папка backend,
# потому что бэку нужен общий пакет packages/shared.
#
# Сборка из корня:  docker build -f backend/Dockerfile -t colormemo-api .

FROM node:22-alpine AS build
WORKDIR /app

# openssl нужен движку Prisma
RUN apk add --no-cache openssl

# Сначала только манифесты — тогда слой с npm ci кешируется
# и не пересобирается при каждой правке кода.
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma

RUN npm ci --ignore-scripts

COPY packages/shared ./packages/shared
COPY backend ./backend

RUN npm run build -w @colormemo/shared \
  && npx prisma generate --schema backend/prisma/schema.prisma \
  && npm run build -w backend

# --- рабочий образ ---------------------------------------------------------
FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/
COPY --from=build /app/backend/prisma ./backend/prisma

EXPOSE 3000

# Миграции применяются при запуске — тогда деплой не требует ручных действий.
CMD ["sh", "-c", "npx prisma migrate deploy --schema backend/prisma/schema.prisma && node backend/dist/main.js"]
