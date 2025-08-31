import { Request, Response, NextFunction } from 'express';
import { HttpException } from './error.middleware';
import multer from 'multer';
import path from 'path';

/**
 * Middleware per gestire errori di upload
 */
export const uploadErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new HttpException(413, 'File troppo grande. Massimo 5MB per file.'));
      case 'LIMIT_FILE_COUNT':
        return next(new HttpException(413, 'Troppi file. Massimo 10 file per upload.'));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(new HttpException(400, 'Campo file non previsto.'));
      default:
        return next(new HttpException(400, `Errore upload: ${error.message}`));
    }
  }

  if (error.message === 'Solo file immagine (JPEG, PNG, WebP) sono permessi!') {
    return next(new HttpException(400, error.message));
  }

  next(error);
};

/**
 * Middleware per validare upload foto
 */
export const validatePhotoUpload = (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;
  const files = req.files as Express.Multer.File[];

  if (!file && (!files || files.length === 0)) {
    return next(new HttpException(400, 'Nessun file caricato'));
  }

  // Validazioni aggiuntive se necessarie
  const filesToCheck = file ? [file] : files;

  for (const fileToCheck of filesToCheck) {
    // Controlla dimensioni minime
    if (fileToCheck.size < 1024) { // Min 1KB
      return next(new HttpException(400, `File ${fileToCheck.originalname} troppo piccolo`));
    }

    // Controlla estensioni
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = path.extname(fileToCheck.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return next(new HttpException(400, `Estensione ${fileExtension} non supportata per ${fileToCheck.originalname}`));
    }
  }

  next();
};