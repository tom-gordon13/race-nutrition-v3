import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all food instances for a specific event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate eventId is provided
    if (!eventId) {
      return res.status(400).json({
        error: 'Missing required parameter: eventId'
      });
    }

    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    console.log({ event })

    // Fetch all food instances for this event
    const foodInstances = await prisma.foodInstance.findMany({
      where: {
        event_id: eventId
      },
      include: {
        foodItem: {
          include: {
            foodItemNutrients: {
              include: {
                nutrient: true
              }
            }
          }
        }
      },
      orderBy: {
        time_elapsed_at_consumption: 'asc'
      }
    });

    console.log(`Fetched ${foodInstances.length} food instances for event ${eventId}`);

    return res.status(200).json({
      foodInstances,
      count: foodInstances.length
    });

  } catch (error) {
    console.error('Error fetching food instances:', error);
    return res.status(500).json({
      error: 'Failed to fetch food instances',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST create a new food instance
router.post('/', async (req, res) => {
  try {
    const { food_item_id, event_id, time_elapsed_at_consumption, servings } = req.body;

    // Validate required fields
    if (!food_item_id || !event_id) {
      return res.status(400).json({
        error: 'Missing required fields: food_item_id and event_id are required'
      });
    }

    if (time_elapsed_at_consumption === undefined || typeof time_elapsed_at_consumption !== 'number') {
      return res.status(400).json({
        error: 'Missing or invalid required field: time_elapsed_at_consumption must be a number'
      });
    }

    // Verify the food item exists
    const foodItem = await prisma.foodItem.findUnique({
      where: { id: food_item_id }
    });

    if (!foodItem) {
      return res.status(404).json({
        error: 'Food item not found'
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

    // Validate time is within event bounds
    if (time_elapsed_at_consumption < 0) {
      return res.status(400).json({
        error: 'time_elapsed_at_consumption cannot be negative'
      });
    }

    if (time_elapsed_at_consumption > event.expected_duration) {
      return res.status(400).json({
        error: `time_elapsed_at_consumption (${time_elapsed_at_consumption}s) cannot exceed event duration (${event.expected_duration}s)`
      });
    }

    // Create the food instance
    const newInstance = await prisma.foodInstance.create({
      data: {
        food_item_id,
        event_id,
        time_elapsed_at_consumption,
        servings: servings || 1
      },
      include: {
        foodItem: {
          include: {
            foodItemNutrients: {
              include: {
                nutrient: true
              }
            }
          }
        }
      }
    });

    console.log(`Created food instance for item ${food_item_id} in event ${event_id} at time ${time_elapsed_at_consumption}`);

    return res.status(201).json({
      message: 'Food instance created successfully',
      foodInstance: newInstance
    });

  } catch (error) {
    console.error('Error creating food instance:', error);
    return res.status(500).json({
      error: 'Failed to create food instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT update a food instance
router.put('/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { time_elapsed_at_consumption, servings } = req.body;

    // Validate instanceId is provided
    if (!instanceId) {
      return res.status(400).json({
        error: 'Missing required parameter: instanceId'
      });
    }

    // Build update data object based on what's provided
    const updateData: any = {};

    // Validate and add time_elapsed_at_consumption if provided
    if (time_elapsed_at_consumption !== undefined) {
      if (typeof time_elapsed_at_consumption !== 'number') {
        return res.status(400).json({
          error: 'Invalid field: time_elapsed_at_consumption must be a number'
        });
      }
      updateData.time_elapsed_at_consumption = time_elapsed_at_consumption;
    }

    // Validate and add servings if provided
    if (servings !== undefined) {
      if (typeof servings !== 'number' || servings <= 0) {
        return res.status(400).json({
          error: 'Invalid field: servings must be a positive number'
        });
      }
      updateData.servings = servings;
    }

    // Ensure at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'At least one field (time_elapsed_at_consumption or servings) must be provided'
      });
    }

    // Verify the food instance exists
    const existingInstance = await prisma.foodInstance.findUnique({
      where: { id: instanceId },
      include: { event: true }
    });

    if (!existingInstance) {
      return res.status(404).json({
        error: 'Food instance not found'
      });
    }

    // Validate time is within event bounds if time is being updated
    if (time_elapsed_at_consumption !== undefined) {
      if (time_elapsed_at_consumption < 0) {
        return res.status(400).json({
          error: 'time_elapsed_at_consumption cannot be negative'
        });
      }

      if (time_elapsed_at_consumption > existingInstance.event.expected_duration) {
        return res.status(400).json({
          error: `time_elapsed_at_consumption (${time_elapsed_at_consumption}s) cannot exceed event duration (${existingInstance.event.expected_duration}s)`
        });
      }
    }

    // Update the food instance
    const updatedInstance = await prisma.foodInstance.update({
      where: { id: instanceId },
      data: updateData,
      include: {
        foodItem: {
          include: {
            foodItemNutrients: {
              include: {
                nutrient: true
              }
            }
          }
        }
      }
    });

    const updateFields = Object.keys(updateData).join(', ');
    console.log(`Updated food instance ${instanceId} - fields: ${updateFields}`);

    return res.status(200).json({
      message: 'Food instance updated successfully',
      foodInstance: updatedInstance
    });

  } catch (error) {
    console.error('Error updating food instance:', error);
    return res.status(500).json({
      error: 'Failed to update food instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE a food instance
router.delete('/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;

    // Validate instanceId is provided
    if (!instanceId) {
      return res.status(400).json({
        error: 'Missing required parameter: instanceId'
      });
    }

    // Verify the food instance exists
    const existingInstance = await prisma.foodInstance.findUnique({
      where: { id: instanceId }
    });

    if (!existingInstance) {
      return res.status(404).json({
        error: 'Food instance not found'
      });
    }

    // Delete the food instance
    await prisma.foodInstance.delete({
      where: { id: instanceId }
    });

    console.log(`Deleted food instance ${instanceId}`);

    return res.status(200).json({
      message: 'Food instance deleted successfully',
      deletedInstanceId: instanceId
    });

  } catch (error) {
    console.error('Error deleting food instance:', error);
    return res.status(500).json({
      error: 'Failed to delete food instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
