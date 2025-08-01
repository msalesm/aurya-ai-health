import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdvancedVoiceMetrics {
  fundamentalFrequency: number;
  jitter: number;
  shimmer: number;
  harmonicToNoiseRatio: number;
  spectralCentroid: number;
  tremor: number;
  breathingPattern: {
    rate: number;
    regularity: number;
    pauseDuration: number;
  };
  speechProsody: {
    tempo: number;
    rhythmVariability: number;
    stressPatterns: number[];
  };
  voiceQuality: {
    roughness: number;
    breathiness: number;
    strain: number;
  };
  emotionalIndicators: {
    stress: number;
    anxiety: number;
    fatigue: number;
    confidence: number;
  };
}

export interface EnhancedVoiceAnalysis {
  basicMetrics: any;
  advancedMetrics: AdvancedVoiceMetrics;
  confidence: number;
  recommendations: string[];
  riskFactors: string[];
}

export const useAdvancedVoiceAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeAdvancedVoicePatterns = useCallback(async (audioBlob: Blob): Promise<EnhancedVoiceAnalysis> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Pré-processamento de áudio
      const processedAudio = await preprocessAudio(audioBlob);
      
      // Análise espectral avançada
      const spectralFeatures = await extractSpectralFeatures(processedAudio);
      
      // Análise de padrões temporais
      const temporalFeatures = await extractTemporalFeatures(processedAudio);
      
      // Análise prosódica
      const prosodicFeatures = await extractProsodicFeatures(processedAudio);
      
      // Integrar com análise híbrida existente
      const hybridAnalysis = await performHybridAnalysis(audioBlob);
      
      const advancedMetrics: AdvancedVoiceMetrics = {
        fundamentalFrequency: spectralFeatures.f0,
        jitter: temporalFeatures.jitter,
        shimmer: temporalFeatures.shimmer,
        harmonicToNoiseRatio: spectralFeatures.hnr,
        spectralCentroid: spectralFeatures.centroid,
        tremor: temporalFeatures.tremor,
        breathingPattern: {
          rate: temporalFeatures.breathingRate,
          regularity: temporalFeatures.breathingRegularity,
          pauseDuration: temporalFeatures.avgPauseDuration
        },
        speechProsody: {
          tempo: prosodicFeatures.tempo,
          rhythmVariability: prosodicFeatures.rhythmVar,
          stressPatterns: prosodicFeatures.stressPatterns
        },
        voiceQuality: {
          roughness: spectralFeatures.roughness,
          breathiness: spectralFeatures.breathiness,
          strain: spectralFeatures.strain
        },
        emotionalIndicators: {
          stress: hybridAnalysis.stress_level || 0,
          anxiety: calculateAnxietyLevel(spectralFeatures, temporalFeatures),
          fatigue: calculateFatigueLevel(prosodicFeatures),
          confidence: hybridAnalysis.confidence_score || 0
        }
      };

      const analysis: EnhancedVoiceAnalysis = {
        basicMetrics: hybridAnalysis,
        advancedMetrics,
        confidence: calculateOverallConfidence(advancedMetrics),
        recommendations: generateRecommendations(advancedMetrics),
        riskFactors: identifyRiskFactors(advancedMetrics)
      };

      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na análise de voz';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyzeAdvancedVoicePatterns,
    isAnalyzing,
    error
  };
};

// Funções auxiliares de processamento
const preprocessAudio = async (audioBlob: Blob): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Aplicar filtros de ruído e normalização
  const filteredBuffer = applyNoiseFilter(audioBuffer);
  const normalizedBuffer = normalizeAudio(filteredBuffer);
  
  return normalizedBuffer;
};

const applyNoiseFilter = (audioBuffer: AudioBuffer): AudioBuffer => {
  // Implementar filtro passa-alta para remover ruído de baixa frequência
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const filteredBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = filteredBuffer.getChannelData(channel);
    
    // Filtro simples passa-alta (HPF) para remover ruído < 80Hz
    let previousSample = 0;
    const alpha = 0.99; // Fator do filtro
    
    for (let i = 0; i < inputData.length; i++) {
      const currentSample = inputData[i];
      outputData[i] = alpha * (outputData[i - 1] || 0) + alpha * (currentSample - previousSample);
      previousSample = currentSample;
    }
  }

  return filteredBuffer;
};

