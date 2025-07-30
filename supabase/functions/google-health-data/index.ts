import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, dataTypes = ['heart_rate', 'steps', 'sleep'] } = await req.json();
    
    const googleApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google Cloud API key not configured');
    }

    // Para MVP, simularemos dados do Google Fit
    // Em produção, integraria com Google Fitness API
    const healthData = await fetchMockGoogleFitData(userId, dataTypes);

    return new Response(
      JSON.stringify({
        user_id: userId,
        data_types: dataTypes,
        health_data: healthData,
        last_sync: new Date().toISOString(),
        source: 'google_fit'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-health-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar dados de saúde',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function fetchMockGoogleFitData(userId: string, dataTypes: string[]) {
  const data: any = {};
  const now = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    return date;
  });

  for (const dataType of dataTypes) {
    switch (dataType) {
      case 'heart_rate':
        data.heart_rate = {
          current: 72 + Math.floor(Math.random() * 20), // 72-92 bpm
          average_7_days: 75,
          resting_hr: 65,
          max_hr_today: 95,
          variability: 'normal',
          trend: 'stable',
          daily_data: last7Days.map(date => ({
            date: date.toISOString().split('T')[0],
            average: 70 + Math.floor(Math.random() * 15),
            max: 85 + Math.floor(Math.random() * 20),
            min: 60 + Math.floor(Math.random() * 10)
          }))
        };
        break;

      case 'steps':
        data.steps = {
          today: 8500 + Math.floor(Math.random() * 3000),
          goal: 10000,
          average_7_days: 9200,
          total_distance_km: 6.2,
          active_minutes: 45,
          daily_data: last7Days.map(date => ({
            date: date.toISOString().split('T')[0],
            steps: 7000 + Math.floor(Math.random() * 5000),
            distance_km: 5 + Math.random() * 3
          }))
        };
        break;

      case 'sleep':
        data.sleep = {
          last_night: {
            duration_hours: 7.5,
            deep_sleep_hours: 1.8,
            light_sleep_hours: 4.2,
            rem_sleep_hours: 1.5,
            efficiency: 88,
            quality_score: 82
          },
          average_7_days: {
            duration_hours: 7.2,
            efficiency: 85,
            quality_score: 80
          },
          sleep_debt_hours: -0.5,
          daily_data: last7Days.map(date => ({
            date: date.toISOString().split('T')[0],
            duration_hours: 6.5 + Math.random() * 2,
            quality_score: 70 + Math.floor(Math.random() * 30)
          }))
        };
        break;

      case 'blood_pressure':
        data.blood_pressure = {
          last_reading: {
            systolic: 120 + Math.floor(Math.random() * 20),
            diastolic: 80 + Math.floor(Math.random() * 10),
            timestamp: new Date().toISOString(),
            category: 'normal'
          },
          average_7_days: {
            systolic: 125,
            diastolic: 82
          },
          trend: 'stable'
        };
        break;

      case 'activity':
        data.activity = {
          calories_burned: 2200 + Math.floor(Math.random() * 400),
          active_minutes: 35 + Math.floor(Math.random() * 20),
          sedentary_minutes: 480,
          workout_sessions_week: 3,
          favorite_activity: 'walking',
          intensity_distribution: {
            light: 70,
            moderate: 25,
            vigorous: 5
          }
        };
        break;

      case 'stress':
        data.stress = {
          current_level: 'low',
          stress_score: 25 + Math.floor(Math.random() * 30), // 0-100
          relaxation_minutes: 15,
          stress_triggers: ['work', 'traffic'],
          hrv_score: 45 + Math.floor(Math.random() * 20),
          recovery_recommendation: 'breathing_exercise'
        };
        break;
    }
  }

  // Adicionar insights gerais de saúde
  data.health_insights = {
    overall_score: 78 + Math.floor(Math.random() * 15),
    recommendations: [
      'Manter atividade física regular',
      'Melhorar qualidade do sono',
      'Monitorar pressão arterial'
    ],
    risk_factors: [],
    positive_trends: ['Atividade física consistente'],
    areas_for_improvement: ['Duração do sono']
  };

  return data;
}