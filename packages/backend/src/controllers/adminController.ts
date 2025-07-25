import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { ShopifyService } from '../services/shopifyService';
import { v4 as uuidv4 } from 'uuid';

const addStoreSchema = z.object({
  shopifyDomain: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  accessToken: z.string().min(1),
  categories: z.array(z.string()).default([]),
  logo: z.string().url().optional(),
});

export const addStore = asyncHandler(async (req: Request, res: Response) => {
  const { shopifyDomain, name, description, accessToken, categories, logo } = 
    addStoreSchema.parse(req.body);

  // Verificar que el access token funcione
  try {
    const shopifyService = new ShopifyService(shopifyDomain, accessToken);
    await shopifyService.getProducts(1); // Test API call
  } catch (error) {
    throw new AppError('Invalid Shopify credentials or domain', 400);
  }

  // Verificar que la tienda no exista
  const existingStore = await prisma.store.findUnique({
    where: { shopifyDomain },
  });

  if (existingStore) {
    throw new AppError('Store already exists', 400);
  }

  // Crear tienda
  const store = await prisma.store.create({
    data: {
      id: uuidv4(),
      shopifyDomain,
      name,
      description,
      accessToken,
      categories,
      logo,
      isActive: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Store added successfully',
    store: {
      id: store.id,
      name: store.name,
      domain: store.shopifyDomain,
      categories: store.categories,
    },
  });
});

export const listStores = asyncHandler(async (req: Request, res: Response) => {
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      shopifyDomain: true,
      description: true,
      categories: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          subscriptions: {
            where: { isActive: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const storesWithStats = stores.map(store => ({
    ...store,
    subscriberCount: store._count.subscriptions,
  }));

  res.json({
    success: true,
    stores: storesWithStats,
  });
});

export const updateStore = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const { name, description, categories, isActive, logo } = req.body;

  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  const updatedStore = await prisma.store.update({
    where: { id: storeId },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(categories && { categories }),
      ...(isActive !== undefined && { isActive }),
      ...(logo && { logo }),
    },
  });

  res.json({
    success: true,
    message: 'Store updated successfully',
    store: updatedStore,
  });
});

export const removeStore = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;

  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  // Soft delete - marcar como inactiva
  await prisma.store.update({
    where: { id: storeId },
    data: { isActive: false },
  });

  res.json({
    success: true,
    message: 'Store removed successfully',
  });
});

export const testStoreConnection = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;

  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  try {
    const shopifyService = new ShopifyService(store.shopifyDomain, store.accessToken);
    const products = await shopifyService.getProducts(5);

    res.json({
      success: true,
      message: 'Store connection successful',
      data: {
        storeId: store.id,
        storeName: store.name,
        productsFound: products.length,
        sampleProducts: products.slice(0, 3).map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
        })),
      },
    });
  } catch (error) {
    throw new AppError('Store connection failed', 400);
  }
});