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

// PUT update an event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, expected_duration } = req.body;

    console.log('Received event update request:', { id, type, expected_duration });

    // Validate required fields
    if (!type && !expected_duration) {
      return res.status(400).json({
        error: 'At least one field (type or expected_duration) must be provided'
      });
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(expected_duration && { expected_duration: parseInt(expected_duration) })
      }
    });

    console.log('Event updated:', updatedEvent.id, 'Type:', updatedEvent.type);

    return res.status(200).json({
      message: 'Event updated successfully',
      event: updatedEvent
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({
      error: 'Failed to update event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST duplicate an event (creates a copy with all food instances)
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Received event duplicate request:', { id });

    // Find the original event
    const originalEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!originalEvent) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Get all food instances for the original event
    const originalFoodInstances = await prisma.foodInstance.findMany({
      where: { event_id: id }
    });

    // Create the new event with " - copy" appended to the name
    const newEvent = await prisma.event.create({
      data: {
        event_user_id: originalEvent.event_user_id,
        expected_duration: originalEvent.expected_duration,
        type: `${originalEvent.type} - copy`
      }
    });

    // Create copies of all food instances for the new event
    if (originalFoodInstances.length > 0) {
      await prisma.foodInstance.createMany({
        data: originalFoodInstances.map(instance => ({
          event_id: newEvent.id,
          food_item_id: instance.food_item_id,
          time_elapsed_at_consumption: instance.time_elapsed_at_consumption,
          servings: instance.servings
        }))
      });
    }

    console.log(
      'Event duplicated:',
      newEvent.id,
      'Type:',
      newEvent.type,
      'Food instances copied:',
      originalFoodInstances.length
    );

    return res.status(201).json({
      message: 'Event duplicated successfully',
      event: newEvent,
      foodInstancesCopied: originalFoodInstances.length
    });

  } catch (error) {
    console.error('Error duplicating event:', error);
    return res.status(500).json({
      error: 'Failed to duplicate event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
