import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import nutrientsRoutes from './routes/nutrients.js';
import foodItemsRoutes from './routes/food-items.js';
import eventsRoutes from './routes/events.js';
import foodInstancesRoutes from './routes/food-instances.js';
import eventGoalsRoutes from './routes/event-goals.js';

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

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
