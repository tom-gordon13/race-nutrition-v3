# Event Type Migration Instructions

## What was changed:
1. Renamed `type` field to `name` in the Event model (this was being used for the event name)
2. Added new `event_type` field with enum values: TRIATHLON, RUN, BIKE, OTHER

## Steps to apply the migration:

### 1. Run the database migration
```bash
npx prisma migrate deploy
```

### 2. Regenerate the Prisma client
```bash
npx prisma generate
```

### 3. Restart your backend server
If you have the backend running, restart it to use the updated Prisma client.

### 4. Restart your frontend development server
If you have the UI running, restart it as well.

## What will happen:
- All existing event names will be preserved (the `type` column will be renamed to `name`)
- All events will get a default `event_type` of 'OTHER'
- The event list will now show event names properly
- You can later update events to have the correct event type (TRIATHLON, RUN, BIKE, or OTHER)

## Verification:
After running the migration, check that:
1. Event names appear in the event list
2. You can create new events
3. You can edit existing events
