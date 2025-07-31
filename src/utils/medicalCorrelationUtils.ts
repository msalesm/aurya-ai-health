// Utilities for Medical Cross-Modal Correlation Analysis

export interface VoiceMetrics {
  emotionalState: string;
  stressLevel: number;
  respiratoryPattern: string;
  speechClarity: number;
  confidence: number;
  advancedMetrics?: {
    fundamentalFrequency: number;
    jitter: number;
    tremor: number;
    breathingPattern: {
      rate: number;
      regularity: number;
    };
    emotionalIndicators: {
      stress: number;
      anxiety: number;
      fatigue: number;
      confidence: number;
    };
  };
}

export interface FacialMetrics {
  heartRate: number;
  stressLevel: number;
  thermalState: 'normal' | 'possible_fever' | 'indeterminate';
  microExpressions: Record<string, number>;
  eyeOpenness: { left: number; right: number };
  blinkRate: number;
  pupilDilation: number;
  confidence: number;
}

export interface AnamnesisMetrics {
  urgencyLevel: string;
  urgencyScore: number;
  symptoms: string[];
  recommendations: string[];
  confidence: number;
}

export interface CrossModalCorrelation {
  facialHeartRate: number;
  voiceStressLevel: number;
  anamnesisUrgency: number;
  consistencyScore: number;
  reliability: 'high' | 'medium' | 'low';
  conflictingMetrics: string[];
  correlationStrength: number;
  consensusIndicators: {
    stressConsensus: boolean;
    emotionalConsensus: boolean;
    urgencyConsensus: boolean;
  };
}

export interface ConsolidatedAnalysis {
  overallUrgency: {
    level: string;
    score: number;
    confidence: number;
  };
  combinedSymptoms: string[];
  riskFactors: string[];
  recommendations: string[];
  reliability: {
    score: number;
    level: 'high' | 'medium' | 'low';
    dataQuality: string;
  };
  crossModalData: CrossModalCorrelation;
  biometricCorrelation: {
    heartRateConsistency: number;
    stressCorrelation: number;
    emotionalAlignment: number;
  };
}

// Calculate correlation between facial and voice stress indicators
export const calculateStressCorrelation = (
  facialMetrics: FacialMetrics,
  voiceMetrics: VoiceMetrics
): number => {
  const facialStress = facialMetrics.stressLevel || 0;
  const voiceStress = voiceMetrics.stressLevel || 0;
  
  // Normalize both to 0-10 scale
  const normalizedFacial = Math.min(facialStress, 10);
  const normalizedVoice = Math.min(voiceStress, 10);
  
  // Calculate correlation (inverse of absolute difference)
  const difference = Math.abs(normalizedFacial - normalizedVoice);
  const correlation = Math.max(0, 1 - (difference / 10));
  
  return correlation;
};

// Calculate heart rate consistency across modalities
export const calculateHeartRateConsistency = (
  facialMetrics: FacialMetrics,
  voiceMetrics: VoiceMetrics
): number => {
  const facialHR = facialMetrics.heartRate || 72;
  
  // Infer heart rate from voice stress (simplified model)
  const voiceInferredHR = 60 + (voiceMetrics.stressLevel * 3);
  
  const difference = Math.abs(facialHR - voiceInferredHR);
  const consistency = Math.max(0, 1 - (difference / 60)); // Normalize by typical HR range
  
  return consistency;
};

// Detect emotional alignment between modalities
export const calculateEmotionalAlignment = (
  facialMetrics: FacialMetrics,
  voiceMetrics: VoiceMetrics
): number => {
  const facialEmotions = facialMetrics.microExpressions || {};
  const voiceEmotion = voiceMetrics.emotionalState || 'neutral';
  
  // Map voice emotion to facial equivalents
  const emotionMapping: Record<string, string[]> = {
    'stress': ['anger', 'fear'],
    'anxiety': ['fear', 'sadness'],
    'calm': ['joy'],
    'sadness': ['sadness'],
    'neutral': ['joy'] // Default to low-key positive
  };
  
  const expectedFacialEmotions = emotionMapping[voiceEmotion] || ['joy'];
  
  // Calculate alignment score
  let alignment = 0;
  expectedFacialEmotions.forEach(emotion => {
    if (facialEmotions[emotion]) {
      alignment += facialEmotions[emotion];
    }
  });
  
  return Math.min(alignment, 1);
};

