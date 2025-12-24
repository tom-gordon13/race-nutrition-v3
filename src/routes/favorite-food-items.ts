import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all favorite food items for a user
router.get('/', async (req, res) => {
  try {
    const { auth0_sub } = req.query;

    if (!auth0_sub || typeof auth0_sub !== 'string') {
      return res.status(400).json({
        error: 'Missing required query parameter: auth0_sub'
      });
    }

    // Look up the user by their Auth0 ID to get their UUID
    const user = await prisma.user.findUnique({
      where: { auth0_sub }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found. Please ensure you are logged in.'
      });
    }

    const favorites = await prisma.favoriteFoodItem.findMany({
      where: {
        user_id: user.id
      },
      include: {
        foodItem: {
          include: {
            foodItemNutrients: {
              include: {
                nutrient: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json({
      favorites,
      count: favorites.length
    });

  } catch (error) {
    console.error('Error fetching favorite food items:', error);
    return res.status(500).json({
      error: 'Failed to fetch favorite food items',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a food item to favorites
router.post('/', async (req, res) => {
  try {
    const { auth0_sub, food_item_id } = req.body;

    if (!auth0_sub || !food_item_id) {
      return res.status(400).json({
        error: 'Missing required fields: auth0_sub and food_item_id are required'
      });
    }

    // Look up the user by their Auth0 ID to get their UUID
    const user = await prisma.user.findUnique({
      where: { auth0_sub }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found. Please ensure you are logged in.'
      });
    }

    // Check if already favorited
    const existing = await prisma.favoriteFoodItem.findUnique({
      where: {
        user_id_food_item_id: {
          user_id: user.id,
          food_item_id
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        error: 'Food item is already favorited'
      });
    }

    const favorite = await prisma.favoriteFoodItem.create({
      data: {
        user_id: user.id,
        food_item_id
      }
    });

    return res.status(201).json({
      message: 'Food item added to favorites',
      favorite
    });

  } catch (error) {
    console.error('Error adding favorite food item:', error);
    return res.status(500).json({
      error: 'Failed to add favorite food item',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Remove a food item from favorites
router.delete('/:food_item_id', async (req, res) => {
  try {
    const { food_item_id } = req.params;
    const { auth0_sub } = req.query;

    if (!auth0_sub || typeof auth0_sub !== 'string') {
      return res.status(400).json({
        error: 'Missing required query parameter: auth0_sub'
      });
    }

    // Look up the user by their Auth0 ID to get their UUID
    const user = await prisma.user.findUnique({
      where: { auth0_sub }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found. Please ensure you are logged in.'
      });
    }

    await prisma.favoriteFoodItem.delete({
      where: {
        user_id_food_item_id: {
          user_id: user.id,
          food_item_id
        }
      }
    });

    return res.status(200).json({
      message: 'Food item removed from favorites'
    });

  } catch (error) {
    console.error('Error removing favorite food item:', error);
    return res.status(500).json({
      error: 'Failed to remove favorite food item',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
