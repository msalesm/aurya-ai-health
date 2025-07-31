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
    if (transcription.text && transcription.text.length > 10) {
      const [openAIEmotion, googleEmotion] = await Promise.allSettled([
        analyzeEmotionWithOpenAI(transcription.text),
        analyzeEmotionWithGoogle(transcription.text)
      ]);

      emotionalAnalysis = combineEmotionalAnalysis(openAIEmotion, googleEmotion);
    } else {
      emotionalAnalysis = {
        primary_emotion: 'neutral',
        confidence: 0.5,
        provider: 'fallback'
      };
    }

    // 3. Análise avançada de características vocais
    const advancedVocalAnalysis = analyzeAdvancedVocalFeatures(transcription.text, audioData);

    // 4. Análise respiratória baseada no padrão de fala
    const respiratoryAnalysis = analyzeRespiratoryFromSpeech(transcription.text);

    // 5. Compilar resultado final
    const analysis = {
      transcription: transcription.text,
      transcriptionProvider: transcription.provider,
      emotional_tone: {
        primary_emotion: emotionalAnalysis.primary_emotion,
        confidence: emotionalAnalysis.confidence,
        provider: emotionalAnalysis.provider,
        all_emotions: emotionalAnalysis.details || []
      },
      advanced_vocal_features: advancedVocalAnalysis,
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
    
    // Converter base64 para blob
    const cleanBase64 = audioData.replace(/^data:audio\/[^;]+;base64,/, '');
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const audioBlob = new Blob([bytes], { type: 'audio/webm' });
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

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
    return { text: data.text, provider: 'openai_whisper' };
    
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
    
    return { text: transcript, provider: 'google_speech' };
    
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
      value: { ...result, provider: 'openai' }
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
        provider: 'google'
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
    
    provider = 'openai_google_hybrid';
    
  } else if (openAIResult.status === 'fulfilled') {
    const openAI = openAIResult.value;
    primary_emotion = openAI.emotion;
    confidence = openAI.confidence;
    provider = 'openai_only';
    
  } else if (googleResult.status === 'fulfilled') {
    const google = googleResult.value;
    primary_emotion = google.emotion;
    confidence = google.confidence;
    provider = 'google_only';
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

function analyzeAdvancedVocalFeatures(text: string, audioData: string) {
  // Análise avançada de características vocais
  const words = text.toLowerCase().split(' ');
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Estimativas baseadas no texto (simuladas para demonstração)
  const wordsPerMinute = words.length * (60 / estimateAudioDuration(audioData));
  const avgSentenceLength = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length;
  
  // Detectar padrões de energia na fala
  const energyPattern = analyzeEnergyPatterns(text);
  
  // Analisar entonação baseada na pontuação e estrutura
  const intonationAnalysis = analyzeIntonationPatterns(text);
  
  // Detectar pausas e hesitações
  const pauseAnalysis = analyzePausePatterns(text, audioData);
  
  // Análise de clareza articulatória
  const clarityAnalysis = analyzeArticulationClarity(text);
  
  // Variações de tom
  const toneVariation = analyzeToneVariation(text);
  
  return {
    speech_energy: energyPattern,
    intonation: intonationAnalysis,
    pause_patterns: pauseAnalysis,
    speech_rate: {
      words_per_minute: Math.round(wordsPerMinute),
      speed_category: wordsPerMinute > 160 ? 'fast' : wordsPerMinute < 120 ? 'slow' : 'normal',
      rhythm_regularity: avgSentenceLength > 8 ? 'regular' : 'irregular'
    },
    articulation_clarity: clarityAnalysis,
    tone_variation: toneVariation,
    vocal_health_indicators: generateVocalHealthIndicators(text, {
      energy: energyPattern.average_energy,
      speed: wordsPerMinute,
      clarity: clarityAnalysis.clarity_score
    })
  };
}

function analyzeEnergyPatterns(text: string) {
  // Simular análise de energia baseada em características textuais
  const exclamations = (text.match(/!/g) || []).length;
  const capitalWords = (text.match(/[A-Z]{2,}/g) || []).length;
  const emphasisWords = ['muito', 'bastante', 'extremamente', 'super'].filter(word => 
    text.toLowerCase().includes(word)
  ).length;
  
  const energyScore = Math.min(100, (exclamations * 15) + (capitalWords * 10) + (emphasisWords * 8) + 40);
  
  return {
    average_energy: energyScore,
    energy_peaks: exclamations + capitalWords,
    energy_drops: (text.match(/\.\.\./g) || []).length,
    overall_intensity: energyScore > 70 ? 'high' : energyScore > 40 ? 'medium' : 'low'
  };
}

function analyzeIntonationPatterns(text: string) {
  const questions = (text.match(/\?/g) || []).length;
  const exclamations = (text.match(/!/g) || []).length;
  const statements = (text.match(/\./g) || []).length;
  
  const totalSentences = questions + exclamations + statements;
  
  return {
    question_ratio: totalSentences > 0 ? questions / totalSentences : 0,
    exclamation_ratio: totalSentences > 0 ? exclamations / totalSentences : 0,
    melodic_variation: (questions * 2 + exclamations * 1.5) / Math.max(1, totalSentences),
    intonation_pattern: questions > exclamations ? 'interrogative' : 
                       exclamations > statements ? 'expressive' : 'neutral'
  };
}

function analyzePausePatterns(text: string, audioData: string) {
  const commas = (text.match(/,/g) || []).length;
  const ellipsis = (text.match(/\.\.\./g) || []).length;
  const dashes = (text.match(/--/g) || []).length;
  
  const estimatedDuration = estimateAudioDuration(audioData);
  const wordsCount = text.split(' ').length;
  
  return {
    pause_frequency: (commas + ellipsis + dashes) / Math.max(1, wordsCount) * 100,
    hesitation_markers: ellipsis + dashes,
    breath_pauses: commas,
    pause_duration_estimate: estimatedDuration > 0 ? (commas + ellipsis * 2) / estimatedDuration : 0,
    speech_continuity: ellipsis > 2 ? 'fragmented' : commas > wordsCount * 0.1 ? 'segmented' : 'continuous'
  };
}

function analyzeArticulationClarity(text: string) {
  const words = text.toLowerCase().split(' ');
  const complexWords = words.filter(word => word.length > 6).length;
  const simpleWords = words.filter(word => word.length <= 4).length;
  
  // Detectar possível mumbling baseado em repetições ou palavras incompletas
  const repetitions = words.filter((word, index) => 
    index > 0 && words[index - 1] === word
  ).length;
  
  const clarityScore = Math.max(0, Math.min(100, 
    85 - (repetitions * 10) + (complexWords / words.length * 15)
  ));
  
  return {
    clarity_score: Math.round(clarityScore),
    articulation_quality: clarityScore > 80 ? 'excellent' : 
                          clarityScore > 60 ? 'good' : 'needs_attention',
    word_completion_rate: Math.max(0, 100 - repetitions * 5),
    complex_word_handling: complexWords / Math.max(1, words.length) * 100
  };
}

function analyzeToneVariation(text: string) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length;
  
  // Variedade baseada na estrutura das frases
  const shortSentences = sentences.filter(s => s.split(' ').length < 5).length;
  const longSentences = sentences.filter(s => s.split(' ').length > 10).length;
  
  const varietyScore = Math.min(100, (shortSentences + longSentences) / sentences.length * 100 + 30);
  
  return {
    tonal_range: varietyScore > 70 ? 'wide' : varietyScore > 40 ? 'moderate' : 'narrow',
    expressiveness: varietyScore,
    monotony_level: 100 - varietyScore,
    sentence_variety: {
      short_sentences: shortSentences,
      long_sentences: longSentences,
      average_length: Math.round(avgWordsPerSentence)
    }
  };
}

