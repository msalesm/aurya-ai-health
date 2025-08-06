import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

export interface PermissionStatus {
  camera: 'prompt' | 'granted' | 'denied' | 'checking';
  microphone: 'prompt' | 'granted' | 'denied' | 'checking';
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: 'prompt',
    microphone: 'prompt'
  });

  const checkWebPermissions = useCallback(async () => {
    try {
      // Check microphone permission
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissions(prev => ({ ...prev, microphone: micPermission.state as any }));

      // Check camera permission
      const camPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setPermissions(prev => ({ ...prev, camera: camPermission.state as any }));

      // Listen for permission changes
      micPermission.onchange = () => {
        setPermissions(prev => ({ ...prev, microphone: micPermission.state as any }));
      };

      camPermission.onchange = () => {
        setPermissions(prev => ({ ...prev, camera: camPermission.state as any }));
      };
    } catch (error) {
      console.log('Permission API not supported, will request directly');
    }
  }, []);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    setPermissions(prev => ({ ...prev, microphone: 'checking' }));
    
    try {
      if (Capacitor.isNativePlatform()) {
        // Native platform - use device-specific permissions
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 44100,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        stream.getTracks().forEach(track => track.stop());
        setPermissions(prev => ({ ...prev, microphone: 'granted' }));
        return true;
      } else {
        // Web platform
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 44100,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        stream.getTracks().forEach(track => track.stop());
        setPermissions(prev => ({ ...prev, microphone: 'granted' }));
        return true;
      }
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      } else if (error.name === 'NotFoundError') {
        console.error('No microphone device found');
        setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      } else {
        setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      }
      return false;
    }
  }, []);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    setPermissions(prev => ({ ...prev, camera: 'checking' }));
    
    try {
      if (Capacitor.isNativePlatform()) {
        // Native platform - use Capacitor Camera
        const permissions = await Camera.requestPermissions();
        if (permissions.camera === 'granted') {
          setPermissions(prev => ({ ...prev, camera: 'granted' }));
          return true;
        } else {
          setPermissions(prev => ({ ...prev, camera: 'denied' }));
          return false;
        }
      } else {
        // Web platform
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        stream.getTracks().forEach(track => track.stop());
        setPermissions(prev => ({ ...prev, camera: 'granted' }));
        return true;
      }
    } catch (error: any) {
      console.error('Camera permission error:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissions(prev => ({ ...prev, camera: 'denied' }));
      } else if (error.name === 'NotFoundError') {
        console.error('No camera device found');
        setPermissions(prev => ({ ...prev, camera: 'denied' }));
      } else {
        setPermissions(prev => ({ ...prev, camera: 'denied' }));
      }
      return false;
    }
  }, []);

  const requestAllPermissions = useCallback(async () => {
    const [micResult, camResult] = await Promise.all([
      requestMicrophonePermission(),
      requestCameraPermission()
    ]);
    
    return {
      microphone: micResult,
      camera: camResult,
      allGranted: micResult && camResult
    };
  }, [requestMicrophonePermission, requestCameraPermission]);

  return {
    permissions,
    requestMicrophonePermission,
    requestCameraPermission,
    requestAllPermissions,
    checkWebPermissions,
    isNative: Capacitor.isNativePlatform()
  };
};