import { useState, useRef, useCallback } from 'react';

interface AudioFeatures {
  pitch: number;
  volume: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  mfcc: number[];
  duration: number;
}

interface RealAudioAnalysis {
  features: AudioFeatures;
  stressLevel: number;
  emotionalState: string;
  breathingPattern: string;
  voiceQuality: string;
  confidence: number;
}

export const useRealAudioAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RealAudioAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeRealAudio = useCallback(async (audioBlob: Blob): Promise<RealAudioAnalysis> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Create AudioContext for analysis
      const audioContext = new AudioContext();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const duration = audioBuffer.duration;

      // Extract real audio features
      const features = extractAudioFeatures(channelData, sampleRate, duration);
      
      // Analyze features for medical insights
      const medicalAnalysis = analyzeMedicalFeatures(features);
      
      const result: RealAudioAnalysis = {
        features,
        ...medicalAnalysis,
        confidence: calculateConfidence(features, medicalAnalysis)
      };

      setAnalysis(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na análise de áudio';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyzeRealAudio,
    isAnalyzing,
    analysis,
    error
  };
};

function extractAudioFeatures(audioData: Float32Array, sampleRate: number, duration: number): AudioFeatures {
  // 1. Fundamental Frequency (Pitch) - usando autocorrelação
  const pitch = calculatePitch(audioData, sampleRate);
  
  // 2. Volume (RMS)
  const volume = calculateVolume(audioData);
  
  // 3. Spectral Centroid (centro espectral)
  const spectralCentroid = calculateSpectralCentroid(audioData, sampleRate);
  
  // 4. Zero Crossing Rate
  const zeroCrossingRate = calculateZeroCrossingRate(audioData);
  
  // 5. MFCC simplificado (apenas os primeiros coeficientes)
  const mfcc = calculateSimpleMFCC(audioData);

  return {
    pitch,
    volume,
    spectralCentroid,
    zeroCrossingRate,
    mfcc,
    duration
  };
}

function calculatePitch(audioData: Float32Array, sampleRate: number): number {
  const minPeriod = Math.floor(sampleRate / 400); // 400 Hz max
  const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
  
  let bestPeriod = 0;
  let bestCorrelation = 0;

  for (let period = minPeriod; period < Math.min(maxPeriod, audioData.length / 2); period++) {
    let correlation = 0;
    let normalizer = 0;
    
    for (let i = 0; i < audioData.length - period; i++) {
      correlation += audioData[i] * audioData[i + period];
      normalizer += audioData[i] * audioData[i];
    }
    
    correlation = normalizer > 0 ? correlation / normalizer : 0;
    
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }

  return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
}

function calculateVolume(audioData: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i];
  }
  return Math.sqrt(sum / audioData.length);
}

function calculateSpectralCentroid(audioData: Float32Array, sampleRate: number): number {
  // FFT simplificado para calcular centroide espectral
  const fftSize = Math.min(2048, Math.pow(2, Math.floor(Math.log2(audioData.length))));
  const fft = simpleFFT(audioData.slice(0, fftSize));
  
  let weightedSum = 0;
  let magnitudeSum = 0;
  
  for (let i = 0; i < fft.length / 2; i++) {
    const magnitude = Math.sqrt(fft[i * 2] * fft[i * 2] + fft[i * 2 + 1] * fft[i * 2 + 1]);
    const frequency = (i * sampleRate) / fftSize;
    
    weightedSum += frequency * magnitude;
    magnitudeSum += magnitude;
  }
  
  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
}

