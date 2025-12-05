const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const items = await prisma.foodItem.findMany({
    take: 5,
    orderBy: { created_at: 'desc' }
  });
  
  console.log('Raw items from DB:');
  items.forEach(item => {
    console.log({
      id: item.id,
      item_name: item.item_name,
      cost: item.cost,
      cost_type: typeof item.cost,
      cost_constructor: item.cost?.constructor?.name
    });
  });
  
  await prisma.$disconnect();
}

test().catch(console.error);
