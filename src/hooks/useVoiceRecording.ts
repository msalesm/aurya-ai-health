import { useState, useRef, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';

interface VoiceRecordingHook {
  isRecording: boolean;
  isProcessing: boolean;
  audioData: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  analyzeVoice: () => Promise<any>;
  error: string | null;
}

export const useVoiceRecording = (): VoiceRecordingHook => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Converter para base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setAudioData(base64Audio);
        };
        reader.readAsDataURL(audioBlob);

        // Parar todas as faixas de áudio
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(100); // Capturar dados a cada 100ms
      setIsRecording(true);

    } catch (err) {
      setError('Erro ao acessar o microfone. Verifique as permissões.');
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

    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke('hybrid-voice-analysis', {
        body: {
          audioData: audioData,
          userId: user.id,
          preferredProvider: 'hybrid'
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro na análise de voz');
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro desconhecido na análise');
      }

      console.log('Análise híbrida de voz concluída:', response.data.analysis);
      return response.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na análise';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [audioData, user]);

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