import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { validateEnv } from './config/env';

import authRoutes from './routes/auth';
import storeRoutes from './routes/stores';
import productRoutes from './routes/products';
import webhookRoutes from './routes/webhooks';
import notificationRoutes from './routes/notifications';

dotenv.config();

const env = validateEnv();
const app = express();

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: env.CORS_ORIGIN.split(','),
  credentials: true,
}));

app.use('/api/webhooks', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/promotions', notificationRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on port ${env.PORT}`);
  logger.info(`📱 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 CORS enabled for: ${env.CORS_ORIGIN}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

export default app;