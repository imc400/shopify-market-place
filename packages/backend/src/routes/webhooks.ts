import { Router } from 'express';
import {
  handleProductUpdate,
  getWebhookLogs,
  retryWebhook,
} from '../controllers/webhookController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/shopify', handleProductUpdate);

router.use(authenticate);
router.get('/logs/:storeId', getWebhookLogs);
router.post('/retry/:webhookId', retryWebhook);

export default router;