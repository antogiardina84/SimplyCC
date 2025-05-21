// server/src/core/middleware/error.middleware.ts

import { Request, Response } from 'express';

export class HttpException extends Error {
  status: number;
  message: string;
  
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

export const errorHandler = (
  error: HttpException,
  req: Request,
  res: Response): void => {
  const status = error.status || 500;
  const message = error.message || 'Errore interno del server';

  console.error(`[${req.method}] ${req.path} >> StatusCode: ${status}, Message: ${message}`);
  
  res.status(status).json({
    success: false,
    status,
    message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};