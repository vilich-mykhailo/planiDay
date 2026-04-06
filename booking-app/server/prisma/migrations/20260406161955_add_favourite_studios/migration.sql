-- CreateTable
CREATE TABLE "FavouriteStudio" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavouriteStudio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FavouriteStudio_clientId_idx" ON "FavouriteStudio"("clientId");

-- CreateIndex
CREATE INDEX "FavouriteStudio_studioId_idx" ON "FavouriteStudio"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "FavouriteStudio_clientId_studioId_key" ON "FavouriteStudio"("clientId", "studioId");

-- AddForeignKey
ALTER TABLE "FavouriteStudio" ADD CONSTRAINT "FavouriteStudio_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteStudio" ADD CONSTRAINT "FavouriteStudio_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
