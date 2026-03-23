-- CreateTable
CREATE TABLE "MasterScheduleDay" (
    "id" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "day" "Weekday" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startMin" INTEGER NOT NULL DEFAULT 600,
    "endMin" INTEGER NOT NULL DEFAULT 1080,

    CONSTRAINT "MasterScheduleDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterScheduleException" (
    "id" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startMin" INTEGER,
    "endMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MasterScheduleDay_masterId_idx" ON "MasterScheduleDay"("masterId");

-- CreateIndex
CREATE UNIQUE INDEX "MasterScheduleDay_masterId_day_key" ON "MasterScheduleDay"("masterId", "day");

-- CreateIndex
CREATE INDEX "MasterScheduleException_masterId_date_idx" ON "MasterScheduleException"("masterId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MasterScheduleException_masterId_date_key" ON "MasterScheduleException"("masterId", "date");

-- CreateIndex
CREATE INDEX "Booking_masterId_startAt_idx" ON "Booking"("masterId", "startAt");

-- CreateIndex
CREATE INDEX "Master_studioId_idx" ON "Master"("studioId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterScheduleDay" ADD CONSTRAINT "MasterScheduleDay_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterScheduleException" ADD CONSTRAINT "MasterScheduleException_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master"("id") ON DELETE CASCADE ON UPDATE CASCADE;
