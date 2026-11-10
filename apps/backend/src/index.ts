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
import monthlyReportRoutes from './routes/monthlyReports';

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
    version: '1.0.2',
  });
});

// App Update & Version Check
const LATEST_APP_VERSION = '1.0.2';
const LATEST_BUILD_CODE = 3;
const LATEST_APK_GITHUB_URL = 'https://github.com/barath2005-dotcom/seettu-anangur/releases/latest/download/Sri-Pattanathu-Mariamman.apk';

app.get('/api/app-update', (req, res) => {
  res.json({
    latestVersion: LATEST_APP_VERSION,
    versionCode: LATEST_BUILD_CODE,
    releaseDate: '2026-11-10',
    minRequiredVersion: '1.0.0',
    apkUrl: LATEST_APK_GITHUB_URL,
    directDownloadUrl: 'https://seettu-anangur.vercel.app/api/app-update/download',
    changelog: {
      ta: [
        'நிலைப்பட்டை மற்றும் கேமரா பஞ்ச்-ஹோல் இடைவெளி சரிசெய்யப்பட்டது',
        'மொபைல் திரைக்கு ஏற்ற 2-அடுக்கு தலைப்பு அமைப்பு (2-Tier Header)',
        'நேரடி ஆப் புதுப்பிப்பு வசதி (One-Tap In-App Update)',
        'செயல்திறன் மற்றும் பாதுகாப்பு மேம்பாடுகள்'
      ],
      en: [
        'Fixed camera punch-hole cutout and status bar safe-area clearance',
        'Optimized 2-tier mobile header for all smartphone screens',
        'One-tap in-app APK update system with direct download',
        'Performance enhancements and stability updates'
      ]
    }
  });
});

app.get('/api/app-update/download', (req, res) => {
  res.redirect(302, LATEST_APK_GITHUB_URL);
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
app.use('/api/monthly-reports', monthlyReportRoutes);

// Error Handling
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
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
