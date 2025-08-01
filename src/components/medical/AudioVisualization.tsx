import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

interface AudioVisualizationProps {
  isRecording: boolean;
  audioStream?: MediaStream;
}

export const AudioVisualization: React.FC<AudioVisualizationProps> = ({
  isRecording,
  audioStream
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequency, setFrequency] = useState(0);

  useEffect(() => {
    if (isRecording && audioStream) {
      setupAudioAnalysis();
    } else {
      cleanup();
    }

    return cleanup;
  }, [isRecording, audioStream]);

  const setupAudioAnalysis = () => {
    if (!audioStream) return;

    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(audioStream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(analyser);
      analyserRef.current = analyser;
      
      startVisualization();
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }
  };

  const startVisualization = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(timeDataArray);

      // Calculate audio level
      const level = Math.max(...timeDataArray) / 255;
      setAudioLevel(level);

      // Calculate dominant frequency
      let maxIndex = 0;
      let maxValue = 0;
      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > maxValue) {
          maxValue = dataArray[i];
          maxIndex = i;
        }
      }
      const dominantFreq = (maxIndex * 44100) / (analyser.fftSize * 2);
      setFrequency(Math.round(dominantFreq));

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw waveform
      ctx.strokeStyle = 'hsl(var(--primary))';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = timeDataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();

      // Draw frequency bars
      ctx.fillStyle = 'hsl(var(--primary) / 0.6)';
      const barWidth = canvas.width / bufferLength;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.5;
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Análise de Áudio em Tempo Real</h3>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Nível: {Math.round(audioLevel * 100)}%</span>
            <span>Frequência: {frequency} Hz</span>
          </div>
        </div>
        
        <canvas
          ref={canvasRef}
          width={300}
          height={120}
          className="w-full border border-border rounded bg-background"
        />
        
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Capturando áudio...</span>
          </div>
        )}
        
        {!isRecording && (
          <div className="text-xs text-muted-foreground text-center">
            Inicie a gravação para visualizar o áudio
          </div>
        )}
      </div>
    </Card>
  );
};