const normalizeAudio = (audioBuffer: AudioBuffer): AudioBuffer => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const normalizedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = normalizedBuffer.getChannelData(channel);
    
    // Encontrar valor máximo para normalização
    let maxValue = 0;
    for (let i = 0; i < inputData.length; i++) {
      maxValue = Math.max(maxValue, Math.abs(inputData[i]));
    }
    
    // Normalizar para utilizar toda a faixa dinâmica
    const normalizationFactor = maxValue > 0 ? 0.95 / maxValue : 1;
    for (let i = 0; i < inputData.length; i++) {
      outputData[i] = inputData[i] * normalizationFactor;
    }
  }

  return normalizedBuffer;
};

const extractSpectralFeatures = async (audioBuffer: AudioBuffer) => {
  const channelData = audioBuffer.getChannelData(0);
  const fftSize = 2048;
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Análise espectral usando FFT
  const fftData = performFFT(channelData, fftSize);
  
  return {
    f0: estimateFundamentalFrequency(fftData, audioBuffer.sampleRate),
    hnr: calculateHNR(fftData),
    centroid: calculateSpectralCentroid(fftData, audioBuffer.sampleRate),
    roughness: calculateRoughness(fftData),
    breathiness: calculateBreathiness(fftData),
    strain: calculateStrain(fftData)
  };
};

const extractTemporalFeatures = async (audioBuffer: AudioBuffer) => {
  const channelData = audioBuffer.getChannelData(0);
  
  return {
    jitter: calculateJitter(channelData, audioBuffer.sampleRate),
    shimmer: calculateShimmer(channelData),
    tremor: calculateTremor(channelData, audioBuffer.sampleRate),
    breathingRate: detectBreathingRate(channelData, audioBuffer.sampleRate),
    breathingRegularity: calculateBreathingRegularity(channelData),
    avgPauseDuration: calculatePauseDuration(channelData, audioBuffer.sampleRate)
  };
};

const extractProsodicFeatures = async (audioBuffer: AudioBuffer) => {
  const channelData = audioBuffer.getChannelData(0);
  
  return {
    tempo: calculateTempo(channelData, audioBuffer.sampleRate),
    rhythmVar: calculateRhythmVariability(channelData),
    stressPatterns: detectStressPatterns(channelData, audioBuffer.sampleRate)
  };
};

const performHybridAnalysis = async (audioBlob: Blob) => {
  // Converter para base64 para enviar ao edge function
  const base64Audio = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(audioBlob);
  });

  const { data, error } = await supabase.functions.invoke('hybrid-voice-analysis', {
    body: { 
      audioData: base64Audio,
      userId: 'anonymous-user', // Fallback para análise sem autenticação
      preferredProvider: 'openai'
    }
  });

  if (error) throw error;
  return data;
};

// Funções matemáticas para análise avançada
const performFFT = (data: Float32Array, fftSize: number): Float32Array => {
  // Implementação simplificada de FFT (para produção, usar biblioteca como FFT.js)
  const output = new Float32Array(fftSize / 2);
  
  for (let k = 0; k < fftSize / 2; k++) {
    let sumReal = 0;
    let sumImag = 0;
    
    for (let n = 0; n < Math.min(data.length, fftSize); n++) {
      const angle = (-2 * Math.PI * k * n) / fftSize;
      sumReal += data[n] * Math.cos(angle);
      sumImag += data[n] * Math.sin(angle);
    }
    
    output[k] = Math.sqrt(sumReal * sumReal + sumImag * sumImag);
  }
  
  return output;
};

const estimateFundamentalFrequency = (fftData: Float32Array, sampleRate: number): number => {
  let maxMagnitude = 0;
  let f0Index = 0;
  
  // Buscar pico entre 80Hz e 400Hz (faixa vocal típica)
  const minIndex = Math.floor((80 * fftData.length * 2) / sampleRate);
  const maxIndex = Math.floor((400 * fftData.length * 2) / sampleRate);
  
  for (let i = minIndex; i < maxIndex && i < fftData.length; i++) {
    if (fftData[i] > maxMagnitude) {
      maxMagnitude = fftData[i];
      f0Index = i;
    }
  }
  
  return (f0Index * sampleRate) / (fftData.length * 2);
};

const calculateHNR = (fftData: Float32Array): number => {
  // Relação harmônico/ruído simplificada
  let harmonicEnergy = 0;
  let noiseEnergy = 0;
  
  for (let i = 0; i < fftData.length; i++) {
    if (i % 10 < 5) { // Aproximação de componentes harmônicos
      harmonicEnergy += fftData[i] * fftData[i];
    } else {
      noiseEnergy += fftData[i] * fftData[i];
    }
  }
  
  return noiseEnergy > 0 ? 10 * Math.log10(harmonicEnergy / noiseEnergy) : 0;
};

