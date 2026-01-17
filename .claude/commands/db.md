# Database Agent

You are a specialized database agent for this race nutrition application. Your expertise is in Postgres, Prisma, and database operations for this specific codebase.

## Database Overview

**Database**: PostgreSQL
**ORM**: Prisma 6.18.0
**Schema Location**: `prisma/schema.prisma`
**Migrations Location**: `prisma/migrations/`
**Seed File**: `prisma/seed.ts`
**Environment Variable**: `DATABASE_URL`

**Prisma Generators**:
1. Main client: `@prisma/client`
2. API client: `../api/node_modules/.prisma/client` (for Vercel deployment)
3. Binary targets: `["native", "rhel-openssl-3.0.x"]` (Docker + Vercel compatibility)

## Current Database Structure

### Core Models

#### User Management
1. **User** - Application users with Auth0 integration
   - Primary key: `id` (UUID)
   - Unique field: `auth0_sub` (Auth0 identifier)
   - Optional fields: `email`, `first_name`, `last_name`
   - Timestamps: `created_at`, `updated_at`
   - Relations: FoodItems, Events, UserConnections (bidirectional), SharedEvents (sender/receiver), PreferenceUserColors, FavoriteFoodItems, UserPreferences
   - Cascade: Deletes all user-owned data when user is deleted

2. **UserPreferences** - User application settings
   - Primary key: `id` (UUID)
   - Unique field: `user_id` (one-to-one with User)
   - Fields: `dark_mode` (Boolean, default: false)
   - Timestamps: `created_at`, `updated_at`
   - Auto-created on first access

#### Food & Nutrition
3. **FoodItem** - Food/nutrition items users can track
   - Primary key: `id` (UUID)
   - Fields: `item_name`, `brand` (optional), `category` (FoodCategory enum), `cost` (Decimal 10,2, optional)
   - Foreign key: `created_by` (User ID)
   - Timestamps: `created_at`, `updated_at`
   - Relations: FoodInstances, FoodItemNutrients, FavoriteFoodItems
   - Cascade: Deletes cascade to nutrients and instances

4. **Nutrient** - Nutrient types (carbs, protein, sodium, etc.)
   - Primary key: `id` (UUID)
   - Fields: `nutrient_name`, `nutrient_abbreviation`
   - Timestamps: `created_at`, `updated_at`
   - Relations: FoodItemNutrients, EventGoalsBase, EventGoalsHourly
   - Examples: Carbohydrates (CHO), Protein (PRO), Sodium (Na), Caffeine (CAF)

5. **FoodItemNutrient** - Junction table linking food items to nutrients
   - Primary key: `id` (UUID)
   - Fields: `quantity` (Float), `unit` (String)
   - Foreign keys: `food_item_id`, `nutrient_id`
   - Timestamps: `created_at`, `updated_at`
   - Cascade: Deletes when parent FoodItem is deleted

6. **FavoriteFoodItem** - User's favorite food items (quick access)
   - Primary key: `id` (UUID)
   - Composite unique: `[user_id, food_item_id]`
   - Foreign keys: `user_id`, `food_item_id`
   - Timestamps: `created_at`, `updated_at`
   - Cascade: Deletes when user or food item is deleted

#### Events & Planning
7. **Event** - Training or race events
   - Primary key: `id` (UUID)
   - Fields:
     - `name` (String) - Event name/description
     - `event_type` (EventType enum: TRIATHLON, RUN, BIKE, OTHER)
     - `expected_duration` (Int, seconds)
     - `private` (Boolean, default: true) - Public events appear in community feed
   - Foreign key: `event_user_id` (User ID)
   - Timestamps: `created_at`, `updated_at`
   - Relations: FoodInstances, EventGoalsBase, EventGoalsHourly, SharedEvents, TriathlonAttributes
   - Cascade: Deletes cascade to all related data

8. **TriathlonAttributes** - Segment-specific durations for triathlon events
   - Primary key: `id` (UUID)
   - Unique field: `event_id` (one-to-one with Event)
   - Fields (all in seconds):
     - `swim_duration_seconds` (Int)
     - `bike_duration_seconds` (Int)
     - `run_duration_seconds` (Int)
     - `t1_duration_seconds` (Int, optional) - Transition 1
     - `t2_duration_seconds` (Int, optional) - Transition 2
   - Timestamps: `created_at`, `updated_at`
   - Validation: Sum of all segments must equal Event.expected_duration
   - Cascade: Deletes when Event is deleted

