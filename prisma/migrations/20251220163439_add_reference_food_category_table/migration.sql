-- CreateTable
CREATE TABLE "ReferenceFoodCategory" (
    "id" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceFoodCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceFoodCategory_category_name_key" ON "ReferenceFoodCategory"("category_name");
