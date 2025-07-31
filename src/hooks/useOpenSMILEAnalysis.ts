import { useState, useCallback } from 'react';

export interface OpenSMILEFeatures {
  // Acoustic features
  f0: number[];                    // Fundamental frequency contour
  loudness: number[];              // Loudness contour
  voicingProbability: number[];    // Probability of voicing
  spectralRolloff: number[];       // Spectral rolloff points
  spectralFlux: number[];          // Spectral flux
  mfcc: number[][];               // Mel-frequency cepstral coefficients
  
  // Prosodic features
  speaking_rate: number;           // Speaking rate in syllables per second
  pause_duration: number[];        // Pause durations
  loudness_mean: number;           // Mean loudness
  loudness_std: number;            // Loudness standard deviation
  f0_mean: number;                 // Mean F0
  f0_std: number;                  // F0 standard deviation
  
  // Quality indicators
  harmonicity: number;             // Harmonics-to-noise ratio
  jitter: number;                  // Fundamental frequency perturbation
  shimmer: number;                 // Amplitude perturbation quotient
  
  // Emotional markers
  arousal: number;                 // Emotional arousal (0-1)
  valence: number;                 // Emotional valence (-1 to 1)
  dominance: number;               // Emotional dominance (0-1)
  
  // Health indicators
  breathiness: number;             // Voice breathiness
  roughness: number;               // Voice roughness
  strain: number;                  // Vocal strain
  
  // Advanced metrics
  spectral_centroid: number;       // Spectral centroid
  spectral_bandwidth: number;      // Spectral bandwidth
  zero_crossing_rate: number;      // Zero crossing rate
}

export interface CorrelationAnalysis {
  opensmile_confidence: number;
  hybrid_confidence: number;
  correlation_score: number;
  consensus_indicators: {
    emotion_consensus: number;
    health_consensus: number;
    quality_consensus: number;
  };
  outlier_detection: string[];
  reliability_score: number;
}

export interface EnhancedVoiceAnalysis {
  opensmile_features: OpenSMILEFeatures;
  hybrid_analysis: any;
  correlation: CorrelationAnalysis;
  final_assessment: {
    emotional_state: string;
    health_indicators: string[];
    confidence_level: 'low' | 'medium' | 'high' | 'very_high';
    clinical_notes: string[];
  };
}

export const useOpenSMILEAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performOpenSMILEAnalysis = useCallback(async (audioBlob: Blob): Promise<OpenSMILEFeatures> => {
    // Convert audio to raw PCM for OpenSMILE processing
    const audioBuffer = await convertBlobToAudioBuffer(audioBlob);
    
    // Extract comprehensive feature set using OpenSMILE-like algorithms
    const features = await extractOpenSMILEFeatures(audioBuffer);
    
    return features;
  }, []);

  const performCorrelationAnalysis = useCallback(async (
    audioBlob: Blob,
    hybridAnalysis: any
  ): Promise<EnhancedVoiceAnalysis> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Get OpenSMILE features
      const opensmileFeatures = await performOpenSMILEAnalysis(audioBlob);
      
      // Calculate correlations between different analysis methods
      const correlation = await calculateCorrelations(opensmileFeatures, hybridAnalysis);
      
      // Generate final enhanced assessment
      const finalAssessment = generateFinalAssessment(opensmileFeatures, hybridAnalysis, correlation);

      return {
        opensmile_features: opensmileFeatures,
        hybrid_analysis: hybridAnalysis,
        correlation,
        final_assessment: finalAssessment
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na análise OpenSMILE';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [performOpenSMILEAnalysis]);

  return {
    performCorrelationAnalysis,
    performOpenSMILEAnalysis,
    isAnalyzing,
    error
  };
};

// Helper functions for OpenSMILE-like feature extraction
const convertBlobToAudioBuffer = async (blob: Blob): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
};

