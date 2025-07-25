import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { message, statusCode } = error as AppError;

  if (!statusCode) statusCode = 500;

  logger.error(`Error ${statusCode}: ${message}`, {
    error: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      error: message,
      stack: error.stack,
    });
  } else {
    res.status(statusCode).json({
      success: false,
      error: statusCode >= 500 ? 'Internal Server Error' : message,
    });
  }
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};