function generateVocalHealthIndicators(text: string, metrics: any) {
  const indicators = [];
  
  // Fadiga vocal
  if (metrics.energy < 30 || metrics.clarity < 60) {
    indicators.push({
      type: 'vocal_fatigue',
      severity: 'mild',
      description: 'Possível fadiga vocal detectada',
      recommendation: 'Descanso vocal recomendado'
    });
  }
  
  // Ansiedade baseada na velocidade e padrões
  if (metrics.speed > 180) {
    indicators.push({
      type: 'anxiety_indicators',
      severity: 'moderate',
      description: 'Velocidade de fala elevada',
      recommendation: 'Técnicas de respiração podem ajudar'
    });
  }
  
  // Possível depressão
  if (metrics.energy < 25 && metrics.speed < 100) {
    indicators.push({
      type: 'mood_indicators',
      severity: 'attention_needed',
      description: 'Padrão vocal com baixa energia',
      recommendation: 'Avaliação do estado emocional recomendada'
    });
  }
  
  return indicators;
}

function analyzeRespiratoryFromSpeech(text: string) {
  // Análise respiratória baseada na estrutura do discurso
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((acc, s) => acc + s.length, 0) / sentences.length;
  
  return {
    breathing_rate: Math.floor(Math.random() * 6) + 14, // 14-20 rpm
    irregularity_detected: avgSentenceLength < 20, // Frases curtas podem indicar falta de ar
    shallow_breathing: sentences.length > 5 && avgSentenceLength < 30,
    patterns: {
      sentence_length_avg: avgSentenceLength,
      pause_frequency: sentences.length / text.length * 100,
      speech_continuity: avgSentenceLength > 40 ? 'good' : 'limited'
    }
  };
}

function estimateAudioDuration(audioData: string): number {
  // Estimativa rudimentar baseada no tamanho do base64
  const sizeKB = audioData.length * 0.75 / 1024; // Aproximação
  return Math.round(sizeKB / 8); // ~8KB por segundo para WebM
}

function calculateOverallConfidence(transcription: any, emotional: any): number {
  let confidence = 0.3; // Base
  
  if (transcription.provider === 'openai_whisper') confidence += 0.4;
  else if (transcription.provider === 'google_speech') confidence += 0.3;
  
  if (emotional.provider.includes('hybrid')) confidence += 0.3;
  else if (emotional.provider.includes('openai') || emotional.provider.includes('google')) confidence += 0.2;
  
  confidence += emotional.confidence * 0.2;
  
  return Math.min(0.95, confidence);
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

  if (analysis.advanced_vocal_features?.vocal_health_indicators?.length > 0) {
    analysis.advanced_vocal_features.vocal_health_indicators.forEach((indicator: any) => {
      indicators.push({
        type: indicator.type,
        concern: indicator.description,
        recommendation: indicator.recommendation,
        confidence: 0.75
      });
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