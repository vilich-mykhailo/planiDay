/*
  Warnings:

  - You are about to drop the column `name` on the `ClientRegistrationVerification` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `ClientRegistrationVerification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClientRegistrationVerification" DROP COLUMN "name",
DROP COLUMN "phone";
