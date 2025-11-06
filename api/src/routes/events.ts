import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all events for a user
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
        error: 'User not found. Please ensure you are logged in.'
      });
    }

    // Fetch all events for this user
    const events = await prisma.event.findMany({
      where: {
        event_user_id: user.id
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`Fetched ${events.length} events for user ${user.id}`);

    return res.status(200).json({
      events,
      count: events.length
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST create a new event
router.post('/', async (req, res) => {
  try {
    const { auth0_sub, expected_duration, type } = req.body;

    console.log('Received event creation request:', req.body);

    // Validate required fields
    if (!auth0_sub || !expected_duration || !type) {
      return res.status(400).json({
        error: 'Missing required fields: auth0_sub, expected_duration, and type are required'
      });
    }

    // Look up the user by their Auth0 ID
    const user = await prisma.user.findUnique({
      where: { auth0_sub }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found. Please ensure you are logged in.'
      });
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        event_user_id: user.id,
        expected_duration: parseInt(expected_duration),
        type
      }
    });

    console.log('Event created:', event.id, 'Type:', event.type);

    return res.status(201).json({
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({
      error: 'Failed to create event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
