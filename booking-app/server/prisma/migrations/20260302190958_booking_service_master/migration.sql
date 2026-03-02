-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "masterId" TEXT,
ADD COLUMN     "serviceId" TEXT;

-- CreateIndex
CREATE INDEX "Booking_serviceId_startAt_idx" ON "Booking"("serviceId", "startAt");
