import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { facialData, voiceData, anamnesisData, patientData } = await req.json();

    console.log('Performing medical correlation analysis');

    // Perform comprehensive correlation analysis
    const correlationResult = await performCorrelationAnalysis(
      facialData,
      voiceData,
      anamnesisData,
      patientData
    );

    return new Response(JSON.stringify(correlationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in medical-correlation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function performCorrelationAnalysis(
  facialData: any,
  voiceData: any,
  anamnesisData: any,
  patientData: any
) {
  // Extract standardized metrics
  const facialMetrics = extractFacialMetrics(facialData);
  const voiceMetrics = extractVoiceMetrics(voiceData);
  const anamnesisMetrics = extractAnamnesisMetrics(anamnesisData);

  // Calculate correlations
  const stressCorrelation = calculateStressCorrelation(facialMetrics, voiceMetrics);
  const heartRateConsistency = calculateHeartRateConsistency(facialMetrics, voiceMetrics);
  const emotionalAlignment = calculateEmotionalAlignment(facialMetrics, voiceMetrics);

  // Overall correlation strength
  const correlationStrength = (stressCorrelation + heartRateConsistency + emotionalAlignment) / 3;
  const consistencyScore = Math.round(correlationStrength * 100);

  // Determine reliability
  let reliability: 'high' | 'medium' | 'low' = 'low';
  if (consistencyScore >= 80) reliability = 'high';
  else if (consistencyScore >= 60) reliability = 'medium';

  // Identify conflicts
  const conflictingMetrics = [];
  if (stressCorrelation < 0.5) conflictingMetrics.push('Níveis de estresse divergentes');
  if (heartRateConsistency < 0.5) conflictingMetrics.push('Frequência cardíaca inconsistente');
  if (emotionalAlignment < 0.4) conflictingMetrics.push('Estados emocionais conflitantes');

  // Calculate consolidated urgency
  const consolidatedUrgency = calculateConsolidatedUrgency(
    facialMetrics,
    voiceMetrics,
    anamnesisMetrics,
    correlationStrength
  );

  // Generate AI-powered analysis if available
  let aiAnalysis = null;
  if (openAIApiKey) {
    try {
      aiAnalysis = await generateAICorrelationAnalysis({
        facialMetrics,
        voiceMetrics,
        anamnesisMetrics,
        correlationStrength,
        patientData
      });
    } catch (error) {
      console.warn('AI analysis failed:', error);
    }
  }

  return {
    crossModalCorrelation: {
      facialHeartRate: facialMetrics.heartRate,
      voiceStressLevel: voiceMetrics.stressLevel,
      anamnesisUrgency: anamnesisMetrics.urgencyScore,
      consistencyScore,
      reliability,
      conflictingMetrics,
      correlationStrength,
      consensusIndicators: {
        stressConsensus: stressCorrelation > 0.7,
        emotionalConsensus: emotionalAlignment > 0.6,
        urgencyConsensus: anamnesisMetrics ? 
          Math.abs(facialMetrics.stressLevel - (anamnesisMetrics.urgencyScore / 10)) < 3 : false
      }
    },
    consolidatedAnalysis: {
      overallUrgency: consolidatedUrgency,
      combinedSymptoms: extractAllSymptoms(facialMetrics, voiceMetrics, anamnesisMetrics),
      riskFactors: identifyRiskFactors(facialMetrics, voiceMetrics, anamnesisMetrics),
      recommendations: generateRecommendations(consolidatedUrgency, reliability),
      reliability: {
        score: consistencyScore,
        level: reliability,
        dataQuality: assessDataQuality(facialData, voiceData, anamnesisData)
      }
    },
    biometricCorrelation: {
      heartRateConsistency,
      stressCorrelation,
      emotionalAlignment
    },
    aiAnalysis,
    timestamp: new Date().toISOString()
  };
}

function extractFacialMetrics(facialData: any) {
  if (!facialData) return null;

  return {
    heartRate: facialData.heartRate || facialData.vitalSigns?.heartRate || 72,
    stressLevel: facialData.stressLevel || calculateFacialStress(facialData),
    thermalState: facialData.facialMetrics?.thermalState || facialData.thermalState || 'indeterminate',
    microExpressions: facialData.facialMetrics?.microExpressions || facialData.microExpressions || {},
    confidence: facialData.quality?.analysisReliability || facialData.confidence || 0.8
  };
}

function extractVoiceMetrics(voiceData: any) {
  if (!voiceData) return null;

  return {
    emotionalState: voiceData.emotional_tone?.primary_emotion || 
                   voiceData.emotions?.[0]?.label || 'neutral',
    stressLevel: voiceData.stress_indicators?.stress_level || 
                voiceData.stressLevel || 
                calculateVoiceStress(voiceData),
    respiratoryPattern: voiceData.respiratory_patterns?.pattern || 'normal',
    speechClarity: voiceData.speech_clarity || 85,
    confidence: voiceData.confidence_score || voiceData.confidence || 0.8
  };
}

function extractAnamnesisMetrics(anamnesisData: any) {
  if (!anamnesisData) return null;

  return {
    urgencyLevel: anamnesisData.urgencyLevel || 'baixa',
    urgencyScore: anamnesisData.urgencyScore || 30,
    symptoms: anamnesisData.symptoms || anamnesisData.consolidatedSymptoms || [],
    recommendations: anamnesisData.recommendations || [],
    confidence: anamnesisData.confidence || 0.8
  };
}

function calculateFacialStress(facialData: any): number {
  let stress = 0;
  const hr = facialData.heartRate || 72;
  if (hr > 90) stress += (hr - 90) / 10;
  
  const emotions = facialData.facialMetrics?.microExpressions || {};
  stress += (emotions.anger || 0) * 10;
  stress += (emotions.fear || 0) * 10;
  
  return Math.min(stress, 10);
}

function calculateVoiceStress(voiceData: any): number {
  let stress = 0;
  const emotion = voiceData.emotional_tone?.primary_emotion || 'neutral';
  
  if (emotion === 'stress' || emotion === 'anxiety') stress += 8;
  else if (emotion === 'sadness') stress += 6;
  
  return Math.min(stress, 10);
}

function calculateStressCorrelation(facialMetrics: any, voiceMetrics: any): number {
  if (!facialMetrics || !voiceMetrics) return 0.5;
  
  const facialStress = facialMetrics.stressLevel || 0;
  const voiceStress = voiceMetrics.stressLevel || 0;
  
  const difference = Math.abs(facialStress - voiceStress);
  return Math.max(0, 1 - (difference / 10));
}

function calculateHeartRateConsistency(facialMetrics: any, voiceMetrics: any): number {
  if (!facialMetrics || !voiceMetrics) return 0.5;
  
  const facialHR = facialMetrics.heartRate || 72;
  const voiceInferredHR = 60 + (voiceMetrics.stressLevel * 3);
  
  const difference = Math.abs(facialHR - voiceInferredHR);
  return Math.max(0, 1 - (difference / 60));
}

function calculateEmotionalAlignment(facialMetrics: any, voiceMetrics: any): number {
  if (!facialMetrics || !voiceMetrics) return 0.5;
  
  const facialEmotions = facialMetrics.microExpressions || {};
  const voiceEmotion = voiceMetrics.emotionalState || 'neutral';
  
  const emotionMapping: Record<string, string[]> = {
    'stress': ['anger', 'fear'],
    'anxiety': ['fear', 'sadness'],
    'calm': ['joy'],
    'neutral': ['joy']
  };
  
  const expectedEmotions = emotionMapping[voiceEmotion] || ['joy'];
  let alignment = 0;
  
  expectedEmotions.forEach(emotion => {
    if (facialEmotions[emotion]) {
      alignment += facialEmotions[emotion];
    }
  });
  
  return Math.min(alignment, 1);
}

function calculateConsolidatedUrgency(
  facialMetrics: any,
  voiceMetrics: any,
  anamnesisMetrics: any,
  correlationStrength: number
) {
  let totalScore = 0;
  let weightSum = 0;
  
  if (anamnesisMetrics) {
    totalScore += anamnesisMetrics.urgencyScore * 0.5;
    weightSum += 0.5;
  }
  
  if (facialMetrics) {
    const facialUrgency = facialMetrics.stressLevel * 10 + 
                         (facialMetrics.heartRate > 100 ? 20 : 0);
    totalScore += Math.min(facialUrgency, 100) * 0.3;
    weightSum += 0.3;
  }
  
  if (voiceMetrics) {
    const voiceUrgency = voiceMetrics.stressLevel * 10;
    totalScore += Math.min(voiceUrgency, 100) * 0.2;
    weightSum += 0.2;
  }
  
  const finalScore = weightSum > 0 ? totalScore / weightSum : 50;
  const reliabilityMultiplier = 0.8 + (correlationStrength * 0.2);
  const adjustedScore = Math.round(finalScore * reliabilityMultiplier);
  
  let level = 'Baixa';
  if (adjustedScore >= 80) level = 'Crítica';
  else if (adjustedScore >= 60) level = 'Alta';
  else if (adjustedScore >= 40) level = 'Média';
  
  return {
    level,
    score: adjustedScore,
    confidence: Math.round(correlationStrength * 100)
  };
}

function extractAllSymptoms(facialMetrics: any, voiceMetrics: any, anamnesisMetrics: any): string[] {
  const symptoms: string[] = [];
  
  if (anamnesisMetrics?.symptoms) symptoms.push(...anamnesisMetrics.symptoms);
  if (voiceMetrics?.emotionalState && voiceMetrics.emotionalState !== 'neutral') {
    symptoms.push(`Estado vocal: ${voiceMetrics.emotionalState}`);
  }
  if (facialMetrics?.stressLevel > 5) symptoms.push('Sinais faciais de estresse');
  
  return [...new Set(symptoms)];
}

function identifyRiskFactors(facialMetrics: any, voiceMetrics: any, anamnesisMetrics: any): string[] {
  const risks: string[] = [];
  
  if (facialMetrics?.heartRate > 100) risks.push('Taquicardia detectada');
  if (voiceMetrics?.stressLevel > 7) risks.push('Estresse vocal elevado');
  if (facialMetrics?.thermalState === 'possible_fever') risks.push('Possível febre');
  
  return risks;
}

function generateRecommendations(urgency: any, reliability: string): string[] {
  const recommendations: string[] = [];
  
  if (urgency.level === 'Crítica') {
    recommendations.push('Buscar atendimento médico de emergência imediatamente');
  } else if (urgency.level === 'Alta') {
    recommendations.push('Procurar atendimento médico urgente nas próximas horas');
  } else {
    recommendations.push('Monitoramento e consulta de rotina');
  }
  
  if (reliability === 'low') {
    recommendations.push('Repetir análise para maior precisão');
  }
  
  return recommendations;
}

function assessDataQuality(facialData: any, voiceData: any, anamnesisData: any): string {
  const hasData = [facialData, voiceData, anamnesisData].filter(Boolean).length;
  
  if (hasData === 3) return 'Completa';
  if (hasData === 2) return 'Boa';
  return 'Parcial';
}

async function generateAICorrelationAnalysis(data: any) {
  const prompt = `Analise esta correlação médica multi-modal:

DADOS FACIAIS: FC ${data.facialMetrics?.heartRate}bpm, Estresse ${data.facialMetrics?.stressLevel}/10
DADOS DE VOZ: Emoção ${data.voiceMetrics?.emotionalState}, Estresse ${data.voiceMetrics?.stressLevel}/10  
ANAMNESE: Urgência ${data.anamnesisMetrics?.urgencyScore}/100
CORRELAÇÃO: ${(data.correlationStrength * 100).toFixed(1)}%

Forneça análise clínica concisa sobre:
1. Consistência entre modalidades
2. Achados mais relevantes
3. Recomendações específicas

Máximo 200 palavras.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um médico especialista em análise de dados biométricos.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    }),
  });

  const result = await response.json();
  return result.choices[0].message.content;
}