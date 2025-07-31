import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { RPPGReading, ROICoordinates } from '@/utils/rppgAlgorithms';

interface RPPGVisualizationProps {
  currentReading: RPPGReading | null;
  bufferProgress: number;
  lightingCondition: 'too_dark' | 'too_bright' | 'good';
  movementDetected: boolean;
  signalQuality: 'poor' | 'fair' | 'good' | 'excellent';
  currentSignal: number[];
  roi: ROICoordinates | null;
  isAnalyzing: boolean;
}

export const RPPGVisualization: React.FC<RPPGVisualizationProps> = ({
  currentReading,
  bufferProgress,
  lightingCondition,
  movementDetected,
  signalQuality,
  currentSignal,
  roi,
  isAnalyzing
}) => {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getLightingIcon = () => {
    switch (lightingCondition) {
      case 'too_dark': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'too_bright': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const renderSignalWave = () => {
    if (currentSignal.length < 10) return null;

    const width = 300;
    const height = 60;
    const points = currentSignal.slice(-60); // Last 2 seconds
    
    const maxVal = Math.max(...points, 1);
    const minVal = Math.min(...points, -1);
    const range = maxVal - minVal || 1;
    
    const pathData = points.map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((value - minVal) / range) * height;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');

    return (
      <div className="flex flex-col items-center space-y-2">
        <p className="text-sm text-muted-foreground">PPG Signal</p>
        <svg width={width} height={height} className="border rounded bg-card">
          <path
            d={pathData}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            className="animate-pulse"
          />
        </svg>
      </div>
    );
  };

  const renderROIOverlay = () => {
    if (!roi) return null;

    return (
      <div className="text-xs text-muted-foreground">
        ROI: {roi.width}×{roi.height} px at ({roi.x}, {roi.y})
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Heart Rate Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Heart className={`h-5 w-5 ${currentReading?.bpm ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
            <span>Real-time Heart Rate</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-3xl font-bold text-primary">
                {currentReading?.bpm || '--'} <span className="text-lg font-normal">BPM</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getQualityColor(signalQuality)}>
                  {signalQuality}
                </Badge>
                {currentReading && (
                  <span className="text-sm text-muted-foreground">
                    {Math.round((currentReading.confidence || 0) * 100)}% confidence
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-right space-y-2">
              <div className="flex items-center space-x-1">
                {getLightingIcon()}
                <span className="text-sm capitalize">
                  {lightingCondition.replace('_', ' ')}
                </span>
              </div>
              {movementDetected && (
                <Badge variant="outline" className="text-yellow-600">
                  Movement detected
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buffer Progress */}
      {isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Signal Buffer</span>
                <span>{Math.round(bufferProgress * 100)}%</span>
              </div>
              <Progress value={bufferProgress * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {bufferProgress < 1 ? 'Building signal buffer...' : 'Analyzing heart rate...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signal Visualization */}
      {currentSignal.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>PPG Signal Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderSignalWave()}
            
            {currentReading && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">SNR:</span>
                  <span className="ml-2 font-mono">{currentReading.snr.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Quality:</span>
                  <span className="ml-2 capitalize">{currentReading.quality}</span>
                </div>
              </div>
            )}
            
            {renderROIOverlay()}
          </CardContent>
        </Card>
      )}

      {/* Analysis Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Analysis Status</span>
            <Badge variant={isAnalyzing ? 'default' : 'secondary'}>
              {isAnalyzing ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div>• Face detection: {roi ? 'Active' : 'Searching...'}</div>
            <div>• Signal quality: {signalQuality}</div>
            <div>• Lighting: {lightingCondition.replace('_', ' ')}</div>
            <div>• Movement: {movementDetected ? 'Detected' : 'Stable'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};