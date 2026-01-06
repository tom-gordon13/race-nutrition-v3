import { Router } from 'express';
import { PrismaClient, Event } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET pending shared events for a user (where they are the receiver)
router.get('/pending/:auth0_sub', async (req, res) => {
  try {
    const { auth0_sub } = req.params;

    if (!auth0_sub) {
      return res.status(400).json({
        error: 'Missing required parameter: auth0_sub'
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

    // Get all pending shared events where this user is the receiver
    const pendingSharedEvents = await prisma.sharedEvent.findMany({
      where: {
        receiver_id: user.id,
        status: 'PENDING'
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            event_type: true,
            expected_duration: true,
            created_at: true
          }
        },
        sender: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.status(200).json({
      sharedEvents: pendingSharedEvents
    });

  } catch (error) {
    console.error('Error fetching pending shared events:', error);
    return res.status(500).json({
      error: 'Failed to fetch pending shared events'
    });
  }
});

// GET accepted connections for a user (to show who they can share with)
router.get('/connections/:auth0_sub', async (req, res) => {
  try {
    const { auth0_sub } = req.params;

    if (!auth0_sub) {
      return res.status(400).json({
        error: 'Missing required parameter: auth0_sub'
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

    // Get all accepted connections where the user is either initiator or receiver
    const connections = await prisma.userConnection.findMany({
      where: {
        OR: [
          { initiating_user: user.id },
          { receiving_user: user.id }
        ],
        status: 'ACCEPTED'
      },
      include: {
        initiator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    // Transform connections to return the other user
    const connectedUsers = connections.map(connection => {
      if (connection.initiating_user === user.id) {
        return connection.receiver;
      } else {
        return connection.initiator;
      }
    });

    console.log('Connections endpoint debug:', {
      auth0_sub: auth0_sub,
      currentUserId: user.id,
      currentUserId_type: typeof user.id
    });

    return res.status(200).json({
      users: connectedUsers,
      currentUserId: user.id // Return the current user's ID for use in sharing
    });

  } catch (error) {
    console.error('Error fetching connected users:', error);
    return res.status(500).json({
      error: 'Failed to fetch connected users'
    });
  }
});

// POST create a new shared event
router.post('/', async (req, res) => {
  try {
    const { event_id, sender_id, receiver_id } = req.body;

    if (!event_id || !sender_id || !receiver_id) {
      return res.status(400).json({
        error: 'Missing required fields: event_id, sender_id, and receiver_id are required'
      });
    }

    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: event_id }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Debug logging
    console.log('Share event debug:', {
      event_user_id: event.event_user_id,
      sender_id: sender_id,
      are_equal: event.event_user_id === sender_id,
      event_user_id_type: typeof event.event_user_id,
      sender_id_type: typeof sender_id
    });

    // Verify the sender owns the event
    if (event.event_user_id !== sender_id) {
      return res.status(403).json({
        error: 'You can only share your own events',
        debug: {
          event_user_id: event.event_user_id,
          sender_id: sender_id
        }
      });
    }

    // Verify there's an accepted connection between sender and receiver
    const connection = await prisma.userConnection.findFirst({
      where: {
        OR: [
          { initiating_user: sender_id, receiving_user: receiver_id },
          { initiating_user: receiver_id, receiving_user: sender_id }
        ],
        status: 'ACCEPTED'
      }
    });

    if (!connection) {
      return res.status(403).json({
        error: 'You can only share events with connected users'
      });
    }

    // Create the shared event
    const sharedEvent = await prisma.sharedEvent.create({
      data: {
        event_id,
        sender_id,
        receiver_id,
        status: 'PENDING'
      }
    });

    return res.status(201).json({
      sharedEvent,
      message: 'Event shared successfully'
    });

  } catch (error) {
    console.error('Error creating shared event:', error);
    return res.status(500).json({
      error: 'Failed to share event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT update shared event status (accept or deny)
router.put('/:sharedEventId', async (req, res) => {
  try {
    const { sharedEventId } = req.params;
    const { status } = req.body;

    if (!status || !['ACCEPTED', 'DENIED'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be ACCEPTED or DENIED'
      });
    }

    // Get the shared event with all related data
    const sharedEvent = await prisma.sharedEvent.findUnique({
      where: { id: sharedEventId },
      include: {
        event: true,
        receiver: true
      }
    });

    if (!sharedEvent) {
      return res.status(404).json({
        error: 'Shared event not found'
      });
    }

    // If accepting, create a copy of the event for the receiver
    let copiedEvent: Event | null = null;
    if (status === 'ACCEPTED') {
      // Create a copy of the event for the receiver
      copiedEvent = await prisma.event.create({
        data: {
          event_user_id: sharedEvent.receiver_id,
          expected_duration: sharedEvent.event.expected_duration,
          name: `${sharedEvent.event.name} (shared)`,
          event_type: sharedEvent.event.event_type
        }
      });

      // Copy all food instances
      const originalFoodInstances = await prisma.foodInstance.findMany({
        where: { event_id: sharedEvent.event_id }
      });

      if (originalFoodInstances.length > 0) {
        await prisma.foodInstance.createMany({
          data: originalFoodInstances.map(instance => ({
            event_id: copiedEvent!.id,
            food_item_id: instance.food_item_id,
            time_elapsed_at_consumption: instance.time_elapsed_at_consumption,
            servings: instance.servings
          }))
        });
      }

      // Copy all EventGoalsBase records
      const originalGoalsBase = await prisma.eventGoalsBase.findMany({
        where: { event_id: sharedEvent.event_id }
      });

      if (originalGoalsBase.length > 0) {
        await prisma.eventGoalsBase.createMany({
          data: originalGoalsBase.map(goal => ({
            user_id: sharedEvent.receiver_id,
            event_id: copiedEvent!.id,
            nutrient_id: goal.nutrient_id,
            quantity: goal.quantity,
            unit: goal.unit
          }))
        });
      }

      // Copy all EventGoalsHourly records
      const originalGoalsHourly = await prisma.eventGoalsHourly.findMany({
        where: { event_id: sharedEvent.event_id }
      });

      if (originalGoalsHourly.length > 0) {
        await prisma.eventGoalsHourly.createMany({
          data: originalGoalsHourly.map(goal => ({
            user_id: sharedEvent.receiver_id,
            event_id: copiedEvent!.id,
            nutrient_id: goal.nutrient_id,
            hour: goal.hour,
            quantity: goal.quantity,
            unit: goal.unit
          }))
        });
      }
    }

    // Update the shared event status
    const updatedSharedEvent = await prisma.sharedEvent.update({
      where: { id: sharedEventId },
      data: { status }
    });

    return res.status(200).json({
      sharedEvent: updatedSharedEvent,
      copiedEvent: copiedEvent,
      message: status === 'ACCEPTED'
        ? 'Shared event accepted and copied to your events'
        : 'Shared event denied'
    });

  } catch (error) {
    console.error('Error updating shared event:', error);
    return res.status(500).json({
      error: 'Failed to update shared event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
