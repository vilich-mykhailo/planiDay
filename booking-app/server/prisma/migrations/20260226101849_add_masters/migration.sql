/*
  Warnings:

  - You are about to drop the column `active` on the `Master` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Master` table. All the data in the column will be lost.
  - You are about to drop the column `sort` on the `Master` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Master_studioId_idx";

-- AlterTable
ALTER TABLE "Master" DROP COLUMN "active",
DROP COLUMN "phone",
DROP COLUMN "sort",
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "role" TEXT;
