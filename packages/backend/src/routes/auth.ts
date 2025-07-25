import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateFCMToken,
  refreshToken,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', authenticate, refreshToken);
router.get('/me', authenticate, getCurrentUser);
router.put('/fcm-token', authenticate, updateFCMToken);

export default router;