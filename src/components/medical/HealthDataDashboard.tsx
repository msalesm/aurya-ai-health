import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Activity, 
  Moon, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthData {
  heart_rate?: any;
  steps?: any;
  sleep?: any;
  blood_pressure?: any;
  activity?: any;
  stress?: any;
  health_insights?: any;
}

const HealthDataDashboard = () => {
  const [healthData, setHealthData] = useState<HealthData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchHealthData = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('google-health-data', {
        body: {
          userId: 'demo-user', // Em produção seria o ID real do usuário
          dataTypes: ['heart_rate', 'steps', 'sleep', 'blood_pressure', 'activity', 'stress']
        }
      });

      if (response.data && !response.error) {
        setHealthData(response.data.health_data);
        setLastSync(response.data.last_sync);
      } else {
        console.error('Erro ao buscar dados:', response.error);
        // Usar dados simulados como fallback
        setHealthData(getMockHealthData());
        setLastSync(new Date().toISOString());
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setHealthData(getMockHealthData());
      setLastSync(new Date().toISOString());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Nunca sincronizado';
    const date = new Date(timestamp);
    return `Há ${Math.floor((Date.now() - date.getTime()) / 60000)} min`;
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de sincronização */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dados de Saúde</h2>
          <p className="text-muted-foreground">
            Última sincronização: {formatLastSync(lastSync)}
          </p>
        </div>
        <Button 
          onClick={fetchHealthData} 
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>
      </div>

      {/* Score geral de saúde */}
      {healthData.health_insights && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Score Geral de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-3xl font-bold ${getHealthScoreColor(healthData.health_insights.overall_score)}`}>
                  {healthData.health_insights.overall_score}/100
                </div>
                <p className="text-muted-foreground">Baseado em dados dos últimos 7 dias</p>
              </div>
              <div className="text-right space-y-1">
                {healthData.health_insights.positive_trends?.map((trend: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {trend}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Frequência Cardíaca */}
        {healthData.heart_rate && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-destructive" />
                Frequência Cardíaca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{healthData.heart_rate.current} bpm</span>
                  {getTrendIcon(healthData.heart_rate.trend)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Repouso: {healthData.heart_rate.resting_hr} bpm
                </div>
                <Progress 
                  value={(healthData.heart_rate.current / 120) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Passos */}
        {healthData.steps && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Atividade Física
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{healthData.steps.today.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">passos</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Meta: {healthData.steps.goal.toLocaleString()}
                </div>
                <Progress 
                  value={(healthData.steps.today / healthData.steps.goal) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sono */}
        {healthData.sleep && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Moon className="h-4 w-4 text-secondary" />
                Qualidade do Sono
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{healthData.sleep.last_night.duration_hours}h</span>
                  <Badge variant={healthData.sleep.last_night.quality_score > 80 ? 'default' : 'secondary'}>
                    {healthData.sleep.last_night.quality_score}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Eficiência: {healthData.sleep.last_night.efficiency}%
                </div>
                <Progress 
                  value={healthData.sleep.last_night.quality_score} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pressão Arterial */}
        {healthData.blood_pressure && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-warning" />
                Pressão Arterial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {healthData.blood_pressure.last_reading.systolic}/
                  {healthData.blood_pressure.last_reading.diastolic}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={healthData.blood_pressure.last_reading.category === 'normal' ? 'default' : 'destructive'}>
                    {healthData.blood_pressure.last_reading.category}
                  </Badge>
                  {getTrendIcon(healthData.blood_pressure.trend)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nível de Estresse */}
        {healthData.stress && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Nível de Estresse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold capitalize">{healthData.stress.current_level}</span>
                  <span className="text-sm text-muted-foreground">{healthData.stress.stress_score}/100</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  VFC: {healthData.stress.hrv_score}
                </div>
                <Progress 
                  value={100 - healthData.stress.stress_score} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calorias */}
        {healthData.activity && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-success" />
                Energia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{healthData.activity.calories_burned}</div>
                <div className="text-xs text-muted-foreground">
                  Ativo: {healthData.activity.active_minutes} min
                </div>
                <div className="flex gap-1">
                  <div className="h-2 bg-success rounded flex-1" style={{width: `${healthData.activity.intensity_distribution.light}%`}}></div>
                  <div className="h-2 bg-warning rounded flex-1" style={{width: `${healthData.activity.intensity_distribution.moderate}%`}}></div>
                  <div className="h-2 bg-destructive rounded flex-1" style={{width: `${healthData.activity.intensity_distribution.vigorous}%`}}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recomendações */}
      {healthData.health_insights?.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle>Recomendações Personalizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthData.health_insights.recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  {rec}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Dados simulados para fallback
function getMockHealthData(): HealthData {
  return {
    heart_rate: {
      current: 72,
      average_7_days: 75,
      resting_hr: 65,
      trend: 'stable'
    },
    steps: {
      today: 8924,
      goal: 10000,
      average_7_days: 9200
    },
    sleep: {
      last_night: {
        duration_hours: 7.5,
        quality_score: 82,
        efficiency: 88
      }
    },
    blood_pressure: {
      last_reading: {
        systolic: 120,
        diastolic: 80,
        category: 'normal'
      },
      trend: 'stable'
    },
    stress: {
      current_level: 'low',
      stress_score: 25,
      hrv_score: 45
    },
    activity: {
      calories_burned: 2240,
      active_minutes: 45,
      intensity_distribution: {
        light: 70,
        moderate: 25,
        vigorous: 5
      }
    },
    health_insights: {
      overall_score: 85,
      recommendations: [
        'Manter atividade física regular',
        'Melhorar qualidade do sono',
        'Continuar monitoramento'
      ],
      positive_trends: ['Atividade consistente']
    }
  };
}

export default HealthDataDashboard;