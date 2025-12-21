-- CreateTable
CREATE TABLE "FavoriteFoodItem" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "food_item_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavoriteFoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteFoodItem_user_id_food_item_id_key" ON "FavoriteFoodItem"("user_id", "food_item_id");

-- AddForeignKey
ALTER TABLE "FavoriteFoodItem" ADD CONSTRAINT "FavoriteFoodItem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteFoodItem" ADD CONSTRAINT "FavoriteFoodItem_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "FoodItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
