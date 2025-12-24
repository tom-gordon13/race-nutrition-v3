import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Create a new connection request
router.post('/', async (req, res) => {
  try {
    const { initiating_user, receiving_user } = req.body;

    if (!initiating_user || !receiving_user) {
      return res.status(400).json({
        error: 'Missing required fields: initiating_user and receiving_user are required'
      });
    }

    // Check if connection already exists
    const existingConnection = await prisma.userConnection.findFirst({
      where: {
        OR: [
          { initiating_user, receiving_user },
          { initiating_user: receiving_user, receiving_user: initiating_user }
        ]
      }
    });

    if (existingConnection) {
      return res.status(400).json({
        error: 'Connection request already exists'
      });
    }

    // Create new connection request
    const connection = await prisma.userConnection.create({
      data: {
        initiating_user,
        receiving_user,
        status: 'PENDING'
      }
    });

    return res.status(201).json({
      connection,
      message: 'Connection request sent successfully'
    });

  } catch (error) {
    console.error('Error creating connection request:', error);
    return res.status(500).json({
      error: 'Failed to create connection request'
    });
  }
});

// Update connection status (accept or deny)
router.put('/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { status } = req.body;

    if (!status || !['ACCEPTED', 'DENIED'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be ACCEPTED or DENIED'
      });
    }

    const connection = await prisma.userConnection.update({
      where: { id: connectionId },
      data: { status }
    });

    return res.status(200).json({
      connection,
      message: `Connection request ${status.toLowerCase()}`
    });

  } catch (error) {
    console.error('Error updating connection:', error);
    return res.status(500).json({
      error: 'Failed to update connection'
    });
  }
});

export default router;
