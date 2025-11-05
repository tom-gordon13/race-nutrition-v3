-- CreateTable
CREATE TABLE "Nutrient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "nutrient_name" TEXT NOT NULL,
    "nutrient_abbreviation" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FoodItemNutrient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "food_item_id" TEXT NOT NULL,
    "nutrient_id" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    CONSTRAINT "FoodItemNutrient_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "FoodItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FoodItemNutrient_nutrient_id_fkey" FOREIGN KEY ("nutrient_id") REFERENCES "Nutrient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
