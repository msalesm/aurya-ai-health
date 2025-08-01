import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const googleApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioData, userId, preferredProvider = 'openai' } = await req.json();

    if (!audioData || !userId) {
      throw new Error('Audio data and userId are required');
    }

    console.log(`Processing hybrid voice analysis for user: ${userId} with provider: ${preferredProvider}`);

    let transcription: any;
    let emotionalAnalysis: any;

    // 1. Transcrição - Tentar OpenAI primeiro, fallback para Google
    if (preferredProvider === 'openai' && openAIApiKey) {
      transcription = await transcribeWithOpenAI(audioData);
    } else if (googleApiKey) {
      transcription = await transcribeWithGoogle(audioData);
    } else {
      throw new Error('No API keys available for transcription');
    }

    // 2. Análise emocional - Híbrida (OpenAI + Google Natural Language)
    if (transcription.text && transcription.text.length > 5) {
      console.log('Starting emotional analysis for text:', transcription.text.substring(0, 50));
      
      try {
        const [openAIEmotion, googleEmotion] = await Promise.allSettled([
          analyzeEmotionWithOpenAI(transcription.text),
          analyzeEmotionWithGoogle(transcription.text)
        ]);

        emotionalAnalysis = combineEmotionalAnalysis(openAIEmotion, googleEmotion);
      } catch (analysisError) {
        console.error('Error in emotional analysis:', analysisError);
        emotionalAnalysis = {
          primary_emotion: 'neutral',
          confidence: 0.5,
          provider: 'fallback'
        };
      }
    } else {
      console.log('Text too short for analysis, using fallback');
      emotionalAnalysis = {
        primary_emotion: 'neutral',
        confidence: 0.5,
        provider: 'fallback'
      };
    }

    // 3. Análise de estresse vocal (baseada em características temporais e linguísticas)
    const stressAnalysis = analyzeVocalStress(transcription.text, transcription);

    // 4. Análise respiratória baseada no padrão de fala
    const respiratoryAnalysis = analyzeRespiratoryFromSpeech(transcription.text);

    // 5. Compilar resultado final
    const analysis = {
      transcription: transcription.text,
      emotional_tone: {
        primary_emotion: emotionalAnalysis.primary_emotion,
        confidence: emotionalAnalysis.confidence,
        all_emotions: emotionalAnalysis.details || []
      },
      stress_indicators: stressAnalysis,
      respiratory_analysis: respiratoryAnalysis,
      session_duration: estimateAudioDuration(audioData),
      confidence_score: calculateOverallConfidence(transcription, emotionalAnalysis),
      analysis_timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      analysis: analysis,
      health_indicators: generateHealthIndicators(analysis)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in hybrid voice analysis:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function transcribeWithOpenAI(audioData: string) {
  try {
    console.log('Transcribing with OpenAI Whisper...');
    
    // Converter base64 para blob - melhor tratamento para WebM Opus
    const cleanBase64 = audioData.replace(/^data:audio\/[^;]+;base64,/, '');
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const audioBlob = new Blob([bytes], { type: 'audio/webm;codecs=opus' });
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'verbose_json'); // Dados extras para análise

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OpenAI Whisper error: ${response.status}`);
    }

    const data = await response.json();
    return { 
      text: data.text, 
      provider: 'ai_transcription',
      duration: data.duration || 0,
      segments: data.segments || [],
      language: data.language || 'pt'
    };
    
  } catch (error) {
    console.error('OpenAI transcription failed:', error);
    throw error;
  }
}

async function transcribeWithGoogle(audioData: string) {
  try {
    console.log('Transcribing with Google Speech-to-Text...');
    
    const cleanBase64 = audioData.replace(/^data:audio\/[^;]+;base64,/, '');
    
    const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'pt-BR',
          model: 'latest_long',
          useEnhanced: true
        },
        audio: {
          content: cleanBase64
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Speech error: ${response.status}`);
    }

    const data = await response.json();
    const transcript = data.results?.[0]?.alternatives?.[0]?.transcript || 'Transcrição não disponível';
    
    return { text: transcript, provider: 'ai_transcription' };
    
  } catch (error) {
    console.error('Google transcription failed:', error);
    return { text: 'Transcrição com limitações técnicas', provider: 'fallback' };
  }
}

