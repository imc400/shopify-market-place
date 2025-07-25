import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { ShopifyService } from '../services/shopifyService';

const searchSchema = z.object({
  query: z.string().min(1).max(100),
  storeIds: z.array(z.string().uuid()).optional(),
  limit: z.number().min(1).max(50).default(20),
});

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { query, storeIds, limit } = searchSchema.parse(req.body);

  let stores;
  
  if (storeIds && storeIds.length > 0) {
    stores = await prisma.store.findMany({
      where: {
        id: { in: storeIds },
        isActive: true,
      },
    });
  } else {
    stores = await prisma.store.findMany({
      where: { isActive: true },
      take: 5,
    });
  }

  if (stores.length === 0) {
    return res.json({
      success: true,
      products: [],
    });
  }

  const allProducts = [];

  for (const store of stores) {
    try {
      const shopifyService = new ShopifyService(store.shopifyDomain, store.accessToken);
      const products = await shopifyService.searchProducts(query, Math.ceil(limit / stores.length));
      
      const productsWithStore = products.map(product => ({
        ...product,
        storeId: store.id,
        storeName: store.name,
      }));

      allProducts.push(...productsWithStore);
    } catch (error) {
      console.error(`Error searching products in store ${store.name}:`, error);
    }
  }

  const sortedProducts = allProducts
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, limit);

  res.json({
    success: true,
    products: sortedProducts,
  });
});

export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const activeStores = await prisma.store.findMany({
    where: { isActive: true },
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  if (activeStores.length === 0) {
    return res.json({
      success: true,
      products: [],
    });
  }

  const featuredProducts = [];

  for (const store of activeStores) {
    try {
      const shopifyService = new ShopifyService(store.shopifyDomain, store.accessToken);
      const products = await shopifyService.getProducts(Math.ceil(limit / activeStores.length));
      
      const productsWithStore = products.map(product => ({
        ...product,
        storeId: store.id,
        storeName: store.name,
      }));

      featuredProducts.push(...productsWithStore);
    } catch (error) {
      console.error(`Error fetching products from store ${store.name}:`, error);
    }
  }

  const shuffledProducts = featuredProducts
    .sort(() => 0.5 - Math.random())
    .slice(0, limit);

  res.json({
    success: true,
    products: shuffledProducts,
  });
});