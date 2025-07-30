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
    const { message, consultationId, userId } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Sistema de prompt médico especializado
    const medicalPrompt = `Você é um assistente médico especializado em anamnese e triagem clínica. 
    
    DIRETRIZES IMPORTANTES:
    - Conduza uma anamnese sistemática e empática
    - Faça perguntas diretas sobre sintomas principais
    - Identifique sinais de alerta e urgência médica
    - Use linguagem clara e acessível
    - Sempre mantenha tom profissional e acolhedor
    - Se detectar sintomas graves, priorize encaminhamento urgente
    
    FOQUE EM:
    - Queixa principal e história da doença atual
    - Sintomas associados e duração
    - Fatores de melhora/piora
    - Sinais vitais e dados objetivos
    - Antecedentes pessoais relevantes
    
    SINAIS DE ALERTA (encaminhar imediatamente):
    - Dor no peito, falta de ar grave
    - Sinais neurológicos agudos
    - Hemorragias, trauma grave
    - Febre alta persistente
    - Alterações de consciência`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: medicalPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Salvar na consulta se consultationId fornecido
    if (consultationId && userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase
        .from('medical_consultations')
        .update({
          conversation_data: { raw: `${message} -> ${aiResponse}` },
          updated_at: new Date().toISOString()
        })
        .eq('id', consultationId)
        .eq('user_id', userId);
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in medical-anamnesis function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro na análise médica',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});