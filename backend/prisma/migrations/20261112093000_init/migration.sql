-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('COLOR_RECALL', 'COLOR_CHOICE', 'COLOR_SEQUENCE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "type" "GameType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_tasks" (
    "id" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "showTimeMs" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "game_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "score" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "answer" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE UNIQUE INDEX "games_type_key" ON "games"("type");

-- CreateIndex
CREATE INDEX "game_tasks_userId_gameType_difficulty_idx" ON "game_tasks"("userId", "gameType", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "results_taskId_key" ON "results"("taskId");

-- AddForeignKey
ALTER TABLE "game_tasks" ADD CONSTRAINT "game_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "game_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
