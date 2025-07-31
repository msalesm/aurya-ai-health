import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Activity, Thermometer, Zap, Monitor, Wifi } from "lucide-react";
import { useVitalSigns } from "@/hooks/useVitalSigns";
import { useEffect } from "react";

interface VitalSignsProps {
  heartRate?: number;
  bloodPressure?: string;
  temperature?: number;
  oxygenSaturation?: number;
  facialData?: any;
  voiceData?: any;
  realTimeMode?: boolean;
}

const VitalSignsCard = ({ 
  heartRate, 
  bloodPressure, 
  temperature, 
  oxygenSaturation,
  facialData,
  voiceData,
  realTimeMode = false
}: VitalSignsProps) => {
  const { vitalSigns, isMonitoring, startMonitoring, stopMonitoring, updateFromFacialAnalysis, updateFromVoiceAnalysis } = useVitalSigns();

  // Atualizar sinais vitais quando novos dados chegam
  useEffect(() => {
    if (facialData) {
      updateFromFacialAnalysis(facialData);
    }
  }, [facialData, updateFromFacialAnalysis]);

  useEffect(() => {
    if (voiceData) {
      updateFromVoiceAnalysis(voiceData);
    }
  }, [voiceData, updateFromVoiceAnalysis]);

  // Usar dados em tempo real ou valores fornecidos
  const displayValues = {
    heartRate: heartRate ?? vitalSigns.heartRate,
    bloodPressure: bloodPressure ?? vitalSigns.bloodPressure.formatted,
    temperature: temperature ?? vitalSigns.temperature,
    oxygenSaturation: oxygenSaturation ?? vitalSigns.oxygenSaturation
  };

  // Determinar cores baseadas em ranges normais
  const getHeartRateColor = (hr: number) => {
    if (hr < 60 || hr > 100) return "text-destructive";
    if (hr < 70 || hr > 90) return "text-warning";
    return "text-success";
  };

  const getBloodPressureColor = (bp: string) => {
    const [systolic] = bp.split('/').map(Number);
    if (systolic > 140) return "text-destructive";
    if (systolic > 130) return "text-warning";
    return "text-success";
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 36.0 || temp > 37.5) return "text-destructive";
    if (temp < 36.2 || temp > 37.2) return "text-warning";
    return "text-success";
  };

  const getSaturationColor = (sat: number) => {
    if (sat < 95) return "text-destructive";
    if (sat < 97) return "text-warning";
    return "text-success";
  };
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Sinais Vitais
          </div>
          <div className="flex items-center gap-2">
            {isMonitoring && (
              <Badge variant="secondary" className="text-xs">
                <Wifi className="h-3 w-3 mr-1" />
                Tempo Real
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {vitalSigns.source === 'camera_ppg' ? 'PPG' :
               vitalSigns.source === 'facial_tracking' ? 'Facial' :
               vitalSigns.source === 'voice_analysis' ? 'Voz' : 'Híbrido'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Frequência Cardíaca</span>
              </div>
              <span className={`text-lg font-bold ${getHeartRateColor(displayValues.heartRate)}`}>
                {displayValues.heartRate} bpm
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Pressão Arterial</span>
              </div>
              <span className={`text-lg font-bold ${getBloodPressureColor(displayValues.bloodPressure)}`}>
                {displayValues.bloodPressure} mmHg
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Temperatura</span>
              </div>
              <span className={`text-lg font-bold ${getTemperatureColor(displayValues.temperature)}`}>
                {displayValues.temperature}°C
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium">Saturação O²</span>
              </div>
              <span className={`text-lg font-bold ${getSaturationColor(displayValues.oxygenSaturation)}`}>
                {displayValues.oxygenSaturation}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Informações adicionais */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Confiabilidade: {vitalSigns.confidence}%</span>
            <span>Última atualização: {new Date(vitalSigns.timestamp).toLocaleTimeString('pt-BR')}</span>
          </div>
          {realTimeMode && !isMonitoring && (
            <button 
              onClick={startMonitoring}
              className="mt-2 text-xs text-primary hover:text-primary/80 underline"
            >
              Iniciar monitoramento contínuo
            </button>
          )}
          {isMonitoring && (
            <button 
              onClick={stopMonitoring}
              className="mt-2 text-xs text-destructive hover:text-destructive/80 underline"
            >
              Parar monitoramento
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VitalSignsCard;