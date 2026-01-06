-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('TRIATHLON', 'RUN', 'BIKE', 'OTHER');

-- AlterTable
-- Rename 'type' column to 'name'
ALTER TABLE "Event" RENAME COLUMN "type" TO "name";

-- Add new 'event_type' column with default value
ALTER TABLE "Event" ADD COLUMN "event_type" "EventType" NOT NULL DEFAULT 'OTHER';
