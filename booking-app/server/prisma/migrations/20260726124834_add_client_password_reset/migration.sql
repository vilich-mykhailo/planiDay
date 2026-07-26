-- CreateTable
CREATE TABLE "ClientPasswordResetToken" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientPasswordResetToken_tokenHash_key" ON "ClientPasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ClientPasswordResetToken_clientId_idx" ON "ClientPasswordResetToken"("clientId");

-- CreateIndex
CREATE INDEX "ClientPasswordResetToken_expiresAt_idx" ON "ClientPasswordResetToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "ClientPasswordResetToken" ADD CONSTRAINT "ClientPasswordResetToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
