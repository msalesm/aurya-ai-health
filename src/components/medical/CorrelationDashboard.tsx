import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Heart, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react';

interface CorrelationDashboardProps {
  correlationData?: {
    consistencyScore: number;
    reliability: 'high' | 'medium' | 'low';
    conflictingMetrics: string[];
    consensusIndicators: {
      stressConsensus: boolean;
      emotionalConsensus: boolean;
      urgencyConsensus: boolean;
    };
  };
  biometricData?: {
    heartRateConsistency: number;
    stressCorrelation: number;
    emotionalAlignment: number;
  };
  outliers?: string[];
  urgencyData?: {
    level: string;
    score: number;
    confidence: number;
  };
}

export const CorrelationDashboard: React.FC<CorrelationDashboardProps> = ({
  correlationData,
  biometricData,
  outliers = [],
  urgencyData
}) => {
  if (!correlationData) return null;

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'crítica': return 'destructive';
      case 'alta': return 'secondary';
      case 'média': return 'default';
      case 'baixa': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {/* Reliability Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Confiabilidade da Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Score de Consistência:</span>
              <div className="flex items-center gap-2">
                <Progress value={correlationData.consistencyScore} className="w-20 h-2" />
                <span className="font-bold">{correlationData.consistencyScore}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Nível de Confiabilidade:</span>
              <Badge 
                variant="outline" 
                className={getReliabilityColor(correlationData.reliability)}
              >
                {correlationData.reliability === 'high' ? 'Alto' :
                 correlationData.reliability === 'medium' ? 'Médio' : 'Baixo'}
              </Badge>
            </div>

            {urgencyData && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Urgência Consolidada:</span>
                <div className="flex items-center gap-2">
                  <Badge variant={getUrgencyColor(urgencyData.level)}>
                    {urgencyData.level}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {urgencyData.score}/100 ({urgencyData.confidence}% confiança)
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consensus Indicators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Consenso Entre Modalidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Estresse Detectado
              </span>
              {correlationData.consensusIndicators.stressConsensus ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Estado Emocional
              </span>
              {correlationData.consensusIndicators.emotionalConsensus ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Nível de Urgência
              </span>
              {correlationData.consensusIndicators.urgencyConsensus ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Biometric Correlations */}
      {biometricData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Correlações Biométricas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Consistência Cardíaca</span>
                  <span>{Math.round(biometricData.heartRateConsistency * 100)}%</span>
                </div>
                <Progress value={biometricData.heartRateConsistency * 100} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Correlação de Estresse</span>
                  <span>{Math.round(biometricData.stressCorrelation * 100)}%</span>
                </div>
                <Progress value={biometricData.stressCorrelation * 100} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Alinhamento Emocional</span>
                  <span>{Math.round(biometricData.emotionalAlignment * 100)}%</span>
                </div>
                <Progress value={biometricData.emotionalAlignment * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conflicting Metrics Alert */}
      {correlationData.conflictingMetrics.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Métricas Conflitantes Detectadas:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {correlationData.conflictingMetrics.map((metric, index) => (
                <li key={index}>{metric}</li>
              ))}
            </ul>
            <div className="mt-2 text-sm text-muted-foreground">
              Recomenda-se repetir a análise ou consultar profissional médico.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Outliers Alert */}
      {outliers.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Valores Anômalos Detectados:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {outliers.map((outlier, index) => (
                <li key={index}>{outlier}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};