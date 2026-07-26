-- CreateTable
CREATE TABLE "OwnerPasswordResetToken" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerPasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnerPasswordResetToken_tokenHash_key" ON "OwnerPasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "OwnerPasswordResetToken_ownerId_idx" ON "OwnerPasswordResetToken"("ownerId");

-- CreateIndex
CREATE INDEX "OwnerPasswordResetToken_expiresAt_idx" ON "OwnerPasswordResetToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "OwnerPasswordResetToken" ADD CONSTRAINT "OwnerPasswordResetToken_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "OwnerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
