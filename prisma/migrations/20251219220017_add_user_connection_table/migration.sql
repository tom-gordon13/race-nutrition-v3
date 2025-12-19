-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'DENIED', 'ACCEPTED');

-- CreateTable
CREATE TABLE "UserConnection" (
    "id" TEXT NOT NULL,
    "initiating_user" TEXT NOT NULL,
    "receiving_user" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "UserConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserConnection_initiating_user_receiving_user_key" ON "UserConnection"("initiating_user", "receiving_user");

-- AddForeignKey
ALTER TABLE "UserConnection" ADD CONSTRAINT "UserConnection_initiating_user_fkey" FOREIGN KEY ("initiating_user") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConnection" ADD CONSTRAINT "UserConnection_receiving_user_fkey" FOREIGN KEY ("receiving_user") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
