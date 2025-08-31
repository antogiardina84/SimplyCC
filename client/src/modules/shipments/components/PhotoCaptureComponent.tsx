// client/src/modules/shipments/components/PhotoCaptureComponent.tsx

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Camera,
  Upload,
  Delete,
  Visibility,
  PhotoCamera,
  CloudUpload
} from '@mui/icons-material';

interface Photo {
  id: string;
  file: File;
  preview: string;
  timestamp: Date;
}

interface PhotoCaptureProps {
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
  maxSizeMB?: number;
}

const PhotoCaptureComponent: React.FC<PhotoCaptureProps> = ({
  onPhotosChange,
  maxPhotos = 10,
  maxSizeMB = 2
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comprime l'immagine per mantenerla sotto i 2MB
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calcola dimensioni per mantenere aspect ratio
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let { width, height } = img;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Disegna l'immagine compressa
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converti in blob con qualità ottimizzata
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8 // Qualità 80%
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Avvia la camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment' // Camera posteriore su mobile
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Errore accesso camera:', error);
      alert('Impossibile accedere alla camera. Usa il caricamento file.');
    }
  }, []);

  // Ferma la camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  // Scatta foto dalla camera
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (blob && photos.length < maxPhotos) {
        const file = new File([blob], `foto-carico-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        
        const compressedFile = await compressImage(file);
        
        const newPhoto: Photo = {
          id: Date.now().toString(),
          file: compressedFile,
          preview: URL.createObjectURL(compressedFile),
          timestamp: new Date()
        };
        
        const updatedPhotos = [...photos, newPhoto];
        setPhotos(updatedPhotos);
        onPhotosChange(updatedPhotos);
      }
      setCapturing(false);
      stopCamera();
    }, 'image/jpeg', 0.8);
  }, [photos, maxPhotos, onPhotosChange, stopCamera]);

  // Carica foto da file
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    setUploading(true);
    
    for (let i = 0; i < files.length && photos.length + i < maxPhotos; i++) {
      const file = files[i];
      
      // Verifica tipo file
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} non è un'immagine valida.`);
        continue;
      }
      
      // Comprimi se necessario
      const compressedFile = await compressImage(file);
      
      // Verifica dimensione dopo compressione
      if (compressedFile.size > maxSizeMB * 1024 * 1024) {
        alert(`File ${file.name} troppo grande anche dopo compressione.`);
        continue;
      }
      
      const newPhoto: Photo = {
        id: Date.now().toString() + i,
        file: compressedFile,
        preview: URL.createObjectURL(compressedFile),
        timestamp: new Date()
      };
      
      setPhotos(prev => {
        const updated = [...prev, newPhoto];
        onPhotosChange(updated);
        return updated;
      });
    }
    
    setUploading(false);
    // Reset input
    event.target.value = '';
  }, [photos, maxPhotos, maxSizeMB, onPhotosChange]);

  // Rimuovi foto
  const removePhoto = useCallback((photoId: string) => {
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== photoId);
      onPhotosChange(updated);
      return updated;
    });
  }, [onPhotosChange]);

  // Cleanup URLs quando il componente si smonta
  React.useEffect(() => {
    return () => {
      photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      stopCamera();
    };
  }, [photos, stopCamera]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        📷 Foto del Carico ({photos.length}/{maxPhotos})
      </Typography>
      
      {/* Pulsanti di acquisizione */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<PhotoCamera />}
          onClick={startCamera}
          disabled={photos.length >= maxPhotos}
        >
          Scatta Foto
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<CloudUpload />}
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= maxPhotos || uploading}
        >
          {uploading ? 'Caricando...' : 'Carica da File'}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFileUpload}
        />
      </Box>

      {/* Griglia foto */}
      {photos.length > 0 && (
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {photos.map((photo) => (
            <Grid item xs={6} sm={4} md={3} key={photo.id}>
              <Card variant="outlined">
                <Box
                  sx={{
                    position: 'relative',
                    paddingBottom: '75%', // 4:3 aspect ratio
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={photo.preview}
                    alt={`Foto carico ${photo.id}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
                <CardActions sx={{ p: 0.5 }}>
                  <IconButton 
                    size="small" 
                    onClick={() => setPreviewPhoto(photo)}
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => removePhoto(photo.id)}
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Camera */}
      <Dialog 
        open={showCamera} 
        onClose={stopCamera} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>📷 Scatta Foto del Carico</DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', textAlign: 'center' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxHeight: '60vh',
                objectFit: 'cover'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={stopCamera}>Annulla</Button>
          <Button
            onClick={capturePhoto}
            variant="contained"
            disabled={capturing}
            startIcon={capturing ? <CircularProgress size={20} /> : <Camera />}
          >
            {capturing ? 'Scattando...' : 'Scatta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Anteprima */}
      <Dialog 
        open={!!previewPhoto} 
        onClose={() => setPreviewPhoto(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Anteprima Foto</DialogTitle>
        <DialogContent>
          {previewPhoto && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={previewPhoto.preview}
                alt="Anteprima"
                style={{
                  width: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Scattata: {previewPhoto.timestamp.toLocaleString()}
              </Typography>
              <Typography variant="caption" display="block">
                Dimensione: {(previewPhoto.file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewPhoto(null)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {photos.length === 0 && (
        <Alert severity="info">
          Scatta delle foto durante il carico per documentare l'operazione.
          Le foto vengono automaticamente compresse per l'invio.
        </Alert>
      )}
    </Box>
  );
};

export default PhotoCaptureComponent;