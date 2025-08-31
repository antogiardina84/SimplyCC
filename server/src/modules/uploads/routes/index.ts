// server/src/modules/uploads/routes/index.ts

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

// Configurazione multer per upload foto
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'photos');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '_');
    const fileName = `${timestamp}_${originalName}`;
    cb(null, fileName);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accetta solo immagini
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo file immagine sono permessi!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB massimo
  }
});

// Proteggi tutte le route con autenticazione
router.use(authMiddleware);

/**
 * POST /uploads/photo - Upload singola foto
 * Accetta: multipart/form-data con campo 'photo'
 * Body: { type: string, timestamp?: string }
 */
router.post('/photo', upload.single('photo'), uploadController.uploadPhoto);

/**
 * POST /uploads/photos - Upload multiple foto
 * Accetta: multipart/form-data con campo 'photos'
 * Body: { type: string, timestamp?: string }
 */
router.post('/photos', upload.array('photos', 10), uploadController.uploadPhotos);

/**
 * GET /uploads/photo/:filename - Serve foto caricata
 */
router.get('/photo/:filename', uploadController.servePhoto);

/**
 * DELETE /uploads/photo/:filename - Elimina foto
 */
router.delete('/photo/:filename', uploadController.deletePhoto);

export const uploadRoutes = router;