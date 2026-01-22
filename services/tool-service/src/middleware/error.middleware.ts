import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '@neighbortools/shared-utils';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json(errorResponse(`Upload error: ${err.message}`));
  }

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
