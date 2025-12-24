import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const nutrients = await prisma.nutrient.findMany({
      orderBy: {
        nutrient_name: 'asc'
      }
    });

    console.log(`Fetched ${nutrients.length} nutrients from database`);
    console.log('Nutrients:', nutrients);

    return res.status(200).json({
      nutrients,
      count: nutrients.length
    });

  } catch (error) {
    console.error('Error fetching nutrients:', error);
    return res.status(500).json({
      error: 'Failed to fetch nutrients'
    });
  }
});

export default router;
