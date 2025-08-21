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

// Secure logging function
const secureLog = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const sanitizedData = data ? sanitizeForLogging(data) : '';
  console.log(`[${timestamp}] [${level}] ${message} ${sanitizedData}`);
};

// Data sanitization function
const sanitizeForLogging = (data: any): string => {
  if (!data) return '';
  
  if (typeof data === 'string') {
    // Remove sensitive information
    return data
      .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '***.***.***-**') // CPF
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '***@***.**') // Email
      .replace(/\b(?:\+55\s?)?\(?[1-9]\d?\)?\s?\d{4,5}-?\d{4}\b/g, '(**) *****-****'); // Phone
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (['message', 'content', 'transcription', 'symptoms'].includes(key.toLowerCase())) {
        sanitized[key] = '[MEDICAL_DATA_REMOVED]';
      } else if (['userId', 'consultationId'].includes(key)) {
        sanitized[key] = '[ID_REMOVED]';
      } else {
        sanitized[key] = value;
      }
    }
    return JSON.stringify(sanitized);
  }
  
  return String(data);
};

// Input validation function
const validateInput = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.message || typeof data.message !== 'string') {
    errors.push('Message is required and must be a string');
  }
  
  if (!data.userId || typeof data.userId !== 'string') {
    errors.push('UserId is required and must be a string');
  }
  
  // Check for potential XSS/injection attempts
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i
  ];
  
  const inputString = JSON.stringify(data);
  for (const pattern of maliciousPatterns) {
    if (pattern.test(inputString)) {
      errors.push('Potentially malicious content detected');
      break;
    }
  }
  
  // Size validation
  if (inputString.length > 50000) {
    errors.push('Input data too large');
  }
  
  return { isValid: errors.length === 0, errors };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - REQUIRED for medical data processing
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      secureLog('WARN', 'Missing or invalid authorization header');
      return new Response(JSON.stringify({ 
        error: 'Authentication required for medical data processing',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      secureLog('WARN', 'Invalid authentication token', { error: authError?.message });
      return new Response(JSON.stringify({ 
        error: 'Invalid or expired authentication token',
        code: 'AUTH_INVALID'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    secureLog('INFO', 'Authenticated medical anamnesis request', { userId: '[SANITIZED]' });
    const requestData = await req.json();
    
    // Validate input
    const validation = validateInput(requestData);
    if (!validation.isValid) {
      secureLog('WARN', 'Invalid input received', { errors: validation.errors });
      return new Response(JSON.stringify({ 
        error: 'Invalid input data',
        details: validation.errors
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { message, userId, consultationId, conversationHistory = [], isStructuredAnalysis = false } = requestData;

    // Validate user ID matches authenticated user
    if (userId && userId !== user.id) {
      secureLog('WARN', 'User ID mismatch in request', { requestUserId: '[SANITIZED]', authUserId: '[SANITIZED]' });
      return new Response(JSON.stringify({ 
        error: 'User ID does not match authenticated user',
        code: 'USER_MISMATCH'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    secureLog('INFO', 'Processing medical anamnesis', { 
      userId: '[USER_ID_REMOVED]',
      hasConsultationId: !!consultationId,
      isStructured: isStructuredAnalysis,
      messageLength: message.length 
    });

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

    // Prepare sanitized data for OpenAI
    const sanitizedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.role === 'system' ? msg.content : sanitizeForThirdPartyAPI(msg.content)
    }));

    // Call OpenAI GPT-4o with sanitized data
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: sanitizedMessages,
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
    secureLog('ERROR', 'Error in medical-anamnesis function', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n')[0] : undefined
    });
    
    return new Response(JSON.stringify({ 
      error: 'An error occurred processing your medical consultation. Please try again.',
      code: 'MEDICAL_ANALYSIS_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Sanitize content for third-party APIs
const sanitizeForThirdPartyAPI = (content: string): string => {
  if (!content || typeof content !== 'string') return content;
  
  // Remove specific personal identifiers while preserving medical context
  return content
    .replace(/\bmeu nome é [^\s,.\n]+/gi, 'meu nome é [NOME_REMOVIDO]')
    .replace(/\bchamo [^\s,.\n]+/gi, 'chamo [NOME_REMOVIDO]')
    .replace(/\bsou [^\s,.\n]+ anos/gi, 'sou [IDADE_REMOVIDA] anos')
    .replace(/\bmoro em [^\s,.\n]+/gi, 'moro em [LOCAL_REMOVIDO]')
    // Keep medical symptoms and descriptions intact for proper analysis
    .trim();
};
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