-- CreateTable
CREATE TABLE "ReferenceColor" (
    "id" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "color_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceColor_pkey" PRIMARY KEY ("id")
);
