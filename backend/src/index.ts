import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';

dotenv.config();

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courseRoutes from './routes/courses';
import sessionRoutes from './routes/sessions';
import learnerRoutes from './routes/learners';
import resultRoutes from './routes/results';
import certificateRoutes from './routes/certificates';
import templateRoutes from './routes/templates';
import maskRoutes from './routes/masks';
import dashboardRoutes from './routes/dashboard';
import publicRoutes from './routes/public';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/learners', learnerRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/masks', maskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'EROSIS CERTIFY API is running', timestamp: new Date().toISOString() });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================`);
  console.log(`  EROSIS CERTIFY API Server`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log(`======================================\n`);
});

export default app;
