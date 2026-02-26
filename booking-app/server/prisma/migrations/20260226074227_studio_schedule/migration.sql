-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- AlterTable
ALTER TABLE "Studio" ADD COLUMN     "slotDuration" INTEGER NOT NULL DEFAULT 15;

-- CreateTable
CREATE TABLE "StudioScheduleDay" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "day" "Weekday" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startMin" INTEGER NOT NULL DEFAULT 600,
    "endMin" INTEGER NOT NULL DEFAULT 1080,

    CONSTRAINT "StudioScheduleDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudioScheduleDay_studioId_idx" ON "StudioScheduleDay"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioScheduleDay_studioId_day_key" ON "StudioScheduleDay"("studioId", "day");

-- AddForeignKey
ALTER TABLE "StudioScheduleDay" ADD CONSTRAINT "StudioScheduleDay_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