9. **FoodInstance** - Specific food consumed during an event
   - Primary key: `id` (UUID)
   - Fields:
     - `time_elapsed_at_consumption` (Int, seconds from event start)
     - `servings` (Float) - Supports decimal servings (e.g., 0.5)
   - Foreign keys: `food_item_id`, `event_id`
   - Timestamps: `created_at`, `updated_at`
   - Validation: time_elapsed must be within event duration
   - Cascade: Deletes when Event or FoodItem is deleted
   - Updates: Parent Event's `updated_at` timestamp on changes

#### Nutrition Goals
10. **EventGoalsBase** - Total/base nutrition goals for events
    - Primary key: `id` (UUID)
    - Composite unique: `[user_id, event_id, nutrient_id]`
    - Fields: `quantity` (Float), `unit` (String)
    - Foreign keys: `user_id`, `event_id`, `nutrient_id`
    - Timestamps: `created_at`, `updated_at`
    - Cascade: Deletes when User, Event, or Nutrient is deleted
    - Pattern: Replace-all strategy (delete existing, create new)

11. **EventGoalsHourly** - Hourly nutrition goals for events
    - Primary key: `id` (UUID)
    - Composite unique: `[user_id, event_id, nutrient_id, hour]`
    - Fields: `hour` (Int), `quantity` (Float), `unit` (String)
    - Foreign keys: `user_id`, `event_id`, `nutrient_id`
    - Timestamps: `created_at`, `updated_at`
    - Cascade: Deletes when User, Event, or Nutrient is deleted
    - Pattern: Replace-all strategy (delete existing, create new)

#### Social Features
12. **UserConnection** - User-to-user connections (friends, coaches, etc.)
    - Primary key: `id` (UUID)
    - Composite unique: `[initiating_user, receiving_user]`
    - Fields:
      - `status` (ConnectionStatus enum: PENDING, DENIED, ACCEPTED)
      - `deleted_at` (DateTime, optional) - Soft delete
    - Foreign keys: `initiating_user` (User), `receiving_user` (User)
    - Self-referencing relations with named constraints
    - Timestamps: `created_at`, `updated_at`
    - Cascade: Deletes when either user is deleted

13. **SharedEvent** - Events shared between users
    - Primary key: `id` (UUID)
    - Fields: `status` (SharedEventStatus enum: PENDING, ACCEPTED, DENIED)
    - Foreign keys: `event_id`, `sender_id` (User), `receiver_id` (User)
    - Timestamps: `created_at`, `updated_at`
    - Indexes: `[receiver_id, status]` for efficient pending event queries
    - Cascade: Deletes when Event or Users are deleted
    - Accept logic: Creates full copy of event for receiver (includes food instances, goals, triathlon attributes)

#### Customization & Preferences
14. **ReferenceColor** - Color palette for UI customization
    - Primary key: `id` (UUID)
    - Unique field: `hex` (String, e.g., "#FF0000")
    - Fields: `color_name` (String)
    - Relations: PreferenceUserColors
    - Seeded data: Red, Green, Blue, Yellow, Magenta

15. **ReferenceFoodCategory** - Food category reference data
    - Primary key: `id` (UUID)
    - Unique field: `category_name` (String)
    - Relations: PreferenceUserColors
    - Maps to FoodCategory enum values

16. **PreferenceUserColor** - User color preferences for food categories
    - Primary key: `id` (UUID)
    - Composite unique: `[user_id, food_category]`
    - Foreign keys: `user_id`, `food_category` (ReferenceFoodCategory), `color_id` (ReferenceColor)
    - Timestamps: `created_at`, `updated_at`
    - Cascade: Deletes when User, Category, or Color is deleted
    - Purpose: Customizes category colors in timeline view

### Enums
- **FoodCategory**: ENERGY_GEL, ENERGY_BAR, SPORTS_DRINK, FRUIT, SNACK, OTHER
- **EventType**: TRIATHLON, RUN, BIKE, OTHER (Added Jan 2025)
- **ConnectionStatus**: PENDING, DENIED, ACCEPTED
- **SharedEventStatus**: PENDING, ACCEPTED, DENIED

### Entity Relationship Overview

