import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const huggingFaceToken = Deno.env.get('HUGGINGFACE_TOKEN');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
const hf = new HfInference(huggingFaceToken);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioData, userId, consultationId } = await req.json();

    if (!audioData || !userId) {
      throw new Error('Audio data and userId are required');
    }

    console.log('Processing voice analysis for user:', userId);

    // Converter base64 para blob
    const binaryString = atob(audioData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/wav' });

    // 1. Transcrição de áudio
    const transcription = await hf.automaticSpeechRecognition({
      data: audioBlob,
      model: 'openai/whisper-small'
    });

    // 2. Análise emocional do texto transcrito
    const emotionalAnalysis = await hf.textClassification({
      model: 'j-hartmann/emotion-english-distilroberta-base',
      inputs: transcription.text
    });

    // 3. Análise de estresse vocal
    const stressAnalysis = await analyzeVocalStress(audioBlob);

    // 4. Análise de padrões respiratórios
    const respiratoryAnalysis = await analyzeRespiratoryPatterns(audioBlob);

    // Compilar resultado da análise
    const analysis = {
      transcription: transcription.text,
      emotional_tone: {
        primary_emotion: emotionalAnalysis[0]?.label || 'neutral',
        confidence: emotionalAnalysis[0]?.score || 0,
        all_emotions: emotionalAnalysis
      },
      stress_indicators: stressAnalysis,
      respiratory_analysis: respiratoryAnalysis,
      session_duration: calculateDuration(audioBlob),
      confidence_score: calculateOverallConfidence(emotionalAnalysis, stressAnalysis)
    };

    return new Response(JSON.stringify({
      success: true,
      analysis: analysis,
      health_indicators: generateHealthIndicators(analysis)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in voice-analysis function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeVocalStress(audioBlob: Blob) {
  // Simulação de análise de estresse vocal
  return {
    stress_level: Math.random() * 10,
    voice_tremor: Math.random() < 0.3,
    speech_rate: 'normal',
    volume_variability: Math.random() * 5,
    indicators: ['pitch_variation', 'speaking_pace', 'voice_quality']
  };
}

async function analyzeRespiratoryPatterns(audioBlob: Blob) {
  // Simulação de análise respiratória através da voz
  return {
    breathing_rate: Math.floor(Math.random() * 10) + 12,
    irregularity_detected: Math.random() < 0.2,
    shallow_breathing: Math.random() < 0.3,
    patterns: {
      inspiration_time: Math.random() * 3 + 1,
      expiration_time: Math.random() * 3 + 1,
      pause_frequency: Math.random() * 0.5
    }
  };
}

function calculateDuration(audioBlob: Blob): number {
  return Math.floor(audioBlob.size / 8000);
}

function calculateOverallConfidence(emotionalAnalysis: any, stressAnalysis: any): number {
  const emotionalConfidence = emotionalAnalysis[0]?.score || 0;
  const stressConfidence = stressAnalysis.stress_level / 10;
  return (emotionalConfidence + stressConfidence) / 2;
}

function generateHealthIndicators(analysis: any) {
  const indicators = [];

  if (analysis.emotional_tone.primary_emotion === 'sadness' && analysis.emotional_tone.confidence > 0.7) {
    indicators.push({
      type: 'psychological',
      concern: 'Possível estado depressivo',
      recommendation: 'Considerar avaliação psicológica'
    });
  }

  if (analysis.stress_indicators.stress_level > 7) {
    indicators.push({
      type: 'stress',
      concern: 'Nível de estresse elevado',
      recommendation: 'Práticas de manejo de estresse indicadas'
    });
  }

  return indicators;
}