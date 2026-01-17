import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get all food items with their nutrients
  const foodItems = await prisma.foodItem.findMany({
    include: {
      foodItemNutrients: {
        include: {
          nutrient: true
        }
      }
    },
    take: 20
  });

  console.log(`\nFound ${foodItems.length} food items in database:\n`);

  foodItems.forEach((item, i) => {
    const carbs = item.foodItemNutrients.find(n => n.nutrient.nutrient_name === 'Carbohydrates');
    const brand = item.brand || 'No brand';
    console.log(`${i+1}. ${item.item_name} (${brand})`);
    console.log(`   ID: ${item.id}`);
    console.log(`   Carbs: ${carbs?.quantity || 0}g`);
    console.log(`   Category: ${item.category || 'N/A'}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