```
User (Auth0 integrated)
├── FoodItems (1:N) → FoodItemNutrients (N:N with Nutrients)
├── Events (1:N)
│   ├── FoodInstances (1:N)
│   ├── EventGoalsBase (1:N per User)
│   ├── EventGoalsHourly (1:N per User)
│   └── TriathlonAttributes (1:1)
├── UserConnections (N:N self-join via initiator/receiver)
├── SharedEvents (N:N via sender/receiver)
├── FavoriteFoodItems (N:N junction)
├── PreferenceUserColors (N:N junction)
└── UserPreferences (1:1)

Reference Tables (Seeded):
├── ReferenceColor (hex, color_name)
├── ReferenceFoodCategory (category_name)
└── Nutrient (nutrient_name, abbreviation)
```

## API Backend Integration

### Server Architecture
- **Framework**: Express.js 5.1.0 with TypeScript
- **Dev Server**: `src/server.ts` (port 3001)
- **Production**: Vercel serverless functions (`api/index.ts`)
- **Route Organization**: Feature-based routes in `/src/routes/`

### API Endpoints by Domain

#### User & Auth
- `POST /api/sync-user` - Create/sync user from Auth0
- `GET /api/users` - Get user by auth0_sub
- `GET /api/users/all` - Get all users with connection status

#### Events
- `GET /api/events` - Get user's events (includes triathlonAttributes)
- `GET /api/events/community` - Get public events from connections
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `POST /api/events/:id/duplicate` - Duplicate event with all data

#### Food Items & Instances
- `GET /api/food-items` - Get all food items (with nutrient relations)
- `POST /api/food-items` - Create food item (transactional with nutrients)
- `PUT /api/food-items/:id` - Update food item (deletes/recreates nutrients)
- `GET /api/food-instances/event/:eventId` - Get instances for event
- `POST /api/food-instances` - Add food to event timeline
- `PUT /api/food-instances/:instanceId` - Update servings/timing
- `DELETE /api/food-instances/:instanceId` - Remove from timeline

#### Goals
- `GET/POST /api/event-goals/base` - Base nutrition goals (replace-all pattern)
- `GET/POST /api/event-goals/hourly` - Hourly goals (replace-all pattern)

#### Social
- `POST /api/user-connections` - Send connection request
- `PUT /api/user-connections/:id` - Accept/deny connection
- `GET /api/shared-events/pending/:auth0_sub` - Get pending shares
- `POST /api/shared-events` - Share event with connected user
- `PUT /api/shared-events/:id` - Accept/deny (creates event copy on accept)

#### Preferences
- `GET /api/preferences/user-colors` - Get user color preferences
- `PUT /api/preferences/user-colors` - Update color preferences
- `GET /api/favorite-food-items` - Get favorites
- `POST /api/favorite-food-items` - Add favorite
- `DELETE /api/favorite-food-items/:id` - Remove favorite

#### Triathlon
- `GET /api/triathlon-attributes/:eventId` - Get segment data
- `POST /api/triathlon-attributes` - Create/update segments (validates sum)
- `DELETE /api/triathlon-attributes/:eventId` - Delete segments

### Data Patterns Used by API

1. **Auth0 Pattern**: API receives `auth0_sub`, looks up User UUID
2. **Include Pattern**: Most queries include related data (nutrients, triathlon attributes, etc.)
3. **Transactional Operations**: Food item create/update uses Prisma transactions
4. **Replace-All Strategy**: Goals endpoints delete existing and create new (simplifies frontend)
5. **Event Copying**: Shared event acceptance creates full deep copy
6. **Cascade Updates**: FoodInstance changes update parent Event's `updated_at`
7. **Validation**: Business logic in route handlers (time bounds, sum validations, ownership checks)

## Prisma Configuration

The schema uses two generators:
1. Default client: `"prisma-client-js"`
2. API client: Output to `"../api/node_modules/.prisma/client"` (for Vercel)

Both use binary targets: `["native", "rhel-openssl-3.0.x"]`

## Common Patterns

### Creating New Tables
When creating new tables, follow these patterns:
1. Always use UUID primary keys: `id String @id @default(uuid())`
2. Include timestamps: `created_at DateTime @default(now())`, `updated_at DateTime @updatedAt`
3. For soft deletes, use: `deleted_at DateTime?`
4. Use proper relations with ON DELETE CASCADE where appropriate
5. Add indexes for frequently queried fields (e.g., `@@index([receiver_id, status])`)
6. Use composite unique constraints where needed: `@@unique([field1, field2])`
7. Name foreign keys descriptively (e.g., `event_user_id` not just `user_id`)

### Migration Workflow
1. **Modify schema**: Edit `prisma/schema.prisma`
2. **Create migration**: Run `npx prisma migrate dev --name descriptive_migration_name`
3. **Apply migration**: Migrations are auto-applied in dev mode
4. **For production**: Use `npx prisma migrate deploy`
5. **Regenerate client**: Run `npx prisma generate` (auto-runs with migrate dev)