// Generate cross-modal correlation analysis
export const performCrossModalCorrelation = (
  facialMetrics: FacialMetrics | null,
  voiceMetrics: VoiceMetrics | null,
  anamnesisMetrics: AnamnesisMetrics | null
): CrossModalCorrelation => {
  const stressCorrelation = facialMetrics && voiceMetrics 
    ? calculateStressCorrelation(facialMetrics, voiceMetrics)
    : 0.5;
  
  const heartRateConsistency = facialMetrics && voiceMetrics
    ? calculateHeartRateConsistency(facialMetrics, voiceMetrics)
    : 0.5;
  
  const emotionalAlignment = facialMetrics && voiceMetrics
    ? calculateEmotionalAlignment(facialMetrics, voiceMetrics)
    : 0.5;
  
  // Calculate overall correlation strength
  const correlationStrength = (stressCorrelation + heartRateConsistency + emotionalAlignment) / 3;
  
  // Determine consensus indicators
  const stressConsensus = stressCorrelation > 0.7;
  const emotionalConsensus = emotionalAlignment > 0.6;
  const urgencyConsensus = anamnesisMetrics ? 
    Math.abs((facialMetrics?.stressLevel || 5) - (anamnesisMetrics.urgencyScore / 10)) < 3 : false;
  
  // Calculate consistency score
  const consistencyScore = Math.round(correlationStrength * 100);
  
  // Determine reliability level
  let reliability: 'high' | 'medium' | 'low' = 'low';
  if (consistencyScore >= 80) reliability = 'high';
  else if (consistencyScore >= 60) reliability = 'medium';
  
  // Identify conflicting metrics
  const conflictingMetrics: string[] = [];
  if (stressCorrelation < 0.5) conflictingMetrics.push('Níveis de estresse divergentes');
  if (heartRateConsistency < 0.5) conflictingMetrics.push('Frequência cardíaca inconsistente');
  if (emotionalAlignment < 0.4) conflictingMetrics.push('Estados emocionais conflitantes');
  
  return {
    facialHeartRate: facialMetrics?.heartRate || 0,
    voiceStressLevel: voiceMetrics?.stressLevel || 0,
    anamnesisUrgency: anamnesisMetrics?.urgencyScore || 0,
    consistencyScore,
    reliability,
    conflictingMetrics,
    correlationStrength,
    consensusIndicators: {
      stressConsensus,
      emotionalConsensus,
      urgencyConsensus
    }
  };
};

// Calculate weighted urgency score using all modalities
export const calculateConsolidatedUrgency = (
  facialMetrics: FacialMetrics | null,
  voiceMetrics: VoiceMetrics | null,
  anamnesisMetrics: AnamnesisMetrics | null,
  correlation: CrossModalCorrelation
): { level: string; score: number; confidence: number } => {
  let totalScore = 0;
  let weightSum = 0;
  
  // Anamnesis (highest weight if available)
  if (anamnesisMetrics) {
    const weight = 0.5;
    totalScore += anamnesisMetrics.urgencyScore * weight;
    weightSum += weight;
  }
  
  // Facial analysis (medium weight)
  if (facialMetrics) {
    const weight = 0.3;
    const facialUrgency = (facialMetrics.stressLevel + 
      (facialMetrics.heartRate > 100 ? 20 : 0) +
      (facialMetrics.thermalState === 'possible_fever' ? 15 : 0)) / 10 * 100;
    totalScore += Math.min(facialUrgency, 100) * weight;
    weightSum += weight;
  }
  
  // Voice analysis (medium weight)
  if (voiceMetrics) {
    const weight = 0.2;
    const voiceUrgency = (voiceMetrics.stressLevel * 10 +
      (voiceMetrics.emotionalState === 'stress' ? 20 : 0) +
      (voiceMetrics.respiratoryPattern === 'irregular' ? 15 : 0));
    totalScore += Math.min(voiceUrgency, 100) * weight;
    weightSum += weight;
  }
  
  const finalScore = weightSum > 0 ? totalScore / weightSum : 50;
  
  // Adjust score based on correlation reliability
  const reliabilityMultiplier = correlation.reliability === 'high' ? 1.0 : 
                               correlation.reliability === 'medium' ? 0.9 : 0.8;
  
  const adjustedScore = Math.round(finalScore * reliabilityMultiplier);
  const confidence = Math.round(correlation.consistencyScore * reliabilityMultiplier);
  
  // Determine urgency level
  let level = 'Baixa';
  if (adjustedScore >= 80) level = 'Crítica';
  else if (adjustedScore >= 60) level = 'Alta';
  else if (adjustedScore >= 40) level = 'Média';
  
  return { level, score: adjustedScore, confidence };
};

