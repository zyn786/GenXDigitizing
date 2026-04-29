-- CreateIndex
CREATE INDEX "BillingAuditLog_actorUserId_idx" ON "BillingAuditLog"("actorUserId");

-- AddForeignKey
ALTER TABLE "BillingAuditLog" ADD CONSTRAINT "BillingAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
