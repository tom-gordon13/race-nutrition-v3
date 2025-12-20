-- CreateTable
CREATE TABLE "PreferenceUserColor" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "food_category" TEXT NOT NULL,
    "color_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenceUserColor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreferenceUserColor_user_id_food_category_key" ON "PreferenceUserColor"("user_id", "food_category");

-- AddForeignKey
ALTER TABLE "PreferenceUserColor" ADD CONSTRAINT "PreferenceUserColor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceUserColor" ADD CONSTRAINT "PreferenceUserColor_food_category_fkey" FOREIGN KEY ("food_category") REFERENCES "ReferenceFoodCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceUserColor" ADD CONSTRAINT "PreferenceUserColor_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "ReferenceColor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
