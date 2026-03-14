const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// ============================================
// TRUST PROXY — must be first for Vercel
// ============================================
app.set('trust proxy', 1);

// ============================================
// HELMET
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc:      ["'self'", "data:", "https:"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
      connectSrc:  ["'self'", "https://netistrackghbackend.auralenx.com", "https://netistrackgh.vercel.app"],
    }
  }
}));

// ============================================
// CORS — properly parses multi-origin env var
// ============================================
const envOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const ALLOWED_ORIGINS = [
  'https://netistrackgh.auralenx.com',
  'https://netistrackghbackend.auralenx.com',
  'https://netistrackgh.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8000',
  'http://localhost:8888',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:3000',
  ...envOrigins,
];

const UNIQUE_ORIGINS = [...new Set(ALLOWED_ORIGINS.filter(Boolean))];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin) return callback(null, true);
    if (UNIQUE_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked: ${origin}`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Client-Version',
    'X-Client-Platform',
  ],
  maxAge: 600,
};

// Handle preflight for ALL routes FIRST — before any other middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ============================================
// RATE LIMITING
// ============================================
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:       parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message:   { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders:   false,
  // Required for Vercel — use memory store (default), skip if undefined IP
  skip: (req) => !req.ip,
});

app.use('/api/', limiter);

// ============================================
// BODY PARSING
// ============================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================
// SWAGGER — load lazily to avoid cold-start cost
// ============================================
try {
  const { swaggerUi, specs } = require('./src/config/swagger');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'NetisTrackGh API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      displayRequestDuration: true,
    },
  }));
} catch (e) {
  console.warn('[Swagger] Failed to load:', e.message);
  app.get('/docs', (req, res) => res.json({ error: 'Swagger unavailable' }));
}

// ============================================
// STATIC FILES (backend dashboard)
// ============================================
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'upload')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// API ROUTES — loaded after health checks
// so health/status never get blocked
// ============================================
const authRoutes        = require('./src/routes/authRoutes');
const siteRoutes        = require('./src/routes/siteRoutes');
const fuelRoutes        = require('./src/routes/fuelRoutes');
const maintenanceRoutes = require('./src/routes/maintenanceRoutes');
const syncRoutes        = require('./src/routes/syncRoutes');

app.use('/api/auth',        authRoutes);
app.use('/api/sites',       siteRoutes);
app.use('/api/fuel',        fuelRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/sync',        syncRoutes);

app.get('/api', (req, res) => {
  res.json({
    message:       'Welcome to NetisTrackGh Backend API',
    version:       '1.0.0',
    documentation: '/docs',
    health:        '/health',
    status:        '/api/status',
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/docs') || req.path.startsWith('/health')) {
    return res.status(404).json({
      error: 'Route not found',
      path:  req.originalUrl,
      availableEndpoints: ['/health', '/api/status', '/api/auth', '/api/sites', '/api/fuel', '/api/maintenance', '/api/sync', '/docs'],
    });
  }
  // SPA fallback
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// ERROR HANDLER
// ============================================
try {
  const { errorHandler } = require('./src/utils/errorHandler');
  app.use(errorHandler);
} catch (e) {
  app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });
}

// ============================================
// EXPORT for Vercel serverless
// ============================================
module.exports = app;

// ============================================
// LOCAL DEV SERVER
// ============================================
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`
🚀 NetisTrackGh Backend Started
📍 Local:   http://localhost:${PORT}
📚 Docs:    http://localhost:${PORT}/docs
❤️  Health:  http://localhost:${PORT}/health
📊 Status:  http://localhost:${PORT}/api/status
    `);
  });
}