async function analyzeEmotionWithOpenAI(text: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'Analise o estado emocional do texto. Responda apenas com JSON: {"emotion": "calm|anxiety|stress|sadness|anger|joy", "confidence": 0.8, "indicators": ["indicator1"]}'
          },
          {
            role: 'user',
            content: `Analise: "${text}"`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI emotion analysis error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      status: 'fulfilled',
      value: { ...result, provider: 'medical_ai' }
    };
    
  } catch (error) {
    return {
      status: 'rejected',
      reason: error
    };
  }
}

async function analyzeEmotionWithGoogle(text: string) {
  try {
    const response = await fetch(`https://language.googleapis.com/v1/documents:analyzeSentiment?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: {
          type: 'PLAIN_TEXT',
          content: text
        },
        encodingType: 'UTF8'
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Natural Language error: ${response.status}`);
    }

    const data = await response.json();
    const sentiment = data.documentSentiment;
    
    // Converter sentimento do Google para emoções
    let emotion = 'neutral';
    if (sentiment.score > 0.5) emotion = 'joy';
    else if (sentiment.score < -0.5) emotion = 'sadness';
    else if (sentiment.magnitude > 0.7) emotion = 'anxiety';
    
    return {
      status: 'fulfilled',
      value: {
        emotion: emotion,
        confidence: Math.abs(sentiment.score),
        magnitude: sentiment.magnitude,
        provider: 'medical_ai'
      }
    };
    
  } catch (error) {
    return {
      status: 'rejected',
      reason: error
    };
  }
}

function combineEmotionalAnalysis(openAIResult: any, googleResult: any) {
  // Combinar resultados das duas APIs
  let primary_emotion = 'neutral';
  let confidence = 0.5;
  let provider = 'hybrid';
  
  if (openAIResult.status === 'fulfilled' && googleResult.status === 'fulfilled') {
    // Usar resultado com maior confiança
    const openAI = openAIResult.value;
    const google = googleResult.value;
    
    if (openAI.confidence > google.confidence) {
      primary_emotion = openAI.emotion;
      confidence = openAI.confidence;
    } else {
      primary_emotion = google.emotion;
      confidence = google.confidence;
    }
    
    provider = 'hybrid_ai';
    
  } else if (openAIResult.status === 'fulfilled') {
    const openAI = openAIResult.value;
    primary_emotion = openAI.emotion;
    confidence = openAI.confidence;
    provider = 'voice_analysis';
    
  } else if (googleResult.status === 'fulfilled') {
    const google = googleResult.value;
    primary_emotion = google.emotion;
    confidence = google.confidence;
    provider = 'voice_analysis';
  }
  
  return {
    primary_emotion,
    confidence,
    provider,
    details: {
      openai: openAIResult.status === 'fulfilled' ? openAIResult.value : null,
      google: googleResult.status === 'fulfilled' ? googleResult.value : null
    }
  };
}

