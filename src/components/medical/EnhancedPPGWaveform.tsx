import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap } from 'lucide-react';
import { RPPGReading } from '@/utils/rppgAlgorithms';

interface EnhancedPPGWaveformProps {
  currentSignal: number[];
  currentReading: RPPGReading | null;
  signalQuality: 'poor' | 'fair' | 'good' | 'excellent';
  isAnalyzing: boolean;
  className?: string;
}

export const EnhancedPPGWaveform: React.FC<EnhancedPPGWaveformProps> = ({
  currentSignal,
  currentReading,
  signalQuality,
  isAnalyzing,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  const width = 600;
  const height = 200;
  const padding = 20;

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return '#10b981'; // green-500
      case 'good': return '#3b82f6'; // blue-500
      case 'fair': return '#f59e0b'; // yellow-500
      default: return '#ef4444'; // red-500
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || currentSignal.length < 10) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = '#e5e7eb'; // gray-200
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i * (height - 2 * padding)) / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines (time markers)
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i * (width - 2 * padding)) / 10;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Reset line dash
    ctx.setLineDash([]);

    // Prepare signal data
    const displayPoints = Math.min(currentSignal.length, 300); // 10 seconds at 30fps
    const signal = currentSignal.slice(-displayPoints);
    
    if (signal.length < 2) return;

    // Find signal range
    const maxVal = Math.max(...signal);
    const minVal = Math.min(...signal);
    const range = maxVal - minVal || 1;

    // Draw PPG waveform
    ctx.strokeStyle = getQualityColor(signalQuality);
    ctx.lineWidth = 2;
    ctx.beginPath();

    signal.forEach((value, index) => {
      const x = padding + ((index / (signal.length - 1)) * (width - 2 * padding));
      const y = height - padding - ((value - minVal) / range) * (height - 2 * padding);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Detect and highlight peaks (heartbeats)
    if (currentReading?.bpm && currentReading.bpm > 40) {
      const peakThreshold = minVal + (range * 0.7);
      const minPeakDistance = Math.floor(60 / (currentReading.bpm / 60) * 30 * 0.8); // Minimum samples between peaks
      
      let lastPeakIndex = -minPeakDistance;
      
      signal.forEach((value, index) => {
        if (value > peakThreshold && index - lastPeakIndex >= minPeakDistance) {
          // Check if this is a local maximum
          const prevValue = signal[index - 1] || value;
          const nextValue = signal[index + 1] || value;
          
          if (value >= prevValue && value >= nextValue) {
            const x = padding + ((index / (signal.length - 1)) * (width - 2 * padding));
            const y = height - padding - ((value - minVal) / range) * (height - 2 * padding);
            
            // Draw peak marker
            ctx.fillStyle = '#ef4444'; // red-500
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw peak line
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
            ctx.setLineDash([]);
            
            lastPeakIndex = index;
          }
        }
      });
    }

    // Draw current value indicator (right edge)
    if (signal.length > 0) {
      const currentValue = signal[signal.length - 1];
      const x = width - padding;
      const y = height - padding - ((currentValue - minVal) / range) * (height - 2 * padding);
      
      ctx.fillStyle = getQualityColor(signalQuality);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add glow effect if analyzing
      if (isAnalyzing) {
        ctx.fillStyle = getQualityColor(signalQuality) + '40'; // 25% opacity
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw axis labels
    ctx.fillStyle = '#6b7280'; // gray-500
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    
    // Time labels (bottom axis)
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i * (width - 2 * padding)) / 5;
      const timeLabel = `${i * 2}s`;
      ctx.fillText(timeLabel, x, height - 5);
    }
    
    // Amplitude labels (left axis)
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i * (height - 2 * padding)) / 4;
      const amplitudeLabel = ((1 - i / 4) * 100).toFixed(0) + '%';
      ctx.fillText(amplitudeLabel, padding - 5, y + 4);
    }
  };

  const animate = () => {
    drawWaveform();
    if (isAnalyzing) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    drawWaveform();
    if (isAnalyzing) {
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentSignal, currentReading, signalQuality, isAnalyzing]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>PPG Signal Analysis</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Badge className={`${getQualityColor(signalQuality)} text-white`}>
              {signalQuality}
            </Badge>
            {currentReading && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>SNR: {currentReading.snr.toFixed(1)}dB</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <canvas
            ref={canvasRef}
            className="w-full border border-border rounded bg-background"
            width={width}
            height={height}
          />
          
          {/* Signal Statistics */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-2 bg-muted/50 rounded">
              <p className="text-muted-foreground">Data Points</p>
              <p className="font-semibold">{currentSignal.length}</p>
            </div>
            
            <div className="text-center p-2 bg-muted/50 rounded">
              <p className="text-muted-foreground">Sample Rate</p>
              <p className="font-semibold">30 Hz</p>
            </div>
            
            <div className="text-center p-2 bg-muted/50 rounded">
              <p className="text-muted-foreground">Duration</p>
              <p className="font-semibold">{(currentSignal.length / 30).toFixed(1)}s</p>
            </div>
          </div>
          
          {/* Analysis Status */}
          <div className="flex items-center justify-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              isAnalyzing ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
            }`} />
            <span className={isAnalyzing ? 'text-green-600' : 'text-muted-foreground'}>
              {isAnalyzing ? 'Real-time Analysis Active' : 'Analysis Paused'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};