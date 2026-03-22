-- CreateTable
CREATE TABLE "StudioScheduleException" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startMin" INTEGER,
    "endMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudioScheduleException_studioId_date_idx" ON "StudioScheduleException"("studioId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StudioScheduleException_studioId_date_key" ON "StudioScheduleException"("studioId", "date");

-- AddForeignKey
ALTER TABLE "StudioScheduleException" ADD CONSTRAINT "StudioScheduleException_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
