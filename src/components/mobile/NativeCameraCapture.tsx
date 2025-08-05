import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Image, AlertCircle } from 'lucide-react';
import { useNativeCamera } from '@/hooks/useNativeCamera';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NativeCameraCaptureProps {
  onPhotoCapture: (photo: { webPath?: string; base64String?: string }) => void;
  title?: string;
  description?: string;
}

export const NativeCameraCapture: React.FC<NativeCameraCaptureProps> = ({
  onPhotoCapture,
  title = 'Captura de Imagem',
  description = 'Utilize a câmera para capturar uma foto para análise'
}) => {
  const { capturePhoto, isCapturing, error, isNative } = useNativeCamera();

  const handleCapturePhoto = async () => {
    const photo = await capturePhoto({
      quality: 90,
      allowEditing: true,
    });

    if (photo) {
      onPhotoCapture(photo);
    }
  };

  const handleCaptureFromGallery = async () => {
    const { CameraSource } = await import('@capacitor/camera');
    const photo = await capturePhoto({
      quality: 90,
      source: CameraSource.Photos,
    });

    if (photo) {
      onPhotoCapture(photo);
    }
  };

  if (!isNative) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Funcionalidade de câmera disponível apenas em dispositivos móveis.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handleCapturePhoto}
            disabled={isCapturing}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            {isCapturing ? 'Capturando...' : 'Tirar Foto'}
          </Button>

          <Button
            variant="outline"
            onClick={handleCaptureFromGallery}
            disabled={isCapturing}
            className="flex items-center gap-2"
          >
            <Image className="h-4 w-4" />
            Galeria
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};