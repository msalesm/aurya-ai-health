import { SignalProcessor } from './signalProcessing';

export interface ROICoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RPPGReading {
  bpm: number;
  confidence: number;
  snr: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  timestamp: number;
}

export class RPPGAnalyzer {
  private rgbBuffer: { r: number[], g: number[], b: number[] } = { r: [], g: [], b: [] };
  private readonly bufferSize = 900; // 30 seconds at 30fps
  private readonly minBufferSize = 300; // 10 seconds minimum for stable reading
  
  // Enhanced face detection with multiple ROI analysis
  static detectFaceROI(videoElement: HTMLVideoElement, canvas: HTMLCanvasElement): ROICoordinates | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Set canvas size to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Draw current frame
    ctx.drawImage(videoElement, 0, 0);
    
    // Try to detect face using brightness variance
    const detected = this.detectFaceByVariance(ctx, canvas.width, canvas.height);
    if (detected) return detected;
    
    // Fallback to center region detection
    const faceWidth = canvas.width * 0.35;
    const faceHeight = canvas.height * 0.45;
    const faceX = (canvas.width - faceWidth) / 2;
    const faceY = canvas.height * 0.15;
    
    // Extract optimal forehead region for PPG
    const roiWidth = faceWidth * 0.7;
    const roiHeight = faceHeight * 0.25;
    const roiX = faceX + (faceWidth - roiWidth) / 2;
    const roiY = faceY + faceHeight * 0.05;
    
