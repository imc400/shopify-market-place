import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { validateEnv } from '../config/env';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { notificationService } from '../services/notificationService';

const env = validateEnv();

const verifyWebhook = (rawBody: string, signature: string): boolean => {
  const hmac = crypto.createHmac('sha256', env.SHOPIFY_API_SECRET);
  hmac.update(rawBody, 'utf8');
  const calculatedSignature = hmac.digest('base64');
  
  return calculatedSignature === signature;
};

export const handleProductUpdate = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.get('X-Shopify-Hmac-Sha256');
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  const topic = req.get('X-Shopify-Topic');
  
  if (!signature || !shopDomain || !topic) {
    logger.warn('Missing required webhook headers');
    return res.status(400).json({ error: 'Missing required headers' });
  }

  const rawBody = req.body.toString();
  
  if (!verifyWebhook(rawBody, signature)) {
    logger.warn(`Invalid webhook signature from ${shopDomain}`);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const store = await prisma.store.findUnique({
    where: { shopifyDomain: shopDomain },
  });

  if (!store) {
    logger.warn(`Webhook received from unknown store: ${shopDomain}`);
    return res.status(404).json({ error: 'Store not found' });
  }

  try {
    const payload = JSON.parse(rawBody);
    
    await prisma.webhookLog.create({
      data: {
        storeId: store.id,
        topic,
        payload,
        processed: false,
      },
    });

    switch (topic) {
      case 'products/update':
        await handleProductUpdateEvent(store.id, payload);
        break;
      case 'products/delete':
        await handleProductDeleteEvent(store.id, payload);
        break;
      case 'inventory_levels/update':
        await handleInventoryUpdateEvent(store.id, payload);
        break;
      case 'orders/create':
        await handleOrderCreateEvent(store.id, payload);
        break;
      default:
        logger.info(`Unhandled webhook topic: ${topic}`);
    }

    await prisma.webhookLog.updateMany({
      where: {
        storeId: store.id,
        topic,
        processed: false,
      },
      data: { processed: true },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`Error processing webhook from ${shopDomain}:`, error);
    
    await prisma.webhookLog.updateMany({
      where: {
        storeId: store.id,
        topic,
        processed: false,
      },
      data: {
        processed: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

const handleProductUpdateEvent = async (storeId: string, product: any) => {
  logger.info(`Product updated in store ${storeId}: ${product.title} (${product.id})`);
  
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { name: true },
  });

  if (!store) return;

  const significantChanges = [];
  
  if (product.status === 'active' && product.published_at) {
    significantChanges.push('available');
  }
  
  if (product.variants && product.variants.some((v: any) => v.inventory_quantity === 0)) {
    significantChanges.push('low_stock');
  }

  if (significantChanges.length > 0) {
    const notificationTitle = `📦 Actualización de producto - ${store.name}`;
    const notificationBody = significantChanges.includes('available')
      ? `¡${product.title} ya está disponible!`
      : `Stock limitado de ${product.title}`;

    await notificationService.sendToStoreSubscribers(storeId, {
      title: notificationTitle,
      body: notificationBody,
      data: {
        type: 'product_update',
        productId: product.id.toString(),
        storeId,
        changes: significantChanges.join(','),
      },
      imageUrl: product.image?.src,
    });
  }
};

const handleProductDeleteEvent = async (storeId: string, product: any) => {
  logger.info(`Product deleted in store ${storeId}: ${product.title} (${product.id})`);
  
  // TODO: Remove product from any active carts or wishlists
  // This would require implementing cart/wishlist storage
};

const handleInventoryUpdateEvent = async (storeId: string, inventoryLevel: any) => {
  logger.info(`Inventory updated in store ${storeId}: ${inventoryLevel.inventory_item_id}`);
  
  if (inventoryLevel.available <= 5 && inventoryLevel.available > 0) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { name: true },
    });

    if (!store) return;

    await notificationService.sendToStoreSubscribers(storeId, {
      title: `⚠️ Stock limitado - ${store.name}`,
      body: `Quedan solo ${inventoryLevel.available} unidades disponibles`,
      data: {
        type: 'low_stock',
        inventoryItemId: inventoryLevel.inventory_item_id.toString(),
        storeId,
        available: inventoryLevel.available.toString(),
      },
    });
  }
};

const handleOrderCreateEvent = async (storeId: string, order: any) => {
  logger.info(`New order created in store ${storeId}: ${order.order_number}`);
  
  // Track order for analytics
  // This could be used for generating conversion metrics
  
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { name: true },
  });

  if (!store) return;

  // Optional: Send notification to store admins about new order
  logger.info(`Order ${order.order_number} created in ${store.name} for $${order.total_price}`);
};

export const getWebhookLogs = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const processed = req.query.processed === 'true' ? true : req.query.processed === 'false' ? false : undefined;

  const whereClause: any = { storeId };
  if (processed !== undefined) {
    whereClause.processed = processed;
  }

  const logs = await prisma.webhookLog.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      store: {
        select: { name: true, shopifyDomain: true },
      },
    },
  });

  res.json({
    success: true,
    logs,
  });
});

export const retryWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { webhookId } = req.params;

  const webhook = await prisma.webhookLog.findUnique({
    where: { id: webhookId },
    include: {
      store: true,
    },
  });

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook log not found' });
  }

  try {
    switch (webhook.topic) {
      case 'products/update':
        await handleProductUpdateEvent(webhook.storeId, webhook.payload);
        break;
      case 'products/delete':
        await handleProductDeleteEvent(webhook.storeId, webhook.payload);
        break;
      case 'inventory_levels/update':
        await handleInventoryUpdateEvent(webhook.storeId, webhook.payload);
        break;
      case 'orders/create':
        await handleOrderCreateEvent(webhook.storeId, webhook.payload);
        break;
      default:
        throw new Error(`Unsupported webhook topic: ${webhook.topic}`);
    }

    await prisma.webhookLog.update({
      where: { id: webhookId },
      data: {
        processed: true,
        error: null,
      },
    });

    res.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    await prisma.webhookLog.update({
      where: { id: webhookId },
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    res.status(500).json({ error: 'Webhook retry failed' });
  }
});