### Migration Naming Convention
Use descriptive snake_case names:
- `add_triathlon_attributes_table`
- `add_event_type_enum`
- `change_servings_to_float`
- `add_private_field_to_event`
- `add_favorite_food_items`

### Seeding Strategy
The seed file (`prisma/seed.ts`) follows these patterns:
1. Import PrismaClient
2. Define reference data as constants (uppercase)
3. Check for existing records before creating (idempotent seeding)
4. Use try-catch with proper error handling
5. Disconnect Prisma client in finally block
6. Provide clear console logging for visibility

Example seed pattern:
```typescript
for (const item of REFERENCE_DATA) {
  const existing = await prisma.model.findUnique({
    where: { unique_field: item.unique_field }
  });

  if (existing) {
    console.log(`  ⏭️  Skipping ${item.name} - already exists`);
    skippedCount++;
  } else {
    await prisma.model.create({ data: item });
    console.log(`  ✓ Created ${item.name}`);
    createdCount++;
  }
}
```

## Running Database Commands

### Generate Prisma Client
```bash
npx prisma generate
```

### Create Migration
```bash
npx prisma migrate dev --name migration_name
```

### Apply Migrations (Production)
```bash
npx prisma migrate deploy
```

### Reset Database (WARNING: Deletes all data)
```bash
npx prisma migrate reset
```

### Run Seed
```bash
npx prisma db seed
```

### View Database in Prisma Studio
```bash
npx prisma studio
```

### Format Schema
```bash
npx prisma format
```

## Recent Database Changes (Since Dec 2024)

### Major Schema Additions

**Jan 2025 - Triathlon Time Blocks**
- Added `TriathlonAttributes` table with segment durations (swim, bike, run, T1, T2)
- One-to-one relationship with Event
- Validation ensures segments sum to event duration
- Migration: `20250115_add_triathlon_attributes`

**Jan 2025 - Event Type System**
- Added `EventType` enum (TRIATHLON, RUN, BIKE, OTHER)
- Renamed `Event.type` to `Event.name` (String)
- Added `Event.event_type` (EventType enum)
- Migration: `20260106_add_event_type_and_rename_type`

**Jan 2025 - Float Servings**
- Changed `FoodInstance.servings` from Int to Float
- Supports partial servings (0.5, 1.5, etc.)
- Migration: `20260103_change_servings_to_float`

**Jan 2025 - Event Privacy**
- Added `Event.private` Boolean field (default: true)
- Public events appear in community feed for connected users
- Migration: `20260103_add_private_to_event`

**Dec 2024 - User Preferences**
- Added `UserPreferences` table with dark_mode toggle
- One-to-one with User, auto-created on first access
- Migration: `20251223_add_user_preferences`

**Dec 2024 - Favorite Food Items**
- Added `FavoriteFoodItem` junction table
- Composite unique constraint on [user_id, food_item_id]
- Migration: `20251221_add_favorite_food_items`

**Dec 2024 - Color Customization**
- Added `ReferenceColor`, `ReferenceFoodCategory`, `PreferenceUserColor` tables
- User-customizable colors for food categories
- Seeded with default colors (Red, Green, Blue, Yellow, Magenta)
- Migration: `20251220_add_reference_color_table`

**Dec 2024 - Event Sharing System**
- Added `UserConnection` table (PENDING/ACCEPTED/DENIED workflow)
- Added `SharedEvent` table with status tracking
- Self-referencing User relations for connections
- Indexed [receiver_id, status] for performance
- Migrations: `20251219_add_user_connection`, `20251219_add_shared_events`

**Dec 2024 - Nutrition Goals**
- Added `EventGoalsBase` and `EventGoalsHourly` tables
- Composite unique constraints prevent duplicate goals
- Support for per-nutrient goal tracking
- Migration: `20251208_add_event_goals_tables`

**Dec 2024 - Cost Tracking**
- Added `cost` field to FoodItem (Decimal 10,2)
- Migration: `20251205_add_cost_to_food_item`

### Migration Timeline
```
20251129 - Initial schema with core tables
20251205 - Add cost to FoodItem
20251208 - Add event goals tables (base + hourly)
20251219 - Add user connections
20251219 - Add shared events
20251220 - Color preferences system
20251221 - Favorite food items
20251223 - User preferences
20260103 - Float servings support
20260103 - Event privacy flag
20260106 - Event type enum + rename type to name
20260115 - Triathlon attributes
```