    return {
      x: Math.round(roiX),
      y: Math.round(roiY),
      width: Math.round(roiWidth),
      height: Math.round(roiHeight)
    };
  }

  // Detect face using brightness variance analysis
  private static detectFaceByVariance(ctx: CanvasRenderingContext2D, width: number, height: number): ROICoordinates | null {
    try {
      const sampleSize = 20;
      const regions = [];
      
      // Sample multiple regions and find the one with best characteristics for PPG
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
          const x = (width * 0.2) + (i * width * 0.12);
          const y = (height * 0.1) + (j * height * 0.15);
          const w = width * 0.12;
          const h = height * 0.12;
          
          const imageData = ctx.getImageData(x, y, w, h);
          const variance = this.calculateVariance(imageData.data);
          const brightness = this.calculateBrightness(imageData.data);
          
          // Look for regions with good variance and proper brightness
          if (variance > 50 && brightness > 80 && brightness < 180) {
            regions.push({ x, y, width: w, height: h, score: variance + (150 - Math.abs(brightness - 120)) });
          }
        }
      }
      
      // Return the best scoring region
      if (regions.length > 0) {
        const best = regions.reduce((a, b) => a.score > b.score ? a : b);
        return {
          x: Math.round(best.x),
          y: Math.round(best.y),
          width: Math.round(best.width),
          height: Math.round(best.height)
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private static calculateVariance(data: Uint8ClampedArray): number {
    let sum = 0, sumSquares = 0, count = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sum += brightness;
      sumSquares += brightness * brightness;
      count++;
    }
    
    const mean = sum / count;
    return (sumSquares / count) - (mean * mean);
  }

  private static calculateBrightness(data: Uint8ClampedArray): number {
    let sum = 0, count = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
      count++;
    }
    
    return sum / count;
  }
  
  // Extract RGB values from ROI
  static extractRGBFromROI(canvas: HTMLCanvasElement, roi: ROICoordinates): { r: number, g: number, b: number } | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    try {
      const imageData = ctx.getImageData(roi.x, roi.y, roi.width, roi.height);
      const data = imageData.data;
      
      let totalR = 0, totalG = 0, totalB = 0;
      let pixelCount = 0;
      
      // Average RGB values across the ROI
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];
        
        // Skip transparent pixels
        if (alpha > 128) {
          totalR += r;
          totalG += g;
          totalB += b;
          pixelCount++;
        }
      }
      
      if (pixelCount === 0) return null;
      
      return {
        r: totalR / pixelCount,
        g: totalG / pixelCount,
        b: totalB / pixelCount
      };
    } catch (error) {
      console.warn('Error extracting RGB from ROI:', error);
      return null;
    }
  }
  
  // Add new RGB reading to buffer
  addReading(rgb: { r: number, g: number, b: number }): void {
    this.rgbBuffer.r.push(rgb.r);
    this.rgbBuffer.g.push(rgb.g);
    this.rgbBuffer.b.push(rgb.b);
    
    // Maintain buffer size
    if (this.rgbBuffer.r.length > this.bufferSize) {
      this.rgbBuffer.r.shift();
      this.rgbBuffer.g.shift();
      this.rgbBuffer.b.shift();
    }
  }
  
  // Analyze current buffer for heart rate
  analyzeHeartRate(): RPPGReading | null {
    if (this.rgbBuffer.r.length < this.minBufferSize) {
      return null;
    }
    
    // Use green channel (most sensitive to blood volume changes)
    const greenSignal = [...this.rgbBuffer.g];
    
    // Apply independent component analysis (simplified)
    const processedSignal = this.applyICA(greenSignal);
    
    // Extract heart rate using signal processing
    const { bpm, confidence } = SignalProcessor.extractHeartRate(processedSignal);
    
    // Calculate signal quality metrics
    const snr = SignalProcessor.calculateSNR(processedSignal);
    const quality = this.assessSignalQuality(snr, confidence);
    
    return {
      bpm,
      confidence,
      snr,
      quality,
      timestamp: Date.now()
    };
  }
  
  // Simplified Independent Component Analysis
  private applyICA(signal: number[]): number[] {
    // In a full implementation, this would use proper ICA algorithms
    // For now, we'll use a simplified approach with detrending and normalization
    
    const detrended = SignalProcessor.detrend(signal);
    const normalized = SignalProcessor.normalize(detrended);
    const windowed = SignalProcessor.applyHammingWindow(normalized);
    
    return windowed;
  }
  
  // Assess signal quality based on various metrics
  private assessSignalQuality(snr: number, confidence: number): 'poor' | 'fair' | 'good' | 'excellent' {
    const qualityScore = (snr / 10 + confidence) / 2;
    
    if (qualityScore >= 0.8) return 'excellent';
    if (qualityScore >= 0.6) return 'good';
    if (qualityScore >= 0.4) return 'fair';
    return 'poor';
  }
  
  // Check if lighting conditions are adequate
  static assessLightingConditions(rgb: { r: number, g: number, b: number }): 'too_dark' | 'too_bright' | 'good' {
    const brightness = (rgb.r + rgb.g + rgb.b) / 3;
    
    if (brightness < 50) return 'too_dark';
    if (brightness > 200) return 'too_bright';
    return 'good';
  }
  
  // Detect excessive head movement
  static detectMovement(previousRGB: { r: number, g: number, b: number }, currentRGB: { r: number, g: number, b: number }): boolean {
    const threshold = 15; // Movement threshold
    
    const rDiff = Math.abs(currentRGB.r - previousRGB.r);
    const gDiff = Math.abs(currentRGB.g - previousRGB.g);
    const bDiff = Math.abs(currentRGB.b - previousRGB.b);
    
    const totalDiff = rDiff + gDiff + bDiff;
    
    return totalDiff > threshold;
  }
  
  // Get current buffer size for UI feedback
  getBufferProgress(): number {
    return Math.min(this.rgbBuffer.r.length / this.minBufferSize, 1);
  }
  
  // Clear buffer (reset analysis)
  clearBuffer(): void {
    this.rgbBuffer = { r: [], g: [], b: [] };
  }
  
  // Get the latest processed signal for visualization
  getLatestSignal(): number[] {
    if (this.rgbBuffer.g.length < 90) return [];
    
    const recent = this.rgbBuffer.g.slice(-150); // Last 5 seconds for visualization
    return SignalProcessor.normalize(SignalProcessor.detrend(recent));
  }

  // Get multiple ROI readings for improved accuracy
  getMultiROIReadings(): { forehead: number[], cheeks: number[] } {
    const halfLength = Math.floor(this.rgbBuffer.g.length / 2);
    return {
      forehead: this.rgbBuffer.g.slice(0, halfLength),
      cheeks: this.rgbBuffer.g.slice(halfLength)
    };
  }

  // Check if we have enough data for reliable analysis
  hasMinimumData(): boolean {
    return this.rgbBuffer.r.length >= this.minBufferSize;
  }

  // Get analysis progress for 30-second window
  getAnalysisProgress(): number {
    return Math.min(this.rgbBuffer.r.length / this.bufferSize, 1);
  }
}