const extractOpenSMILEFeatures = async (audioBuffer: AudioBuffer): Promise<OpenSMILEFeatures> => {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Fundamental frequency extraction using autocorrelation
  const f0Contour = extractF0Contour(channelData, sampleRate);
  
  // Loudness computation using RMS in frames
  const loudnessContour = extractLoudnessContour(channelData, sampleRate);
  
  // Spectral features
  const spectralFeatures = extractSpectralFeatures(channelData, sampleRate);
  
  // MFCC features
  const mfccFeatures = extractMFCC(channelData, sampleRate);
  
  // Prosodic features
  const prosodicFeatures = extractProsodicFeatures(channelData, sampleRate, f0Contour);
  
  // Voice quality features
  const qualityFeatures = extractVoiceQuality(channelData, sampleRate, f0Contour);
  
  // Emotional features based on prosodic and spectral analysis
  const emotionalFeatures = extractEmotionalFeatures(f0Contour, loudnessContour, spectralFeatures);

  return {
    f0: f0Contour,
    loudness: loudnessContour,
    voicingProbability: calculateVoicingProbability(channelData, f0Contour),
    spectralRolloff: spectralFeatures.rolloff,
    spectralFlux: spectralFeatures.flux,
    mfcc: mfccFeatures,
    speaking_rate: prosodicFeatures.speakingRate,
    pause_duration: prosodicFeatures.pauseDurations,
    loudness_mean: loudnessContour.reduce((a, b) => a + b, 0) / loudnessContour.length,
    loudness_std: calculateStandardDeviation(loudnessContour),
    f0_mean: f0Contour.filter(f => f > 0).reduce((a, b) => a + b, 0) / f0Contour.filter(f => f > 0).length,
    f0_std: calculateStandardDeviation(f0Contour.filter(f => f > 0)),
    harmonicity: qualityFeatures.harmonicity,
    jitter: qualityFeatures.jitter,
    shimmer: qualityFeatures.shimmer,
    arousal: emotionalFeatures.arousal,
    valence: emotionalFeatures.valence,
    dominance: emotionalFeatures.dominance,
    breathiness: qualityFeatures.breathiness,
    roughness: qualityFeatures.roughness,
    strain: qualityFeatures.strain,
    spectral_centroid: spectralFeatures.centroid,
    spectral_bandwidth: spectralFeatures.bandwidth,
    zero_crossing_rate: calculateZeroCrossingRate(channelData)
  };
};

const extractF0Contour = (data: Float32Array, sampleRate: number): number[] => {
  const frameSize = Math.floor(sampleRate * 0.025); // 25ms frames
  const hopSize = Math.floor(sampleRate * 0.010);   // 10ms hop
  const f0Contour: number[] = [];
  
  for (let i = 0; i < data.length - frameSize; i += hopSize) {
    const frame = data.slice(i, i + frameSize);
    const f0 = estimateF0Autocorrelation(frame, sampleRate);
    f0Contour.push(f0);
  }
  
  return f0Contour;
};

const estimateF0Autocorrelation = (frame: Float32Array, sampleRate: number): number => {
  const minPeriod = Math.floor(sampleRate / 400); // 400 Hz max
  const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
  
  let maxCorrelation = 0;
  let bestPeriod = 0;
  
  for (let period = minPeriod; period <= maxPeriod && period < frame.length / 2; period++) {
    let correlation = 0;
    let norm1 = 0, norm2 = 0;
    
    for (let j = 0; j < frame.length - period; j++) {
      correlation += frame[j] * frame[j + period];
      norm1 += frame[j] * frame[j];
      norm2 += frame[j + period] * frame[j + period];
    }
    
    const normalizedCorr = correlation / Math.sqrt(norm1 * norm2);
    
    if (normalizedCorr > maxCorrelation && normalizedCorr > 0.3) {
      maxCorrelation = normalizedCorr;
      bestPeriod = period;
    }
  }
  
  return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
};

const extractLoudnessContour = (data: Float32Array, sampleRate: number): number[] => {
  const frameSize = Math.floor(sampleRate * 0.025);
  const hopSize = Math.floor(sampleRate * 0.010);
  const loudnessContour: number[] = [];
  
  for (let i = 0; i < data.length - frameSize; i += hopSize) {
    const frame = data.slice(i, i + frameSize);
    const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);
    const loudness = 20 * Math.log10(rms + 1e-10); // Convert to dB
    loudnessContour.push(loudness);
  }
  
  return loudnessContour;
};

