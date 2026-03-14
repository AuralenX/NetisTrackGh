require('dotenv').config();
const admin = require('firebase-admin');
const logger = require('../utils/logger');

// ============================================
// Validate required Firebase credentials
// ============================================
const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  const errorMsg = `Missing Firebase credentials: ${missingVars.join(', ')}`;
  logger.error(errorMsg);
  console.error(`❌ ${errorMsg}`);
}

// ============================================
// Parse private key — handles both production and local formats
// ============================================
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

// ============================================
// Initialize Firebase Admin (singleton)
// ============================================
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        type:         'service_account',
        project_id:   process.env.FIREBASE_PROJECT_ID,
        private_key:  privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✓ Firebase Admin initialized successfully');
  } catch (error) {
    logger.error('Firebase initialization error', { error: error.message });
    console.error('❌ Firebase initialization failed:', error.message);
  }
}

// ============================================
// Export Firestore and Auth instances
// ============================================
let db;
let auth;

try {
  db   = admin.firestore();
  auth = admin.auth();

  // Firestore settings — prevents warnings in serverless environments
  db.settings({ ignoreUndefinedProperties: true });

} catch (error) {
  console.error('❌ Failed to get Firestore/Auth instance:', error.message);
}

module.exports = { admin, db, auth };