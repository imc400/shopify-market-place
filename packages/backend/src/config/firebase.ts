import admin from 'firebase-admin';
import { validateEnv } from './env';
import { logger } from '../utils/logger';

const env = validateEnv();

const firebaseConfig = {
  projectId: env.FIREBASE_PROJECT_ID,
  privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    projectId: env.FIREBASE_PROJECT_ID,
  });
  logger.info('✅ Firebase Admin initialized');
}

export const messaging = admin.messaging();
export { admin };