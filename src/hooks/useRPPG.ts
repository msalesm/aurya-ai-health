import { useRef, useState, useCallback, useEffect } from 'react';
import { RPPGAnalyzer, RPPGReading, ROICoordinates } from '@/utils/rppgAlgorithms';

interface UseRPPGOptions {
  onHeartRateUpdate?: (reading: RPPGReading) => void;
  analysisInterval?: number; // milliseconds
  captureInterval?: number; // milliseconds
}

interface UseRPPGReturn {
  isAnalyzing: boolean;
  currentReading: RPPGReading | null;
  bufferProgress: number;
  lightingCondition: 'too_dark' | 'too_bright' | 'good';
  movementDetected: boolean;
  signalQuality: 'poor' | 'fair' | 'good' | 'excellent';
  currentSignal: number[];
  startAnalysis: (videoElement: HTMLVideoElement) => Promise<boolean>;
  stopAnalysis: () => void;
  getROI: () => ROICoordinates | null;
  resetAnalysis: () => void;
}

export const useRPPG = (options: UseRPPGOptions = {}): UseRPPGReturn => {
  const {
    onHeartRateUpdate,
    analysisInterval = 1000, // Analyze every 1 second
    captureInterval = 33 // Capture at ~30fps
  } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentReading, setCurrentReading] = useState<RPPGReading | null>(null);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [lightingCondition, setLightingCondition] = useState<'too_dark' | 'too_bright' | 'good'>('good');
  const [movementDetected, setMovementDetected] = useState(false);
  const [signalQuality, setSignalQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('poor');
  const [currentSignal, setCurrentSignal] = useState<number[]>([]);
  const [currentROI, setCurrentROI] = useState<ROICoordinates | null>(null);

  const analyzerRef = useRef<RPPGAnalyzer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousRGBRef = useRef<{ r: number, g: number, b: number } | null>(null);

  // Initialize canvas for video processing
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    return canvasRef.current;
  }, []);

  // Capture frame and extract RGB data
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !analyzerRef.current) return;

    const canvas = initializeCanvas();
    const roi = RPPGAnalyzer.detectFaceROI(videoRef.current, canvas);
    
    if (!roi) return;
    
    setCurrentROI(roi);
    
    const rgb = RPPGAnalyzer.extractRGBFromROI(canvas, roi);
    if (!rgb) return;

    // Check lighting conditions
    const lighting = RPPGAnalyzer.assessLightingConditions(rgb);
    setLightingCondition(lighting);

    // Detect movement
    if (previousRGBRef.current) {
      const movement = RPPGAnalyzer.detectMovement(previousRGBRef.current, rgb);
      setMovementDetected(movement);
    }
    previousRGBRef.current = rgb;

    // Add reading to analyzer
    analyzerRef.current.addReading(rgb);
    
    // Update buffer progress
    const progress = analyzerRef.current.getBufferProgress();
    setBufferProgress(progress);

    // Update signal visualization
    const signal = analyzerRef.current.getLatestSignal();
    setCurrentSignal(signal);
  }, [initializeCanvas]);

  // Perform heart rate analysis
  const performAnalysis = useCallback(() => {
    if (!analyzerRef.current) return;

    const reading = analyzerRef.current.analyzeHeartRate();
    if (reading) {
      setCurrentReading(reading);
      setSignalQuality(reading.quality);
      
      if (onHeartRateUpdate) {
        onHeartRateUpdate(reading);
      }
    }
  }, [onHeartRateUpdate]);

  // Start rPPG analysis
  const startAnalysis = useCallback(async (videoElement: HTMLVideoElement): Promise<boolean> => {
    try {
      // Initialize analyzer
      analyzerRef.current = new RPPGAnalyzer();
      videoRef.current = videoElement;
      
      // Reset state
      setCurrentReading(null);
      setBufferProgress(0);
      setSignalQuality('poor');
      setCurrentSignal([]);
      previousRGBRef.current = null;

      // Start capture interval
      captureIntervalRef.current = setInterval(captureFrame, captureInterval);
      
      // Start analysis interval
      analysisIntervalRef.current = setInterval(performAnalysis, analysisInterval);
      
      setIsAnalyzing(true);
      return true;
    } catch (error) {
      console.error('Failed to start rPPG analysis:', error);
      return false;
    }
  }, [captureFrame, performAnalysis, captureInterval, analysisInterval]);

  // Stop rPPG analysis
  const stopAnalysis = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    setIsAnalyzing(false);
    videoRef.current = null;
  }, []);

  // Reset analysis state
  const resetAnalysis = useCallback(() => {
    if (analyzerRef.current) {
      analyzerRef.current.clearBuffer();
    }
    
    setCurrentReading(null);
    setBufferProgress(0);
    setSignalQuality('poor');
    setCurrentSignal([]);
    setCurrentROI(null);
    previousRGBRef.current = null;
  }, []);

  // Get current ROI for visualization
  const getROI = useCallback(() => currentROI, [currentROI]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, [stopAnalysis]);

  return {
    isAnalyzing,
    currentReading,
    bufferProgress,
    lightingCondition,
    movementDetected,
    signalQuality,
    currentSignal,
    startAnalysis,
    stopAnalysis,
    getROI,
    resetAnalysis
  };
};