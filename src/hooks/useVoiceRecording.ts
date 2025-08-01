import { useState, useRef, useCallback } from 'react';

interface VoiceRecordingHook {
  isRecording: boolean;
  isProcessing: boolean;
  audioData: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  analyzeVoice: (apiKey: string) => Promise<any>;
  error: string | null;
}

export const useVoiceRecording = (): VoiceRecordingHook => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioData, setAudioData] = useState<Blob | null>(null);
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
        setAudioData(audioBlob);

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

  const analyzeVoice = useCallback(async (apiKey: string) => {
    if (!audioData) {
      throw new Error('Nenhum áudio disponível para análise');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Cria o formData com o áudio e o modelo
      const formData = new FormData();
      formData.append("file", audioData, "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "pt");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na transcrição: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Transcrição:", data.text);
      
      return {
        success: true,
        analysis: {
          transcription: data.text,
          emotionalTone: 'neutral',
          confidence: 0.8
        }
      };

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