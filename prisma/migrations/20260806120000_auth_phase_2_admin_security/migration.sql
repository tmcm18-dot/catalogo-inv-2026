-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'DENIED', 'FAILED');

-- CreateEnum
CREATE TYPE "SensitiveActionScope" AS ENUM ('roles_manage', 'users_suspend_admin', 'sessions_revoke_admin', 'two_factor_disable', 'two_factor_regenerate_recovery_codes', 'data_export_sensitive', 'system_configure');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blockedUntil" TIMESTAMP(3),
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedReason" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "result" "AuditResult" NOT NULL DEFAULT 'SUCCESS',
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "ipHash" TEXT,
ADD COLUMN     "userAgentHash" TEXT;

-- CreateTable
CREATE TABLE "SensitiveActionGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scope" "SensitiveActionScope" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensitiveActionGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitCounter" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SensitiveActionGrant_tokenHash_key" ON "SensitiveActionGrant"("tokenHash");

-- CreateIndex
CREATE INDEX "SensitiveActionGrant_userId_sessionId_scope_idx" ON "SensitiveActionGrant"("userId", "sessionId", "scope");

-- CreateIndex
CREATE INDEX "SensitiveActionGrant_expiresAt_idx" ON "SensitiveActionGrant"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitCounter_key_key" ON "RateLimitCounter"("key");

-- CreateIndex
CREATE INDEX "RateLimitCounter_blockedUntil_idx" ON "RateLimitCounter"("blockedUntil");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_createdAt_idx" ON "AuditLog"("resourceType", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- AddForeignKey
ALTER TABLE "SensitiveActionGrant" ADD CONSTRAINT "SensitiveActionGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
