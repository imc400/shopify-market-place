import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';
import { validateEnv } from '../config/env';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const env = validateEnv();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateFCMTokenSchema = z.object({
  fcmToken: z.string(),
});

const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  const token = generateToken(user.id, user.email);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      ...user,
      subscriptions: [],
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      subscriptions: {
        include: {
          store: {
            select: {
              id: true,
              name: true,
              shopifyDomain: true,
            },
          },
        },
      },
    },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user.id, user.email);

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      ...userWithoutPassword,
      subscriptions: user.subscriptions.map(sub => sub.store.id),
    },
  });
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      subscriptions: {
        where: { isActive: true },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              shopifyDomain: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    user: {
      ...userWithoutPassword,
      subscriptions: user.subscriptions.map(sub => sub.store.id),
    },
  });
});

export const updateFCMToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { fcmToken } = updateFCMTokenSchema.parse(req.body);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { fcmToken },
  });

  res.json({
    success: true,
    message: 'FCM token updated successfully',
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const token = generateToken(req.user.id, req.user.email);

  res.json({
    success: true,
    token,
  });
});