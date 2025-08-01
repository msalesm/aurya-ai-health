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
    if (!audioData || !audioBlobRef.current) {
      throw new Error('Nenhum áudio disponível para análise');
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Iniciando análise híbrida com características reais de áudio...');
      
      // 1. Análise de características reais do áudio
      const realAudioAnalysis = await analyzeRealAudio(audioBlobRef.current);
      console.log('Análise de áudio real:', realAudioAnalysis);

      // 2. Análise textual e emocional via Supabase
      const response = await supabase.functions.invoke('hybrid-voice-analysis', {
        body: {
          audioData: `data:audio/webm;base64,${audioData}`,
          userId: 'demo-user-id',
          preferredProvider: 'hybrid'
        }
      });

      if (response.error) {
        console.warn('Análise textual falhou, usando apenas análise de áudio real:', response.error);
      }

      // 3. Combinar análise real de áudio com análise textual
      const combinedAnalysis = {
        transcription: response.data?.analysis?.transcription || 'Transcrição não disponível',
        real_audio_features: realAudioAnalysis.features,
        emotional_tone: {
          primary_emotion: realAudioAnalysis.emotionalState,
          confidence: realAudioAnalysis.confidence,
          source: 'real_audio_analysis'
        },
        stress_indicators: {
          stress_level: realAudioAnalysis.stressLevel,
          voice_quality: realAudioAnalysis.voiceQuality,
          breathing_pattern: realAudioAnalysis.breathingPattern,
          pitch_analysis: {
            fundamental_frequency: realAudioAnalysis.features.pitch,
            pitch_stability: realAudioAnalysis.features.pitch > 80 && realAudioAnalysis.features.pitch < 300
          },
          volume_analysis: {
            average_volume: realAudioAnalysis.features.volume,
            volume_consistency: realAudioAnalysis.features.volume > 0.1
          }
        },
        respiratory_analysis: {
          breathing_rate: realAudioAnalysis.breathingPattern === 'shallow' ? 22 : 16,
          irregularity_detected: realAudioAnalysis.breathingPattern !== 'normal',
          speech_effort_level: realAudioAnalysis.voiceQuality === 'weak' ? 'high' : 'normal'
        },
        session_duration: realAudioAnalysis.features.duration,
        confidence_score: realAudioAnalysis.confidence,
        analysis_timestamp: new Date().toISOString(),
        analysis_method: 'hybrid_real_audio_plus_text'
      };

      console.log('Análise híbrida completa:', combinedAnalysis);
      
      return {
        success: true,
        analysis: combinedAnalysis,
        health_indicators: generateHealthIndicators(combinedAnalysis)
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na análise';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [audioData, analyzeRealAudio]);

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