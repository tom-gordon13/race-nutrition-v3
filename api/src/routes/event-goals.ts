import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET base goals for an event
router.get('/base', async (req, res) => {
  try {
    const { event_id, user_id } = req.query;

    if (!event_id || !user_id) {
      return res.status(400).json({
        error: 'event_id and user_id are required'
      });
    }

    const goals = await prisma.eventGoalsBase.findMany({
      where: {
        event_id: event_id as string,
        user_id: user_id as string
      },
      include: {
        nutrient: true
      }
    });

    return res.status(200).json({ goals });
  } catch (error) {
    console.error('Error fetching base goals:', error);
    return res.status(500).json({
      error: 'Failed to fetch base goals'
    });
  }
});

// GET hourly goals for an event
router.get('/hourly', async (req, res) => {
  try {
    const { event_id, user_id } = req.query;

    if (!event_id || !user_id) {
      return res.status(400).json({
        error: 'event_id and user_id are required'
      });
    }

    const goals = await prisma.eventGoalsHourly.findMany({
      where: {
        event_id: event_id as string,
        user_id: user_id as string
      },
      include: {
        nutrient: true
      },
      orderBy: {
        hour: 'asc'
      }
    });

    return res.status(200).json({ goals });
  } catch (error) {
    console.error('Error fetching hourly goals:', error);
    return res.status(500).json({
      error: 'Failed to fetch hourly goals'
    });
  }
});

// POST/UPDATE base goals (upsert)
router.post('/base', async (req, res) => {
  try {
    const { user_id, event_id, goals } = req.body;

    if (!user_id || !event_id || !goals || !Array.isArray(goals)) {
      return res.status(400).json({
        error: 'user_id, event_id, and goals array are required'
      });
    }

    // Get user internal ID from auth0_sub
    const user = await prisma.user.findUnique({
      where: { auth0_sub: user_id }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Delete existing goals for this event
    await prisma.eventGoalsBase.deleteMany({
      where: {
        user_id: user.id,
        event_id
      }
    });

    // Create new goals
    const createdGoals = await Promise.all(
      goals.map(goal =>
        prisma.eventGoalsBase.create({
          data: {
            user_id: user.id,
            event_id,
            nutrient_id: goal.nutrient_id,
            quantity: goal.quantity,
            unit: goal.unit
          }
        })
      )
    );

    return res.status(200).json({
      message: 'Base goals saved successfully',
      goals: createdGoals
    });
  } catch (error) {
    console.error('Error saving base goals:', error);
    return res.status(500).json({
      error: 'Failed to save base goals'
    });
  }
});

// POST/UPDATE hourly goals (upsert)
router.post('/hourly', async (req, res) => {
  try {
    const { user_id, event_id, goals } = req.body;

    if (!user_id || !event_id || !goals || !Array.isArray(goals)) {
      return res.status(400).json({
        error: 'user_id, event_id, and goals array are required'
      });
    }

    // Get user internal ID from auth0_sub
    const user = await prisma.user.findUnique({
      where: { auth0_sub: user_id }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Delete existing hourly goals for this event
    await prisma.eventGoalsHourly.deleteMany({
      where: {
        user_id: user.id,
        event_id
      }
    });

    // Create new hourly goals
    const createdGoals = await Promise.all(
      goals.map(goal =>
        prisma.eventGoalsHourly.create({
          data: {
            user_id: user.id,
            event_id,
            nutrient_id: goal.nutrient_id,
            hour: goal.hour,
            quantity: goal.quantity,
            unit: goal.unit
          }
        })
      )
    );

    return res.status(200).json({
      message: 'Hourly goals saved successfully',
      goals: createdGoals
    });
  } catch (error) {
    console.error('Error saving hourly goals:', error);
    return res.status(500).json({
      error: 'Failed to save hourly goals'
    });
  }
});

// DELETE base goal
router.delete('/base/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.eventGoalsBase.delete({
      where: { id }
    });

    return res.status(200).json({
      message: 'Base goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting base goal:', error);
    return res.status(500).json({
      error: 'Failed to delete base goal'
    });
  }
});

// DELETE hourly goal
router.delete('/hourly/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.eventGoalsHourly.delete({
      where: { id }
    });

    return res.status(200).json({
      message: 'Hourly goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hourly goal:', error);
    return res.status(500).json({
      error: 'Failed to delete hourly goal'
    });
  }
});

export default router;
