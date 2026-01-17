# Triathlon Time Blocks Feature

This document describes the newly implemented triathlon time blocks feature that allows users to define and visualize different segments (swim, bike, run, transitions) of a triathlon event.

## Overview

The feature consists of:
1. **Database schema** - `TriathlonAttributes` table for storing segment durations
2. **API routes** - CRUD operations for triathlon attributes
3. **TypeScript types** - Type-safe interfaces
4. **UI component** - Visual display and editing of time blocks

## Database Schema

### TriathlonAttributes Table

```prisma
model TriathlonAttributes {
  id                    String   @id @default(uuid())
  event_id              String   @unique
  swim_duration_seconds Int
  bike_duration_seconds Int
  run_duration_seconds  Int
  t1_duration_seconds   Int?     // Transition 1 (optional)
  t2_duration_seconds   Int?     // Transition 2 (optional)
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  event                 Event    @relation(fields: [event_id], references: [id], onDelete: Cascade)
}
```

The `Event` model now includes:
```prisma
triathlonAttributes TriathlonAttributes?
```

## API Routes

Base path: `/api/triathlon-attributes`

### GET /:eventId
Fetch triathlon attributes for a specific event.

**Example:**
```bash
GET /api/triathlon-attributes/abc-123
```

**Response:**
```json
{
  "attributes": {
    "id": "xyz-789",
    "event_id": "abc-123",
    "swim_duration_seconds": 1800,
    "bike_duration_seconds": 10800,
    "run_duration_seconds": 7200,
    "t1_duration_seconds": 180,
    "t2_duration_seconds": 120,
    "created_at": "2025-01-17T10:00:00Z",
    "updated_at": "2025-01-17T10:00:00Z"
  }
}
```

### POST /
Create or update (upsert) triathlon attributes.

**Request body:**
```json
{
  "event_id": "abc-123",
  "swim_duration_seconds": 1800,
  "bike_duration_seconds": 10800,
  "run_duration_seconds": 7200,
  "t1_duration_seconds": 180,
  "t2_duration_seconds": 120
}
```

**Validation:**
- Event must exist and be of type `TRIATHLON`
- Sum of all segment durations must equal the event's `expected_duration`

**Response:**
```json
{
  "message": "Triathlon attributes saved successfully",
  "attributes": { ... }
}
```

### DELETE /:eventId
Delete triathlon attributes for an event.

**Example:**
```bash
DELETE /api/triathlon-attributes/abc-123
```

## TypeScript Types

```typescript
interface TriathlonAttributes {
  id: string;
  event_id: string;
  swim_duration_seconds: number;
  bike_duration_seconds: number;
  run_duration_seconds: number;
  t1_duration_seconds: number | null;
  t2_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

interface Event {
  // ... existing fields
  triathlonAttributes?: TriathlonAttributes | null;
}
```

## UI Component: TriathlonTimeBlocks

A React component that displays triathlon segments as a visual timeline with color-coded blocks.

### Features
- Visual timeline showing proportional segment durations
- Color-coded segments (blue=swim, green=bike, orange=run, gray=transitions)
- Interactive editing dialog
- Real-time validation ensuring total equals event duration
- Responsive design

### Usage

```tsx
import { TriathlonTimeBlocks } from './components/events';

// In your component
{event.event_type === 'TRIATHLON' && event.triathlonAttributes && (
  <TriathlonTimeBlocks
    attributes={event.triathlonAttributes}
    totalDuration={event.expected_duration}
    editable={true}
    onUpdate={handleTriathlonUpdate}
  />
)}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `attributes` | `TriathlonAttributes` | Yes | The triathlon segment data |
| `totalDuration` | `number` | Yes | Total event duration in seconds |
| `editable` | `boolean` | No | Enable edit functionality (default: false) |
| `onUpdate` | `(updated: TriathlonAttributes) => void` | No | Callback when attributes are updated |

### Example Integration in Events.tsx

```tsx
import { TriathlonTimeBlocks } from './components/events';

const Events = () => {
  // ... existing code

  const handleTriathlonUpdate = async (updated: TriathlonAttributes) => {
    try {
      const response = await fetch(`${API_URL}/api/triathlon-attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: updated.event_id,
          swim_duration_seconds: updated.swim_duration_seconds,
          bike_duration_seconds: updated.bike_duration_seconds,
          run_duration_seconds: updated.run_duration_seconds,
          t1_duration_seconds: updated.t1_duration_seconds,
          t2_duration_seconds: updated.t2_duration_seconds
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update triathlon attributes');
      }

      // Refresh the event data
      fetchEventData();
    } catch (error) {
      console.error('Error updating triathlon attributes:', error);
    }
  };

  return (
    <div>
      {/* ... existing code */}

      {selectedEvent?.event_type === 'TRIATHLON' && selectedEvent.triathlonAttributes && (
        <TriathlonTimeBlocks
          attributes={selectedEvent.triathlonAttributes}
          totalDuration={selectedEvent.expected_duration}
          editable={true}
          onUpdate={handleTriathlonUpdate}
        />
      )}

      {/* ... rest of the component */}
    </div>
  );
};
```

## Event Fetching

All event fetching routes now automatically include triathlon attributes when present:

- `GET /api/events` - User's events
- `GET /api/events/:id` - Single event
- `GET /api/events/community` - Community events

Example response:
```json
{
  "event": {
    "id": "abc-123",
    "name": "Ironman 70.3",
    "event_type": "TRIATHLON",
    "expected_duration": 19800,
    "triathlonAttributes": {
      "swim_duration_seconds": 1800,
      "bike_duration_seconds": 10800,
      "run_duration_seconds": 7200,
      "t1_duration_seconds": null,
      "t2_duration_seconds": null
    }
  }
}
```

## Event Copying

Triathlon attributes are automatically copied when:
1. Duplicating an event (`POST /api/events/:id/duplicate`)
2. Accepting a shared event (`PUT /api/shared-events/:sharedEventId`)

## Typical Workflow

1. **Create a triathlon event** with total duration
2. **Define segments** via the UI or API
3. **View visualization** showing proportional segments
4. **Edit segments** as needed (validation ensures total matches)
5. **Share/duplicate** events (segments are copied automatically)

## Design Rationale

### Separate Table Approach
We chose a separate `TriathlonAttributes` table rather than adding fields directly to the `Event` table for several reasons:

**Pros:**
- Clean separation of concerns - core Event model stays lean
- Scalable - easy to add other sport-specific tables (RunAttributes, BikeAttributes, etc.)
- No NULL columns for non-triathlon events
- Type safety - forces explicit handling of triathlon-specific data
- Flexible schema evolution

**Cons:**
- Additional JOIN required when fetching
- Slightly more complex queries

This approach mirrors the existing pattern used for `EventGoalsBase` and `EventGoalsHourly` tables.

## Future Enhancements

Possible extensions to this feature:
- Add distance metrics for each segment
- Add pace/speed calculations
- Add elevation profiles
- Support for other multisport events (duathlon, aquathlon, etc.)
- Segment-specific nutrition goals
- Visual indicators on timeline showing segment boundaries
