// ======================================
// Middleware per logging OCR
// ======================================

// server/src/core/middleware/ocr.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const ocrLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log richiesta OCR
  if (req.file) {
    logger.info('OCR Request', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      endpoint: req.path
    });
  }

  // Intercetta la risposta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log risposta OCR
    logger.info('OCR Response', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      endpoint: req.path
    });

    return originalSend.call(this, data);
  };

  next();
};
