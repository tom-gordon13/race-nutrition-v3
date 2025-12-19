// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/auth.js';
import nutrientsRoutes from './src/routes/nutrients.js';
import foodItemsRoutes from './src/routes/food-items.js';
import eventsRoutes from './src/routes/events.js';
import foodInstancesRoutes from './src/routes/food-instances.js';
import eventGoalsRoutes from './src/routes/event-goals.js';
import userConnectionsRoutes from './src/routes/user-connections.js';

const app = express();

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

// Export for Vercel serverless
export default app;
