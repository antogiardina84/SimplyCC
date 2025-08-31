// server/src/core/config/multer.config.ts

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express'; // 1. Import Request

// 2. Define a custom Request type that includes the 'user' property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string; // Assuming the user id is a string
  };
}

// 3. Define the File and Callback types for Multer to replace 'any'
type MulterFile = Express.Multer.File;
type MulterCallback = (error: Error | null, result?: any) => void;

// Assicurati che la directory uploads esista
const uploadDir = path.join(process.cwd(), 'uploads', 'photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const multerConfig = {
  storage: multer.diskStorage({
    destination: (req: Request, file: MulterFile, cb: MulterCallback) => {
      cb(null, uploadDir);
    },
    filename: (req: AuthenticatedRequest, file: MulterFile, cb: MulterCallback) => {
      const timestamp = Date.now();
      const userId = req.user?.id || 'anonymous';
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${userId}_${sanitizedName}`;
      cb(null, fileName);
    }
  }),
  fileFilter: (req: AuthenticatedRequest, file: MulterFile, cb: MulterCallback) => {
    // Accetta solo immagini
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo file immagine (JPEG, PNG, WebP) sono permessi!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 10 // Max 10 file per upload multiplo
  }
};