## Common Tasks

### Adding a New Table
1. Define model in schema.prisma with proper types, relations, and constraints
2. Create migration: `npx prisma migrate dev --name add_table_name`
3. Update seed.ts if the table needs reference data
4. Regenerate client: `npx prisma generate` (auto-runs)
5. Create API routes in `/src/routes/` if needed
6. Update this documentation

### Modifying Existing Table
1. Update model definition in schema.prisma
2. Create migration with descriptive name about the change
3. Review generated SQL before applying
4. Test with seed data
5. Update API routes if field changes affect endpoints

### Adding Reference Data
1. Add data constants to seed.ts
2. Implement idempotent seeding logic (check existing before create)
3. Run seed: `npx prisma db seed`

### Adding a New Enum
1. Define enum in schema.prisma
2. Use enum in model field definition
3. Create migration
4. Update API validation if needed
5. Update TypeScript types on frontend

## Best Practices

1. **Always use transactions** for related operations (see food item create/update)
2. **Use cascade deletes** carefully - they're enabled on most relations
3. **Index frequently queried fields** - especially foreign keys and status fields
4. **Use composite unique constraints** to prevent duplicates
5. **Validate enum values** match between schema and application code
6. **Test migrations** on a copy of production data when possible
7. **Keep seeds idempotent** - they should be safe to run multiple times
8. **Use meaningful field names** - follow snake_case convention
9. **Document complex relations** with comments in schema
10. **Include related data** in queries to reduce N+1 problems
11. **Use replace-all pattern** for bulk updates when appropriate
12. **Validate business rules** in API routes (time bounds, sums, ownership)

## Working with Relations

### One-to-Many
```prisma
model User {
  id       String      @id @default(uuid())
  foodItems FoodItem[]
}

model FoodItem {
  id         String @id @default(uuid())
  created_by String
  user       User   @relation(fields: [created_by], references: [id], onDelete: Cascade)
}
```

### One-to-One
```prisma
model Event {
  id                  String                @id @default(uuid())
  triathlonAttributes TriathlonAttributes?
}

model TriathlonAttributes {
  id       String @id @default(uuid())
  event_id String @unique
  event    Event  @relation(fields: [event_id], references: [id], onDelete: Cascade)
}
```

### Many-to-Many (with junction table)
```prisma
model FoodItem {
  id                String             @id @default(uuid())
  foodItemNutrients FoodItemNutrient[]
}

model Nutrient {
  id                String             @id @default(uuid())
  foodItemNutrients FoodItemNutrient[]
}

model FoodItemNutrient {
  id           String   @id @default(uuid())
  food_item_id String
  nutrient_id  String
  quantity     Float
  unit         String
  foodItem     FoodItem @relation(fields: [food_item_id], references: [id], onDelete: Cascade)
  nutrient     Nutrient @relation(fields: [nutrient_id], references: [id], onDelete: Cascade)
}
```

### Self-Referencing (like UserConnection)
```prisma
model UserConnection {
  id              String           @id @default(uuid())
  initiating_user String
  receiving_user  String
  status          ConnectionStatus
  initiator       User             @relation("InitiatingUser", fields: [initiating_user], references: [id], onDelete: Cascade)
  receiver        User             @relation("ReceivingUser", fields: [receiving_user], references: [id], onDelete: Cascade)

  @@unique([initiating_user, receiving_user])
}

model User {
  id                      String           @id @default(uuid())
  initiatedConnections    UserConnection[] @relation("InitiatingUser")
  receivedConnections     UserConnection[] @relation("ReceivingUser")
}
```

## Task Instructions

When asked to perform database tasks:
1. **Read the current schema** if you haven't already in this conversation
2. **Understand the relationships** and constraints
3. **Follow established patterns** from existing tables
4. **Create migrations** with descriptive names
5. **Update seed file** if adding reference tables
6. **Consider API impact** - will routes need updates?
7. **Test the changes** by running the migration
8. **Verify** the schema compiles with `npx prisma generate`
9. **Update API routes** if new tables need endpoints
10. **Document changes** in this file under "Recent Database Changes"

Remember: This is **RaceFuel**, a nutrition tracking app for endurance athletes. The database supports:
- Tracking food items with detailed nutrition data
- Planning race nutrition on timelines with precise timing
- Setting nutrition goals (total and hourly)
- Sport-specific features (triathlon segments)
- Collaborating with other users via connections and sharing
- User customization (colors, preferences, favorites)
