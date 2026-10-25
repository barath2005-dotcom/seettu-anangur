import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { authLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import memberRoutes from './routes/members';
import schemeRoutes from './routes/schemes';
import paymentRoutes from './routes/payments';
import payoutRoutes from './routes/payouts';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import notificationRoutes from './routes/notifications';
import staffRoutes from './routes/staff';
import auditRoutes from './routes/audit';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Kolkata',
    service: 'Sri Pattanathu Mariamman Anangur Seettu API',
    organization: 'ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு',
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/audit', auditRoutes);

// Error Handling
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`  ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு`);
    console.log(`  Sri Pattanathu Mariamman Anangur Seettu API on port ${config.port}`);
    console.log(`  Local URL:    http://localhost:${config.port}`);
    console.log(`  Health check: http://localhost:${config.port}/api/health`);
    console.log(`===============================================`);
  });
}

export default app;
