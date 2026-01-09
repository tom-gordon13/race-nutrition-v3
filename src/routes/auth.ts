import { Router } from 'express';
// import { PrismaClient } from '../../../generated/prisma/index.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/users/all', async (req, res) => {
  try {
    const { current_user_id } = req.query;

    if (!current_user_id || typeof current_user_id !== 'string') {
      return res.status(400).json({
        error: 'Missing required query parameter: current_user_id'
      });
    }

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: current_user_id // Exclude current user from list
        }
      },
      select: {
        id: true,
        first_name: true,
        last_name: true
      },
      orderBy: {
        first_name: 'asc'
      }
    });

    // Fetch all connections involving the current user
    const connections = await prisma.userConnection.findMany({
      where: {
        OR: [
          { initiating_user: current_user_id },
          { receiving_user: current_user_id }
        ]
      }
    });

    // Build a map of user connections
    const connectionMap = new Map();
    connections.forEach(conn => {
      if (conn.initiating_user === current_user_id) {
        connectionMap.set(conn.receiving_user, {
          connectionId: conn.id,
          status: conn.status,
          type: 'INITIATED'
        });
      } else {
        connectionMap.set(conn.initiating_user, {
          connectionId: conn.id,
          status: conn.status,
          type: 'RECEIVED'
        });
      }
    });

    // Get event counts for all users
    const eventCounts = await prisma.event.groupBy({
      by: ['event_user_id'],
      _count: {
        id: true
      }
    });

    // Build a map of user event counts
    const eventCountMap = new Map();
    eventCounts.forEach(ec => {
      eventCountMap.set(ec.event_user_id, ec._count.id);
    });

    // Filter out users where the connection was denied by them
    // and attach connection info and event count to each user
    const usersWithConnections = users
      .filter(user => {
        const connection = connectionMap.get(user.id);
        // Exclude if they denied my request
        if (connection && connection.type === 'INITIATED' && connection.status === 'DENIED') {
          return false;
        }
        return true;
      })
      .map(user => {
        const connection = connectionMap.get(user.id);
        const sharedPlansCount = eventCountMap.get(user.id) || 0;
        return {
          ...user,
          connection: connection || null,
          sharedPlansCount
        };
      });

    return res.status(200).json({
      users: usersWithConnections
    });

  } catch (error) {
    console.error('Error fetching all users:', error);
    return res.status(500).json({
      error: 'Failed to fetch users'
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { auth0_sub } = req.query;

    if (!auth0_sub || typeof auth0_sub !== 'string') {
      return res.status(400).json({
        error: 'Missing required query parameter: auth0_sub'
      });
    }

    const user = await prisma.user.findUnique({
      where: { auth0_sub }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    return res.status(200).json({
      user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      error: 'Failed to fetch user'
    });
  }
});

router.post('/sync-user', async (req, res) => {
  try {
    const { auth0Sub, email, firstName, lastName } = req.body;


    if (!auth0Sub || !firstName) {
      return res.status(400).json({
        error: 'Missing required fields: auth0Sub and firstName are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { auth0_sub: auth0Sub }
    });

    if (existingUser) {
      return res.status(200).json({
        user: existingUser,
        message: 'User already exists'
      });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        auth0_sub: auth0Sub,
        email: email || null,
        first_name: firstName,
        last_name: lastName || ''
      }
    });

    return res.status(201).json({
      user: newUser,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error syncing user:', error);
    return res.status(500).json({
      error: 'Failed to sync user'
    });
  }
});

export default router;
