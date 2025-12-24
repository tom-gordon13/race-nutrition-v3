import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/preferences/reference-data - fetch all reference colors and food categories
router.get('/reference-data', async (req, res) => {
  try {
    const [colors, categories] = await Promise.all([
      prisma.referenceColor.findMany({
        orderBy: {
          color_name: 'asc'
        }
      }),
      prisma.referenceFoodCategory.findMany({
        orderBy: {
          category_name: 'asc'
        }
      })
    ]);

    return res.status(200).json({
      colors,
      categories
    });
  } catch (error) {
    console.error('Error fetching reference data:', error);
    return res.status(500).json({
      error: 'Failed to fetch reference data'
    });
  }
});

// GET /api/preferences/user-colors - fetch user's saved color preferences
router.get('/user-colors', async (req, res) => {
  try {
    const { auth0_sub } = req.query;

    // Validate required fields
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

    // Fetch user's color preferences
    const preferences = await prisma.preferenceUserColor.findMany({
      where: {
        user_id: user.id
      },
      include: {
        color: true,
        foodCategory: true
      }
    });

    console.log(`Fetched ${preferences.length} color preferences for user ${user.id}`);

    return res.status(200).json({
      preferences
    });
  } catch (error) {
    console.error('Error fetching user color preferences:', error);
    return res.status(500).json({
      error: 'Failed to fetch user color preferences'
    });
  }
});

// PUT /api/preferences/user-colors - update user's color preferences (only changed ones)
router.put('/user-colors', async (req, res) => {
  try {
    const { auth0_sub, preferences } = req.body;

    // Validate required fields
    if (!auth0_sub || typeof auth0_sub !== 'string') {
      return res.status(400).json({
        error: 'Missing required field: auth0_sub'
      });
    }

    if (!preferences || !Array.isArray(preferences)) {
      return res.status(400).json({
        error: 'Missing or invalid field: preferences (should be an array)'
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

    // Process each preference update
    const results = await Promise.all(
      preferences.map(async (pref: { food_category_id: string; color_id: string }) => {
        const { food_category_id, color_id } = pref;

        // Validate that the category and color exist
        const [category, color] = await Promise.all([
          prisma.referenceFoodCategory.findUnique({
            where: { id: food_category_id }
          }),
          prisma.referenceColor.findUnique({
            where: { id: color_id }
          })
        ]);

        if (!category) {
          throw new Error(`Food category not found: ${food_category_id}`);
        }

        if (!color) {
          throw new Error(`Color not found: ${color_id}`);
        }

        // Upsert the preference (update if exists, create if not)
        return await prisma.preferenceUserColor.upsert({
          where: {
            user_id_food_category: {
              user_id: user.id,
              food_category: food_category_id
            }
          },
          update: {
            color_id: color_id,
            updated_at: new Date()
          },
          create: {
            user_id: user.id,
            food_category: food_category_id,
            color_id: color_id
          }
        });
      })
    );

    console.log(`Updated ${results.length} color preferences for user ${user.id}`);

    return res.status(200).json({
      message: 'Color preferences updated successfully',
      count: results.length
    });
  } catch (error) {
    console.error('Error updating user color preferences:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update color preferences'
    });
  }
});

export default router;
