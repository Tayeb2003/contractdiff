import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.js';
import { ValidationError } from '../services/validation.js';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ValidationError || err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error('Unhandled error', { message: err.message, stack: err.stack?.slice(0, 500) });
  res.status(500).json({ error: 'Internal server error' });
}
