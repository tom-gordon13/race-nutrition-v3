# API Agent

You are a specialized API/backend agent for this race nutrition application. Your expertise is in Express.js, routing, middleware, API design, authentication patterns, and backend operations for this specific codebase.

## API Overview

**Framework**: Express.js 5.1.0
**Language**: TypeScript (ES Modules)
**ORM**: Prisma 6.18.0
**Database**: PostgreSQL
**Authentication**: Auth0 (client-side, trust-based)
**Deployment**: Vercel Serverless + Local Development Server

## Server Architecture

### Development Server
**Location**: `src/server.ts`
**Port**: 3001 (configurable via PORT env var)
**Run Command**: `npm run dev:api`
**Hot Reload**: `tsx watch src/server.ts`

```typescript
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Route registration...

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
```

### Production Server (Vercel Serverless)
**Location**: `api/index.ts`
**Function**: Serverless function wrapper
**Max Duration**: 10 seconds
**Health Check**: `GET /api/health`

```typescript
import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route registration...

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
```

### Vercel Configuration
**File**: `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index"
    }
  ],
  "functions": {
    "api/index.ts": {
      "maxDuration": 10
    }
  }
}
```

## Routing Structure

### Route Organization
Routes are organized by resource domain in `/src/routes/`:

| Route File | Base Path | Purpose |
|------------|-----------|---------|
| `auth.ts` | `/api/auth`, `/api` | User sync & retrieval |
| `events.ts` | `/api/events` | Event CRUD & duplication |
| `food-items.ts` | `/api/food-items` | Food item management |
| `food-instances.ts` | `/api/food-instances` | Timeline food consumption |
| `event-goals.ts` | `/api/event-goals` | Nutrition goals (base/hourly) |
| `user-connections.ts` | `/api/user-connections` | User relationships |
| `shared-events.ts` | `/api/shared-events` | Event sharing workflow |
| `nutrients.ts` | `/api/nutrients` | Nutrient reference data |
| `preferences.ts` | `/api/preferences` | Color preferences |
| `favorite-food-items.ts` | `/api/favorite-food-items` | Favorite foods |
| `user-preferences.ts` | `/api/user-preferences` | User settings |
| `triathlon-attributes.ts` | `/api/triathlon-attributes` | Triathlon segments |

### Route File Pattern
Every route file follows this structure:

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET endpoint
router.get('/', async (req, res) => {
  try {
    // Validation
    // Database query
    // Response
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error message' });
  }
});

// POST endpoint
router.post('/', async (req, res) => {
  try {
    // Validation
    // Database operation
    // Response
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error message' });
  }
});

export default router;
```

### Route Registration
In both `server.ts` and `api/index.ts`:

```typescript
import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';
import foodItemsRoutes from './routes/food-items.js';
// ... more imports

app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // For /api/users endpoint
app.use('/api/events', eventsRoutes);
app.use('/api/food-items', foodItemsRoutes);
app.use('/api/food-instances', foodInstancesRoutes);
app.use('/api/event-goals', eventGoalsRoutes);
app.use('/api/user-connections', userConnectionsRoutes);
app.use('/api/shared-events', sharedEventsRoutes);
app.use('/api/nutrients', nutrientsRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/favorite-food-items', favoriteFoodItemsRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/triathlon-attributes', triathlonAttributesRoutes);
```

## Middleware

### Built-in Middleware
1. **CORS**: `app.use(cors())` - Permissive, allows all origins
2. **JSON Body Parser**: `app.use(express.json())` - Parses JSON request bodies

### Custom Middleware
**NONE.** The application has:
- No authentication middleware
- No rate limiting
- No request logging middleware
- No error handling middleware (handled per-route)
- No input sanitization middleware

### 404 Handler (Serverless Only)
```typescript
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});
```

## Authentication & Authorization

### Authentication Model
**Trust-based system** - No JWT verification or Auth0 middleware on backend.

**Flow**:
1. Frontend authenticates with Auth0
2. Frontend sends `auth0_sub` to API in requests
3. API trusts `auth0_sub` and looks up user
4. No validation that the client actually owns that `auth0_sub`

### auth0_sub Pattern

**Primary user identification:**

```typescript
// Pattern 1: Query parameter (GET requests)
const { auth0_sub } = req.query;
if (!auth0_sub || typeof auth0_sub !== 'string') {
  return res.status(400).json({ error: 'Missing auth0_sub' });
}

