import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { notificationService } from '../services/notificationService';

const sendNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(200),
  data: z.record(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  storeId: z.string().uuid().optional(),
  userIds: z.array(z.string().uuid()).optional(),
});

const promotionSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  image: z.string().url().optional(),
  discountCode: z.string().optional(),
  validUntil: z.string().datetime().optional(),
  storeId: z.string().uuid(),
  sendNotification: z.boolean().default(false),
});

export const sendNotification = asyncHandler(async (req: Request, res: Response) => {
  const { title, body, data, imageUrl, storeId, userIds } = sendNotificationSchema.parse(req.body);

  let sentCount = 0;

  if (storeId) {
    const store = await prisma.store.findUnique({
      where: { id: storeId, isActive: true },
    });

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    sentCount = await notificationService.sendToStoreSubscribers(storeId, {
      title,
      body,
      data,
      imageUrl,
    });
  } else if (userIds && userIds.length > 0) {
    sentCount = await notificationService.sendToMultipleUsers(userIds, {
      title,
      body,
      data,
      imageUrl,
    });
  } else {
    throw new AppError('Either storeId or userIds must be provided', 400);
  }

  res.json({
    success: true,
    message: `Notification sent to ${sentCount} users`,
    sentCount,
  });
});

export const createPromotion = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, image, discountCode, validUntil, storeId, sendNotification } = 
    promotionSchema.parse(req.body);

  const store = await prisma.store.findUnique({
    where: { id: storeId, isActive: true },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  const promotion = await prisma.promotion.create({
    data: {
      storeId,
      title,
      description,
      image,
      discountCode,
      validUntil: validUntil ? new Date(validUntil) : null,
    },
  });

  if (sendNotification) {
    const notificationTitle = `🎉 Nueva oferta en ${store.name}`;
    const notificationBody = discountCode 
      ? `${title} - Código: ${discountCode}`
      : title;

    await notificationService.sendToStoreSubscribers(storeId, {
      title: notificationTitle,
      body: notificationBody,
      data: {
        type: 'promotion',
        promotionId: promotion.id,
        storeId: storeId,
      },
      imageUrl: image,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Promotion created successfully',
    promotion,
  });
});

export const getPromotions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const userSubscriptions = await prisma.subscription.findMany({
    where: {
      userId: req.user.id,
      isActive: true,
    },
    select: { storeId: true },
  });

  const storeIds = userSubscriptions.map(sub => sub.storeId);

  if (storeIds.length === 0) {
    return res.json({
      success: true,
      promotions: [],
    });
  }

  const promotions = await prisma.promotion.findMany({
    where: {
      storeId: { in: storeIds },
      isActive: true,
      OR: [
        { validUntil: null },
        { validUntil: { gte: new Date() } },
      ],
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          shopifyDomain: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const formattedPromotions = promotions.map(promotion => ({
    id: promotion.id,
    title: promotion.title,
    description: promotion.description,
    image: promotion.image,
    discountCode: promotion.discountCode,
    validUntil: promotion.validUntil,
    storeId: promotion.storeId,
    storeName: promotion.store.name,
    createdAt: promotion.createdAt,
  }));

  res.json({
    success: true,
    promotions: formattedPromotions,
  });
});

export const getNotificationHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  
  const notifications = await notificationService.getNotificationHistory(req.user.id, limit);

  res.json({
    success: true,
    notifications,
  });
});

export const markNotificationClicked = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;

  const notification = await prisma.pushNotification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.userId !== req.user?.id) {
    throw new AppError('Unauthorized', 403);
  }

  const success = await notificationService.markNotificationAsClicked(notificationId);

  res.json({
    success,
    message: success ? 'Notification marked as clicked' : 'Failed to update notification',
  });
});