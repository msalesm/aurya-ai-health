import { useState, useRef, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useRealAudioAnalysis } from './useRealAudioAnalysis';

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
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  
  const { analyzeRealAudio } = useRealAudioAnalysis();

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        audioBlobRef.current = audioBlob;
        
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
    if (!audioBlobRef.current) {
      throw new Error('Nenhum áudio disponível para análise');
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Iniciando análise com a versão melhorada da edge function...');
      
      // 1. Análise de características reais do áudio (mantida para comparação)
      const realAudioAnalysis = await analyzeRealAudio(audioBlobRef.current);
      console.log('Análise de áudio real:', realAudioAnalysis);

      // 2. Preparar FormData para nova edge function
      const formData = new FormData();
      formData.append('audio', audioBlobRef.current, 'audio.webm');
      formData.append('user_id', 'demo-user-id'); // TODO: usar ID real do usuário autenticado
      formData.append('session_duration', Math.floor(audioBlobRef.current.size / 8000).toString());

      // 3. Chamar a edge function melhorada usando supabase client
      const response = await supabase.functions.invoke('voice-analysis', {
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro na análise de voz');
      }

      const analysisResult = response.data;
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Falha na análise');
      }

      // 4. Combinar com análise real de áudio
      const combinedAnalysis = {
        transcription: analysisResult.transcription,
        emotional_tone: analysisResult.emotional_tone,
        stress_indicators: analysisResult.stress_indicators,
        psychological_analysis: analysisResult.psychological_analysis,
        voice_metrics: analysisResult.voice_metrics,
        confidence_score: analysisResult.confidence_score,
        real_audio_features: realAudioAnalysis.features,
        analysis_timestamp: new Date().toISOString(),
        analysis_method: 'enhanced_voice_analysis_with_database_persistence'
      };

      console.log('Análise completa:', combinedAnalysis);
      
      return {
        success: true,
        analysis: combinedAnalysis,
        health_indicators: generateHealthIndicators(combinedAnalysis)
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na análise';
      setError(errorMessage);
      console.error('Erro na análise de voz:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [analyzeRealAudio]);

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

function generateHealthIndicators(analysis: any) {
  const indicators = [];

  if (analysis.stress_indicators.stress_level > 6) {
    indicators.push({
      type: 'stress',
      concern: 'Nível elevado de stress vocal detectado',
      recommendation: 'Considerar técnicas de relaxamento',
      confidence: analysis.confidence_score
    });
  }

  if (analysis.emotional_tone.primary_emotion === 'anxiety') {
    indicators.push({
      type: 'psychological',
      concern: 'Sinais de ansiedade na análise vocal',
      recommendation: 'Avaliação psicológica recomendada',
      confidence: analysis.emotional_tone.confidence
    });
  }

  if (analysis.respiratory_analysis.irregularity_detected) {
    indicators.push({
      type: 'respiratory',
      concern: 'Padrão respiratório irregular detectado',
      recommendation: 'Monitorar função respiratória',
      confidence: 0.7
    });
  }

  if (analysis.stress_indicators.voice_quality === 'weak') {
    indicators.push({
      type: 'vocal',
      concern: 'Qualidade vocal reduzida',
      recommendation: 'Avaliar função vocal e respiratória',
      confidence: 0.6
    });
  }

  return indicators;
}