import { Router } from 'express';
import {
  addStore,
  listStores,
  updateStore,
  removeStore,
  testStoreConnection,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Todas las rutas de admin requieren autenticación
router.use(authenticate);

// Gestión de tiendas
router.post('/stores', addStore);
router.get('/stores', listStores);
router.put('/stores/:storeId', updateStore);
router.delete('/stores/:storeId', removeStore);
router.get('/stores/:storeId/test', testStoreConnection);

export default router;