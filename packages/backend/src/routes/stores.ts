import { Router } from 'express';
import {
  getStores,
  getStoreById,
  getStoreProducts,
  getStoreProduct,
  createCheckout,
  subscribeToStore,
  unsubscribeFromStore,
} from '../controllers/storeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getStores);
router.get('/:storeId', getStoreById);
router.get('/:storeId/products', getStoreProducts);
router.get('/:storeId/products/:productId', getStoreProduct);
router.post('/:storeId/checkout', createCheckout);

router.use(authenticate);
router.post('/:storeId/subscribe', subscribeToStore);
router.delete('/:storeId/subscribe', unsubscribeFromStore);

export default router;