const calculateSpectralCentroid = (fftData: Float32Array, sampleRate: number): number => {
  let weightedSum = 0;
  let magnitudeSum = 0;
  
  for (let i = 0; i < fftData.length; i++) {
    const frequency = (i * sampleRate) / (fftData.length * 2);
    weightedSum += frequency * fftData[i];
    magnitudeSum += fftData[i];
  }
  
  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
};

const calculateJitter = (data: Float32Array, sampleRate: number): number => {
  // Variação período a período na frequência fundamental
  const periods = detectPeriods(data, sampleRate);
  if (periods.length < 2) return 0;
  
  let jitterSum = 0;
  for (let i = 1; i < periods.length; i++) {
    jitterSum += Math.abs(periods[i] - periods[i - 1]);
  }
  
  const avgPeriod = periods.reduce((a, b) => a + b, 0) / periods.length;
  return avgPeriod > 0 ? (jitterSum / (periods.length - 1)) / avgPeriod : 0;
};

const calculateShimmer = (data: Float32Array): number => {
  // Variação período a período na amplitude
  const amplitudes = detectAmplitudes(data);
  if (amplitudes.length < 2) return 0;
  
  let shimmerSum = 0;
  for (let i = 1; i < amplitudes.length; i++) {
    shimmerSum += Math.abs(amplitudes[i] - amplitudes[i - 1]);
  }
  
  const avgAmplitude = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
  return avgAmplitude > 0 ? (shimmerSum / (amplitudes.length - 1)) / avgAmplitude : 0;
};

const calculateTremor = (data: Float32Array, sampleRate: number): number => {
  // Detectar modulação de baixa frequência (4-12 Hz)
  const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
  let tremorSum = 0;
  let windowCount = 0;
  
  for (let i = 0; i < data.length - windowSize; i += windowSize) {
    const window = data.slice(i, i + windowSize);
    const variance = calculateVariance(window);
    tremorSum += variance;
    windowCount++;
  }
  
  return windowCount > 0 ? tremorSum / windowCount : 0;
};

// Funções auxiliares
const detectPeriods = (data: Float32Array, sampleRate: number): number[] => {
  // Implementação simplificada de detecção de períodos
  const periods: number[] = [];
  const minPeriod = Math.floor(sampleRate / 400); // 400Hz max
  const maxPeriod = Math.floor(sampleRate / 80);  // 80Hz min
  
  for (let i = minPeriod; i < data.length - maxPeriod; i++) {
    // Detectar cruzamentos por zero ou picos
    if (data[i] > 0 && data[i - 1] <= 0) {
      let nextCrossing = -1;
      for (let j = i + minPeriod; j < Math.min(i + maxPeriod, data.length - 1); j++) {
        if (data[j] > 0 && data[j - 1] <= 0) {
          nextCrossing = j;
          break;
        }
      }
      if (nextCrossing > 0) {
        periods.push(nextCrossing - i);
        i = nextCrossing - 1;
      }
    }
  }
  
  return periods;
};

const detectAmplitudes = (data: Float32Array): number[] => {
  const amplitudes: number[] = [];
  const windowSize = 1024;
  
  for (let i = 0; i < data.length - windowSize; i += windowSize / 2) {
    const window = data.slice(i, i + windowSize);
    const rms = Math.sqrt(window.reduce((sum, val) => sum + val * val, 0) / window.length);
    amplitudes.push(rms);
  }
  
  return amplitudes;
};

const calculateVariance = (data: Float32Array): number => {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squaredDiffs = data.map(val => (val - mean) * (val - mean));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
};

const detectBreathingRate = (data: Float32Array, sampleRate: number): number => {
  // Detectar pausas respiratórias (energia baixa)
  const windowSize = Math.floor(sampleRate * 0.5); // 500ms windows
  let breathCount = 0;
  let inPause = false;
  
  for (let i = 0; i < data.length - windowSize; i += windowSize / 4) {
    const window = data.slice(i, i + windowSize);
    const energy = window.reduce((sum, val) => sum + val * val, 0) / window.length;
    const threshold = 0.001; // Ajustar conforme necessário
    
    if (energy < threshold && !inPause) {
      breathCount++;
      inPause = true;
    } else if (energy >= threshold) {
      inPause = false;
    }
  }
  
  const durationMinutes = data.length / sampleRate / 60;
  return durationMinutes > 0 ? breathCount / durationMinutes : 0;
};

