import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REFERENCE_COLORS = [
  { hex: '#FF0000', color_name: 'Red' },
  { hex: '#00FF00', color_name: 'Green' },
  { hex: '#0000FF', color_name: 'Blue' },
  { hex: '#FFFF00', color_name: 'Yellow' },
  { hex: '#FF00FF', color_name: 'Magenta' },
];

const REFERENCE_FOOD_CATEGORIES = [
  { category_name: 'ENERGY_GEL' },
  { category_name: 'ENERGY_BAR' },
  { category_name: 'SPORTS_DRINK' },
  { category_name: 'FRUIT' },
  { category_name: 'SNACK' },
  { category_name: 'OTHER' },
];

async function main() {
  console.log('Starting seed...\n');

  // Seed reference colors - only create if they don't exist
  console.log('📦 Seeding Reference Colors...');
  let colorCreatedCount = 0;
  let colorSkippedCount = 0;

  for (const color of REFERENCE_COLORS) {
    const existing = await prisma.referenceColor.findUnique({
      where: { hex: color.hex }
    });

    if (existing) {
      console.log(`  ⏭️  Skipping ${color.color_name} (${color.hex}) - already exists`);
      colorSkippedCount++;
    } else {
      await prisma.referenceColor.create({
        data: {
          hex: color.hex,
          color_name: color.color_name,
        },
      });
      console.log(`  ✓ Created ${color.color_name} (${color.hex})`);
      colorCreatedCount++;
    }
  }

  console.log(`Colors: ${colorCreatedCount} created, ${colorSkippedCount} skipped\n`);

  // Seed reference food categories - only create if they don't exist
  console.log('📦 Seeding Reference Food Categories...');
  let categoryCreatedCount = 0;
  let categorySkippedCount = 0;

  for (const category of REFERENCE_FOOD_CATEGORIES) {
    const existing = await prisma.referenceFoodCategory.findUnique({
      where: { category_name: category.category_name }
    });

    if (existing) {
      console.log(`  ⏭️  Skipping ${category.category_name} - already exists`);
      categorySkippedCount++;
    } else {
      await prisma.referenceFoodCategory.create({
        data: {
          category_name: category.category_name,
        },
      });
      console.log(`  ✓ Created ${category.category_name}`);
      categoryCreatedCount++;
    }
  }

  console.log(`Categories: ${categoryCreatedCount} created, ${categorySkippedCount} skipped\n`);

  console.log(`\n✅ Seed complete: ${colorCreatedCount + categoryCreatedCount} total created, ${colorSkippedCount + categorySkippedCount} total skipped`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
