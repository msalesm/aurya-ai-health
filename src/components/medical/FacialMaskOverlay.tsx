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
      // Ajustar offset vertical para melhor alinhamento com o rosto
      offsetY = (scaledNativeHeight - videoRect.height) / 2 - (videoRect.height * 0.05);
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

      // Criar overlay com gradiente radial elegante
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calcular centro e dimensões do oval orgânico
      const centerX = displayROI.x + displayROI.width / 2;
      const centerY = displayROI.y + displayROI.height / 2;
      const baseRadiusX = displayROI.width / 2;
      const baseRadiusY = displayROI.height / 2;
      
      // Ajustar forma oval vertical (formato face humana - proporção 1.6:1)
      const radiusX = baseRadiusX + 20;
      const radiusY = baseRadiusY + 70;
      
      // Criar máscara suave com múltiplas camadas
      const qualityColor = getQualityColor(signalQuality);
      
      // Camada externa - sombra suave
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 5; i >= 0; i--) {
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX + i * 8, radiusY + i * 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Área principal transparente
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Restaurar modo de desenho
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      
      // Borda principal elegante com gradiente
      const borderGradient = ctx.createLinearGradient(
        centerX - radiusX, centerY - radiusY,
        centerX + radiusX, centerY + radiusY
      );
      borderGradient.addColorStop(0, qualityColor);
      borderGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      borderGradient.addColorStop(1, qualityColor);
      
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 3;
      ctx.shadowColor = qualityColor;
      ctx.shadowBlur = 10;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Remover sombra para próximos desenhos
      ctx.shadowBlur = 0;
      
      // Guias de alinhamento estilo banking app
      const cornerSize = 25;
      const cornerThickness = 4;
      const cornerOffset = radiusX * 0.75;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = cornerThickness;
      ctx.lineCap = 'round';
      
      // Cantos arredondados nas 4 direções
      const corners = [
        { x: centerX - cornerOffset, y: centerY - radiusY * 0.5, angles: [0, Math.PI/2] },
        { x: centerX + cornerOffset, y: centerY - radiusY * 0.5, angles: [Math.PI/2, Math.PI] },
        { x: centerX - cornerOffset, y: centerY + radiusY * 0.5, angles: [Math.PI, 3*Math.PI/2] },
        { x: centerX + cornerOffset, y: centerY + radiusY * 0.5, angles: [3*Math.PI/2, 2*Math.PI] }
      ];
      
      corners.forEach(corner => {
        ctx.beginPath();
        ctx.moveTo(corner.x - cornerSize/2, corner.y);
        ctx.lineTo(corner.x + cornerSize/2, corner.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(corner.x, corner.y - cornerSize/2);
        ctx.lineTo(corner.x, corner.y + cornerSize/2);
        ctx.stroke();
      });

      // Texto de qualidade do sinal com fundo semi-transparente
      ctx.font = 'bold 16px system-ui';
      const text = `Signal: ${signalQuality.toUpperCase()}`;
      const textMetrics = ctx.measureText(text);
      const textX = centerX;
      const textY = centerY + radiusY + 40;
      
      // Fundo do texto
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        textX - textMetrics.width / 2 - 10,
        textY - 20,
        textMetrics.width + 20,
        30
      );
      
      // Texto
      ctx.fillStyle = qualityColor;
      ctx.textAlign = 'center';
      ctx.fillText(text, textX, textY - 5);
    } else {
      drawSearchIndication(ctx, canvas);
    }
  };

  const drawSearchIndication = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Gradiente radial elegante para busca
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const searchGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, Math.max(canvas.width, canvas.height) / 2
    );
    searchGradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)'); // blue-500 suave
    searchGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.6)');
    searchGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    
    ctx.fillStyle = searchGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Oval de busca vertical (proporção face humana 1.5:1)
    const radiusX = canvas.width * 0.15;
    const radiusY = canvas.width * 0.225;
    
    // Múltiplas camadas para efeito suave
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 4; i >= 0; i--) {
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX + i * 6, radiusY + i * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Área central completamente transparente
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalCompositeOperation = 'source-over';
    
    // Borda pulsante com gradiente
    const time = Date.now() * 0.003;
    const pulseSize = Math.sin(time) * 3 + 3;
    
    const borderGradient = ctx.createLinearGradient(
      centerX - radiusX, centerY - radiusY,
      centerX + radiusX, centerY + radiusY
    );
    borderGradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    borderGradient.addColorStop(0.5, 'rgba(147, 197, 253, 1)'); // blue-300
    borderGradient.addColorStop(1, 'rgba(59, 130, 246, 0.8)');
    
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3 + pulseSize;
    ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // Indicadores de canto estilo banking
    const cornerLength = 30;
    const cornerWidth = 4;
    const cornerRadius = Math.min(radiusX, radiusY) * 0.8;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = cornerWidth;
    ctx.lineCap = 'round';
    
    // 4 cantos com linhas em L
    const cornerPositions = [
      { x: centerX - cornerRadius * 0.7, y: centerY - cornerRadius * 0.5 }, // top-left
      { x: centerX + cornerRadius * 0.7, y: centerY - cornerRadius * 0.5 }, // top-right  
      { x: centerX - cornerRadius * 0.7, y: centerY + cornerRadius * 0.5 }, // bottom-left
      { x: centerX + cornerRadius * 0.7, y: centerY + cornerRadius * 0.5 }  // bottom-right
    ];
    
    cornerPositions.forEach((pos, index) => {
      const isLeft = index % 2 === 0;
      const isTop = index < 2;
      
      // Linha horizontal
      ctx.beginPath();
      ctx.moveTo(pos.x + (isLeft ? -cornerLength/2 : -cornerLength/2), pos.y);
      ctx.lineTo(pos.x + (isLeft ? cornerLength/2 : cornerLength/2), pos.y);
      ctx.stroke();
      
      // Linha vertical
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y + (isTop ? -cornerLength/2 : -cornerLength/2));
      ctx.lineTo(pos.x, pos.y + (isTop ? cornerLength/2 : cornerLength/2));
      ctx.stroke();
    });
    
    // Texto instrucional moderno
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, system-ui';
    const mainText = 'Posicione seu rosto';
    const subText = 'Centralize dentro do oval';
    
    const mainMetrics = ctx.measureText(mainText);
    const subMetrics = ctx.measureText(subText);
    const textY = centerY + radiusY + 60;
    
    // Fundo moderno para o texto - usando fillRect simples em vez de roundRect  
    const textBgWidth = Math.max(mainMetrics.width, subMetrics.width) + 40;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(centerX - textBgWidth/2, textY - 40, textBgWidth, 70);
    
    // Texto principal
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(mainText, centerX, textY - 10);
    
    // Subtexto
    ctx.font = '16px -apple-system, BlinkMacSystemFont, system-ui';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(subText, centerX, textY + 15);
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