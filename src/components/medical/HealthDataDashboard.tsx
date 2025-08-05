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
  heart_rate?: {
    current: number;
    average_7_days?: number;
    resting_hr?: number;
    trend?: string;
  };
  steps?: {
    today: number;
    goal: number;
    average_7_days?: number;
  };
  sleep?: {
    last_night: {
      duration_hours: number;
      quality_score: number;
      efficiency: number;
    };
  };
  blood_pressure?: {
    last_reading: {
      systolic: number;
      diastolic: number;
      category: string;
    };
    trend?: string;
  };
  activity?: {
    calories_burned: number;
    active_minutes: number;
    intensity_distribution: {
      light: number;
      moderate: number;
      vigorous: number;
    };
  };
  stress?: {
    current_level: string;
    stress_score: number;
    hrv_score?: number;
  };
  health_insights?: {
    overall_score: number;
    recommendations?: string[];
    positive_trends?: string[];
  };
}

const HealthDataDashboard = () => {
  const [healthData, setHealthData] = useState<HealthData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Iniciando busca de dados de saúde...');
      
      const response = await supabase.functions.invoke('google-health-data', {
        body: {
          userId: 'demo-user',
          dataTypes: ['heart_rate', 'steps', 'sleep', 'blood_pressure', 'activity', 'stress']
        }
      });

      console.log('Resposta da API:', response);

      if (response.error) {
        throw new Error(response.error.message || 'Erro na API');
      }

      if (response.data?.health_data) {
        const data = response.data.health_data;
        console.log('Dados recebidos:', data);
        
        // Validar estrutura dos dados antes de usar
        const validatedData = validateHealthData(data);
        setHealthData(validatedData);
        setLastSync(response.data.last_sync || new Date().toISOString());
      } else {
        console.warn('Estrutura de dados inválida, usando fallback');
        setHealthData(getMockHealthData());
        setLastSync(new Date().toISOString());
        setError('Dados incompletos recebidos');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setHealthData(getMockHealthData());
      setLastSync(new Date().toISOString());
    } finally {
      setIsLoading(false);
    }
  };

  // Função para validar e sanitizar dados
  const validateHealthData = (data: any): HealthData => {
    const validated: HealthData = {};
    
    if (data.heart_rate?.current) {
      validated.heart_rate = {
        current: data.heart_rate.current,
        average_7_days: data.heart_rate.average_7_days,
        resting_hr: data.heart_rate.resting_hr,
        trend: data.heart_rate.trend || 'stable'
      };
    }
    
    if (data.steps?.today) {
      validated.steps = {
        today: data.steps.today,
        goal: data.steps.goal || 10000,
        average_7_days: data.steps.average_7_days
      };
    }
    
    if (data.sleep?.last_night) {
      validated.sleep = {
        last_night: {
          duration_hours: data.sleep.last_night.duration_hours || 0,
          quality_score: data.sleep.last_night.quality_score || 0,
          efficiency: data.sleep.last_night.efficiency || 0
        }
      };
    }
    
    if (data.blood_pressure?.last_reading) {
      validated.blood_pressure = {
        last_reading: {
          systolic: data.blood_pressure.last_reading.systolic || 0,
          diastolic: data.blood_pressure.last_reading.diastolic || 0,
          category: data.blood_pressure.last_reading.category || 'unknown'
        },
        trend: data.blood_pressure.trend || 'stable'
      };
    }
    
    if (data.activity) {
      validated.activity = {
        calories_burned: data.activity.calories_burned || 0,
        active_minutes: data.activity.active_minutes || 0,
        intensity_distribution: {
          light: data.activity.intensity_distribution?.light || 0,
          moderate: data.activity.intensity_distribution?.moderate || 0,
          vigorous: data.activity.intensity_distribution?.vigorous || 0
        }
      };
    }
    
    if (data.stress) {
      validated.stress = {
        current_level: data.stress.current_level || 'unknown',
        stress_score: data.stress.stress_score || 0,
        hrv_score: data.stress.hrv_score
      };
    }
    
    if (data.health_insights) {
      validated.health_insights = {
        overall_score: data.health_insights.overall_score || 0,
        recommendations: Array.isArray(data.health_insights.recommendations) 
          ? data.health_insights.recommendations 
          : [],
        positive_trends: Array.isArray(data.health_insights.positive_trends) 
          ? data.health_insights.positive_trends 
          : []
      };
    }
    
    return validated;
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
      {/* Erro de sincronização */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Erro na sincronização: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

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
        {healthData.heart_rate?.current && (
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
                  <span className="text-2xl font-bold">{healthData.heart_rate?.current || 0} bpm</span>
                  {getTrendIcon(healthData.heart_rate?.trend || 'stable')}
                </div>
                <div className="text-xs text-muted-foreground">
                  Repouso: {healthData.heart_rate?.resting_hr || 0} bpm
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
        {healthData.steps?.today && (
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
                  <span className="text-2xl font-bold">{healthData.steps?.today?.toLocaleString() || '0'}</span>
                  <span className="text-xs text-muted-foreground">passos</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Meta: {healthData.steps?.goal?.toLocaleString() || '10,000'}
                </div>
                <Progress 
                  value={healthData.steps?.today && healthData.steps?.goal ? (healthData.steps.today / healthData.steps.goal) * 100 : 0} 
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