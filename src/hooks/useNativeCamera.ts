import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: CameraResultType;
  source?: CameraSource;
}

interface CameraResult {
  webPath?: string;
  base64String?: string;
  format?: string;
}

export const useNativeCamera = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capturePhoto = useCallback(async (options: CameraOptions = {}): Promise<CameraResult | null> => {
    if (!Capacitor.isNativePlatform()) {
      setError('Camera only available on mobile devices');
      return null;
    }

    setIsCapturing(true);
    setError(null);

    try {
      const image = await Camera.getPhoto({
        quality: options.quality || 90,
        allowEditing: options.allowEditing || false,
        resultType: options.resultType || CameraResultType.Uri,
        source: options.source || CameraSource.Camera,
      });

      return {
        webPath: image.webPath,
        base64String: image.base64String,
        format: image.format,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture photo';
      setError(errorMessage);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted';
    } catch (err) {
      setError('Failed to request camera permissions');
      return false;
    }
  }, []);

  return {
    capturePhoto,
    requestPermissions,
    isCapturing,
    error,
    isNative: Capacitor.isNativePlatform(),
  };
};