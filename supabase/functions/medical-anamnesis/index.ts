import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { 
  calculateStructuredUrgency, 
  extractStructuredSymptoms, 
  generateStructuredRecommendations, 
  generateStructuredSummary 
} from './structured-analysis.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, consultationId, conversationHistory = [], isStructuredAnalysis = false } = await req.json();

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    console.log('Processing medical anamnesis for user:', userId);

    // Análise estruturada baseada em questionário objetivo
    if (isStructuredAnalysis) {
      try {
        const answers = JSON.parse(message.split('Análise estruturada baseada em respostas objetivas: ')[1]);
        
        const analysis = {
          urgencyLevel: calculateStructuredUrgency(answers),
          symptoms: extractStructuredSymptoms(answers), 
          recommendations: generateStructuredRecommendations(answers),
          response: generateStructuredSummary(answers)
        };
        
        return new Response(JSON.stringify(analysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error in structured analysis:', error);
      }
    }

    // Contexto médico para chat rápido e objetivo
    const systemPrompt = `Você é um assistente médico para triagem rápida. SUAS RESPOSTAS DEVEM SER:

OBRIGATÓRIO:
- Máximo 2-3 perguntas objetivas
- Perguntas de SIM/NÃO sempre que possível  
- Foque apenas em sintomas críticos de urgência
- Seja DIRETO e CONCISO

EXEMPLO CORRETO:
"1. Você sente dor no peito? (SIM/NÃO)
2. Há dificuldade para respirar? (SIM/NÃO) 
3. Os sintomas começaram há menos de 2 horas? (SIM/NÃO)"

NÃO faça perguntas abertas. NÃO seja prolixo. FOQUE na urgência.`;

    // Preparar histórico da conversa para o OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Chamar OpenAI GPT-4o
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 150,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Salvar mensagem do usuário
    const userMessage = {
      consultation_id: consultationId,
      user_id: userId,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Salvar resposta da IA
    const aiMessage = {
      consultation_id: consultationId,
      user_id: userId,
      type: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    };

    // Análise de urgência baseada na resposta
    const urgencyAnalysis = await analyzeUrgency(aiResponse, message);

    return new Response(JSON.stringify({
      response: aiResponse,
      urgency: urgencyAnalysis,
      conversationHistory: [
        ...conversationHistory,
        userMessage,
        aiMessage
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in medical-anamnesis function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeUrgency(aiResponse: string, userMessage: string): Promise<any> {
  // Palavras-chave para diferentes níveis de urgência
  const criticalKeywords = [
    'dor no peito', 'falta de ar severa', 'perda de consciência', 
    'convulsão', 'sangramento intenso', 'vômito com sangue',
    'dor de cabeça súbita e intensa', 'paralisia', 'confusão mental súbita'
  ];

  const highKeywords = [
    'febre alta', 'dificuldade para respirar', 'dor abdominal intensa',
    'vômitos persistentes', 'tontura severa', 'palpitações'
  ];

  const mediumKeywords = [
    'dor persistente', 'febre', 'náusea', 'mal-estar', 'fadiga'
  ];

  const combinedText = (aiResponse + ' ' + userMessage).toLowerCase();

  if (criticalKeywords.some(keyword => combinedText.includes(keyword))) {
    return {
      level: 'critica',
      score: 9,
      recommendation: 'Busque atendimento médico de emergência imediatamente'
    };
  } else if (highKeywords.some(keyword => combinedText.includes(keyword))) {
    return {
      level: 'alta',
      score: 7,
      recommendation: 'Recomenda-se consulta médica nas próximas horas'
    };
  } else if (mediumKeywords.some(keyword => combinedText.includes(keyword))) {
    return {
      level: 'media',
      score: 5,
      recommendation: 'Agende consulta médica nos próximos dias'
    };
  } else {
    return {
      level: 'baixa',
      score: 2,
      recommendation: 'Monitoramento dos sintomas é suficiente por agora'
    };
  }
}