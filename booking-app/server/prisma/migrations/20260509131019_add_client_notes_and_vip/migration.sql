-- AlterTable
ALTER TABLE "ClientAccount" ADD COLUMN     "isVip" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vipSince" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ClientNote" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientNote_studioId_idx" ON "ClientNote"("studioId");

-- CreateIndex
CREATE INDEX "ClientNote_clientId_idx" ON "ClientNote"("clientId");

-- CreateIndex
CREATE INDEX "ClientNote_studioId_clientId_idx" ON "ClientNote"("studioId", "clientId");

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
