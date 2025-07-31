import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Activity, Thermometer, Zap, RefreshCw } from "lucide-react";
import { useVitalSigns } from "@/hooks/useVitalSigns";

interface VitalSignsProps {
  externalData?: {
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    oxygenSaturation?: number;
    source?: string;
  };
}

const VitalSignsCard = ({ externalData }: VitalSignsProps) => {
  const { vitalSigns, isLoading, fetchFromHealthData, updateVitalSigns } = useVitalSigns();

  // Se há dados externos (ex: da telemetria facial), usar eles
  const displayVitals = externalData ? {
    heartRate: externalData.heartRate || vitalSigns.heartRate,
    bloodPressure: externalData.bloodPressure || vitalSigns.bloodPressure,
    temperature: externalData.temperature || vitalSigns.temperature,
    oxygenSaturation: externalData.oxygenSaturation || vitalSigns.oxygenSaturation
  } : vitalSigns;

  const getVitalStatus = (type: string, value: number | string) => {
    switch (type) {
      case 'heartRate':
        const hr = value as number;
        if (hr < 60) return 'text-blue-500';
        if (hr > 100) return 'text-red-500';
        return 'text-green-500';
      case 'bloodPressure':
        const bp = value as string;
        const [systolic] = bp.split('/').map(Number);
        if (systolic >= 140) return 'text-red-500';
        if (systolic >= 130) return 'text-yellow-500';
        return 'text-green-500';
      case 'temperature':
        const temp = value as number;
        if (temp >= 37.5) return 'text-red-500';
        if (temp <= 36.0) return 'text-blue-500';
        return 'text-green-500';
      case 'oxygen':
        const o2 = value as number;
        if (o2 < 95) return 'text-red-500';
        if (o2 < 98) return 'text-yellow-500';
        return 'text-green-500';
      default:
        return 'text-foreground';
    }
  };
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Sinais Vitais
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchFromHealthData}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        {externalData?.source && (
          <p className="text-xs text-muted-foreground">
            Fonte: {externalData.source === 'facial_telemetry' ? 'Telemetria Facial' : 'Dados de Saúde'}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Frequência Cardíaca</span>
              </div>
              <span className={`text-lg font-bold ${getVitalStatus('heartRate', displayVitals.heartRate)}`}>
                {displayVitals.heartRate} bpm
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Pressão Arterial</span>
              </div>
              <span className={`text-lg font-bold ${getVitalStatus('bloodPressure', displayVitals.bloodPressure)}`}>
                {displayVitals.bloodPressure} mmHg
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Temperatura</span>
              </div>
              <span className={`text-lg font-bold ${getVitalStatus('temperature', displayVitals.temperature)}`}>
                {displayVitals.temperature}°C
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium">Saturação O²</span>
              </div>
              <span className={`text-lg font-bold ${getVitalStatus('oxygen', displayVitals.oxygenSaturation)}`}>
                {displayVitals.oxygenSaturation}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VitalSignsCard;