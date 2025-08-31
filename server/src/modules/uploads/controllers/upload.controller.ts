// server/src/modules/uploads/controllers/upload.controller.ts

import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { AuthRequest } from '../../../core/middleware/auth.middleware';
import { HttpException } from '../../../core/middleware/error.middleware';

/**
 * Upload singola foto
 */
export const uploadPhoto = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      throw new HttpException(400, 'Nessun file caricato');
    }

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const { type, timestamp } = req.body;
    const file = req.file;

    // Log per debugging (usa le variabili per evitare warning)
    console.log(`📷 Foto caricata: ${file.filename}, tipo: ${type || 'loading-photo'}, timestamp: ${timestamp || new Date().toISOString()}`);

    // URL per accedere alla foto
    const photoUrl = `/api/uploads/photo/${file.filename}`;

    res.status(201).json({
      success: true,
      message: 'Foto caricata con successo',
      data: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: photoUrl,
        uploadedAt: new Date(),
        type: type || 'loading-photo'
      }
    });
  } catch (error) {
    // Pulisci file se upload fallito
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Errore pulizia file:', cleanupError);
      }
    }
    next(error);
  }
};

/**
 * Upload multiple foto
 */
export const uploadPhotos = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      throw new HttpException(400, 'Nessun file caricato');
    }

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const { type, timestamp } = req.body;
    const uploadedPhotos = [];

    // Log per debugging
    console.log(`📷 Upload multiplo: ${files.length} foto, tipo: ${type || 'loading-photo'}, timestamp: ${timestamp || new Date().toISOString()}`);

    // Processa ogni foto
    for (const file of files) {
      uploadedPhotos.push({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: `/api/uploads/photo/${file.filename}`,
        uploadedAt: new Date(),
        type: type || 'loading-photo'
      });
    }

    res.status(201).json({
      success: true,
      message: `${uploadedPhotos.length} foto caricate con successo`,
      data: uploadedPhotos
    });
  } catch (error) {
    // Pulisci tutti i file se upload fallito
    const files = req.files as Express.Multer.File[];
    if (files) {
      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.error('Errore pulizia file:', cleanupError);
        }
      }
    }
    next(error);
  }
};

/**
 * Serve foto caricata
 */
export const servePhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      throw new HttpException(400, 'Nome file richiesto');
    }
    
    // Verifica che il file esista fisicamente
    const filePath = path.join(process.cwd(), 'uploads', 'photos', filename);
    
    try {
      await fs.access(filePath);
    } catch {
      throw new HttpException(404, 'File non trovato');
    }

    // Determina content type dal file
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
    }

    // Imposta headers appropriati
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 anno
    
    // Invia file
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina foto
 */
export const deletePhoto = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { filename } = req.params;
    
    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    if (!filename) {
      throw new HttpException(400, 'Nome file richiesto');
    }

    console.log(`🗑️ Eliminazione foto: ${filename} da utente: ${req.user.id}`);

    // Elimina file fisico
    const filePath = path.join(process.cwd(), 'uploads', 'photos', filename);
    try {
      await fs.unlink(filePath);
      console.log(`✅ File eliminato: ${filename}`);
    } catch (fsError) {
      console.error(`❌ Errore eliminazione file ${filename}:`, fsError);
      throw new HttpException(404, 'File non trovato');
    }

    res.status(200).json({
      success: true,
      message: 'Foto eliminata con successo',
      data: {
        filename,
        deletedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};