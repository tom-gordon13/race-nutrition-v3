// Vercel serverless function entry point
import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './src/routes/auth';
import nutrientsRoutes from './src/routes/nutrients';
import foodItemsRoutes from './src/routes/food-items';
import eventsRoutes from './src/routes/events';
import foodInstancesRoutes from './src/routes/food-instances';
import eventGoalsRoutes from './src/routes/event-goals';
import userConnectionsRoutes from './src/routes/user-connections';
import sharedEventsRoutes from './src/routes/shared-events';
import preferencesRoutes from './src/routes/preferences';
import favoriteFoodItemsRoutes from './src/routes/favorite-food-items';

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

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Export for Vercel serverless
export default app;
