-- CreateEnum
CREATE TYPE "StudioClientSource" AS ENUM ('BOOKING', 'MANUAL');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "studioClientId" TEXT;

-- CreateTable
CREATE TABLE "StudioClient" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "accountId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "birthDate" TIMESTAMP(3),
    "photoUrl" TEXT,
    "photoKey" TEXT,
    "source" "StudioClientSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudioClient_studioId_idx" ON "StudioClient"("studioId");

-- CreateIndex
CREATE INDEX "StudioClient_accountId_idx" ON "StudioClient"("accountId");

-- CreateIndex
CREATE INDEX "Booking_studioClientId_startAt_idx" ON "Booking"("studioClientId", "startAt");

-- AddForeignKey
ALTER TABLE "StudioClient" ADD CONSTRAINT "StudioClient_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioClient" ADD CONSTRAINT "StudioClient_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ClientAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_studioClientId_fkey" FOREIGN KEY ("studioClientId") REFERENCES "StudioClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
