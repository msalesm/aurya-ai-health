import { useState, useEffect } from 'react';
import { Device, DeviceInfo } from '@capacitor/device';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

interface ExtendedDeviceInfo extends DeviceInfo {
  networkStatus?: ConnectionStatus;
  isNative: boolean;
}

export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState<ExtendedDeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDeviceInfo = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const [info, networkStatus] = await Promise.all([
            Device.getInfo(),
            Network.getStatus(),
          ]);

          setDeviceInfo({
            ...info,
            networkStatus,
            isNative: true,
          });
        } else {
          // Web fallback
          setDeviceInfo({
            model: 'Web Browser',
            platform: 'web',
            operatingSystem: 'unknown',
            osVersion: navigator.userAgent,
            manufacturer: 'Browser',
            isVirtual: false,
            networkStatus: {
              connected: navigator.onLine,
              connectionType: 'unknown',
            },
            isNative: false,
          } as ExtendedDeviceInfo);
        }
      } catch (error) {
        console.error('Failed to get device info:', error);
      } finally {
        setLoading(false);
      }
    };

    getDeviceInfo();

    // Listen for network changes
    if (Capacitor.isNativePlatform()) {
      let networkListener: any;
      
      Network.addListener('networkStatusChange', (status) => {
        setDeviceInfo(prev => prev ? { ...prev, networkStatus: status } : null);
      }).then(listener => {
        networkListener = listener;
      });

      return () => {
        if (networkListener) {
          networkListener.remove();
        }
      };
    }
  }, []);

  return { deviceInfo, loading };
};