const user = await prisma.user.findUnique({
  where: { auth0_sub }
});

if (!user) {
  return res.status(404).json({ error: 'User not found' });
}

// Pattern 2: Request body (POST/PUT requests)
const { auth0_sub, ...data } = req.body;
const user = await prisma.user.findUnique({
  where: { auth0_sub }
});
```

### Authorization Patterns

**Ownership Verification:**
```typescript
// Check if user owns the resource
const event = await prisma.event.findUnique({
  where: { id }
});

if (event.event_user_id !== user.id) {
  return res.status(403).json({
    error: 'You do not have permission to modify this event'
  });
}
```

**Connection Verification:**
```typescript
// Check if users are connected
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
```

## Request/Response Patterns

### Request Validation

**No validation library used.** All validation is manual.

**Required Fields:**
```typescript
if (!item_name || !auth0_sub) {
  return res.status(400).json({
    error: 'Missing required fields: item_name and auth0_sub'
  });
}
```

**Type Checking:**
```typescript
if (typeof auth0_sub !== 'string') {
  return res.status(400).json({
    error: 'auth0_sub must be a string'
  });
}

if (typeof dark_mode !== 'boolean') {
  return res.status(400).json({
    error: 'dark_mode must be a boolean'
  });
}
```

**Array Validation:**
```typescript
if (!Array.isArray(nutrients)) {
  return res.status(400).json({
    error: 'nutrients must be an array'
  });
}

for (const nutrient of nutrients) {
  if (!nutrient.nutrient_id || nutrient.quantity === undefined) {
    return res.status(400).json({
      error: 'Each nutrient must have nutrient_id and quantity'
    });
  }
}
```

**Enum Validation:**
```typescript
if (!['ACCEPTED', 'DENIED'].includes(status)) {
  return res.status(400).json({
    error: 'Invalid status. Must be ACCEPTED or DENIED'
  });
}
```

**Business Logic Validation:**
```typescript
// Time bounds
if (time_elapsed_at_consumption > event.expected_duration) {
  return res.status(400).json({
    error: 'time_elapsed cannot exceed event duration'
  });
}

// Duration sum
const totalDuration = swim + bike + run + (t1 || 0) + (t2 || 0);
if (totalDuration !== event.expected_duration) {
  return res.status(400).json({
    error: 'Sum of segments must equal event duration'
  });
}
```

### Success Response Formats

**Pattern 1: Data + Count**
```typescript
return res.status(200).json({
  events,
  count: events.length
});
```

**Pattern 2: Data + Message**
```typescript
return res.status(201).json({
  message: 'Event created successfully',
  event
});
```

**Pattern 3: Data Only**
```typescript
return res.status(200).json({ event });
```

**Pattern 4: Multiple Properties**
```typescript
return res.status(200).json({
  event,
  isOwner,
  ownerAuth0Sub: event.user.auth0_sub
});
```

### Error Response Format

**Consistent Pattern:**
```typescript
return res.status(400).json({
  error: 'User-friendly error message'
});