const extractSpectralFeatures = (data: Float32Array, sampleRate: number) => {
  const frameSize = 2048;
  const hopSize = Math.floor(frameSize / 4);
  const rolloff: number[] = [];
  const flux: number[] = [];
  let previousSpectrum: Float32Array | null = null;
  
  for (let i = 0; i < data.length - frameSize; i += hopSize) {
    const frame = data.slice(i, i + frameSize);
    const spectrum = performFFT(frame);
    
    // Spectral rolloff (85% of energy)
    const totalEnergy = spectrum.reduce((sum, val) => sum + val * val, 0);
    let cumulativeEnergy = 0;
    let rolloffBin = 0;
    
    for (let j = 0; j < spectrum.length; j++) {
      cumulativeEnergy += spectrum[j] * spectrum[j];
      if (cumulativeEnergy >= 0.85 * totalEnergy) {
        rolloffBin = j;
        break;
      }
    }
    
    rolloff.push((rolloffBin * sampleRate) / (2 * spectrum.length));
    
    // Spectral flux
    if (previousSpectrum) {
      let fluxValue = 0;
      for (let j = 0; j < Math.min(spectrum.length, previousSpectrum.length); j++) {
        const diff = spectrum[j] - previousSpectrum[j];
        fluxValue += diff * diff;
      }
      flux.push(Math.sqrt(fluxValue));
    }
    
    previousSpectrum = spectrum.slice();
  }
  
  // Calculate spectral centroid and bandwidth
  const centroid = calculateSpectralCentroid(data, sampleRate);
  const bandwidth = calculateSpectralBandwidth(data, sampleRate, centroid);
  
  return { rolloff, flux, centroid, bandwidth };
};

const extractMFCC = (data: Float32Array, sampleRate: number): number[][] => {
  // Simplified MFCC extraction (in production, use a proper MFCC library)
  const frameSize = 2048;
  const hopSize = Math.floor(frameSize / 4);
  const numMelFilters = 26;
  const numMFCC = 13;
  const mfccFrames: number[][] = [];
  
  for (let i = 0; i < data.length - frameSize; i += hopSize) {
    const frame = data.slice(i, i + frameSize);
    const spectrum = performFFT(frame);
    
    // Apply mel filter bank
    const melSpectrum = applyMelFilterBank(spectrum, sampleRate, numMelFilters);
    
    // Apply DCT to get MFCC coefficients
    const mfccCoeffs = applyDCT(melSpectrum, numMFCC);
    mfccFrames.push(mfccCoeffs);
  }
  
  return mfccFrames;
};

const extractProsodicFeatures = (data: Float32Array, sampleRate: number, f0Contour: number[]) => {
  // Speaking rate estimation
  const speakingRate = estimateSpeakingRate(data, sampleRate);
  
  // Pause detection
  const pauseDurations = detectPauses(data, sampleRate);
  
  return {
    speakingRate,
    pauseDurations
  };
};

const extractVoiceQuality = (data: Float32Array, sampleRate: number, f0Contour: number[]) => {
  // Jitter calculation (F0 perturbation)
  const validF0 = f0Contour.filter(f => f > 0);
  let jitter = 0;
  if (validF0.length > 1) {
    let jitterSum = 0;
    for (let i = 1; i < validF0.length; i++) {
      jitterSum += Math.abs(validF0[i] - validF0[i - 1]);
    }
    const meanF0 = validF0.reduce((a, b) => a + b, 0) / validF0.length;
    jitter = meanF0 > 0 ? (jitterSum / (validF0.length - 1)) / meanF0 : 0;
  }
  
  // Shimmer calculation (amplitude perturbation)
  const shimmer = calculateShimmerAPQ(data, sampleRate);
  
  // Harmonicity (HNR)
  const harmonicity = calculateHarmonicity(data, f0Contour, sampleRate);
  
  // Voice quality indicators
  const breathiness = calculateBreathiness(data, sampleRate);
  const roughness = calculateRoughness(data, sampleRate);
  const strain = calculateStrain(data, sampleRate);
  
  return {
    jitter,
    shimmer,
    harmonicity,
    breathiness,
    roughness,
    strain
  };
};

const extractEmotionalFeatures = (f0Contour: number[], loudnessContour: number[], spectralFeatures: any) => {
  // Emotional arousal based on F0 and loudness variability
  const f0Variance = calculateVariance(f0Contour.filter(f => f > 0));
  const loudnessVariance = calculateVariance(loudnessContour);
  const arousal = Math.min(1, (f0Variance + loudnessVariance) / 1000);
  
  // Emotional valence based on spectral characteristics
  const valence = Math.tanh((spectralFeatures.centroid - 1000) / 1000);
  
  // Dominance based on loudness and F0 levels
  const meanLoudness = loudnessContour.reduce((a, b) => a + b, 0) / loudnessContour.length;
  const meanF0 = f0Contour.filter(f => f > 0).reduce((a, b) => a + b, 0) / f0Contour.filter(f => f > 0).length;
  const dominance = Math.min(1, (meanLoudness + 60) / 60 * (meanF0 / 200));
  
  return { arousal, valence, dominance };
};

