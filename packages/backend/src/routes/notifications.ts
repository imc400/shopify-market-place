import { Router } from 'express';
import {
  sendNotification,
  createPromotion,
  getPromotions,
  getNotificationHistory,
  markNotificationClicked,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/send', sendNotification);
router.post('/promotions', createPromotion);
router.get('/promotions', getPromotions);
router.get('/history', getNotificationHistory);
router.put('/:notificationId/clicked', markNotificationClicked);

export default router;