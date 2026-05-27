import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import sequelize from './config/database';
import dotenv from 'dotenv';
import taskRoutes from './routes/taskRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { initCronJobs } from './utils/cronJobs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

initCronJobs();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/health', (req, res) => {
  res.send('Backend is running!');
});

app.use(errorHandler);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

startServer();
