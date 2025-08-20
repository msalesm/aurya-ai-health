import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, TrendingUp, TrendingDown } from 'lucide-react';
import { RPPGReading } from '@/utils/rppgAlgorithms';

interface RealtimeHeartDisplayProps {
  currentReading: RPPGReading | null;
  fallbackBPM: number;
  signalQuality: 'poor' | 'fair' | 'good' | 'excellent';
  isAnalyzing: boolean;
  className?: string;
}

export const RealtimeHeartDisplay: React.FC<RealtimeHeartDisplayProps> = ({
  currentReading,
  fallbackBPM,
  signalQuality,
  isAnalyzing,
  className = ''
}) => {
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([]);
  const [isBeating, setIsBeating] = useState(false);
  
  const currentBPM = currentReading?.bpm || fallbackBPM;
  const confidence = currentReading?.confidence || 0.5;

  // Trigger heart beat animation
  useEffect(() => {
    if (!isAnalyzing || !currentBPM) return;
    
    const beatInterval = 60000 / currentBPM; // milliseconds per beat
    
    const triggerBeat = () => {
      setIsBeating(true);
      setTimeout(() => setIsBeating(false), 200);
    };
    
    triggerBeat(); // Initial beat
    const interval = setInterval(triggerBeat, beatInterval);
    
    return () => clearInterval(interval);
  }, [currentBPM, isAnalyzing]);

  // Track heart rate history for trend analysis
  useEffect(() => {
    if (currentReading?.bpm) {
      setHeartRateHistory(prev => {
        const newHistory = [...prev, currentReading.bpm];
        return newHistory.slice(-10); // Keep last 10 readings
      });
    }
  }, [currentReading]);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getHeartRateTrend = () => {
    if (heartRateHistory.length < 3) return null;
    
    const recent = heartRateHistory.slice(-3);
    const trend = recent[recent.length - 1] - recent[0];
    
    if (Math.abs(trend) < 2) return null;
    return trend > 0 ? 'up' : 'down';
  };

  const getHeartRateZone = (bpm: number) => {
    if (bpm < 60) return { zone: 'Resting', color: 'text-blue-500' };
    if (bpm < 100) return { zone: 'Normal', color: 'text-green-500' };
    if (bpm < 140) return { zone: 'Elevated', color: 'text-yellow-500' };
    return { zone: 'High', color: 'text-red-500' };
  };

  const trend = getHeartRateTrend();
  const zone = getHeartRateZone(currentBPM);

  return (
    <Card className={`${className} bg-gradient-to-br from-background to-muted/20`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Heart 
              className={`h-8 w-8 text-red-500 transition-all duration-200 ${
                isBeating ? 'scale-125' : 'scale-100'
              } ${isAnalyzing ? 'animate-pulse' : ''}`} 
            />
            <div>
              <h3 className="text-lg font-semibold">Heart Rate</h3>
              <p className="text-xs text-muted-foreground">Real-time monitoring</p>
            </div>
          </div>
          
          <Badge className={getQualityColor(signalQuality)}>
            {signalQuality}
          </Badge>
        </div>

        {/* Main BPM Display */}
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold transition-all duration-300 ${
            isBeating ? 'scale-105 text-red-500' : 'scale-100 text-foreground'
          }`}>
            {isAnalyzing ? currentBPM : '--'}
          </div>
          <div className="text-lg font-medium text-muted-foreground mt-1">
            BPM
          </div>
        </div>

        {/* Heart Rate Zone and Trend */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Zone</p>
            <p className={`font-semibold ${zone.color}`}>
              {zone.zone}
            </p>
          </div>
          
          {trend && (
            <div className="flex items-center space-x-1">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-sm font-medium">
                {Math.abs(heartRateHistory[heartRateHistory.length - 1] - heartRateHistory[0])} BPM
              </span>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Confidence</p>
            <p className="font-semibold">
              {Math.round(confidence * 100)}%
            </p>
          </div>
        </div>

        {/* Heart Rate History Mini Chart */}
        {heartRateHistory.length > 1 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Trend (last 30s)</p>
            <div className="h-8 flex items-end space-x-1">
              {heartRateHistory.map((bpm, index) => {
                const maxBPM = Math.max(...heartRateHistory, 100);
                const minBPM = Math.min(...heartRateHistory, 60);
                const range = maxBPM - minBPM || 20;
                const height = ((bpm - minBPM) / range) * 100;
                
                return (
                  <div
                    key={index}
                    className="bg-primary/60 rounded-sm flex-1 transition-all duration-300"
                    style={{ height: `${Math.max(height, 10)}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className={`flex items-center justify-center space-x-2 ${
            isAnalyzing ? 'text-green-500' : 'text-muted-foreground'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isAnalyzing ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
            }`} />
            <span className="text-sm font-medium">
              {isAnalyzing ? 'Live Analysis' : 'Analysis Inactive'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};