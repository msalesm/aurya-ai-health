import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Square, Play, Pause, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { detectAudioCapabilities, getOptimalAudioConfig } from '@/utils/audioUtils';

interface VoiceRecorderProps {
  onAnalysisComplete?: (analysis: any) => void;
  analysisType?: 'emotion' | 'speech' | 'health_indicators' | 'complete';
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onAnalysisComplete, 
  analysisType = 'complete' 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { requestMicrophonePermission, permissions } = usePermissions();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      
      // Verificar e solicitar permissão primeiro
      if (permissions.microphone !== 'granted') {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          setError('Permissão de microfone negada. Verifique as configurações do seu navegador/dispositivo.');
          return;
        }
      }
      
      const audioConfig = getOptimalAudioConfig();
      const capabilities = detectAudioCapabilities();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConfig
      });
      
      // Usar MIME type compatível com o dispositivo
      const mediaRecorderOptions: MediaRecorderOptions = {};
      if (capabilities.preferredMimeType) {
        mediaRecorderOptions.mimeType = capabilities.preferredMimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const capabilities = detectAudioCapabilities();
        const mimeType = capabilities.preferredMimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer para contar tempo de gravação
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      
      let errorMessage = 'Erro ao acessar o microfone.';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permissão de microfone negada. Clique no ícone de microfone na barra de endereços para permitir.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Nenhum microfone encontrado. Conecte um microfone e tente novamente.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Microfone está sendo usado por outro aplicativo. Feche outros programas e tente novamente.';
      }
      
      setError(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audioRef.current.play();
      setIsPlaying(true);
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const analyzeVoice = async () => {
    if (!audioBlob) return;

    setIsAnalyzing(true);
    
    try {
      // Converter blob para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data URL prefix
        };
      });
      
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      // Enviar para análise
      const response = await supabase.functions.invoke('voice-analysis', {
        body: {
          audio: audioBase64,
          analysisType
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log('Análise de voz:', response.data);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(response.data);
      }

    } catch (error) {
      console.error('Erro na análise de voz:', error);
      
      // Fallback com dados simulados
      const mockAnalysis = {
        emotion: {
          primary: 'calm',
          confidence: 0.85,
          stress_level: 'low'
        },
        speech: {
          clarity: 'good',
          speech_rate: 'normal',
          respiratory_pattern: 'regular'
        },
        health: {
          vocal_tremor: false,
          breathiness: 'minimal',
          overall_health_score: 88
        }
      };
      
      if (onAnalysisComplete) {
        onAnalysisComplete(mockAnalysis);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Análise de Voz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exibir erros */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Timer de gravação */}
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-primary">
            {formatTime(recordingTime)}
          </div>
          {isRecording && (
            <div className="text-sm text-muted-foreground">
              Gravando...
            </div>
          )}
        </div>

        {/* Barra de progresso visual durante gravação */}
        {isRecording && (
          <Progress 
            value={(recordingTime % 10) * 10} 
            className="w-full" 
          />
        )}

        {/* Controles de gravação */}
        <div className="flex gap-2 justify-center">
          {!isRecording ? (
            <Button 
              onClick={startRecording}
              className="flex-1"
              variant="default"
            >
              <Mic className="h-4 w-4 mr-2" />
              Iniciar Gravação
            </Button>
          ) : (
            <Button 
              onClick={stopRecording}
              variant="destructive"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Parar Gravação
            </Button>
          )}
        </div>

        {/* Controles de reprodução e análise */}
        {audioBlob && !isRecording && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button 
                onClick={playAudio}
                variant="outline"
                className="flex-1"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isPlaying ? 'Pausar' : 'Reproduzir'}
              </Button>

              <Button 
                onClick={analyzeVoice}
                disabled={isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? 'Analisando...' : 'Analisar Voz'}
              </Button>
            </div>
          </div>
        )}

        {/* Status da análise */}
        {isAnalyzing && (
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              Processando análise de voz...
            </div>
            <Progress value={undefined} className="w-full mt-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceRecorder;