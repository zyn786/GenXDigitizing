-- AlterTable
ALTER TABLE "UserPresence" ADD COLUMN     "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "typingThreadId" TEXT;

-- CreateIndex
CREATE INDEX "UserPresence_typingThreadId_idx" ON "UserPresence"("typingThreadId");
