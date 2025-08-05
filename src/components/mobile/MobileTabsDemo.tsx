import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileOptimizedCamera } from './MobileOptimizedCamera';
import { DeviceInfoCard } from './DeviceInfoCard';
import { NotificationManager } from './NotificationManager';
import { Smartphone, Camera, Bell } from 'lucide-react';

export const MobileTabsDemo: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Funcionalidades Mobile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="camera" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Câmera
            </TabsTrigger>
            <TabsTrigger value="device" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Dispositivo
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="mt-6">
            <MobileOptimizedCamera 
              analysisType="facial"
              onAnalysisComplete={(results) => {
                console.log('Análise completa:', results);
              }}
            />
          </TabsContent>

          <TabsContent value="device" className="mt-6">
            <DeviceInfoCard />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationManager />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};