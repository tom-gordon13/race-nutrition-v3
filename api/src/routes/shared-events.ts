import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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

    // Verify the sender owns the event
    if (event.event_user_id !== sender_id) {
      return res.status(403).json({
        error: 'You can only share your own events'
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

    const sharedEvent = await prisma.sharedEvent.update({
      where: { id: sharedEventId },
      data: { status }
    });

    return res.status(200).json({
      sharedEvent,
      message: `Shared event ${status.toLowerCase()}`
    });

  } catch (error) {
    console.error('Error updating shared event:', error);
    return res.status(500).json({
      error: 'Failed to update shared event'
    });
  }
});

export default router;
