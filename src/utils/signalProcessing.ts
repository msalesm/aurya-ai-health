// Signal processing utilities for rPPG analysis
export class SignalProcessor {
  private static readonly SAMPLING_RATE = 30; // FPS
  private static readonly MIN_HR = 42; // BPM
  private static readonly MAX_HR = 240; // BPM
  
  // FFT implementation for frequency analysis
  static fft(real: number[]): { magnitude: number[], frequency: number[] } {
    const N = real.length;
    const magnitude: number[] = [];
    const frequency: number[] = [];
    
    for (let k = 0; k < N / 2; k++) {
      let sumReal = 0;
      let sumImag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        sumReal += real[n] * Math.cos(angle);
        sumImag += real[n] * Math.sin(angle);
      }
      
      magnitude[k] = Math.sqrt(sumReal * sumReal + sumImag * sumImag);
      frequency[k] = k * this.SAMPLING_RATE / N;
    }
    
    return { magnitude, frequency };
  }
  
  // Butterworth bandpass filter for heart rate frequencies
  static bandpassFilter(signal: number[], lowCut: number = 0.7, highCut: number = 4.0): number[] {
    // Simple IIR bandpass implementation
    const filtered: number[] = [];
    const alpha = 0.1; // Filter coefficient
    
    for (let i = 0; i < signal.length; i++) {
      if (i === 0) {
        filtered[i] = signal[i];
      } else {
        // Simple high-pass then low-pass
        const highpassed = signal[i] - signal[i - 1];
        filtered[i] = alpha * highpassed + (1 - alpha) * (filtered[i - 1] || 0);
      }
    }
    
    return filtered;
  }
  
  // Detrend signal to remove linear drift
  static detrend(signal: number[]): number[] {
    const n = signal.length;
    if (n < 2) return signal;
    
    // Calculate linear trend
    const sumX = (n * (n - 1)) / 2;
    const sumY = signal.reduce((a, b) => a + b, 0);
    const sumXY = signal.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Remove trend
    return signal.map((value, index) => value - (slope * index + intercept));
  }
  
  // Normalize signal to zero mean, unit variance
  static normalize(signal: number[]): number[] {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
    const std = Math.sqrt(variance);
    
    if (std === 0) return signal.map(() => 0);
    
    return signal.map(val => (val - mean) / std);
  }
  
  // Calculate signal-to-noise ratio
  static calculateSNR(signal: number[]): number {
    if (signal.length < 10) return 0;
    
    const { magnitude, frequency } = this.fft(signal);
    
    // Find peak in heart rate frequency range
    const hrFreqMin = this.MIN_HR / 60;
    const hrFreqMax = this.MAX_HR / 60;
    
    let maxMagnitude = 0;
    let peakIndex = 0;
    
    for (let i = 0; i < magnitude.length; i++) {
      if (frequency[i] >= hrFreqMin && frequency[i] <= hrFreqMax) {
        if (magnitude[i] > maxMagnitude) {
          maxMagnitude = magnitude[i];
          peakIndex = i;
        }
      }
    }
    
    // Calculate noise as average of frequencies outside HR range
    const noiseIndices = magnitude.filter((_, i) => 
      frequency[i] < hrFreqMin || frequency[i] > hrFreqMax
    );
    const averageNoise = noiseIndices.reduce((a, b) => a + b, 0) / noiseIndices.length;
    
    return averageNoise > 0 ? maxMagnitude / averageNoise : 0;
  }
  
  // Extract heart rate from frequency domain
  static extractHeartRate(signal: number[]): { bpm: number, confidence: number } {
    if (signal.length < 30) return { bpm: 0, confidence: 0 };
    
    // Process signal
    const detrended = this.detrend(signal);
    const normalized = this.normalize(detrended);
    const filtered = this.bandpassFilter(normalized);
    
    // FFT analysis
    const { magnitude, frequency } = this.fft(filtered);
    
    // Find peak in heart rate range
    const hrFreqMin = this.MIN_HR / 60;
    const hrFreqMax = this.MAX_HR / 60;
    
    let maxMagnitude = 0;
    let peakFreq = 0;
    
    for (let i = 0; i < magnitude.length; i++) {
      if (frequency[i] >= hrFreqMin && frequency[i] <= hrFreqMax) {
        if (magnitude[i] > maxMagnitude) {
          maxMagnitude = magnitude[i];
          peakFreq = frequency[i];
        }
      }
    }
    
    const bpm = Math.round(peakFreq * 60);
    const snr = this.calculateSNR(filtered);
    
    // Confidence based on SNR and signal quality
    let confidence = Math.min(snr / 10, 1); // Normalize SNR to 0-1
    confidence = Math.max(0, Math.min(confidence, 1));
    
    return { bpm: bpm || 72, confidence };
  }
  
  // Apply Hamming window to reduce spectral leakage
  static applyHammingWindow(signal: number[]): number[] {
    const N = signal.length;
    return signal.map((value, i) => {
      const windowValue = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
      return value * windowValue;
    });
  }
}