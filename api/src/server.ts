import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import nutrientsRoutes from './routes/nutrients.js';
import foodItemsRoutes from './routes/food-items.js';
import eventsRoutes from './routes/events.js';
import foodInstancesRoutes from './routes/food-instances.js';
import eventGoalsRoutes from './routes/event-goals.js';
import userConnectionsRoutes from './routes/user-connections.js';
import sharedEventsRoutes from './routes/shared-events.js';
import preferencesRoutes from './routes/preferences.js';
import favoriteFoodItemsRoutes from './routes/favorite-food-items.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
