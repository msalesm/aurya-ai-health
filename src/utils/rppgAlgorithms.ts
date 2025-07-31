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
  private readonly bufferSize = 150; // 5 seconds at 30fps
  private readonly minBufferSize = 90; // 3 seconds minimum
  
  // Face detection and ROI extraction
  static detectFaceROI(videoElement: HTMLVideoElement, canvas: HTMLCanvasElement): ROICoordinates | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Set canvas size to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Draw current frame
    ctx.drawImage(videoElement, 0, 0);
    
    // Simple face detection using center region
    // In a real implementation, you'd use face detection APIs
    const faceWidth = canvas.width * 0.3;
    const faceHeight = canvas.height * 0.4;
    const faceX = (canvas.width - faceWidth) / 2;
    const faceY = canvas.height * 0.2;
    
    // Extract forehead region (top 1/3 of face)
    const roiWidth = faceWidth * 0.8;
    const roiHeight = faceHeight * 0.3;
    const roiX = faceX + (faceWidth - roiWidth) / 2;
    const roiY = faceY + faceHeight * 0.1;
    
    return {
      x: Math.round(roiX),
      y: Math.round(roiY),
      width: Math.round(roiWidth),
      height: Math.round(roiHeight)
    };
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
    if (this.rgbBuffer.g.length < 30) return [];
    
    const recent = this.rgbBuffer.g.slice(-60); // Last 2 seconds
    return SignalProcessor.normalize(SignalProcessor.detrend(recent));
  }
}