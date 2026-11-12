# Образ приложения целиком: один контейнер отдаёт и сайт, и API.
#
# Контекст сборки — КОРЕНЬ репозитория, а не папка backend: нужен общий
# пакет packages/shared и собранный фронт.
#
# Сборка из корня:  docker build -f backend/Dockerfile -t colormemo .
# Запуск вместе с базой:  docker compose --profile full up -d

FROM node:22-alpine AS build
WORKDIR /app

# openssl нужен движку Prisma
RUN apk add --no-cache openssl

# Сначала только манифесты — тогда слой с npm ci кешируется
# и не пересобирается при каждой правке кода.
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY backend/prisma ./backend/prisma

RUN npm ci --ignore-scripts

COPY packages/shared ./packages/shared
COPY backend ./backend
COPY frontend ./frontend

# Порядок важен: общий пакет собирается первым, его типы и код нужны
# и бэку, и фронту.
RUN npm run build -w @colormemo/shared \
  && npx prisma generate --schema backend/prisma/schema.prisma \
  && npm run build -w backend \
  && npm run build -w frontend

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

# Собранный сайт кладём туда, где сервер ищет его по умолчанию
# (backend/dist/../public). Один домен, никакого CORS.
COPY --from=build /app/frontend/dist ./backend/public

EXPOSE 3000

# Миграции применяются при запуске — тогда развёртывание не требует
# ручных действий, а схема базы всегда соответствует коду.
CMD ["sh", "-c", "npx prisma migrate deploy --schema backend/prisma/schema.prisma && node backend/dist/server.js"]