const calculateBreathingRegularity = (data: Float32Array): number => {
  // Calcular regularidade dos padrões respiratórios
  const energyWindows = [];
  const windowSize = 1024;
  
  for (let i = 0; i < data.length - windowSize; i += windowSize / 2) {
    const window = data.slice(i, i + windowSize);
    const energy = window.reduce((sum, val) => sum + val * val, 0) / window.length;
    energyWindows.push(energy);
  }
  
  if (energyWindows.length < 2) return 1;
  
  const variance = calculateVariance(new Float32Array(energyWindows));
  const mean = energyWindows.reduce((sum, val) => sum + val, 0) / energyWindows.length;
  
  return mean > 0 ? 1 - Math.min(variance / mean, 1) : 0;
};

const calculatePauseDuration = (data: Float32Array, sampleRate: number): number => {
  const threshold = 0.001;
  let totalPauseDuration = 0;
  let pauseCount = 0;
  let currentPauseLength = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) < threshold) {
      currentPauseLength++;
    } else {
      if (currentPauseLength > 0) {
        totalPauseDuration += currentPauseLength / sampleRate;
        pauseCount++;
        currentPauseLength = 0;
      }
    }
  }
  
  return pauseCount > 0 ? totalPauseDuration / pauseCount : 0;
};

const calculateTempo = (data: Float32Array, sampleRate: number): number => {
  // Calcular taxa de fala (sílabas por minuto)
  const energyWindows = [];
  const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
  
  for (let i = 0; i < data.length - windowSize; i += windowSize) {
    const window = data.slice(i, i + windowSize);
    const energy = window.reduce((sum, val) => sum + val * val, 0) / window.length;
    energyWindows.push(energy);
  }
  
  // Detectar picos de energia (aproximação de sílabas)
  const threshold = energyWindows.reduce((sum, val) => sum + val, 0) / energyWindows.length * 1.5;
  let syllableCount = 0;
  let inSyllable = false;
  
  for (const energy of energyWindows) {
    if (energy > threshold && !inSyllable) {
      syllableCount++;
      inSyllable = true;
    } else if (energy <= threshold) {
      inSyllable = false;
    }
  }
  
  const durationMinutes = data.length / sampleRate / 60;
  return durationMinutes > 0 ? syllableCount / durationMinutes : 0;
};

const calculateRhythmVariability = (data: Float32Array): number => {
  // Calcular variabilidade rítmica
  const energyWindows = [];
  const windowSize = 1024;
  
  for (let i = 0; i < data.length - windowSize; i += windowSize / 2) {
    const window = data.slice(i, i + windowSize);
    const energy = window.reduce((sum, val) => sum + val * val, 0) / window.length;
    energyWindows.push(energy);
  }
  
  if (energyWindows.length < 2) return 0;
  
  return calculateVariance(new Float32Array(energyWindows));
};

const detectStressPatterns = (data: Float32Array, sampleRate: number): number[] => {
  // Detectar padrões de stress vocal
  const stressPatterns: number[] = [];
  const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
  
  for (let i = 0; i < data.length - windowSize; i += windowSize / 2) {
    const window = data.slice(i, i + windowSize);
    const energy = window.reduce((sum, val) => sum + val * val, 0) / window.length;
    const highFreqEnergy = calculateHighFrequencyEnergy(window);
    
    const stressIndicator = energy > 0 ? highFreqEnergy / energy : 0;
    stressPatterns.push(stressIndicator);
  }
  
  return stressPatterns;
};

const calculateHighFrequencyEnergy = (data: Float32Array): number => {
  // Calcular energia em altas frequências (indicador de stress)
  const fftData = performFFT(data, data.length);
  let highFreqEnergy = 0;
  
  const startIndex = Math.floor(fftData.length * 0.7); // 70% das frequências
  for (let i = startIndex; i < fftData.length; i++) {
    highFreqEnergy += fftData[i] * fftData[i];
  }
  
  return highFreqEnergy;
};

const calculateRoughness = (fftData: Float32Array): number => {
  // Calcular rugosidade vocal baseada em irregularidades espectrais
  let roughnessSum = 0;
  for (let i = 1; i < fftData.length - 1; i++) {
    const variation = Math.abs(fftData[i] - (fftData[i - 1] + fftData[i + 1]) / 2);
    roughnessSum += variation;
  }
  return roughnessSum / (fftData.length - 2);
};

