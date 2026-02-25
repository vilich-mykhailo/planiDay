/*
  Warnings:

  - You are about to drop the column `address` on the `Studio` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ownerId]` on the table `Studio` will be added. If there are existing duplicate values, this will fail.
  - Made the column `city` on table `Studio` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Studio" DROP CONSTRAINT "Studio_ownerId_fkey";

-- AlterTable
ALTER TABLE "Studio" DROP COLUMN "address",
ADD COLUMN     "apartment" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "building" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "coverUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "logoUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "portfolioUrls" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "street" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "name" SET DEFAULT '',
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "city" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Studio_ownerId_key" ON "Studio"("ownerId");

-- AddForeignKey
ALTER TABLE "Studio" ADD CONSTRAINT "Studio_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "OwnerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