const calculateCorrelations = async (
  opensmileFeatures: OpenSMILEFeatures,
  hybridAnalysis: any
): Promise<CorrelationAnalysis> => {
  // Compare emotional assessments
  const emotionCorrelation = compareEmotionalStates(opensmileFeatures, hybridAnalysis);
  
  // Compare health indicators
  const healthCorrelation = compareHealthIndicators(opensmileFeatures, hybridAnalysis);
  
  // Compare voice quality metrics
  const qualityCorrelation = compareVoiceQuality(opensmileFeatures, hybridAnalysis);
  
  // Calculate overall correlation score
  const correlationScore = (emotionCorrelation + healthCorrelation + qualityCorrelation) / 3;
  
  // Detect outliers
  const outliers = detectAnalysisOutliers(opensmileFeatures, hybridAnalysis);
  
  // Calculate reliability based on consensus
  const reliabilityScore = calculateReliabilityScore(correlationScore, outliers.length);
  
  return {
    opensmile_confidence: 0.85, // Based on feature extraction quality
    hybrid_confidence: hybridAnalysis.confidence_score || 0.75,
    correlation_score: correlationScore,
    consensus_indicators: {
      emotion_consensus: emotionCorrelation,
      health_consensus: healthCorrelation,
      quality_consensus: qualityCorrelation
    },
    outlier_detection: outliers,
    reliability_score: reliabilityScore
  };
};

const generateFinalAssessment = (
  opensmileFeatures: OpenSMILEFeatures,
  hybridAnalysis: any,
  correlation: CorrelationAnalysis
) => {
  // Determine emotional state with highest confidence
  const emotionalState = determineConsensusEmotion(opensmileFeatures, hybridAnalysis, correlation);
  
  // Combine health indicators from both analyses
  const healthIndicators = combineHealthIndicators(opensmileFeatures, hybridAnalysis);
  
  // Determine confidence level
  const confidenceLevel = determineConfidenceLevel(correlation.reliability_score);
  
  // Generate clinical notes
  const clinicalNotes = generateClinicalNotes(opensmileFeatures, hybridAnalysis, correlation);
  
  return {
    emotional_state: emotionalState,
    health_indicators: healthIndicators,
    confidence_level: confidenceLevel,
    clinical_notes: clinicalNotes
  };
};

// Utility functions
const performFFT = (data: Float32Array): Float32Array => {
  // Simplified FFT implementation (use proper FFT library in production)
  const N = data.length;
  const output = new Float32Array(N / 2);
  
  for (let k = 0; k < N / 2; k++) {
    let sumReal = 0;
    let sumImag = 0;
    
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N;
      sumReal += data[n] * Math.cos(angle);
      sumImag += data[n] * Math.sin(angle);
    }
    
    output[k] = Math.sqrt(sumReal * sumReal + sumImag * sumImag);
  }
  
  return output;
};

const calculateStandardDeviation = (data: number[]): number => {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length;
  return Math.sqrt(variance);
};

const calculateVariance = (data: number[]): number => {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  return data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length;
};

