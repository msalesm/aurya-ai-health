import { useState, useEffect, useCallback } from 'react';

export interface VitalSigns {
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
    formatted: string;
  };
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  timestamp: string;
  source: 'camera_ppg' | 'voice_analysis' | 'facial_tracking' | 'simulated';
  confidence: number;
}

export interface VitalSignsHook {
  vitalSigns: VitalSigns;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  updateFromFacialAnalysis: (facialData: any) => void;
  updateFromVoiceAnalysis: (voiceData: any) => void;
  captureVitalSignsSnapshot: () => VitalSigns;
  error: string | null;
}

// Gerar baseline realista com variabilidade
const generateRealisticBaseline = () => {
  // Simular perfil demográfico básico
  const ageGroup = Math.random() > 0.6 ? 'young' : Math.random() > 0.3 ? 'middle' : 'senior';
  const fitnessLevel = Math.random() * 10;
  const stressBaseline = Math.random() * 5;
  
  // FC baseada na idade e fitness
  let heartRate;
  if (ageGroup === 'young') {
    heartRate = fitnessLevel > 7 ? Math.floor(Math.random() * 15) + 55 : Math.floor(Math.random() * 20) + 65;
  } else if (ageGroup === 'middle') {
    heartRate = fitnessLevel > 6 ? Math.floor(Math.random() * 20) + 60 : Math.floor(Math.random() * 25) + 70;
  } else {
    heartRate = Math.floor(Math.random() * 25) + 70;
  }
  
  // PA baseada na idade e stress
  const systolicBase = ageGroup === 'young' ? 115 : ageGroup === 'middle' ? 125 : 135;
  const systolic = systolicBase + Math.floor(Math.random() * 20) - 10 + Math.floor(stressBaseline * 3);
  const diastolic = Math.floor(systolic * 0.65) + Math.floor(Math.random() * 10) - 5;
  
  // Temperatura com variação natural
  const temperature = Math.round((36.1 + Math.random() * 1.1) * 10) / 10;
  
  // SpO2 com distribuição realista (peso maior em 98-99%)
  const oxygenSaturation = Math.random() > 0.8 ? 
    Math.floor(Math.random() * 3) + 96 : 
    Math.floor(Math.random() * 2) + 98;
  
  // Taxa respiratória
  const respiratoryRate = Math.floor(Math.random() * 6) + 14;
  
  return {
    heartRate,
    bloodPressure: {
      systolic,
      diastolic,
      formatted: `${systolic}/${diastolic}`
    },
    temperature,
    oxygenSaturation,
    respiratoryRate,
    timestamp: new Date().toISOString(),
    source: 'simulated' as const,
    confidence: Math.floor(Math.random() * 25) + 65
  };
};

export const useVitalSigns = (): VitalSignsHook => {
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>(() => generateRealisticBaseline());

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  // Simular variações naturais nos sinais vitais durante monitoramento
  const simulateNaturalVariation = useCallback(() => {
    setVitalSigns(prev => ({
      ...prev,
      heartRate: Math.max(60, Math.min(100, prev.heartRate + (Math.random() - 0.5) * 4)),
      bloodPressure: {
        ...prev.bloodPressure,
        systolic: Math.max(90, Math.min(140, prev.bloodPressure.systolic + (Math.random() - 0.5) * 6)),
        diastolic: Math.max(60, Math.min(90, prev.bloodPressure.diastolic + (Math.random() - 0.5) * 4))
      },
      temperature: Math.max(35.0, Math.min(38.0, prev.temperature + (Math.random() - 0.5) * 0.2)),
      oxygenSaturation: Math.max(95, Math.min(100, prev.oxygenSaturation + (Math.random() - 0.5) * 1)),
      respiratoryRate: Math.max(12, Math.min(20, prev.respiratoryRate + (Math.random() - 0.5) * 2)),
      timestamp: new Date().toISOString()
    }));
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    setError(null);
    
    // Simular monitoramento contínuo
    const interval = setInterval(simulateNaturalVariation, 2000);
    setMonitoringInterval(interval);
  }, [simulateNaturalVariation]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
  }, [monitoringInterval]);

  const updateFromFacialAnalysis = useCallback((facialData: any) => {
    if (!facialData) return;

    // Extrair frequência cardíaca da análise facial (PPG via câmera)
    const heartRate = facialData.heartRate || facialData.averageHeartRate;
    
    // Calcular pressão arterial baseada na FC e stress
    const stressMultiplier = facialData.stressLevel ? (facialData.stressLevel / 10) : 0;
    const systolic = Math.round(120 + (heartRate > 85 ? 15 : 0) + (stressMultiplier * 20));
    const diastolic = Math.round(80 + (heartRate > 85 ? 10 : 0) + (stressMultiplier * 10));

    setVitalSigns(prev => ({
      ...prev,
      heartRate: heartRate || prev.heartRate,
      bloodPressure: {
        systolic,
        diastolic,
        formatted: `${systolic}/${diastolic}`
      },
      // Estimar temperatura baseada no nível de stress
      temperature: Math.round((36.5 + (stressMultiplier * 0.8)) * 10) / 10,
      // SpO2 pode diminuir com stress
      oxygenSaturation: Math.max(95, Math.round(99 - (stressMultiplier * 2))),
      timestamp: new Date().toISOString(),
      source: 'facial_tracking',
      confidence: facialData.confidence || 80
    }));
  }, []);

  const updateFromVoiceAnalysis = useCallback((voiceData: any) => {
    if (!voiceData) return;

    const respiratoryAnalysis = voiceData.respiratory_analysis;
    const stressAnalysis = voiceData.stress_indicators;

    if (respiratoryAnalysis || stressAnalysis) {
      setVitalSigns(prev => ({
        ...prev,
        respiratoryRate: respiratoryAnalysis?.breathing_rate || prev.respiratoryRate,
        // Ajustar FC baseado no stress vocal
        heartRate: stressAnalysis?.stress_level > 6 ? 
          Math.min(95, prev.heartRate + 8) : prev.heartRate,
        timestamp: new Date().toISOString(),
        source: 'voice_analysis',
        confidence: voiceData.confidence_score ? Math.round(voiceData.confidence_score * 100) : 75
      }));
    }
  }, []);

  const captureVitalSignsSnapshot = useCallback(() => {
    // Para o monitoramento contínuo e retorna os valores atuais
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
    setIsMonitoring(false);
    
    return {
      ...vitalSigns,
      timestamp: new Date().toISOString()
    };
  }, [vitalSigns, monitoringInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  // Atualizar formatted blood pressure quando valores mudam
  useEffect(() => {
    setVitalSigns(prev => ({
      ...prev,
      bloodPressure: {
        ...prev.bloodPressure,
        formatted: `${prev.bloodPressure.systolic}/${prev.bloodPressure.diastolic}`
      }
    }));
  }, [vitalSigns.bloodPressure.systolic, vitalSigns.bloodPressure.diastolic]);

  return {
    vitalSigns,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    updateFromFacialAnalysis,
    updateFromVoiceAnalysis,
    captureVitalSignsSnapshot,
    error
  };
};