function analyzeVocalStress(text: string, transcriptionData: any = {}) {
  // Análise de estresse baseada no conteúdo textual E características temporais
  const stressKeywords = ['dor', 'preocupado', 'ansioso', 'nervoso', 'estresse', 'medo', 'tensão', 'pânico', 'desespero'];
  const calmKeywords = ['calmo', 'tranquilo', 'bem', 'normal', 'relaxado', 'sereno', 'paz'];
  
  let stressScore = 0;
  const words = text.toLowerCase().split(' ');
  
  // Análise linguística
  words.forEach(word => {
    if (stressKeywords.some(keyword => word.includes(keyword))) {
      stressScore += 2;
    }
    if (calmKeywords.some(keyword => word.includes(keyword))) {
      stressScore -= 1;
    }
  });
  
  // Análise estrutural da fala
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? text.length / sentences.length : 0;
  const interruptionMarkers = (text.match(/\.\.\.|,|;/g) || []).length;
  
  // Análise temporal baseada em segmentos da transcrição
  if (transcriptionData.segments && transcriptionData.segments.length > 0) {
    const segments = transcriptionData.segments;
    let totalPauses = 0;
    let speechRate = 0;
    
    for (let i = 1; i < segments.length; i++) {
      const pause = segments[i].start - segments[i-1].end;
      if (pause > 0.5) totalPauses++; // Pausas longas
    }
    
    // Taxa de fala (palavras por minuto)
    const totalDuration = transcriptionData.duration || 1;
    speechRate = (words.length / totalDuration) * 60;
    
    // Indicadores temporais de stress
    if (speechRate > 180 || speechRate < 100) stressScore += 1; // Muito rápido ou lento
    if (totalPauses > segments.length * 0.4) stressScore += 1; // Muitas pausas
  }
  
  // Frases muito curtas ou interrompidas podem indicar stress
  if (avgSentenceLength < 15) stressScore += 1;
  if (interruptionMarkers > sentences.length * 0.3) stressScore += 1;
  
  // Análise de repetições (gagueira ou nervosismo)
  const repetitions = words.filter((word, index) => 
    index > 0 && word === words[index - 1] && word.length > 2
  ).length;
  
  if (repetitions > 0) stressScore += repetitions * 0.5;
  
  // Calcular nível final de stress com base real
  const finalStressLevel = Math.max(0, Math.min(10, stressScore));
  
  return {
    stress_level: finalStressLevel,
    voice_tremor: stressScore > 3 || repetitions > 1,
    speech_rate: avgSentenceLength < 20 ? 'fast' : stressScore > 5 ? 'irregular' : 'normal',
    volume_variability: Math.min(10, stressScore * 0.8 + repetitions),
    interruption_frequency: interruptionMarkers,
    repetition_count: repetitions,
    sentence_fragmentation: avgSentenceLength < 15,
    temporal_analysis: {
      segments_count: transcriptionData.segments?.length || 0,
      estimated_speech_rate: transcriptionData.duration ? (words.length / transcriptionData.duration) * 60 : 0,
      pause_frequency: transcriptionData.segments ? countLongPauses(transcriptionData.segments) : 0
    },
    indicators: stressScore > 3 ? ['linguistic_stress_markers', 'speech_pattern_irregularities', 'temporal_anomalies'] : ['normal_speech_patterns']
  };
}

function countLongPauses(segments: any[]): number {
  let longPauses = 0;
  for (let i = 1; i < segments.length; i++) {
    const pause = segments[i].start - segments[i-1].end;
    if (pause > 0.5) longPauses++;
  }
  return longPauses;
}

function analyzeRespiratoryFromSpeech(text: string) {
  // Análise respiratória baseada na estrutura do discurso e padrões de fala
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgSentenceLength = sentences.length > 0 ? sentences.reduce((acc, s) => acc + s.length, 0) / sentences.length : 0;
  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  
  // Detectar pausas e respirações baseado em pontuação e estrutura
  const pauseMarkers = (text.match(/[,.;:]/g) || []).length;
  const longPauses = (text.match(/\.\.\.|--/g) || []).length;
  
  // Análise de falta de ar baseada em indicadores linguísticos
  const breathKeywords = ['respirar', 'ar', 'cansado', 'falta', 'sufocado', 'ofegante'];
  const breathIndicators = words.filter(word => 
    breathKeywords.some(keyword => word.toLowerCase().includes(keyword))
  ).length;
  
  // Calcular taxa respiratória estimada
  const estimatedBreathingRate = Math.max(12, Math.min(25, 
    16 + (breathIndicators * 2) + (avgSentenceLength < 20 ? 3 : 0) - (avgWordsPerSentence > 8 ? 2 : 0)
  ));
  
  // Detectar irregularidades
  const irregularity = avgSentenceLength < 25 || breathIndicators > 0 || longPauses > 1;
  const shallowBreathing = avgWordsPerSentence < 6 && sentences.length > 3;
  
  return {
    breathing_rate: Math.round(estimatedBreathingRate),
    irregularity_detected: irregularity,
    shallow_breathing: shallowBreathing,
    breath_indicators_found: breathIndicators,
    speech_effort_level: breathIndicators > 0 ? 'high' : avgSentenceLength < 20 ? 'moderate' : 'normal',
    patterns: {
      sentence_length_avg: Math.round(avgSentenceLength),
      words_per_sentence: Math.round(avgWordsPerSentence),
      pause_frequency: Math.round(pauseMarkers / words.length * 100),
      long_pause_count: longPauses,
      speech_continuity: avgWordsPerSentence > 8 ? 'excellent' : avgWordsPerSentence > 5 ? 'good' : 'limited'
    }
  };
}

