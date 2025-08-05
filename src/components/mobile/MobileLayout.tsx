import React from 'react';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  safeArea?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  className,
  safeArea = true
}) => {
  const isNative = Capacitor.isNativePlatform();

  return (
    <div 
      className={cn(
        'min-h-screen w-full',
        isNative && safeArea && 'pb-safe-area-inset-bottom pt-safe-area-inset-top',
        className
      )}
    >
      {children}
    </div>
  );
};