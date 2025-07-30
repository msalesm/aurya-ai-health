import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Activity, Thermometer, Zap } from "lucide-react";

interface VitalSignsProps {
  heartRate?: number;
  bloodPressure?: string;
  temperature?: number;
  oxygenSaturation?: number;
}

const VitalSignsCard = ({ 
  heartRate = 72, 
  bloodPressure = "120/80", 
  temperature = 36.5, 
  oxygenSaturation = 98 
}: VitalSignsProps) => {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Sinais Vitais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Frequência Cardíaca</span>
              </div>
              <span className="text-lg font-bold text-destructive">{heartRate} bpm</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Pressão Arterial</span>
              </div>
              <span className="text-lg font-bold text-primary">{bloodPressure} mmHg</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Temperatura</span>
              </div>
              <span className="text-lg font-bold text-warning">{temperature}°C</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium">Saturação O²</span>
              </div>
              <span className="text-lg font-bold text-secondary">{oxygenSaturation}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VitalSignsCard;