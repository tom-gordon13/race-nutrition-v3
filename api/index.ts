// Vercel serverless function entry point
import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from '../src/routes/auth.js';
import nutrientsRoutes from '../src/routes/nutrients.js';
import foodItemsRoutes from '../src/routes/food-items.js';
import eventsRoutes from '../src/routes/events.js';
import foodInstancesRoutes from '../src/routes/food-instances.js';
import eventGoalsRoutes from '../src/routes/event-goals.js';
import userConnectionsRoutes from '../src/routes/user-connections.js';
import sharedEventsRoutes from '../src/routes/shared-events.js';
import preferencesRoutes from '../src/routes/preferences.js';
import favoriteFoodItemsRoutes from '../src/routes/favorite-food-items.js';
import userPreferencesRoutes from '../src/routes/user-preferences.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // For /api/users endpoint
app.use('/api/nutrients', nutrientsRoutes);
app.use('/api/food-items', foodItemsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/food-instances', foodInstancesRoutes);
app.use('/api/event-goals', eventGoalsRoutes);
app.use('/api/user-connections', userConnectionsRoutes);
app.use('/api/shared-events', sharedEventsRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/favorite-food-items', favoriteFoodItemsRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Export for Vercel serverless
export default app;
