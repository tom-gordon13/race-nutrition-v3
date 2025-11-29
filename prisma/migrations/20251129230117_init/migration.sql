-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('ENERGY_GEL', 'ENERGY_BAR', 'SPORTS_DRINK', 'FRUIT', 'SNACK', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "auth0_sub" TEXT NOT NULL,
    "email" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "brand" TEXT,
    "category" "FoodCategory",
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "event_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expected_duration" INTEGER NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodInstance" (
    "id" TEXT NOT NULL,
    "time_elapsed_at_consumption" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "food_item_id" TEXT NOT NULL,
    "servings" INTEGER NOT NULL,
    "event_id" TEXT NOT NULL,

    CONSTRAINT "FoodInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nutrient" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "nutrient_name" TEXT NOT NULL,
    "nutrient_abbreviation" TEXT NOT NULL,

    CONSTRAINT "Nutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodItemNutrient" (
    "id" TEXT NOT NULL,
    "food_item_id" TEXT NOT NULL,
    "nutrient_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "FoodItemNutrient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_auth0_sub_key" ON "User"("auth0_sub");

-- AddForeignKey
ALTER TABLE "FoodItem" ADD CONSTRAINT "FoodItem_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_event_user_id_fkey" FOREIGN KEY ("event_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodInstance" ADD CONSTRAINT "FoodInstance_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodInstance" ADD CONSTRAINT "FoodInstance_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodItemNutrient" ADD CONSTRAINT "FoodItemNutrient_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodItemNutrient" ADD CONSTRAINT "FoodItemNutrient_nutrient_id_fkey" FOREIGN KEY ("nutrient_id") REFERENCES "Nutrient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
