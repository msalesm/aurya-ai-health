import { useState, useCallback } from 'react';
import {
  VoiceMetrics,
  FacialMetrics,
  AnamnesisMetrics,
  ConsolidatedAnalysis,
  generateConsolidatedAnalysis,
  detectOutliers
} from '@/utils/medicalCorrelationUtils';

interface CorrelationAnalysisState {
  isAnalyzing: boolean;
  consolidatedResult: ConsolidatedAnalysis | null;
  outliers: string[];
  error: string | null;
}

export const useCorrelationAnalysis = () => {
  const [state, setState] = useState<CorrelationAnalysisState>({
    isAnalyzing: false,
    consolidatedResult: null,
    outliers: [],
    error: null
  });

  const performCorrelationAnalysis = useCallback(async (
    facialData: any,
    voiceData: any,
    anamnesisData: any
  ) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      // Transform data to standard metrics format
      const facialMetrics: FacialMetrics | null = facialData ? {
        heartRate: facialData.heartRate || facialData.vitalSigns?.heartRate || 72,
        stressLevel: facialData.stressLevel || calculateFacialStress(facialData),
        thermalState: facialData.facialMetrics?.thermalState || facialData.thermalState || 'indeterminate',
        microExpressions: facialData.facialMetrics?.microExpressions || facialData.microExpressions || {},
        eyeOpenness: facialData.facialMetrics?.eyeOpenness || facialData.eyeOpenness || { left: 0.8, right: 0.8 },
        blinkRate: facialData.facialMetrics?.blinkRate || facialData.blinkRate || 15,
        pupilDilation: facialData.facialMetrics?.pupilDilation || facialData.pupilDilation || 3.2,
        confidence: facialData.quality?.analysisReliability || facialData.confidence || 0.8
      } : null;

      const voiceMetrics: VoiceMetrics | null = voiceData ? {
        emotionalState: voiceData.emotional_tone?.primary_emotion || 
                       voiceData.emotions?.[0]?.label || 
                       voiceData.emotionalState || 'neutral',
        stressLevel: voiceData.stress_indicators?.stress_level || 
                    voiceData.stressLevel || 
                    calculateVoiceStress(voiceData),
        respiratoryPattern: voiceData.respiratory_patterns?.pattern || 
                          voiceData.respiratoryPattern || 'normal',
        speechClarity: voiceData.speech_clarity || 
                      voiceData.speechClarity || 85,
        confidence: voiceData.confidence_score || 
                   voiceData.confidence || 0.8,
        advancedMetrics: voiceData.advancedMetrics
      } : null;

      const anamnesisMetrics: AnamnesisMetrics | null = anamnesisData ? {
        urgencyLevel: anamnesisData.urgencyLevel || anamnesisData.urgency?.level || 'baixa',
        urgencyScore: anamnesisData.urgencyScore || anamnesisData.urgency?.score || 30,
        symptoms: anamnesisData.symptoms || anamnesisData.consolidatedSymptoms || [],
        recommendations: anamnesisData.recommendations || [],
        confidence: anamnesisData.confidence || anamnesisData.confidenceScore || 0.8
      } : null;

      // Perform correlation analysis
      const consolidatedResult = generateConsolidatedAnalysis(
        facialMetrics,
        voiceMetrics,
        anamnesisMetrics
      );

      // Detect outliers
      const outliers = detectOutliers(facialMetrics, voiceMetrics);

      setState({
        isAnalyzing: false,
        consolidatedResult,
        outliers,
        error: null
      });

      return consolidatedResult;
    } catch (error) {
      console.error('Correlation analysis error:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Erro na análise de correlação'
      }));
      return null;
    }
  }, []);

  const calculateFacialStress = (facialData: any): number => {
    let stress = 0;
    
    // Heart rate component
    const hr = facialData.heartRate || facialData.vitalSigns?.heartRate || 72;
    if (hr > 90) stress += (hr - 90) / 10;
    
    // Micro-expressions component
    const emotions = facialData.facialMetrics?.microExpressions || facialData.microExpressions || {};
    stress += (emotions.anger || 0) * 10;
    stress += (emotions.fear || 0) * 10;
    stress += (emotions.sadness || 0) * 5;
    
    // Thermal state component
    const thermal = facialData.facialMetrics?.thermalState || facialData.thermalState;
    if (thermal === 'possible_fever') stress += 2;
    
    return Math.min(stress, 10);
  };

  const calculateVoiceStress = (voiceData: any): number => {
    let stress = 0;
    
    // Emotional component
    const emotion = voiceData.emotional_tone?.primary_emotion || 
                   voiceData.emotions?.[0]?.label || 'neutral';
    
    if (emotion === 'stress' || emotion === 'anxiety') stress += 8;
    else if (emotion === 'sadness' || emotion === 'anger') stress += 6;
    else if (emotion === 'fear') stress += 7;
    
    // Advanced metrics component
    if (voiceData.advancedMetrics) {
      stress += voiceData.advancedMetrics.emotionalIndicators?.stress * 10 || 0;
      stress += voiceData.advancedMetrics.emotionalIndicators?.anxiety * 8 || 0;
    }
    
    return Math.min(stress, 10);
  };

  const resetAnalysis = useCallback(() => {
    setState({
      isAnalyzing: false,
      consolidatedResult: null,
      outliers: [],
      error: null
    });
  }, []);

  return {
    isAnalyzing: state.isAnalyzing,
    consolidatedResult: state.consolidatedResult,
    outliers: state.outliers,
    error: state.error,
    performCorrelationAnalysis,
    resetAnalysis
  };
};