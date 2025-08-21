import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - REQUIRED for medical inference
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required for medical inference processing',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client to verify auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Invalid or expired authentication token',
        code: 'AUTH_INVALID'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { 
      symptoms, 
      vitalSigns, 
      voiceAnalysis, 
      healthData, 
      patientAge, 
      patientGender,
      consultationId 
    } = await req.json();

    // Sistema de inferência médica baseado em regras clínicas
    const diagnosis = await generateMedicalInference({
      symptoms,
      vitalSigns,
      voiceAnalysis,
      healthData,
      patientAge,
      patientGender
    });

    // Usar OpenAI para análise complementar
    const aiAnalysis = await getAIAnalysis({
      symptoms,
      vitalSigns,
      diagnosis
    });

    const result = {
      consultation_id: consultationId,
      primary_diagnosis: diagnosis.primary,
      differential_diagnoses: diagnosis.differential,
      urgency_level: diagnosis.urgency,
      confidence_score: diagnosis.confidence,
      ai_analysis: aiAnalysis,
      recommendations: diagnosis.recommendations,
      referral_needed: diagnosis.referral_needed,
      emergency_signs: diagnosis.emergency_signs,
      follow_up: diagnosis.follow_up,
      generated_at: new Date().toISOString()
    };

    // Salvar resultado no banco se consultationId fornecido
    if (consultationId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase
        .from('medical_consultations')
        .update({
          ai_diagnosis: result.primary_diagnosis,
          urgency_level: result.urgency_level,
          recommendations: result.recommendations,
          needs_referral: result.referral_needed,
          assessment_score: Math.round(result.confidence_score * 100),
          updated_at: new Date().toISOString()
        })
        .eq('id', consultationId);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in medical-inference function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro na inferência médica',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateMedicalInference(data: any) {
  const { symptoms, vitalSigns, voiceAnalysis, healthData, patientAge, patientGender } = data;
  
  let urgency = 'baixa';
  let confidence = 0.7;
  let primaryDiagnosis = 'Consulta de rotina';
  let differentialDiagnoses: string[] = [];
  let recommendations: string[] = ['Manter cuidados de saúde preventivos'];
  let referralNeeded = false;
  let emergencySigns: string[] = [];

  // Análise de sinais de emergência
  if (vitalSigns) {
    if (vitalSigns.heart_rate > 120 || vitalSigns.heart_rate < 50) {
      emergencySigns.push('Frequência cardíaca anormal');
      urgency = 'alta';
      referralNeeded = true;
    }
    
    if (vitalSigns.blood_pressure_systolic > 180 || vitalSigns.blood_pressure_systolic < 90) {
      emergencySigns.push('Pressão arterial crítica');
      urgency = 'crítica';
      referralNeeded = true;
    }

    if (vitalSigns.oxygen_saturation < 90) {
      emergencySigns.push('Saturação de oxigênio baixa');
      urgency = 'crítica';
      referralNeeded = true;
    }

    if (vitalSigns.temperature > 39 || vitalSigns.temperature < 35) {
      emergencySigns.push('Temperatura corporal anormal');
      urgency = urgency === 'crítica' ? 'crítica' : 'alta';
    }
  }

  // Análise de sintomas
  if (symptoms && symptoms.length > 0) {
    const criticalSymptoms = [
      'dor no peito', 'falta de ar', 'perda de consciência', 
      'convulsão', 'hemorragia', 'trauma grave'
    ];

    const hasCriticalSymptoms = symptoms.some((symptom: string) =>
      criticalSymptoms.some(critical => 
        symptom.toLowerCase().includes(critical)
      )
    );

    if (hasCriticalSymptoms) {
      urgency = 'crítica';
      referralNeeded = true;
      primaryDiagnosis = 'Condição aguda que requer avaliação médica imediata';
      confidence = 0.9;
    } else {
      // Análise de sintomas comuns
      if (symptoms.some((s: string) => s.toLowerCase().includes('febre'))) {
        primaryDiagnosis = 'Síndrome febril a esclarecer';
        differentialDiagnoses = ['Infecção viral', 'Infecção bacteriana', 'Outras causas'];
        urgency = 'média';
        recommendations.push('Hidratação adequada', 'Repouso', 'Monitorar temperatura');
      }

      if (symptoms.some((s: string) => s.toLowerCase().includes('dor de cabeça'))) {
        primaryDiagnosis = 'Cefaleia a esclarecer';
        differentialDiagnoses = ['Cefaleia tensional', 'Enxaqueca', 'Cefaleia secundária'];
        recommendations.push('Evitar fatores desencadeantes', 'Hidratação', 'Ambiente calmo');
      }
    }
  }

  // Análise de voz (indicadores emocionais e neurológicos)
  if (voiceAnalysis) {
    if (voiceAnalysis.emotion?.stress_level === 'high') {
      recommendations.push('Técnicas de relaxamento e manejo do estresse');
      if (primaryDiagnosis === 'Consulta de rotina') {
        primaryDiagnosis = 'Estresse/Ansiedade';
        differentialDiagnoses = ['Transtorno de ansiedade', 'Estresse agudo', 'Burnout'];
      }
    }

    if (voiceAnalysis.health?.vocal_tremor) {
      recommendations.push('Avaliação neurológica especializada');
      referralNeeded = true;
      urgency = 'média';
    }
  }

  // Fatores de risco por idade
  if (patientAge > 65) {
    recommendations.push('Rastreamento cardiovascular regular', 'Avaliação cognitiva');
    confidence *= 0.9; // Maior cautela em idosos
  }

  if (patientAge < 18) {
    recommendations.push('Acompanhamento pediátrico regular');
    confidence *= 0.9; // Maior cautela em crianças
  }

  return {
    primary: primaryDiagnosis,
    differential: differentialDiagnoses,
    urgency,
    confidence,
    recommendations,
    referral_needed: referralNeeded,
    emergency_signs: emergencySigns,
    follow_up: referralNeeded ? '24 horas' : '7 dias'
  };
}

async function getAIAnalysis(data: any) {
  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return 'Análise de IA não disponível';
    }

    const prompt = `Como médico especialista, analise estes dados clínicos:

SINTOMAS: ${data.symptoms?.join(', ') || 'Não relatados'}
SINAIS VITAIS: ${JSON.stringify(data.vitalSigns || {})}
DIAGNÓSTICO PRELIMINAR: ${data.diagnosis?.primary || 'Não definido'}

Forneça uma análise médica concisa focando em:
1. Validação do diagnóstico preliminar
2. Fatores de risco não considerados
3. Recomendações específicas
4. Necessidade de exames complementares

Mantenha linguagem técnica mas acessível.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um médico experiente realizando uma segunda opinião clínica.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 400,
      }),
    });

    if (response.ok) {
      const aiData = await response.json();
      return aiData.choices[0].message.content;
    }
  } catch (error) {
    console.error('AI analysis failed:', error);
  }

  return 'Análise médica baseada em protocolos clínicos padrão. Recomenda-se acompanhamento profissional.';
}