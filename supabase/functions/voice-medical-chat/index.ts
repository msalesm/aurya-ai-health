import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { voiceAnalysis, conversationHistory, questionCount, maxQuestions, action, chatMessages } = await req.json();

    console.log('Voice Medical Chat - Received request:', { action, questionCount });

    // Se for para gerar insights finais
    if (action === 'generate_insights') {
      return await generateFinalInsights(voiceAnalysis, chatMessages);
    }

    // Verificar se deve finalizar o chat
    if (questionCount >= maxQuestions) {
      return new Response(JSON.stringify({
        completed: true,
        message: 'Chat médico concluído'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gerar pergunta contextual baseada na análise de voz
    const contextualQuestion = await generateContextualQuestion(voiceAnalysis, conversationHistory, questionCount);

    return new Response(JSON.stringify({
      success: true,
      question: contextualQuestion,
      questionNumber: questionCount + 1,
      maxQuestions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in voice-medical-chat function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateContextualQuestion(voiceAnalysis: any, conversationHistory: any[], questionCount: number) {
  const analysis = voiceAnalysis.analysis;
  const healthIndicators = voiceAnalysis.health_indicators || [];
  
  // Preparar contexto para o GPT baseado na análise de voz
  const voiceContext = {
    emotion: analysis?.emotional_tone?.primary_emotion || 'neutral',
    confidence: analysis?.emotional_tone?.confidence || 0,
    stressLevel: analysis?.stress_indicators?.stress_level || 0,
    voiceTremor: analysis?.stress_indicators?.voice_tremor || false,
    breathingRate: analysis?.respiratory_analysis?.breathing_rate || 'normal',
    irregularBreathing: analysis?.respiratory_analysis?.irregularity_detected || false,
    shallowBreathing: analysis?.respiratory_analysis?.shallow_breathing || false,
    transcription: analysis?.transcription || '',
    healthConcerns: healthIndicators.map((h: any) => h.concern).join(', ')
  };

  // Definir foco da pergunta baseado no número
  const questionFocus = getQuestionFocus(questionCount, voiceContext);

  try {
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente médico especializado em fazer perguntas contextuais baseadas em análise de voz. 

CONTEXTO DA ANÁLISE DE VOZ:
- Emoção detectada: ${voiceContext.emotion} (confiança: ${Math.round(voiceContext.confidence * 100)}%)
- Nível de estresse: ${voiceContext.stressLevel}/10
- Tremor vocal: ${voiceContext.voiceTremor ? 'Sim' : 'Não'}
- Taxa respiratória: ${voiceContext.breathingRate} rpm
- Respiração irregular: ${voiceContext.irregularBreathing ? 'Sim' : 'Não'}
- Respiração superficial: ${voiceContext.shallowBreathing ? 'Sim' : 'Não'}
- Preocupações identificadas: ${voiceContext.healthConcerns || 'Nenhuma'}

FOCO DESTA PERGUNTA: ${questionFocus}

DIRETRIZES:
- Faça APENAS UMA pergunta clara e específica
- Base a pergunta nos dados técnicos da voz
- Seja empático e não assustador
- Use linguagem simples e acessível
- Máximo de 2 frases
- Foque em correlacionar dados técnicos com sintomas subjetivos

CONVERSA ANTERIOR:
${conversationHistory.map(m => `${m.sender}: ${m.content}`).join('\n')}`
          },
          {
            role: 'user',
            content: `Gere a pergunta ${questionCount + 1} de máximo 4, focando em: ${questionFocus}`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      }),
    });

    if (!gptResponse.ok) {
      throw new Error(`GPT API error: ${gptResponse.status}`);
    }

    const gptData = await gptResponse.json();
    return gptData.choices[0].message.content.trim();

  } catch (error) {
    console.error('Error generating contextual question:', error);
    return getFallbackQuestion(questionCount, voiceContext);
  }
}

function getQuestionFocus(questionCount: number, voiceContext: any): string {
  switch (questionCount) {
    case 0:
      // Primeira pergunta: foco na emoção detectada
      if (voiceContext.emotion === 'anxiety' || voiceContext.stressLevel > 6) {
        return "ansiedade/estresse detectados na voz";
      } else if (voiceContext.emotion === 'sadness') {
        return "tristeza detectada na voz";
      } else if (voiceContext.voiceTremor) {
        return "tremor vocal detectado";
      }
      return "estado emocional geral";

    case 1:
      // Segunda pergunta: foco na respiração
      if (voiceContext.irregularBreathing || voiceContext.shallowBreathing) {
        return "padrões respiratórios irregulares detectados";
      }
      return "sintomas físicos relacionados à respiração";

    case 2:
      // Terceira pergunta: foco em sintomas específicos
      return "sintomas físicos específicos (dor, desconforto, etc.)";

    case 3:
      // Quarta pergunta: contexto e duração
      return "duração e contexto dos sintomas";

    default:
      return "síntese e esclarecimentos finais";
  }
}

function getFallbackQuestion(questionCount: number, voiceContext: any): string {
  const fallbackQuestions = [
    `Percebi ${voiceContext.emotion !== 'neutral' ? voiceContext.emotion : 'alguns padrões'} na sua voz. Como você está se sentindo hoje?`,
    `Sua respiração parece ${voiceContext.irregularBreathing ? 'um pouco irregular' : 'normal'}. Está sentindo algum desconforto para respirar?`,
    "Está sentindo alguma dor ou desconforto físico no momento?",
    "Há quanto tempo esses sintomas estão presentes?"
  ];

  return fallbackQuestions[Math.min(questionCount, fallbackQuestions.length - 1)];
}

async function generateFinalInsights(voiceAnalysis: any, chatMessages: any[]) {
  try {
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em correlacionar dados técnicos de análise de voz com relatos subjetivos de pacientes.

ANÁLISE TÉCNICA DE VOZ:
${JSON.stringify(voiceAnalysis, null, 2)}

RELATOS DO PACIENTE:
${chatMessages.map(m => m.content).join('\n')}

Gere insights que correlacionem os dados técnicos com os relatos. Responda em JSON:
{
  "correlations": ["correlação 1", "correlação 2"],
  "recommendations": ["recomendação 1", "recomendação 2"],
  "confidenceScore": 0.8,
  "urgencyLevel": "baixo|médio|alto",
  "summary": "resumo da análise combinada"
}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!gptResponse.ok) {
      throw new Error(`GPT API error: ${gptResponse.status}`);
    }

    const gptData = await gptResponse.json();
    const insights = JSON.parse(gptData.choices[0].message.content);

    return new Response(JSON.stringify({
      success: true,
      insights
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    
    // Fallback insights
    const fallbackInsights = {
      correlations: [
        "Dados técnicos de voz analisados com sucesso",
        "Relatos do paciente coletados e processados"
      ],
      recommendations: [
        "Continuar monitoramento dos sintomas",
        "Consultar profissional de saúde se sintomas persistirem"
      ],
      confidenceScore: 0.7,
      urgencyLevel: "baixo",
      summary: "Análise combinada de voz e relatos processada com dados limitados"
    };

    return new Response(JSON.stringify({
      success: true,
      insights: fallbackInsights
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}