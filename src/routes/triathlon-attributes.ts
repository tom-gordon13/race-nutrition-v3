import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET triathlon attributes for an event
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        error: 'eventId is required'
      });
    }

    const attributes = await prisma.triathlonAttributes.findUnique({
      where: { event_id: eventId }
    });

    if (!attributes) {
      return res.status(404).json({
        error: 'Triathlon attributes not found for this event'
      });
    }

    return res.status(200).json({ attributes });
  } catch (error) {
    console.error('Error fetching triathlon attributes:', error);
    return res.status(500).json({
      error: 'Failed to fetch triathlon attributes'
    });
  }
});

// POST/UPDATE triathlon attributes (upsert)
router.post('/', async (req, res) => {
  try {
    const {
      event_id,
      swim_duration_seconds,
      bike_duration_seconds,
      run_duration_seconds,
      t1_duration_seconds,
      t2_duration_seconds
    } = req.body;

    if (!event_id || swim_duration_seconds === undefined || bike_duration_seconds === undefined || run_duration_seconds === undefined) {
      return res.status(400).json({
        error: 'event_id, swim_duration_seconds, bike_duration_seconds, and run_duration_seconds are required'
      });
    }

    // Verify the event exists and is a triathlon
    const event = await prisma.event.findUnique({
      where: { id: event_id }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    if (event.event_type !== 'TRIATHLON') {
      return res.status(400).json({
        error: 'Event must be of type TRIATHLON to have triathlon attributes'
      });
    }

    // Calculate total duration and validate
    const totalDuration =
      swim_duration_seconds +
      bike_duration_seconds +
      run_duration_seconds +
      (t1_duration_seconds || 0) +
      (t2_duration_seconds || 0);

    if (totalDuration !== event.expected_duration) {
      return res.status(400).json({
        error: `Sum of segment durations (${totalDuration}s) must equal event expected_duration (${event.expected_duration}s)`
      });
    }

    // Upsert the triathlon attributes
    const attributes = await prisma.triathlonAttributes.upsert({
      where: { event_id },
      update: {
        swim_duration_seconds,
        bike_duration_seconds,
        run_duration_seconds,
        t1_duration_seconds: t1_duration_seconds || null,
        t2_duration_seconds: t2_duration_seconds || null,
        updated_at: new Date()
      },
      create: {
        event_id,
        swim_duration_seconds,
        bike_duration_seconds,
        run_duration_seconds,
        t1_duration_seconds: t1_duration_seconds || null,
        t2_duration_seconds: t2_duration_seconds || null
      }
    });

    // Update the parent event's updated_at timestamp
    await prisma.event.update({
      where: { id: event_id },
      data: { updated_at: new Date() }
    });

    return res.status(200).json({
      message: 'Triathlon attributes saved successfully',
      attributes
    });
  } catch (error) {
    console.error('Error saving triathlon attributes:', error);
    return res.status(500).json({
      error: 'Failed to save triathlon attributes'
    });
  }
});

// DELETE triathlon attributes
router.delete('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const attributes = await prisma.triathlonAttributes.findUnique({
      where: { event_id: eventId }
    });

    if (!attributes) {
      return res.status(404).json({
        error: 'Triathlon attributes not found'
      });
    }

    await prisma.triathlonAttributes.delete({
      where: { event_id: eventId }
    });

    // Update the parent event's updated_at timestamp
    await prisma.event.update({
      where: { id: eventId },
      data: { updated_at: new Date() }
    });

    return res.status(200).json({
      message: 'Triathlon attributes deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting triathlon attributes:', error);
    return res.status(500).json({
      error: 'Failed to delete triathlon attributes'
    });
  }
});

export default router;
