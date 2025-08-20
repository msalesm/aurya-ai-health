import React, { useEffect, useRef } from 'react';
import { ROICoordinates } from '@/utils/rppgAlgorithms';

interface FacialMaskOverlayProps {
  videoElement: HTMLVideoElement | null;
  roi: ROICoordinates | null;
  faceDetected: boolean;
  signalQuality: 'poor' | 'fair' | 'good' | 'excellent';
  className?: string;
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

  const drawFacialMask = () => {
    if (!canvasRef.current || !videoElement || !roi) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (faceDetected && roi) {
      const color = getQualityColor(signalQuality);
      
      // Draw facial contour outline
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      
      // Draw elliptical face outline
      const centerX = roi.x + roi.width / 2;
      const centerY = roi.y + roi.height / 2;
      const radiusX = roi.width * 0.6;
      const radiusY = roi.height * 1.2;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw ROI rectangle for analysis area
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(roi.x, roi.y, roi.width, roi.height);
      
      // Add corner indicators
      const cornerSize = 20;
      ctx.setLineDash([]);
      ctx.lineWidth = 3;
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(roi.x, roi.y + cornerSize);
      ctx.lineTo(roi.x, roi.y);
      ctx.lineTo(roi.x + cornerSize, roi.y);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(roi.x + roi.width - cornerSize, roi.y);
      ctx.lineTo(roi.x + roi.width, roi.y);
      ctx.lineTo(roi.x + roi.width, roi.y + cornerSize);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(roi.x, roi.y + roi.height - cornerSize);
      ctx.lineTo(roi.x, roi.y + roi.height);
      ctx.lineTo(roi.x + cornerSize, roi.y + roi.height);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(roi.x + roi.width - cornerSize, roi.y + roi.height);
      ctx.lineTo(roi.x + roi.width, roi.y + roi.height);
      ctx.lineTo(roi.x + roi.width, roi.y + roi.height - cornerSize);
      ctx.stroke();
      
      // Add quality indicator text
      ctx.fillStyle = color;
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Signal: ${signalQuality.toUpperCase()}`,
        centerX,
        roi.y - 10
      );
    } else {
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
    }
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
      style={{ zIndex: 10 }}
    />
  );
};