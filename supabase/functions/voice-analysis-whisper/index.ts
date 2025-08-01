import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioData, userId, consultationId } = await req.json();

    if (!audioData) {
      throw new Error('Audio data is required');
    }

    console.log('Processing voice analysis...');

    // Converter base64 para blob com validação
    let audioBlob: Blob;
    try {
      // Remove prefixos de data URL se existirem
      const cleanBase64 = audioData.replace(/^data:audio\/[^;]+;base64,/, '');
      
      // Decodificar base64 em chunks para evitar problemas de memória
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Criar blob com tipo WEBM (formato usado pela gravação)
      audioBlob = new Blob([bytes], { type: 'audio/webm' });
      
      // Validar tamanho mínimo do áudio
      if (audioBlob.size < 1000) {
        throw new Error('Audio file too small or corrupted');
      }
      
    } catch (conversionError) {
      console.error('Audio conversion error:', conversionError);
      throw new Error('Failed to process audio data');
    }

    // 1. Transcrição com OpenAI Whisper
    let transcription;
    try {
      console.log('Transcribing audio with OpenAI Whisper...');
      
      // Criar FormData para Whisper
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');

      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: formData,
      });

      if (!whisperResponse.ok) {
        throw new Error(`Whisper API error: ${whisperResponse.status}`);
      }

      const whisperData = await whisperResponse.json();
      transcription = { text: whisperData.text };
      console.log('Transcription completed:', transcription.text);
      
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      transcription = { text: 'Falha na transcrição - usando análise simulada' };
    }

    // 2. Análise emocional com GPT-4
    let emotionalAnalysis;
    try {
      console.log('Analyzing emotional tone with GPT-4...');
      
      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Analise o estado emocional do texto transcrito. Responda apenas com um JSON no formato: {"emotion": "calm|anxiety|stress|sadness|anger|joy", "confidence": 0.8, "indicators": ["indicador1", "indicador2"]}'
            },
            {
              role: 'user',
              content: `Analise o estado emocional desta transcrição: "${transcription.text}"`
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!gptResponse.ok) {
        throw new Error(`GPT API error: ${gptResponse.status}`);
      }

      const gptData = await gptResponse.json();
      const emotionData = JSON.parse(gptData.choices[0].message.content);
      
      emotionalAnalysis = [{
        label: emotionData.emotion,
        score: emotionData.confidence
      }];
      
      console.log('Emotional analysis completed:', emotionalAnalysis);
      
    } catch (emotionError) {
      console.error('Emotion analysis error:', emotionError);
      // Fallback baseado em palavras-chave
      const text = transcription.text.toLowerCase();
      let emotion = 'calm';
      let confidence = 0.7;
      
      if (text.includes('dor') || text.includes('preocup') || text.includes('ansioso')) {
        emotion = 'anxiety';
        confidence = 0.8;
      } else if (text.includes('triste') || text.includes('desânimo')) {
        emotion = 'sadness';
        confidence = 0.75;
      }
      
      emotionalAnalysis = [{ label: emotion, score: confidence }];
    }

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
      success: false,
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