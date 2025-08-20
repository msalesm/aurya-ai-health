import React, { useEffect, useRef } from 'react';
import { ROICoordinates } from '@/utils/rppgAlgorithms';

interface FacialMaskOverlayProps {
  videoElement: HTMLVideoElement | null;
  roi: ROICoordinates | null;
  faceDetected: boolean;
  signalQuality: 'poor' | 'fair' | 'good' | 'excellent';
  className?: string;
}

interface CoordinateTransform {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

export const FacialMaskOverlay: React.FC<FacialMaskOverlayProps> = ({
  videoElement,
  roi,
  faceDetected,
  signalQuality,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return '#10b981'; // green-500
      case 'good': return '#3b82f6'; // blue-500
      case 'fair': return '#f59e0b'; // yellow-500
      default: return '#ef4444'; // red-500
    }
  };

  const calculateCoordinateTransform = (videoElement: HTMLVideoElement): CoordinateTransform => {
    const videoRect = videoElement.getBoundingClientRect();
    const videoNativeWidth = videoElement.videoWidth;
    const videoNativeHeight = videoElement.videoHeight;
    
    // Calculate the aspect ratios
    const nativeRatio = videoNativeWidth / videoNativeHeight;
    const displayRatio = videoRect.width / videoRect.height;
    
    let scaleX: number, scaleY: number, offsetX = 0, offsetY = 0;
    
    if (nativeRatio > displayRatio) {
      // Native video is wider than display - video is cropped horizontally
      scaleY = videoRect.height / videoNativeHeight;
      scaleX = scaleY;
      
      const scaledNativeWidth = videoNativeWidth * scaleX;
      offsetX = (scaledNativeWidth - videoRect.width) / 2;
    } else {
      // Native video is taller than display - video is cropped vertically  
      scaleX = videoRect.width / videoNativeWidth;
      scaleY = scaleX;
      
      const scaledNativeHeight = videoNativeHeight * scaleY;
      offsetY = (scaledNativeHeight - videoRect.height) / 2;
    }
    
    return { scaleX, scaleY, offsetX, offsetY };
  };

  const transformROI = (roi: ROICoordinates, transform: CoordinateTransform): ROICoordinates => {
    return {
      x: (roi.x * transform.scaleX) - transform.offsetX,
      y: (roi.y * transform.scaleY) - transform.offsetY,
      width: roi.width * transform.scaleX,
      height: roi.height * transform.scaleY
    };
  };

  const drawFacialMask = () => {
    if (!canvasRef.current || !videoElement) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video element's display size
    const videoRect = videoElement.getBoundingClientRect();
    canvas.width = videoRect.width;
    canvas.height = videoRect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (faceDetected && roi) {
      // Transform ROI coordinates from native to display coordinates
      const transform = calculateCoordinateTransform(videoElement);
      const displayROI = transformROI(roi, transform);
      
      // Ensure ROI is within canvas bounds
      if (displayROI.x < 0 || displayROI.y < 0 || 
          displayROI.x + displayROI.width > canvas.width || 
          displayROI.y + displayROI.height > canvas.height) {
        // ROI is outside visible area, show search indication instead
        drawSearchIndication(ctx, canvas);
        return;
      }
      
      const color = getQualityColor(signalQuality);
      
      // Draw facial contour outline
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      
      // Draw elliptical face outline
      const centerX = displayROI.x + displayROI.width / 2;
      const centerY = displayROI.y + displayROI.height / 2;
      const radiusX = displayROI.width * 0.8;
      const radiusY = displayROI.height * 1.4;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw ROI rectangle for analysis area
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(displayROI.x, displayROI.y, displayROI.width, displayROI.height);
      
      // Add corner indicators
      const cornerSize = Math.min(20, displayROI.width * 0.15, displayROI.height * 0.15);
      ctx.setLineDash([]);
      ctx.lineWidth = 3;
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(displayROI.x, displayROI.y + cornerSize);
      ctx.lineTo(displayROI.x, displayROI.y);
      ctx.lineTo(displayROI.x + cornerSize, displayROI.y);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(displayROI.x + displayROI.width - cornerSize, displayROI.y);
      ctx.lineTo(displayROI.x + displayROI.width, displayROI.y);
      ctx.lineTo(displayROI.x + displayROI.width, displayROI.y + cornerSize);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(displayROI.x, displayROI.y + displayROI.height - cornerSize);
      ctx.lineTo(displayROI.x, displayROI.y + displayROI.height);
      ctx.lineTo(displayROI.x + cornerSize, displayROI.y + displayROI.height);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(displayROI.x + displayROI.width - cornerSize, displayROI.y + displayROI.height);
      ctx.lineTo(displayROI.x + displayROI.width, displayROI.y + displayROI.height);
      ctx.lineTo(displayROI.x + displayROI.width, displayROI.y + displayROI.height - cornerSize);
      ctx.stroke();
      
      // Add quality indicator text
      ctx.fillStyle = color;
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Signal: ${signalQuality.toUpperCase()}`,
        centerX,
        displayROI.y - 10
      );
    } else {
      drawSearchIndication(ctx, canvas);
    }
  };

  const drawSearchIndication = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Draw search indication
    ctx.strokeStyle = '#6b7280'; // gray-500
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 10]);
    
    const searchX = canvas.width * 0.35;
    const searchY = canvas.height * 0.2;
    const searchWidth = canvas.width * 0.3;
    const searchHeight = canvas.height * 0.4;
    
    ctx.strokeRect(searchX, searchY, searchWidth, searchHeight);
    
    // Add search text
    ctx.fillStyle = '#6b7280';
    ctx.font = '18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Position your face in the frame',
      canvas.width / 2,
      searchY - 20
    );
  };

  const animate = () => {
    drawFacialMask();
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (videoElement && canvasRef.current) {
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoElement, roi, faceDetected, signalQuality]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ 
        zIndex: 10,
        width: '100%',
        height: '100%'
      }}
    />
  );
};