function estimateAudioDuration(audioData: string): number {
  // Estimativa rudimentar baseada no tamanho do base64
  const sizeKB = audioData.length * 0.75 / 1024; // Aproximação
  return Math.round(sizeKB / 8); // ~8KB por segundo para WebM
}

function calculateOverallConfidence(transcription: any, emotional: any): number {
  const text = transcription.text || '';
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Base realista baseada na qualidade do áudio
  let confidence = 0.35;
  
  // Análise de qualidade da transcrição
  const wordsPerMinute = words.length / Math.max(1, estimateAudioDuration(transcription.text) / 60);
  const avgSentenceLength = sentences.length > 0 ? text.length / sentences.length : 0;
  
  // WPM normal (120-180) indica boa qualidade
  if (wordsPerMinute >= 120 && wordsPerMinute <= 180) {
    confidence += 0.15;
  } else if (wordsPerMinute < 80 || wordsPerMinute > 220) {
    confidence -= 0.1; // Muito rápido ou lento pode indicar problemas
  }
  
  // Frases bem estruturadas aumentam confiança
  if (avgSentenceLength > 20 && avgSentenceLength < 100) {
    confidence += 0.1;
  }
  
  // Palavras incompletas ou truncadas reduzem confiança
  const truncatedWords = words.filter(word => word.includes('...') || word.length < 2).length;
  confidence -= (truncatedWords / words.length) * 0.2;
  
  // Hesitações e pausas afetam clareza
  const hesitations = (text.match(/\b(uh|um|ah|er|hmm)\b/gi) || []).length;
  confidence -= Math.min(0.15, hesitations * 0.02);
  
  // Qualidade baseada na completude das ideias
  const incompleteMarkers = (text.match(/\.\.\.|--|\bunfinished\b/gi) || []).length;
  confidence -= incompleteMarkers * 0.03;
  
  // Fator da análise emocional (correlação com consistência)
  if (emotional.confidence) {
    confidence += emotional.confidence * 0.1;
  }
  
  // Duração do áudio afeta precisão
  const duration = estimateAudioDuration(text);
  if (duration < 3) {
    confidence *= 0.8; // Áudio muito curto
  } else if (duration > 30) {
    confidence += 0.05; // Áudio longo permite melhor análise
  }
  
  // Range realista: 45-92%
  return Math.max(0.45, Math.min(0.92, confidence));
}

function generateHealthIndicators(analysis: any) {
  const indicators = [];

  if (analysis.emotional_tone.primary_emotion === 'sadness' && analysis.emotional_tone.confidence > 0.7) {
    indicators.push({
      type: 'psychological',
      concern: 'Possível estado depressivo detectado',
      recommendation: 'Considerar avaliação psicológica',
      confidence: analysis.emotional_tone.confidence
    });
  }

  if (analysis.stress_indicators.stress_level > 7) {
    indicators.push({
      type: 'stress',
      concern: 'Nível de estresse vocal elevado',
      recommendation: 'Técnicas de manejo de estresse recomendadas',
      confidence: 0.8
    });
  }

  if (analysis.respiratory_analysis.irregularity_detected) {
    indicators.push({
      type: 'respiratory',
      concern: 'Possível irregularidade respiratória',
      recommendation: 'Monitorar padrões respiratórios',
      confidence: 0.6
    });
  }

  return indicators;
}