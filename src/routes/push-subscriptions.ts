import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { auth0_sub, endpoint, keys } = req.body;

    if (!auth0_sub || typeof auth0_sub !== 'string') {
      return res.status(400).json({
        error: 'Missing required field: auth0_sub'
      });
    }

    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({
        error: 'Missing required field: endpoint'
      });
    }

    if (!keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        error: 'Missing required fields: keys.p256dh and keys.auth'
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

    // Get user agent from request headers
    const userAgent = req.headers['user-agent'] || null;

    // Create or update push subscription
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        user_id: user.id,
        p256dh_key: keys.p256dh,
        auth_key: keys.auth,
        user_agent: userAgent
      },
      create: {
        user_id: user.id,
        endpoint,
        p256dh_key: keys.p256dh,
        auth_key: keys.auth,
        user_agent: userAgent
      }
    });

    return res.status(200).json({
      message: 'Push subscription saved successfully',
      subscription_id: subscription.id
    });

  } catch (error) {
    console.error('Error saving push subscription:', error);
    return res.status(500).json({
      error: 'Failed to save push subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({
        error: 'Missing required field: endpoint'
      });
    }

    // Delete the subscription
    await prisma.pushSubscription.delete({
      where: { endpoint }
    });

    return res.status(200).json({
      message: 'Push subscription removed successfully'
    });

  } catch (error) {
    // If subscription doesn't exist, still return success
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(200).json({
        message: 'Push subscription already removed'
      });
    }

    console.error('Error removing push subscription:', error);
    return res.status(500).json({
      error: 'Failed to remove push subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's push subscriptions
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

    // Get all subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { user_id: user.id },
      select: {
        id: true,
        endpoint: true,
        user_agent: true,
        created_at: true
      }
    });

    return res.status(200).json({
      subscriptions
    });

  } catch (error) {
    console.error('Error fetching push subscriptions:', error);
    return res.status(500).json({
      error: 'Failed to fetch push subscriptions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
