import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { Skeleton } from '@/components/ui/skeleton';

export const DeviceInfoCard: React.FC = () => {
  const { deviceInfo, loading } = useDeviceInfo();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Informações do Dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!deviceInfo) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Informações do Dispositivo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">Plataforma</p>
            <p className="capitalize">{deviceInfo.platform}</p>
          </div>
          
          <div>
            <p className="font-medium text-muted-foreground">Modelo</p>
            <p>{deviceInfo.model}</p>
          </div>
          
          <div>
            <p className="font-medium text-muted-foreground">Sistema</p>
            <p>{deviceInfo.operatingSystem} {deviceInfo.osVersion}</p>
          </div>
          
          <div>
            <p className="font-medium text-muted-foreground">Fabricante</p>
            <p>{deviceInfo.manufacturer}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={deviceInfo.isNative ? 'default' : 'secondary'}>
            {deviceInfo.isNative ? 'App Nativo' : 'Web App'}
          </Badge>
          
          {deviceInfo.networkStatus && (
            <Badge variant={deviceInfo.networkStatus.connected ? 'default' : 'destructive'}>
              {deviceInfo.networkStatus.connected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Conectado
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Desconectado
                </>
              )}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};