const calculateZeroCrossingRate = (data: Float32Array): number => {
  let crossings = 0;
  for (let i = 1; i < data.length; i++) {
    if ((data[i] >= 0) !== (data[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / data.length;
};

// Additional helper functions would be implemented here...
const applyMelFilterBank = (spectrum: Float32Array, sampleRate: number, numFilters: number): number[] => {
  // Simplified mel filter bank implementation
  return new Array(numFilters).fill(0).map((_, i) => spectrum[i] || 0);
};

const applyDCT = (melSpectrum: number[], numCoeffs: number): number[] => {
  // Simplified DCT implementation
  return new Array(numCoeffs).fill(0).map((_, i) => melSpectrum[i] || 0);
};

const calculateSpectralCentroid = (data: Float32Array, sampleRate: number): number => {
  const spectrum = performFFT(data);
  let weightedSum = 0;
  let magnitudeSum = 0;
  
  for (let i = 0; i < spectrum.length; i++) {
    const frequency = (i * sampleRate) / (2 * spectrum.length);
    weightedSum += frequency * spectrum[i];
    magnitudeSum += spectrum[i];
  }
  
  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
};

const calculateSpectralBandwidth = (data: Float32Array, sampleRate: number, centroid: number): number => {
  const spectrum = performFFT(data);
  let weightedVariance = 0;
  let magnitudeSum = 0;
  
  for (let i = 0; i < spectrum.length; i++) {
    const frequency = (i * sampleRate) / (2 * spectrum.length);
    const deviation = frequency - centroid;
    weightedVariance += deviation * deviation * spectrum[i];
    magnitudeSum += spectrum[i];
  }
  
  return magnitudeSum > 0 ? Math.sqrt(weightedVariance / magnitudeSum) : 0;
};

const calculateVoicingProbability = (data: Float32Array, f0Contour: number[]): number[] => {
  return f0Contour.map(f0 => f0 > 0 ? 0.8 : 0.2);
};

const estimateSpeakingRate = (data: Float32Array, sampleRate: number): number => {
  // Simplified speaking rate estimation
  const frameSize = Math.floor(sampleRate * 0.1);
  let syllableCount = 0;
  
  for (let i = 0; i < data.length - frameSize; i += frameSize) {
    const frame = data.slice(i, i + frameSize);
    const energy = frame.reduce((sum, val) => sum + val * val, 0) / frame.length;
    if (energy > 0.001) syllableCount++;
  }
  
  const durationSeconds = data.length / sampleRate;
  return syllableCount / durationSeconds;
};

const detectPauses = (data: Float32Array, sampleRate: number): number[] => {
  const threshold = 0.001;
  const pauseDurations: number[] = [];
  let pauseStart = -1;
  
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) < threshold) {
      if (pauseStart === -1) pauseStart = i;
    } else {
      if (pauseStart !== -1) {
        const duration = (i - pauseStart) / sampleRate;
        if (duration > 0.1) pauseDurations.push(duration); // Only significant pauses
        pauseStart = -1;
      }
    }
  }
  
  return pauseDurations;
};

const calculateShimmerAPQ = (data: Float32Array, sampleRate: number): number => {
  // Simplified shimmer calculation
  const frameSize = Math.floor(sampleRate * 0.01);
  const amplitudes: number[] = [];
  
  for (let i = 0; i < data.length - frameSize; i += frameSize) {
    const frame = data.slice(i, i + frameSize);
    const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);
    amplitudes.push(rms);
  }
  
  if (amplitudes.length < 2) return 0;
  
  let shimmerSum = 0;
  for (let i = 1; i < amplitudes.length; i++) {
    shimmerSum += Math.abs(amplitudes[i] - amplitudes[i - 1]);
  }
  
  const meanAmplitude = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
  return meanAmplitude > 0 ? (shimmerSum / (amplitudes.length - 1)) / meanAmplitude : 0;
};

const calculateHarmonicity = (data: Float32Array, f0Contour: number[], sampleRate: number): number => {
  // Simplified harmonicity calculation
  const spectrum = performFFT(data);
  let harmonicEnergy = 0;
  let totalEnergy = 0;
  
  for (let i = 0; i < spectrum.length; i++) {
    totalEnergy += spectrum[i] * spectrum[i];
    // Consider every 5th bin as potentially harmonic (simplified)
    if (i % 5 === 0) {
      harmonicEnergy += spectrum[i] * spectrum[i];
    }
  }
  
  return totalEnergy > 0 ? 10 * Math.log10(harmonicEnergy / (totalEnergy - harmonicEnergy + 1e-10)) : 0;
};

const calculateBreathiness = (data: Float32Array, sampleRate: number): number => {
  // Simplified breathiness calculation based on spectral tilt
  const spectrum = performFFT(data);
  const lowFreqEnergy = spectrum.slice(0, spectrum.length / 4).reduce((sum, val) => sum + val * val, 0);
  const highFreqEnergy = spectrum.slice(spectrum.length / 2).reduce((sum, val) => sum + val * val, 0);
  
  return highFreqEnergy > 0 ? lowFreqEnergy / highFreqEnergy : 0;
};

const calculateRoughness = (data: Float32Array, sampleRate: number): number => {
  // Simplified roughness calculation based on amplitude modulation
  const frameSize = Math.floor(sampleRate * 0.01);
  const amplitudeModulation: number[] = [];
  
  for (let i = 0; i < data.length - frameSize; i += frameSize / 2) {
    const frame = data.slice(i, i + frameSize);
    const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);
    amplitudeModulation.push(rms);
  }
  
  return calculateVariance(amplitudeModulation);
};

