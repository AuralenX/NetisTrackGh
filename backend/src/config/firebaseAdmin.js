require("dotenv").config();
const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Validate required Firebase credentials
const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  const errorMsg = `Missing Firebase credentials: ${missingVars.join(', ')}`;
  logger.error(errorMsg);
  console.error(`❌ ${errorMsg}`);
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ?.replace(/\\n/g, '\n');

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: privateKey,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    console.log('✓ Firebase initialized successfully');
  } catch (error) {
    logger.error('Firebase initialization error', { error: error.message });
    console.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
