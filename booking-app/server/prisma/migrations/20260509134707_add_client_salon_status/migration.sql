-- CreateTable
CREATE TABLE "ClientSalonStatus" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "favoriteSince" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSalonStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientSalonStatus_studioId_idx" ON "ClientSalonStatus"("studioId");

-- CreateIndex
CREATE INDEX "ClientSalonStatus_clientId_idx" ON "ClientSalonStatus"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSalonStatus_studioId_clientId_key" ON "ClientSalonStatus"("studioId", "clientId");

-- AddForeignKey
ALTER TABLE "ClientSalonStatus" ADD CONSTRAINT "ClientSalonStatus_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSalonStatus" ADD CONSTRAINT "ClientSalonStatus_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
