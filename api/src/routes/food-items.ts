import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { auth0_sub, my_items_only } = req.query;

    // Validate required fields
    if (!auth0_sub || typeof auth0_sub !== 'string') {
      return res.status(400).json({
        error: 'Missing required query parameter: auth0_sub'
      });
    }

    // Look up the user by their Auth0 ID to get their UUID
    const user = await prisma.user.findUnique({
      where: { auth0_sub }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found. Please ensure you are logged in.'
      });
    }

    // Determine if we should filter by user or fetch all items
    const shouldFilterByUser = my_items_only === 'true';

    // Fetch food items with optional user filter
    const foodItems = await prisma.foodItem.findMany({
      where: shouldFilterByUser ? {
        created_by: user.id
      } : undefined,
      include: {
        foodItemNutrients: {
          include: {
            nutrient: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`Fetched ${foodItems.length} food items${shouldFilterByUser ? ` for user ${user.id}` : ' (all users)'}`);

    // Convert Decimal cost to number for JSON serialization
    const foodItemsWithCost = foodItems.map(item => {
      const converted = {
        ...item,
        cost: item.cost ? Number(item.cost) : null
      };
      console.log(`Item: ${item.item_name}, cost raw: ${item.cost}, cost converted: ${converted.cost}`);
      return converted;
    });

    return res.status(200).json({
      foodItems: foodItemsWithCost,
      count: foodItemsWithCost.length
    });

  } catch (error) {
    console.error('Error fetching food items:', error);
    return res.status(500).json({
      error: 'Failed to fetch food items',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { item_name, brand, category, cost, auth0_sub, nutrients } = req.body;

    console.log('Extracted values:', { item_name, brand, category, cost, auth0_sub, nutrientsCount: nutrients?.length });

    // Validate required fields
    if (!item_name || !auth0_sub) {
      console.log('Validation failed - item_name:', item_name, 'auth0_sub:', auth0_sub);
      return res.status(400).json({
        error: 'Missing required fields: item_name and auth0_sub are required'
      });
    }

    // Look up the user by their Auth0 ID to get their UUID
    const user = await prisma.user.findUnique({
      where: { auth0_sub }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found. Please ensure you are logged in.'
      });
    }

    // Validate nutrients array if provided
    if (nutrients && !Array.isArray(nutrients)) {
      return res.status(400).json({
        error: 'nutrients must be an array'
      });
    }

    // Validate each nutrient entry
    if (nutrients) {
      for (const nutrient of nutrients) {
        if (!nutrient.nutrient_id || nutrient.quantity === undefined || !nutrient.unit) {
          return res.status(400).json({
            error: 'Each nutrient must have nutrient_id, quantity, and unit'
          });
        }
      }
    }

    // Create food item with nutrients in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the food item with the user's UUID
      const foodItem = await tx.foodItem.create({
        data: {
          item_name,
          brand: brand || null,
          category: category || null,
          cost: cost !== undefined ? cost : null,
          created_by: user.id
        }
      });

      // Create food item nutrients if provided
      let foodItemNutrients = [];
      if (nutrients && nutrients.length > 0) {
        foodItemNutrients = await Promise.all(
          nutrients.map((nutrient: any) =>
            tx.foodItemNutrient.create({
              data: {
                food_item_id: foodItem.id,
                nutrient_id: nutrient.nutrient_id,
                quantity: nutrient.quantity,
                unit: nutrient.unit
              }
            })
          )
        );
      }

      return { foodItem, foodItemNutrients };
    });

    console.log('Food item created:', result.foodItem.item_name, 'with', result.foodItemNutrients.length, 'nutrients');

    // Convert Decimal cost to number for JSON serialization
    const foodItemWithCost = {
      ...result.foodItem,
      cost: result.foodItem.cost ? Number(result.foodItem.cost) : null
    };

    return res.status(201).json({
      message: 'Food item created successfully',
      foodItem: foodItemWithCost,
      nutrients: result.foodItemNutrients
    });

  } catch (error) {
    console.error('Error creating food item:', error);
    return res.status(500).json({
      error: 'Failed to create food item',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, brand, category, cost, nutrients } = req.body;

    console.log('Update request for food item:', id, req.body);

    // Validate required fields
    if (!item_name) {
      return res.status(400).json({
        error: 'Missing required field: item_name'
      });
    }

    // Validate nutrients array if provided
    if (nutrients && !Array.isArray(nutrients)) {
      return res.status(400).json({
        error: 'nutrients must be an array'
      });
    }

    // Validate each nutrient entry
    if (nutrients) {
      for (const nutrient of nutrients) {
        if (!nutrient.nutrient_id || nutrient.quantity === undefined || !nutrient.unit) {
          return res.status(400).json({
            error: 'Each nutrient must have nutrient_id, quantity, and unit'
          });
        }
      }
    }

    // Update food item with nutrients in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing nutrients
      await tx.foodItemNutrient.deleteMany({
        where: { food_item_id: id }
      });

      // Update the food item
      await tx.foodItem.update({
        where: { id },
        data: {
          item_name,
          brand: brand || null,
          category: category || null,
          cost: cost !== undefined && cost !== null ? cost : null
        }
      });

      // Create new nutrients if provided
      if (nutrients && nutrients.length > 0) {
        await Promise.all(
          nutrients.map((nutrient: any) =>
            tx.foodItemNutrient.create({
              data: {
                food_item_id: id,
                nutrient_id: nutrient.nutrient_id,
                quantity: nutrient.quantity,
                unit: nutrient.unit
              }
            })
          )
        );
      }

      // Fetch the updated food item with nutrients
      const updatedFoodItem = await tx.foodItem.findUnique({
        where: { id },
        include: {
          foodItemNutrients: {
            include: {
              nutrient: true
            }
          }
        }
      });

      return updatedFoodItem;
    });

    if (!result) {
      return res.status(404).json({
        error: 'Food item not found after update'
      });
    }

    console.log('Food item updated:', result.item_name);

    // Convert Decimal cost to number for JSON serialization
    const foodItemWithCost = {
      ...result,
      cost: result.cost ? Number(result.cost) : null
    };

    return res.status(200).json({
      message: 'Food item updated successfully',
      foodItem: foodItemWithCost
    });

  } catch (error) {
    console.error('Error updating food item:', error);
    return res.status(500).json({
      error: 'Failed to update food item',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