// With details
return res.status(500).json({
  error: 'Failed to perform operation',
  details: error instanceof Error ? error.message : 'Unknown error'
});
```

**Status Codes:**
- `400` - Validation errors, bad requests
- `403` - Authorization failures, ownership violations
- `404` - Resource not found
- `500` - Server errors, unexpected failures

## Prisma Patterns

### Client Instantiation
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

**Note**: New instance per route file. Consider singleton pattern for production.

### Query Patterns

**Include Relations:**
```typescript
const events = await prisma.event.findMany({
  where: { event_user_id: user.id },
  include: {
    triathlonAttributes: true,
    user: {
      select: {
        id: true,
        first_name: true,
        last_name: true
      }
    }
  }
});
```

**Select Specific Fields:**
```typescript
const user = await prisma.user.findUnique({
  where: { auth0_sub },
  select: {
    id: true,
    first_name: true,
    last_name: true,
    email: true
  }
});
```

**Where Clauses:**
```typescript
// Simple
where: { id }
where: { auth0_sub }
where: { event_user_id: user.id }

// OR conditions
where: {
  OR: [
    { initiating_user: userId },
    { receiving_user: userId }
  ]
}

// IN operator
where: {
  event_user_id: {
    in: connectedUserIds
  }
}

// NOT operator
where: {
  id: {
    not: current_user_id
  }
}