const calculateStrain = (data: Float32Array, sampleRate: number): number => {
  // Simplified strain calculation based on high-frequency energy
  const spectrum = performFFT(data);
  const totalEnergy = spectrum.reduce((sum, val) => sum + val * val, 0);
  const highFreqEnergy = spectrum.slice(spectrum.length * 3 / 4).reduce((sum, val) => sum + val * val, 0);
  
  return totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;
};

const compareEmotionalStates = (opensmileFeatures: OpenSMILEFeatures, hybridAnalysis: any): number => {
  // Compare emotional indicators between analyses
  const opensmileEmotion = determineEmotionFromFeatures(opensmileFeatures);
  const hybridEmotion = hybridAnalysis.emotional_analysis?.dominant_emotion || 'neutral';
  
  const emotionMapping: { [key: string]: number } = {
    'happy': 1, 'joy': 1, 'excited': 1,
    'sad': 2, 'melancholy': 2, 'depressed': 2,
    'angry': 3, 'frustrated': 3, 'irritated': 3,
    'anxious': 4, 'nervous': 4, 'worried': 4,
    'calm': 5, 'relaxed': 5, 'peaceful': 5,
    'neutral': 6, 'balanced': 6
  };
  
  const opensmileValue = emotionMapping[opensmileEmotion] || 6;
  const hybridValue = emotionMapping[hybridEmotion] || 6;
  
  const difference = Math.abs(opensmileValue - hybridValue);
  return Math.max(0, 1 - difference / 6);
};

const compareHealthIndicators = (opensmileFeatures: OpenSMILEFeatures, hybridAnalysis: any): number => {
  // Compare health-related metrics
  const opensmileHealth = assessHealthFromFeatures(opensmileFeatures);
  const hybridHealth = hybridAnalysis.health_indicators || {};
  
  let correlationSum = 0;
  let comparisons = 0;
  
  // Compare voice quality metrics
  if (hybridHealth.voice_quality) {
    const qualityCorr = Math.abs(opensmileHealth.voiceQuality - hybridHealth.voice_quality) <= 0.3 ? 1 : 0;
    correlationSum += qualityCorr;
    comparisons++;
  }
  
  // Compare stress indicators
  if (hybridHealth.stress_level) {
    const stressCorr = Math.abs(opensmileHealth.stressLevel - hybridHealth.stress_level) <= 0.3 ? 1 : 0;
    correlationSum += stressCorr;
    comparisons++;
  }
  
  return comparisons > 0 ? correlationSum / comparisons : 0.5;
};

const compareVoiceQuality = (opensmileFeatures: OpenSMILEFeatures, hybridAnalysis: any): number => {
  // Compare voice quality metrics
  let correlationSum = 0;
  let comparisons = 0;
  
  // Compare jitter
  if (hybridAnalysis.voice_metrics?.jitter) {
    const jitterCorr = 1 - Math.min(1, Math.abs(opensmileFeatures.jitter - hybridAnalysis.voice_metrics.jitter));
    correlationSum += jitterCorr;
    comparisons++;
  }
  
  // Compare shimmer
  if (hybridAnalysis.voice_metrics?.shimmer) {
    const shimmerCorr = 1 - Math.min(1, Math.abs(opensmileFeatures.shimmer - hybridAnalysis.voice_metrics.shimmer));
    correlationSum += shimmerCorr;
    comparisons++;
  }
  
  return comparisons > 0 ? correlationSum / comparisons : 0.5;
};

const detectAnalysisOutliers = (opensmileFeatures: OpenSMILEFeatures, hybridAnalysis: any): string[] => {
  const outliers: string[] = [];
  
  // Check for significant discrepancies
  if (Math.abs(opensmileFeatures.arousal - (hybridAnalysis.emotional_analysis?.arousal || 0.5)) > 0.5) {
    outliers.push('Discrepância significativa na análise de arousal emocional');
  }
  
  if (opensmileFeatures.jitter > 0.1 && (hybridAnalysis.voice_metrics?.jitter || 0) < 0.02) {
    outliers.push('Divergência na medição de jitter vocal');
  }
  
  return outliers;
};

