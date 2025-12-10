-- CreateTable
CREATE TABLE "EventGoalsBase" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "nutrient_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventGoalsBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventGoalsHourly" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "nutrient_id" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventGoalsHourly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventGoalsBase_user_id_event_id_nutrient_id_key" ON "EventGoalsBase"("user_id", "event_id", "nutrient_id");

-- CreateIndex
CREATE UNIQUE INDEX "EventGoalsHourly_user_id_event_id_nutrient_id_hour_key" ON "EventGoalsHourly"("user_id", "event_id", "nutrient_id", "hour");

-- AddForeignKey
ALTER TABLE "EventGoalsBase" ADD CONSTRAINT "EventGoalsBase_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGoalsBase" ADD CONSTRAINT "EventGoalsBase_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGoalsBase" ADD CONSTRAINT "EventGoalsBase_nutrient_id_fkey" FOREIGN KEY ("nutrient_id") REFERENCES "Nutrient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGoalsHourly" ADD CONSTRAINT "EventGoalsHourly_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGoalsHourly" ADD CONSTRAINT "EventGoalsHourly_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGoalsHourly" ADD CONSTRAINT "EventGoalsHourly_nutrient_id_fkey" FOREIGN KEY ("nutrient_id") REFERENCES "Nutrient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