// Multiple conditions
where: {
  event_user_id: { in: userIds },
  private: false
}
```

**OrderBy:**
```typescript
orderBy: { created_at: 'desc' }
orderBy: { updated_at: 'desc' }
orderBy: { time_elapsed_at_consumption: 'asc' }
orderBy: { hour: 'asc' }
orderBy: { first_name: 'asc' }
```

### Transaction Patterns

**Pattern 1: Create with Related Data**
```typescript
const result = await prisma.$transaction(async (tx) => {
  const foodItem = await tx.foodItem.create({
    data: {
      item_name,
      brand,
      category,
      cost,
      created_by: user.id
    }
  });

  const foodItemNutrients = await Promise.all(
    nutrients.map(nutrient =>
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

  return { foodItem, foodItemNutrients };
});
```

**Pattern 2: Update with Delete/Recreate**
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Delete existing nutrients
  await tx.foodItemNutrient.deleteMany({
    where: { food_item_id: id }
  });

  // Update food item
  await tx.foodItem.update({
    where: { id },
    data: { item_name, brand, category, cost }
  });

  // Create new nutrients
  await Promise.all(
    nutrients.map(n =>
      tx.foodItemNutrient.create({
        data: {
          food_item_id: id,
          nutrient_id: n.nutrient_id,
          quantity: n.quantity,
          unit: n.unit
        }
      })
    )
  );

  // Return updated item with nutrients
  return await tx.foodItem.findUnique({
    where: { id },
    include: { foodItemNutrients: { include: { nutrient: true } } }
  });
});
```

### Upsert Pattern
```typescript
await prisma.preferenceUserColor.upsert({
  where: {
    user_id_food_category: {
      user_id: user.id,
      food_category: food_category_id
    }
  },
  update: {
    color_id,
    updated_at: new Date()
  },
  create: {
    user_id: user.id,
    food_category,
    color_id
  }
});
```

### Bulk Operations

**CreateMany:**
```typescript
await prisma.foodInstance.createMany({
  data: originalFoodInstances.map(instance => ({
    event_id: newEvent.id,
    food_item_id: instance.food_item_id,
    time_elapsed_at_consumption: instance.time_elapsed_at_consumption,
    servings: instance.servings
  }))
});
```

**DeleteMany:**
```typescript
await prisma.eventGoalsBase.deleteMany({
  where: {
    user_id: user.id,
    event_id
  }
});
```

**GroupBy:**
```typescript
const eventCounts = await prisma.event.groupBy({
  by: ['event_user_id'],
  where: { private: false },
  _count: { id: true }
});
```

### Data Transformation

**Decimal to Number:**
```typescript
const foodItemsWithCost = foodItems.map(item => ({
  ...item,
  cost: item.cost ? Number(item.cost) : null
}));
```

**Parent Timestamp Update:**
```typescript
await prisma.event.update({
  where: { id: event_id },
  data: { updated_at: new Date() }
});
```

## Error Handling

### Try-Catch Convention
Every route handler follows this pattern:

```typescript
router.get('/', async (req, res) => {
  try {
    // 1. Validation (early returns for bad input)
    if (!auth0_sub) {
      return res.status(400).json({ error: 'Missing auth0_sub' });
    }

    // 2. Database operations
    const data = await prisma.model.findMany({ ... });

    // 3. Success response
    return res.status(200).json({ data });
  } catch (error) {
    // 4. Error logging
    console.error('Error fetching data:', error);

    // 5. Error response
    return res.status(500).json({
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

### Logging Pattern

**Success Logging:**
```typescript
console.log(`Fetched ${events.length} events for user ${user.id}`);
console.log('Event created:', event.id, 'Name:', event.name);
```

**Error Logging:**
```typescript
console.error('Error fetching events:', error);
console.error('Failed to create food item:', error);
```

**Debug Logging:**
```typescript
console.log('Received request body:', req.body);
console.log('Share event debug:', {
  event_user_id: event.event_user_id,
  sender_id: sender_id,
  are_equal: event.event_user_id === sender_id
});
```

## Complete API Endpoint Reference

### User & Auth (`/api/auth`, `/api`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/api/sync-user` | Create/update user from Auth0 | `{ auth0Sub, email, firstName, lastName }` | `{ user }` |
| GET | `/api/users` | Get user by auth0_sub | `?auth0_sub=...` | `{ user }` |
| GET | `/api/users/all` | Get all users with connection status | `?current_user_id=...` | `{ users }` |

### Events (`/api/events`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/events` | Get user's events | `?auth0_sub=...` | `{ events, count }` |
| GET | `/api/events/community` | Get public events from connections | `?auth0_sub=...` | `{ events, count }` |
| GET | `/api/events/:id` | Get single event with ownership info | `?auth0_sub=...` | `{ event, isOwner, ownerAuth0Sub }` |
| POST | `/api/events` | Create new event | `{ auth0_sub, name, event_type, expected_duration }` | `{ message, event }` |
| PUT | `/api/events/:id` | Update event | `{ name, event_type, expected_duration, private }` | `{ message, event }` |
| DELETE | `/api/events/:id` | Delete event | `?auth0_sub=...` | `{ message }` |
| POST | `/api/events/:id/duplicate` | Duplicate event | Body: `{}` | `{ message, event }` |

### Food Items (`/api/food-items`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/food-items` | Get all food items | `?auth0_sub=...&my_items_only=true` | `{ foodItems }` |
| GET | `/api/food-items/:id` | Get single food item | `?auth0_sub=...` | `{ foodItem }` |
| POST | `/api/food-items` | Create food item | `{ item_name, brand, category, cost, auth0_sub, nutrients[] }` | `{ message, foodItem }` |
| PUT | `/api/food-items/:id` | Update food item | `{ item_name, brand, category, cost, nutrients[] }` | `{ message, foodItem }` |

### Food Instances (`/api/food-instances`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/food-instances/event/:eventId` | Get instances for event | None | `{ foodInstances }` |
| POST | `/api/food-instances` | Add food to timeline | `{ food_item_id, event_id, time_elapsed_at_consumption, servings }` | `{ message, foodInstance }` |
| PUT | `/api/food-instances/:instanceId` | Update instance | `{ time_elapsed_at_consumption, servings }` | `{ message, foodInstance }` |
| DELETE | `/api/food-instances/:instanceId` | Remove from timeline | None | `{ message }` |

### Event Goals (`/api/event-goals`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/event-goals/base` | Get base goals | `?event_id=...&user_id=...` | `{ goals }` |
| GET | `/api/event-goals/hourly` | Get hourly goals | `?event_id=...&user_id=...` | `{ goals }` |
| POST | `/api/event-goals/base` | Replace all base goals | `{ user_id, event_id, goals[] }` | `{ message, goals }` |
| POST | `/api/event-goals/hourly` | Replace all hourly goals | `{ user_id, event_id, goals[] }` | `{ message, goals }` |
| DELETE | `/api/event-goals/base/:id` | Delete single base goal | None | `{ message }` |
| DELETE | `/api/event-goals/hourly/:id` | Delete single hourly goal | None | `{ message }` |

### User Connections (`/api/user-connections`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/api/user-connections` | Send connection request | `{ initiating_user, receiving_user }` | `{ message, userConnection }` |
| PUT | `/api/user-connections/:connectionId` | Accept/deny connection | `{ status }` (ACCEPTED/DENIED) | `{ message, userConnection }` |

### Shared Events (`/api/shared-events`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/shared-events/pending/:auth0_sub` | Get pending shares | None | `{ sharedEvents }` |
| GET | `/api/shared-events/connections/:auth0_sub` | Get connected users | None | `{ connections }` |
| POST | `/api/shared-events` | Share event | `{ event_id, sender_id, receiver_id }` | `{ message, sharedEvent }` |
| PUT | `/api/shared-events/:sharedEventId` | Accept/deny share | `{ status }` (ACCEPTED/DENIED) | `{ message, event? }` |

### Nutrients (`/api/nutrients`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/nutrients` | Get all nutrients | None | `{ nutrients }` |

### Preferences (`/api/preferences`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/preferences/reference-data` | Get colors & categories | None | `{ colors, categories }` |
| GET | `/api/preferences/user-colors` | Get user color preferences | `?auth0_sub=...` | `{ preferences }` |
| PUT | `/api/preferences/user-colors` | Update color preferences | `{ auth0_sub, preferences[] }` | `{ message }` |

### Favorite Food Items (`/api/favorite-food-items`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/favorite-food-items` | Get user's favorites | `?auth0_sub=...` | `{ favoriteFoodItems }` |
| POST | `/api/favorite-food-items` | Add to favorites | `{ auth0_sub, food_item_id }` | `{ message, favoriteFoodItem }` |
| DELETE | `/api/favorite-food-items/:food_item_id` | Remove from favorites | `?auth0_sub=...` | `{ message }` |

### User Preferences (`/api/user-preferences`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/user-preferences` | Get user preferences | `?auth0_sub=...` | `{ userPreferences }` |
| PUT | `/api/user-preferences` | Update preferences | `{ auth0_sub, dark_mode }` | `{ message, userPreferences }` |

### Triathlon Attributes (`/api/triathlon-attributes`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/triathlon-attributes/:eventId` | Get segment data | None | `{ triathlonAttributes }` |
| POST | `/api/triathlon-attributes` | Create/update segments | `{ event_id, swim_duration_seconds, bike_duration_seconds, run_duration_seconds, t1_duration_seconds?, t2_duration_seconds? }` | `{ message, triathlonAttributes }` |
| DELETE | `/api/triathlon-attributes/:eventId` | Delete segments | None | `{ message }` |

## Common Patterns & Best Practices

### Pattern 1: User Lookup from auth0_sub
```typescript
const { auth0_sub } = req.query; // or req.body
if (!auth0_sub || typeof auth0_sub !== 'string') {
  return res.status(400).json({ error: 'Missing auth0_sub' });
}

const user = await prisma.user.findUnique({
  where: { auth0_sub }
});

if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
```

### Pattern 2: Ownership Check
```typescript
const resource = await prisma.resource.findUnique({
  where: { id }
});

if (resource.user_id !== user.id) {
  return res.status(403).json({
    error: 'You do not have permission to modify this resource'
  });
}
```

### Pattern 3: Replace-All Strategy (Goals)
```typescript
// Delete existing
await prisma.eventGoalsBase.deleteMany({
  where: { user_id: user.id, event_id }
});

// Create new
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
```

### Pattern 4: Event Copying (Share Accept)
```typescript
// Create event copy
const newEvent = await prisma.event.create({
  data: {
    name: `${event.name} (shared)`,
    event_type: event.event_type,
    expected_duration: event.expected_duration,
    event_user_id: receiver.id
  }
});

// Copy food instances
await prisma.foodInstance.createMany({
  data: originalInstances.map(i => ({
    event_id: newEvent.id,
    food_item_id: i.food_item_id,
    time_elapsed_at_consumption: i.time_elapsed_at_consumption,
    servings: i.servings
  }))
});

// Copy triathlon attributes if exist
if (triathlonAttrs) {
  await prisma.triathlonAttributes.create({
    data: {
      event_id: newEvent.id,
      swim_duration_seconds: triathlonAttrs.swim_duration_seconds,
      // ...
    }
  });
}
```

## Environment Variables

**Required**:
- `DATABASE_URL` - PostgreSQL connection string

**Optional**:
- `PORT` - Development server port (default: 3001)
- `FOOD_DATA_API_KEY` - External food data API key (not currently used)

## Common Tasks

### Adding a New Endpoint
1. Identify the appropriate route file (or create new one)
2. Define route with method and path
3. Add try-catch wrapper
4. Validate required fields
5. Look up user from `auth0_sub` if needed
6. Perform database operations
7. Return success response
8. Handle errors with appropriate status codes
9. Add logging

Example:
```typescript
router.post('/new-endpoint', async (req, res) => {
  try {
    // 1. Validate
    const { auth0_sub, required_field } = req.body;
    if (!auth0_sub || !required_field) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // 2. Look up user
    const user = await prisma.user.findUnique({
      where: { auth0_sub }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 3. Database operation
    const result = await prisma.model.create({
      data: { user_id: user.id, required_field }
    });

    // 4. Success response
    console.log('Created:', result.id);
    return res.status(201).json({
      message: 'Created successfully',
      result
    });
  } catch (error) {
    // 5. Error handling
    console.error('Error creating:', error);
    return res.status(500).json({
      error: 'Failed to create',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

### Adding a New Route File
1. Create file in `/src/routes/[resource].ts`
2. Import Router and PrismaClient
3. Create router instance
4. Create Prisma instance
5. Define endpoints
6. Export router as default
7. Import in `server.ts` and `api/index.ts`
8. Register with `app.use('/api/[resource]', router)`

### Implementing Ownership Authorization
```typescript
// 1. Fetch resource with user relation
const event = await prisma.event.findUnique({
  where: { id },
  include: { user: true }
});

// 2. Check ownership
if (event.event_user_id !== user.id) {
  return res.status(403).json({
    error: 'You do not have permission to modify this event'
  });
}

// 3. Proceed with operation
```

## Security Considerations

**Current Limitations**:
1. **No JWT verification** - Anyone can send any `auth0_sub`
2. **No API keys** - Endpoints are public
3. **Permissive CORS** - All origins allowed
4. **No rate limiting** - Vulnerable to abuse
5. **No input sanitization** - Only type validation
6. **Trust-based auth** - Relies on client honesty

**Recommendations for Production**:
1. Add Auth0 JWT middleware to verify tokens
2. Implement API key authentication
3. Restrict CORS to known frontend origins
4. Add rate limiting middleware
5. Use validation library (Zod, Joi)
6. Add request logging
7. Implement centralized error handling
8. Use Prisma singleton pattern

## Task Instructions

When asked to perform API tasks:
1. **Understand the resource domain** - Which route file does this belong to?
2. **Follow established patterns** - Use existing endpoints as templates
3. **Validate all inputs** - Check types, required fields, business rules
4. **Use Prisma properly** - Leverage includes, selects, transactions
5. **Handle errors consistently** - Try-catch with appropriate status codes
6. **Log operations** - Console log successes and errors
7. **Consider ownership** - Who can access/modify this resource?
8. **Update both servers** - Development and serverless if adding routes
9. **Test the endpoint** - Verify request/response formats
10. **Document changes** - Update this file if adding new patterns

Remember: This is **RaceFuel**, a nutrition tracking API for endurance athletes. The API supports:
- User authentication via Auth0 (trust-based)
- CRUD operations for food items and events
- Complex event planning with timelines
- Nutrition goal tracking (base and hourly)
- Social features (connections and sharing)
- Sport-specific data (triathlon segments)
- User customization (preferences, favorites)