// Generate comprehensive analysis combining all modalities
export const generateConsolidatedAnalysis = (
  facialMetrics: FacialMetrics | null,
  voiceMetrics: VoiceMetrics | null,
  anamnesisMetrics: AnamnesisMetrics | null
): ConsolidatedAnalysis => {
  const crossModalData = performCrossModalCorrelation(facialMetrics, voiceMetrics, anamnesisMetrics);
  const overallUrgency = calculateConsolidatedUrgency(facialMetrics, voiceMetrics, anamnesisMetrics, crossModalData);
  
  // Combine symptoms from all sources
  const combinedSymptoms: string[] = [];
  if (anamnesisMetrics?.symptoms) combinedSymptoms.push(...anamnesisMetrics.symptoms);
  if (voiceMetrics?.emotionalState && voiceMetrics.emotionalState !== 'neutral') {
    combinedSymptoms.push(`Estado vocal: ${voiceMetrics.emotionalState}`);
  }
  if (facialMetrics?.stressLevel && facialMetrics.stressLevel > 5) {
    combinedSymptoms.push('Sinais faciais de estresse');
  }
  
  // Identify risk factors
  const riskFactors: string[] = [];
  if (facialMetrics?.heartRate && facialMetrics.heartRate > 100) riskFactors.push('Taquicardia detectada');
  if (voiceMetrics?.stressLevel && voiceMetrics.stressLevel > 7) riskFactors.push('Estresse vocal elevado');
  if (facialMetrics?.thermalState === 'possible_fever') riskFactors.push('Possível febre');
  if (crossModalData.conflictingMetrics.length > 0) riskFactors.push('Dados conflitantes requerem atenção');
  
  // Generate consolidated recommendations
  const recommendations: string[] = [];
  if (overallUrgency.level === 'Crítica') {
    recommendations.push('Buscar atendimento médico de emergência imediatamente');
  } else if (overallUrgency.level === 'Alta') {
    recommendations.push('Procurar atendimento médico urgente nas próximas horas');
  } else if (overallUrgency.level === 'Média') {
    recommendations.push('Agendar consulta médica em 24-48 horas');
  } else {
    recommendations.push('Monitoramento e autocuidado');
  }
  
  if (crossModalData.reliability === 'low') {
    recommendations.push('Repetir análise para maior precisão');
  }
  
  if (riskFactors.length > 0) {
    recommendations.push('Informar todos os achados ao médico');
  }
  
  return {
    overallUrgency,
    combinedSymptoms: [...new Set(combinedSymptoms)], // Remove duplicates
    riskFactors,
    recommendations,
    reliability: {
      score: crossModalData.consistencyScore,
      level: crossModalData.reliability,
      dataQuality: assessDataCompleteness(facialMetrics, voiceMetrics, anamnesisMetrics)
    },
    crossModalData,
    biometricCorrelation: {
      heartRateConsistency: facialMetrics && voiceMetrics ? 
        calculateHeartRateConsistency(facialMetrics, voiceMetrics) : 0,
      stressCorrelation: facialMetrics && voiceMetrics ? 
        calculateStressCorrelation(facialMetrics, voiceMetrics) : 0,
      emotionalAlignment: facialMetrics && voiceMetrics ? 
        calculateEmotionalAlignment(facialMetrics, voiceMetrics) : 0
    }
  };
};

// Assess data completeness for quality scoring
export const assessDataCompleteness = (
  facialMetrics: FacialMetrics | null,
  voiceMetrics: VoiceMetrics | null,
  anamnesisMetrics: AnamnesisMetrics | null
): string => {
  const hasData = [facialMetrics, voiceMetrics, anamnesisMetrics].filter(Boolean).length;
  
  if (hasData === 3) return 'Completa';
  if (hasData === 2) return 'Boa';
  if (hasData === 1) return 'Parcial';
  return 'Insuficiente';
};

// Detect statistical outliers in metrics
export const detectOutliers = (
  facialMetrics: FacialMetrics | null,
  voiceMetrics: VoiceMetrics | null
): string[] => {
  const outliers: string[] = [];
  
  if (facialMetrics) {
    if (facialMetrics.heartRate > 120 || facialMetrics.heartRate < 50) {
      outliers.push(`Frequência cardíaca anormal: ${facialMetrics.heartRate} bpm`);
    }
    if (facialMetrics.stressLevel > 9) {
      outliers.push('Nível de estresse facial extremamente alto');
    }
  }
  
  if (voiceMetrics) {
    if (voiceMetrics.stressLevel > 9) {
      outliers.push('Nível de estresse vocal extremamente alto');
    }
    if (voiceMetrics.confidence < 0.3) {
      outliers.push('Confiança muito baixa na análise de voz');
    }
  }
  
  return outliers;
};