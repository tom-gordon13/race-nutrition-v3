import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET user preferences
router.get('/', async (req, res) => {
  try {
    const { auth0_sub } = req.query;

    if (!auth0_sub || typeof auth0_sub !== 'string') {
      return res.status(400).json({
        error: 'Missing required query parameter: auth0_sub'
      });
    }

    // Look up the user by their Auth0 ID
    const user = await prisma.user.findUnique({
      where: { auth0_sub }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get user preferences (or create default if doesn't exist)
    let userPreferences = await prisma.userPreferences.findUnique({
      where: { user_id: user.id }
    });

    // If no preferences exist, create default ones
    if (!userPreferences) {
      userPreferences = await prisma.userPreferences.create({
        data: {
          user_id: user.id,
          dark_mode: false
        }
      });
    }

    return res.status(200).json({
      preferences: userPreferences
    });

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return res.status(500).json({
      error: 'Failed to fetch user preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT/update user preferences
router.put('/', async (req, res) => {
  try {
    const { auth0_sub, dark_mode } = req.body;

    if (!auth0_sub || typeof auth0_sub !== 'string') {
      return res.status(400).json({
        error: 'Missing required field: auth0_sub'
      });
    }

    if (typeof dark_mode !== 'boolean') {
      return res.status(400).json({
        error: 'dark_mode must be a boolean'
      });
    }

    // Look up the user by their Auth0 ID
    const user = await prisma.user.findUnique({
      where: { auth0_sub }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Upsert user preferences
    const userPreferences = await prisma.userPreferences.upsert({
      where: { user_id: user.id },
      update: { dark_mode },
      create: {
        user_id: user.id,
        dark_mode
      }
    });

    return res.status(200).json({
      message: 'User preferences updated successfully',
      preferences: userPreferences
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    return res.status(500).json({
      error: 'Failed to update user preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
