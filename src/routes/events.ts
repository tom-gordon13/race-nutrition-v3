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
      include: {
        triathlonAttributes: true
      },
      orderBy: {
        updated_at: 'desc'
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

// GET community events (public events from connected users)
router.get('/community', async (req, res) => {
  try {
    const { auth0_sub } = req.query;

    if (!auth0_sub || typeof auth0_sub !== 'string') {
      return res.status(400).json({
        error: 'Missing required query parameter: auth0_sub'
      });
    }

    // Look up the current user by their Auth0 ID
    const currentUser = await prisma.user.findUnique({
      where: { auth0_sub }
    });

    if (!currentUser) {
      return res.status(404).json({
        error: 'User not found. Please ensure you are logged in.'
      });
    }

    // Find all accepted connections for this user (both initiated and received)
    const connections = await prisma.userConnection.findMany({
      where: {
        OR: [
          { initiating_user: currentUser.id },
          { receiving_user: currentUser.id }
        ],
        status: 'ACCEPTED'
      }
    });

    // Extract connected user IDs
    const connectedUserIds = connections.map(conn =>
      conn.initiating_user === currentUser.id ? conn.receiving_user : conn.initiating_user
    );

    console.log(`User ${currentUser.id} has ${connectedUserIds.length} connected users`);

    // Fetch all public events from connected users
    const events = await prisma.event.findMany({
      where: {
        event_user_id: {
          in: connectedUserIds
        },
        private: false
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        triathlonAttributes: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform to include owner info in the expected format
    const eventsWithOwner = events.map(event => ({
      ...event,
      owner: event.user
    }));

    console.log(`Fetched ${events.length} public community events for user ${currentUser.id}`);

    return res.status(200).json({
      events: eventsWithOwner,
      count: events.length
    });

  } catch (error) {
    console.error('Error fetching community events:', error);
    return res.status(500).json({
      error: 'Failed to fetch community events',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET a single event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { auth0_sub } = req.query;

    // Fetch the event with owner information
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            auth0_sub: true
          }
        },
        triathlonAttributes: true
      }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // If auth0_sub is provided, check if this user owns the event
    let isOwner = false;
    if (auth0_sub && typeof auth0_sub === 'string') {
      const user = await prisma.user.findUnique({
        where: { auth0_sub }
      });

      if (user) {
        isOwner = user.id === event.event_user_id;
      }
    }

    console.log(`Fetched event ${event.id}, isOwner: ${isOwner}, private: ${event.private}`);

    return res.status(200).json({
      event,
      isOwner,
      ownerAuth0Sub: event.user.auth0_sub
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    return res.status(500).json({
      error: 'Failed to fetch event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST create a new event
router.post('/', async (req, res) => {
  try {
    const { auth0_sub, expected_duration, name, event_type } = req.body;

    console.log('Received event creation request:', req.body);

    // Validate required fields
    if (!auth0_sub || !expected_duration || !name || !event_type) {
      return res.status(400).json({
        error: 'Missing required fields: auth0_sub, expected_duration, name, and event_type are required'
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
        name,
        event_type
      }
    });

    console.log('Event created:', event.id, 'Name:', event.name, 'Type:', event.event_type);

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
    const { name, event_type, expected_duration, private: isPrivate } = req.body;

    console.log('Received event update request:', { id, name, event_type, expected_duration, private: isPrivate });

    // Validate required fields
    if (!name && !event_type && !expected_duration && isPrivate === undefined) {
      return res.status(400).json({
        error: 'At least one field (name, event_type, expected_duration, or private) must be provided'
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
        ...(name && { name }),
        ...(event_type && { event_type }),
        ...(expected_duration && { expected_duration: parseInt(expected_duration) }),
        ...(isPrivate !== undefined && { private: isPrivate })
      }
    });

    console.log('Event updated:', updatedEvent.id, 'Name:', updatedEvent.name, 'Type:', updatedEvent.event_type, 'Private:', updatedEvent.private);

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
      where: { id },
      include: {
        triathlonAttributes: true
      }
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
        name: `${originalEvent.name} - copy`,
        event_type: originalEvent.event_type
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

    // Copy triathlon attributes if they exist
    if (originalEvent.triathlonAttributes) {
      await prisma.triathlonAttributes.create({
        data: {
          event_id: newEvent.id,
          swim_duration_seconds: originalEvent.triathlonAttributes.swim_duration_seconds,
          bike_duration_seconds: originalEvent.triathlonAttributes.bike_duration_seconds,
          run_duration_seconds: originalEvent.triathlonAttributes.run_duration_seconds,
          t1_duration_seconds: originalEvent.triathlonAttributes.t1_duration_seconds,
          t2_duration_seconds: originalEvent.triathlonAttributes.t2_duration_seconds
        }
      });
    }

    console.log(
      'Event duplicated:',
      newEvent.id,
      'Name:',
      newEvent.name,
      'Type:',
      newEvent.event_type,
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

// DELETE an event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { auth0_sub } = req.query;

    console.log('Received event deletion request:', { id, auth0_sub });

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

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Check if user is the owner of the event
    if (event.event_user_id !== user.id) {
      return res.status(403).json({
        error: 'You do not have permission to delete this event'
      });
    }

    // Delete related records first (due to foreign key constraints)
    // Delete food instances
    await prisma.foodInstance.deleteMany({
      where: { event_id: id }
    });

    // Delete triathlon attributes if they exist
    await prisma.triathlonAttributes.deleteMany({
      where: { event_id: id }
    });

    // Delete event goals (base and hourly)
    await prisma.eventGoalsBase.deleteMany({
      where: { event_id: id }
    });

    await prisma.eventGoalsHourly.deleteMany({
      where: { event_id: id }
    });

    // Delete shared events
    await prisma.sharedEvent.deleteMany({
      where: { event_id: id }
    });

    // Finally, delete the event itself
    await prisma.event.delete({
      where: { id }
    });

    console.log('Event deleted:', id, 'by user:', user.id);

    return res.status(200).json({
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({
      error: 'Failed to delete event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
