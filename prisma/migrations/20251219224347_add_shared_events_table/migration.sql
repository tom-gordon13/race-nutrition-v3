-- CreateEnum
CREATE TYPE "SharedEventStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DENIED');

-- CreateTable
CREATE TABLE "SharedEvent" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "status" "SharedEventStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedEvent_receiver_id_idx" ON "SharedEvent"("receiver_id");

-- CreateIndex
CREATE INDEX "SharedEvent_status_idx" ON "SharedEvent"("status");

-- AddForeignKey
ALTER TABLE "SharedEvent" ADD CONSTRAINT "SharedEvent_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedEvent" ADD CONSTRAINT "SharedEvent_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedEvent" ADD CONSTRAINT "SharedEvent_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
