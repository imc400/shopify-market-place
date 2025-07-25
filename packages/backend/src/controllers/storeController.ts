import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { ShopifyService } from '../services/shopifyService';

const subscriptionSchema = z.object({
  storeId: z.string().uuid(),
});

export const getStores = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    include: {
      subscriptions: userId 
        ? {
            where: { 
              userId,
              isActive: true,
            },
          }
        : false,
    },
  });

  const storesWithSubscriptionStatus = stores.map(store => ({
    id: store.id,
    name: store.name,
    domain: store.shopifyDomain,
    description: store.description,
    logo: store.logo,
    categories: store.categories,
    isSubscribed: userId ? store.subscriptions.length > 0 : false,
  }));

  res.json({
    success: true,
    stores: storesWithSubscriptionStatus,
  });
});

export const getStoreById = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const userId = req.user?.id;

  const store = await prisma.store.findUnique({
    where: { id: storeId, isActive: true },
    include: {
      subscriptions: userId 
        ? {
            where: { 
              userId,
              isActive: true,
            },
          }
        : false,
    },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  res.json({
    success: true,
    store: {
      id: store.id,
      name: store.name,
      domain: store.shopifyDomain,
      description: store.description,
      logo: store.logo,
      categories: store.categories,
      isSubscribed: userId ? store.subscriptions.length > 0 : false,
    },
  });
});

export const getStoreProducts = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const store = await prisma.store.findUnique({
    where: { id: storeId, isActive: true },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  const shopifyService = new ShopifyService(store.shopifyDomain, store.accessToken);
  const products = await shopifyService.getProducts(limit);

  res.json({
    success: true,
    products: products.map(product => ({
      ...product,
      storeId: store.id,
      storeName: store.name,
    })),
  });
});

export const getStoreProduct = asyncHandler(async (req: Request, res: Response) => {
  const { storeId, productId } = req.params;

  const store = await prisma.store.findUnique({
    where: { id: storeId, isActive: true },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  const shopifyService = new ShopifyService(store.shopifyDomain, store.accessToken);
  const product = await shopifyService.getProduct(productId);

  res.json({
    success: true,
    product: {
      ...product,
      storeId: store.id,
      storeName: store.name,
    },
  });
});

export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const { lineItems } = req.body;

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new AppError('Line items are required', 400);
  }

  const store = await prisma.store.findUnique({
    where: { id: storeId, isActive: true },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  const shopifyService = new ShopifyService(store.shopifyDomain, store.accessToken);
  const checkout = await shopifyService.createCheckout(lineItems);

  res.json({
    success: true,
    checkout,
  });
});

export const subscribeToStore = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { storeId } = req.params;

  const store = await prisma.store.findUnique({
    where: { id: storeId, isActive: true },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  const existingSubscription = await prisma.subscription.findUnique({
    where: {
      userId_storeId: {
        userId: req.user.id,
        storeId,
      },
    },
  });

  if (existingSubscription && existingSubscription.isActive) {
    throw new AppError('Already subscribed to this store', 400);
  }

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: { isActive: true },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId: req.user.id,
        storeId,
      },
    });
  }

  res.json({
    success: true,
    message: 'Successfully subscribed to store',
  });
});

export const unsubscribeFromStore = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { storeId } = req.params;

  const subscription = await prisma.subscription.findUnique({
    where: {
      userId_storeId: {
        userId: req.user.id,
        storeId,
      },
    },
  });

  if (!subscription || !subscription.isActive) {
    throw new AppError('Not subscribed to this store', 400);
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { isActive: false },
  });

  res.json({
    success: true,
    message: 'Successfully unsubscribed from store',
  });
});