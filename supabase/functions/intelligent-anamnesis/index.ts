import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context, sessionId, requestType, patientAge } = await req.json();

    if (requestType === 'generate_question') {
      return await generateIntelligentQuestion(context, sessionId, patientAge);
    } else if (requestType === 'final_analysis') {
      return await generateFinalAnalysis(context, sessionId);
    }

    return new Response(JSON.stringify({ error: 'Invalid request type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in intelligent-anamnesis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function generateIntelligentQuestion(context: any, sessionId: string, patientAge?: number) {
  console.log('Generating intelligent question for session:', sessionId);
  
  // Build context for AI
  const prompt = `Você é um médico experiente realizando uma anamnese inteligente. 
  
CONTEXTO ATUAL:
- Respostas anteriores: ${JSON.stringify(context.answers)}
- Dados faciais: FC ${context.facialData?.heartRate || 'N/A'} bpm, Estresse ${context.facialData?.stressLevel || 'N/A'}/10
- Dados de voz: Emoção ${context.voiceData?.emotionalState || 'N/A'}, Estresse ${context.voiceData?.stressLevel || 'N/A'}/10
- Score de urgência atual: ${context.urgencyScore}/100
- Perguntas já feitas: ${context.questionHistory?.length || 0}
- Idade do paciente: ${patientAge || 'não informada'}

INSTRUÇÕES:
1. Analise os dados biométricos (facial/voz) para correlacionar com as respostas
2. Faça UMA pergunta específica e relevante baseada no contexto
3. Priorize perguntas críticas se os dados indicarem urgência alta
4. Se já temos informações suficientes (urgência >70 ou 5+ perguntas), termine a anamnese
5. Adapte a linguagem para ser clara e médica mas acessível

FORMATO DE RESPOSTA:
{
  "isComplete": boolean,
  "question": {
    "id": "unique_id",
    "text": "pergunta em português",
    "type": "yes_no|multiple|scale|text",
    "options": ["opção1", "opção2"] (se aplicável),
    "category": "categoria_medica",
    "priority": 1-10
  },
  "currentUrgencyScore": number,
  "reasoning": "Por que esta pergunta foi escolhida"
}

Gere a próxima pergunta mais relevante:`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Generate the next most relevant question based on the context.' }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    try {
      const parsedResponse = JSON.parse(aiResponse);
      
      // Validate and sanitize response
      if (parsedResponse.isComplete) {
        return new Response(JSON.stringify({
          isComplete: true,
          finalUrgencyScore: context.urgencyScore
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Ensure question has required fields
      const question = {
        id: parsedResponse.question?.id || `q_${Date.now()}`,
        text: parsedResponse.question?.text || 'Como você está se sentindo agora?',
        type: parsedResponse.question?.type || 'text',
        category: parsedResponse.question?.category || 'geral',
        priority: parsedResponse.question?.priority || 5,
        ...(parsedResponse.question?.options && { options: parsedResponse.question.options })
      };

      return new Response(JSON.stringify({
        isComplete: false,
        question,
        currentUrgencyScore: parsedResponse.currentUrgencyScore || context.urgencyScore,
        reasoning: parsedResponse.reasoning
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback question
      return generateFallbackQuestion(context);
    }

  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackQuestion(context);
  }
}

async function generateFinalAnalysis(context: any, sessionId: string) {
  console.log('Generating final analysis for session:', sessionId);

  const prompt = `Analise esta consulta médica virtual e forneça uma avaliação final:

DADOS DA CONSULTA:
- Respostas: ${JSON.stringify(context.answers)}
- Dados faciais: ${JSON.stringify(context.facialData)}
- Dados de voz: ${JSON.stringify(context.voiceData)}
- Score de urgência: ${context.urgencyScore}/100

FORNEÇA:
1. Análise consolidada dos sintomas
2. Recomendações médicas específicas
3. Lista de sintomas identificados
4. Nível de urgência final

FORMATO:
{
  "analysis": "análise detalhada em português",
  "recommendations": ["recomendação 1", "recomendação 2"],
  "symptoms": ["sintoma 1", "sintoma 2"],
  "urgencyLevel": "crítica|alta|média|baixa",
  "finalScore": number,
  "riskFactors": ["fator 1", "fator 2"]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Provide final medical analysis.' }
        ],
        temperature: 0.3,
        max_tokens: 800
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    const analysis = JSON.parse(aiResponse);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in final analysis:', error);
    
    // Fallback analysis
    const fallbackAnalysis = {
      analysis: 'Análise baseada nas respostas fornecidas durante a consulta.',
      recommendations: generateBasicRecommendations(context.urgencyScore),
      symptoms: extractBasicSymptoms(context.answers),
      urgencyLevel: getUrgencyLevel(context.urgencyScore),
      finalScore: context.urgencyScore,
      riskFactors: identifyBasicRiskFactors(context)
    };

    return new Response(JSON.stringify(fallbackAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

function generateFallbackQuestion(context: any) {
  const fallbackQuestions = [
    {
      id: 'general_feeling',
      text: 'Como você está se sentindo no momento?',
      type: 'multiple',
      options: ['Bem', 'Desconfortável', 'Com dor', 'Muito mal'],
      category: 'geral',
      priority: 5
    },
    {
      id: 'symptom_duration',
      text: 'Há quanto tempo você sente isso?',
      type: 'multiple',
      options: ['Menos de 1 hora', '1-6 horas', '1 dia', 'Vários dias'],
      category: 'tempo',
      priority: 6
    },
    {
      id: 'pain_intensity',
      text: 'Se você tem dor, qual a intensidade de 0 a 10?',
      type: 'scale',
      category: 'dor',
      priority: 7
    }
  ];

  const answeredIds = Object.keys(context.answers);
  const unanswered = fallbackQuestions.filter(q => !answeredIds.includes(q.id));
  
  if (unanswered.length === 0) {
    return new Response(JSON.stringify({
      isComplete: true,
      finalUrgencyScore: context.urgencyScore
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    isComplete: false,
    question: unanswered[0],
    currentUrgencyScore: context.urgencyScore
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function generateBasicRecommendations(urgencyScore: number): string[] {
  if (urgencyScore >= 70) return ['Procurar atendimento médico de emergência imediatamente'];
  if (urgencyScore >= 50) return ['Procurar atendimento médico urgente nas próximas horas'];
  if (urgencyScore >= 30) return ['Agendar consulta médica em 24-48 horas'];
  return ['Monitoramento e autocuidado', 'Procurar atendimento se os sintomas piorarem'];
}

function extractBasicSymptoms(answers: Record<string, any>): string[] {
  const symptoms: string[] = [];
  
  Object.entries(answers).forEach(([key, value]) => {
    if (key.includes('pain') && value === 'sim') symptoms.push('Dor');
    if (key.includes('breathing') && value === 'sim') symptoms.push('Dificuldade respiratória');
    if (key.includes('chest') && value === 'sim') symptoms.push('Dor no peito');
    if (key.includes('fever') && value === 'sim') symptoms.push('Febre');
    if (typeof value === 'string' && value.length > 10) symptoms.push(value);
  });
  
  return symptoms;
}

function getUrgencyLevel(score: number): string {
  if (score >= 70) return 'crítica';
  if (score >= 50) return 'alta';
  if (score >= 30) return 'média';
  return 'baixa';
}

function identifyBasicRiskFactors(context: any): string[] {
  const risks: string[] = [];
  
  if (context.facialData?.heartRate > 100) risks.push('Frequência cardíaca elevada');
  if (context.facialData?.stressLevel > 7) risks.push('Alto nível de estresse detectado');
  if (context.voiceData?.stressLevel > 7) risks.push('Estresse vocal elevado');
  if (context.urgencyScore > 60) risks.push('Sintomas sugestivos de urgência médica');
  
  return risks;
}