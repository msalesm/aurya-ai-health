import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CircularProgressTimerProps {
  progress: number; // 0-100
  duration: number; // total duration in seconds
  isActive: boolean;
  className?: string;
}

export const CircularProgressTimer: React.FC<CircularProgressTimerProps> = ({
  progress,
  duration,
  isActive,
  className = ''
}) => {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const timeRemaining = Math.ceil(duration - (progress / 100) * duration);
  const timeElapsed = Math.floor((progress / 100) * duration);

  const getProgressColor = () => {
    if (progress < 33) return 'hsl(var(--destructive))'; // red
    if (progress < 66) return 'hsl(var(--warning))'; // yellow
    return 'hsl(var(--success))'; // green
  };

  return (
    <div className={`relative flex flex-col items-center space-y-2 ${className}`}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          className={`transform -rotate-90 ${isActive ? 'animate-pulse' : ''}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.3}
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getProgressColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        
        {/* Timer text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-foreground">
            {timeRemaining}s
          </div>
          <div className="text-xs text-muted-foreground">
            remaining
          </div>
        </div>
      </div>
      
      {/* Progress indicators */}
      <div className="flex items-center space-x-2">
        <Badge variant={progress >= 33 ? 'default' : 'outline'}>
          10s
        </Badge>
        <Badge variant={progress >= 66 ? 'default' : 'outline'}>
          20s
        </Badge>
        <Badge variant={progress >= 100 ? 'default' : 'outline'}>
          30s
        </Badge>
      </div>
      
      {/* Status text */}
      <div className="text-center">
        <p className="text-sm font-medium">
          {timeElapsed}s / {duration}s
        </p>
        <p className="text-xs text-muted-foreground">
          {isActive ? 'Analyzing facial telemetry...' : 'Analysis complete'}
        </p>
      </div>
    </div>
  );
};