import { Router } from 'express';
import {
  searchProducts,
  getFeaturedProducts,
} from '../controllers/productController';

const router = Router();

router.post('/search', searchProducts);
router.get('/featured', getFeaturedProducts);

export default router;