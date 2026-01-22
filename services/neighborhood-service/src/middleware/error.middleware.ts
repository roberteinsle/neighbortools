import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '@neighbortools/shared-utils';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json(errorResponse('Database operation failed'));
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json(errorResponse('Invalid data provided'));
  }

  // Default error
  res.status(500).json(errorResponse('Internal server error'));
}