const calculateBreathiness = (fftData: Float32Array): number => {
  // Calcular soprosidade baseada na energia em altas frequências
  let lowFreqEnergy = 0;
  let highFreqEnergy = 0;
  const midPoint = Math.floor(fftData.length / 2);
  
  for (let i = 0; i < midPoint; i++) {
    lowFreqEnergy += fftData[i] * fftData[i];
  }
  
  for (let i = midPoint; i < fftData.length; i++) {
    highFreqEnergy += fftData[i] * fftData[i];
  }
  
  const totalEnergy = lowFreqEnergy + highFreqEnergy;
  return totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;
};

const calculateStrain = (fftData: Float32Array): number => {
  // Calcular tensão vocal baseada em picos espectrais abruptos
  let strainSum = 0;
  let peakCount = 0;
  
  for (let i = 1; i < fftData.length - 1; i++) {
    if (fftData[i] > fftData[i - 1] && fftData[i] > fftData[i + 1]) {
      const prominence = fftData[i] - Math.max(fftData[i - 1], fftData[i + 1]);
      if (prominence > 0.1) { // Threshold para picos significativos
        strainSum += prominence;
        peakCount++;
      }
    }
  }
  
  return peakCount > 0 ? strainSum / peakCount : 0;
};

const calculateAnxietyLevel = (spectral: any, temporal: any): number => {
  // Combinar métricas para estimar nível de ansiedade
  const highFreqRatio = spectral.centroid > 2000 ? 1 : spectral.centroid / 2000;
  const jitterFactor = Math.min(temporal.jitter * 10, 1);
  const tremorFactor = Math.min(temporal.tremor * 5, 1);
  
  return Math.min((highFreqRatio + jitterFactor + tremorFactor) / 3, 1);
};

const calculateFatigueLevel = (prosodic: any): number => {
  // Estimar fadiga baseada em características prosódicas
  const lowTempo = prosodic.tempo < 120 ? (120 - prosodic.tempo) / 120 : 0;
  const lowVariability = prosodic.rhythmVar < 0.1 ? (0.1 - prosodic.rhythmVar) / 0.1 : 0;
  
  return Math.min((lowTempo + lowVariability) / 2, 1);
};

const calculateOverallConfidence = (metrics: AdvancedVoiceMetrics): number => {
  // Calcular confiança geral baseada na qualidade das métricas
  const qualityFactors = [
    metrics.harmonicToNoiseRatio > 10 ? 1 : metrics.harmonicToNoiseRatio / 10,
    1 - Math.min(metrics.jitter * 10, 1),
    1 - Math.min(metrics.shimmer * 10, 1),
    metrics.breathingPattern.regularity
  ];
  
  const avgQuality = qualityFactors.reduce((sum, factor) => sum + factor, 0) / qualityFactors.length;
  return Math.round(avgQuality * 100);
};

const generateRecommendations = (metrics: AdvancedVoiceMetrics): string[] => {
  const recommendations: string[] = [];
  
  if (metrics.jitter > 0.1) {
    recommendations.push("Avaliar estabilidade vocal - possível tensão");
  }
  
  if (metrics.voiceQuality.strain > 0.3) {
    recommendations.push("Repouso vocal recomendado");
  }
  
  if (metrics.emotionalIndicators.stress > 0.7) {
    recommendations.push("Considerar avaliação de estresse");
  }
  
  if (metrics.breathingPattern.regularity < 0.5) {
    recommendations.push("Exercícios respiratórios podem ser benéficos");
  }
  
  if (metrics.voiceQuality.breathiness > 0.4) {
    recommendations.push("Avaliação otorrinolaringológica recomendada");
  }
  
  return recommendations;
};

const identifyRiskFactors = (metrics: AdvancedVoiceMetrics): string[] => {
  const riskFactors: string[] = [];
  
  if (metrics.harmonicToNoiseRatio < 5) {
    riskFactors.push("Baixa qualidade vocal");
  }
  
  if (metrics.tremor > 0.05) {
    riskFactors.push("Tremor vocal detectado");
  }
  
  if (metrics.emotionalIndicators.anxiety > 0.8) {
    riskFactors.push("Sinais de ansiedade elevada");
  }
  
  if (metrics.speechProsody.tempo < 60) {
    riskFactors.push("Fala muito lenta - possível fadiga");
  }
  
  return riskFactors;
};