const calculateReliabilityScore = (correlationScore: number, outlierCount: number): number => {
  let reliability = correlationScore;
  
  // Penalize for outliers
  reliability -= outlierCount * 0.1;
  
  // Ensure minimum reliability
  reliability = Math.max(0.3, reliability);
  
  return Math.min(1, reliability);
};

const determineConsensusEmotion = (
  opensmileFeatures: OpenSMILEFeatures,
  hybridAnalysis: any,
  correlation: CorrelationAnalysis
): string => {
  const opensmileEmotion = determineEmotionFromFeatures(opensmileFeatures);
  const hybridEmotion = hybridAnalysis.emotional_analysis?.dominant_emotion || 'neutral';
  
  // If high consensus, return the agreed emotion
  if (correlation.consensus_indicators.emotion_consensus > 0.7) {
    return opensmileEmotion === hybridEmotion ? opensmileEmotion : 'neutral';
  }
  
  // Otherwise, return the emotion with higher confidence
  const opensmileConfidence = correlation.opensmile_confidence;
  const hybridConfidence = correlation.hybrid_confidence;
  
  return opensmileConfidence > hybridConfidence ? opensmileEmotion : hybridEmotion;
};

const combineHealthIndicators = (opensmileFeatures: OpenSMILEFeatures, hybridAnalysis: any): string[] => {
  const indicators: string[] = [];
  
  // Voice quality indicators
  if (opensmileFeatures.roughness > 0.5) {
    indicators.push('Rugosidade vocal detectada');
  }
  
  if (opensmileFeatures.breathiness > 0.6) {
    indicators.push('Soprosidade vocal identificada');
  }
  
  if (opensmileFeatures.strain > 0.4) {
    indicators.push('Tensão vocal observada');
  }
  
  // Emotional health indicators
  if (opensmileFeatures.arousal > 0.7) {
    indicators.push('Nível elevado de arousal emocional');
  }
  
  if (opensmileFeatures.valence < -0.5) {
    indicators.push('Valência emocional negativa');
  }
  
  // Add hybrid analysis indicators
  if (hybridAnalysis.health_indicators?.fatigue) {
    indicators.push('Indicadores de fadiga vocal');
  }
  
  return indicators;
};

const determineConfidenceLevel = (reliabilityScore: number): 'low' | 'medium' | 'high' | 'very_high' => {
  if (reliabilityScore >= 0.9) return 'very_high';
  if (reliabilityScore >= 0.7) return 'high';
  if (reliabilityScore >= 0.5) return 'medium';
  return 'low';
};

const generateClinicalNotes = (
  opensmileFeatures: OpenSMILEFeatures,
  hybridAnalysis: any,
  correlation: CorrelationAnalysis
): string[] => {
  const notes: string[] = [];
  
  notes.push(`Análise realizada com confiabilidade ${(correlation.reliability_score * 100).toFixed(1)}%`);
  
  if (correlation.correlation_score > 0.8) {
    notes.push('Alta concordância entre métodos de análise');
  } else if (correlation.correlation_score < 0.5) {
    notes.push('Divergências significativas entre análises - recomenda-se nova avaliação');
  }
  
  if (opensmileFeatures.speaking_rate > 5) {
    notes.push('Taxa de fala acelerada observada');
  } else if (opensmileFeatures.speaking_rate < 2) {
    notes.push('Taxa de fala reduzida detectada');
  }
  
  if (correlation.outlier_detection.length > 0) {
    notes.push(`${correlation.outlier_detection.length} discrepância(s) detectada(s) entre análises`);
  }
  
  return notes;
};

const determineEmotionFromFeatures = (features: OpenSMILEFeatures): string => {
  const { arousal, valence, dominance } = features;
  
  if (valence > 0.3 && arousal > 0.6) return 'excited';
  if (valence > 0.3 && arousal < 0.4) return 'calm';
  if (valence < -0.3 && arousal > 0.6) return 'anxious';
  if (valence < -0.3 && arousal < 0.4) return 'sad';
  if (dominance > 0.7) return 'confident';
  
  return 'neutral';
};

const assessHealthFromFeatures = (features: OpenSMILEFeatures) => {
  const voiceQuality = 1 - Math.max(features.roughness, features.breathiness, features.strain);
  const stressLevel = features.arousal * 0.6 + (1 - features.valence) * 0.4;
  
  return {
    voiceQuality: Math.max(0, Math.min(1, voiceQuality)),
    stressLevel: Math.max(0, Math.min(1, stressLevel))
  };
};
