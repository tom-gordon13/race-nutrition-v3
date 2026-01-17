import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get one food item with all its details
  const item = await prisma.foodItem.findFirst({
    where: {
      item_name: 'Banana'
    },
    include: {
      foodItemNutrients: {
        include: {
          nutrient: true
        }
      }
    }
  });

  if (!item) {
    console.log('No Banana found');
    return;
  }

  console.log('\nFood Item Details:');
  console.log('Name:', item.item_name);
  console.log('Brand:', item.brand);
  console.log('\nNutrients:');
  item.foodItemNutrients.forEach(n => {
    console.log(`- ${n.nutrient.name}: ${n.amount}${n.nutrient.unit || ''}`);
  });

  // Also check what nutrients exist
  console.log('\n\nAll available nutrients:');
  const nutrients = await prisma.nutrient.findMany();
  nutrients.forEach(n => {
    console.log(`- ${n.name} (${n.unit || 'no unit'})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
