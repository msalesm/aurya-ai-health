import { useState, useRef, useCallback } from 'react';
import { usePermissions } from './usePermissions';
import { detectAudioCapabilities, getOptimalAudioConfig } from '../utils/audioUtils';

interface VoiceRecordingHook {
  isRecording: boolean;
  isProcessing: boolean;
  audioData: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  analyzeVoice: () => Promise<any>;
  error: string | null;
}

export const useVoiceRecording = (): VoiceRecordingHook => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { requestMicrophonePermission, permissions } = usePermissions();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Verificar e solicitar permissão primeiro
      if (permissions.microphone !== 'granted') {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          throw new Error('Permissão de microfone negada. Verifique as configurações do seu navegador/dispositivo.');
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

      mediaRecorderRef.current = new MediaRecorder(stream, mediaRecorderOptions);

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const mimeType = capabilities.preferredMimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioData(audioBlob);

        // Parar todas as faixas de áudio
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(100); // Capturar dados a cada 100ms
      setIsRecording(true);

    } catch (err: any) {
      let errorMessage = 'Erro ao acessar o microfone.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permissão de microfone negada. Clique no ícone de microfone na barra de endereços para permitir.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Nenhum microfone encontrado. Conecte um microfone e tente novamente.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Microfone está sendo usado por outro aplicativo. Feche outros programas e tente novamente.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Erro ao iniciar gravação:', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const analyzeVoice = useCallback(async () => {
    if (!audioData) {
      throw new Error('Nenhum áudio disponível para análise');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Converter audioData (Blob) para base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioData);
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('voice-analysis-whisper', {
        body: {
          audioData: base64Audio,
          userId: 'anonymous-user',
          consultationId: Date.now().toString()
        }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro na análise de voz');
      }

      console.log("Análise concluída:", data.analysis);
      
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na análise';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [audioData]);

  return {
    isRecording,
    isProcessing,
    audioData,
    startRecording,
    stopRecording,
    analyzeVoice,
    error
  };
};