function calculateZeroCrossingRate(audioData: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < audioData.length; i++) {
    if ((audioData[i] >= 0) !== (audioData[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / audioData.length;
}

function calculateSimpleMFCC(audioData: Float32Array): number[] {
  // MFCC simplificado - apenas energia em diferentes bandas de frequência
  const numBands = 8;
  const fftSize = Math.min(1024, Math.pow(2, Math.floor(Math.log2(audioData.length))));
  const fft = simpleFFT(audioData.slice(0, fftSize));
  
  const mfcc: number[] = [];
  const bandSize = Math.floor(fft.length / 2 / numBands);
  
  for (let band = 0; band < numBands; band++) {
    let energy = 0;
    const start = band * bandSize;
    const end = Math.min((band + 1) * bandSize, fft.length / 2);
    
    for (let i = start; i < end; i++) {
      const magnitude = Math.sqrt(fft[i * 2] * fft[i * 2] + fft[i * 2 + 1] * fft[i * 2 + 1]);
      energy += magnitude;
    }
    
    mfcc.push(energy / (end - start));
  }
  
  return mfcc;
}

function simpleFFT(audioData: Float32Array): Float32Array {
  // FFT muito simplificada para demonstração
  // Em produção, usar uma biblioteca como fft.js
  const N = audioData.length;
  const result = new Float32Array(N * 2);
  
  for (let k = 0; k < N; k++) {
    let realSum = 0;
    let imagSum = 0;
    
    for (let n = 0; n < N; n++) {
      const angle = -2 * Math.PI * k * n / N;
      realSum += audioData[n] * Math.cos(angle);
      imagSum += audioData[n] * Math.sin(angle);
    }
    
    result[k * 2] = realSum;
    result[k * 2 + 1] = imagSum;
  }
  
  return result;
}

function analyzeMedicalFeatures(features: AudioFeatures) {
  // Análise médica baseada em características reais do áudio
  
  // 1. Nível de stress baseado em variações de pitch e volume
  let stressLevel = 0;
  
  if (features.pitch > 200 || features.pitch < 80) stressLevel += 2; // Pitch anormal
  if (features.volume > 0.5) stressLevel += 1; // Volume alto
  if (features.zeroCrossingRate > 0.1) stressLevel += 1; // Voz trêmula
  
  // Variação nos coeficientes MFCC indica stress
  const mfccVariation = features.mfcc.reduce((sum, val, idx, arr) => {
    if (idx === 0) return 0;
    return sum + Math.abs(val - arr[idx - 1]);
  }, 0) / (features.mfcc.length - 1);
  
  if (mfccVariation > 0.02) stressLevel += 1;
  
  stressLevel = Math.min(10, stressLevel);

  // 2. Estado emocional baseado em características espectrais
  let emotionalState = 'neutral';
  
  if (features.pitch < 100 && features.volume < 0.2) emotionalState = 'sadness';
  else if (features.pitch > 180 && features.volume > 0.4) emotionalState = 'anxiety';
  else if (features.pitch > 150 && features.spectralCentroid > 1000) emotionalState = 'excitement';
  else if (stressLevel > 6) emotionalState = 'stress';

  // 3. Padrão respiratório baseado em pausas e continuidade
  let breathingPattern = 'normal';
  
  if (features.duration < 2) breathingPattern = 'shallow';
  else if (features.zeroCrossingRate < 0.02) breathingPattern = 'labored';
  else if (features.volume < 0.1) breathingPattern = 'weak';

  // 4. Qualidade da voz
  let voiceQuality = 'clear';
  
  if (features.zeroCrossingRate > 0.08) voiceQuality = 'rough';
  else if (features.spectralCentroid < 500) voiceQuality = 'hoarse';
  else if (features.volume < 0.15) voiceQuality = 'weak';

  return {
    stressLevel,
    emotionalState,
    breathingPattern,
    voiceQuality
  };
}

function calculateConfidence(features: AudioFeatures, analysis: any): number {
  let confidence = 0.7; // Base confidence

  // Confiança baseada na qualidade do áudio
  if (features.volume > 0.1) confidence += 0.1;
  if (features.duration > 1) confidence += 0.1;
  if (features.pitch > 80 && features.pitch < 300) confidence += 0.1;

  return Math.min(0.95, confidence);
}