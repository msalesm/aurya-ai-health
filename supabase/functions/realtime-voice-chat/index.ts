import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  // Check if this is a WebSocket upgrade request
  if (upgradeHeader.toLowerCase() === "websocket") {
    console.log('WebSocket upgrade requested, creating proxy...');
    
    try {
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
      }

      // First, get an ephemeral token
      console.log('Getting ephemeral token from OpenAI...');
      const tokenResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "alloy",
          instructions: `Você é um assistente médico especializado em triagem e análise de saúde. 

Sua função é:
- Cumprimentar o paciente imediatamente quando a conversa iniciar
- Conduzir entrevistas médicas de forma empática e profissional
- Fazer perguntas direcionadas sobre sintomas e histórico médico
- Avaliar urgência médica baseada nas respostas
- Fornecer orientações gerais (sem diagnósticos específicos)
- Recomendar busca por atendimento médico quando necessário

Diretrizes importantes:
- Use linguagem acessível e empática
- Seja objetivo mas cuidadoso
- Sempre reforce que não substitui consulta médica presencial
- Em casos de emergência, oriente imediatamente para serviços de urgência
- IMPORTANTE: Inicie SEMPRE a conversa perguntando como o paciente está se sentindo

Responda sempre em português brasileiro e mantenha um tom profissional e acolhedor.`
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('OpenAI token error:', errorData);
        throw new Error(`Token error: ${tokenResponse.status} - ${errorData}`);
      }

      const tokenData = await tokenResponse.json();
      const ephemeralToken = tokenData.client_secret?.value;
      
      if (!ephemeralToken) {
        throw new Error('Failed to get ephemeral token');
      }

      console.log('Got ephemeral token, upgrading to WebSocket...');

      // Upgrade client connection to WebSocket
      const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
      
      // Connect to OpenAI's WebSocket API
      const openAISocket = new WebSocket(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        ['realtime', `authorization.bearer.${ephemeralToken}`]
      );

      let sessionEstablished = false;

      // Handle OpenAI WebSocket events
      openAISocket.onopen = () => {
        console.log('Connected to OpenAI Realtime API');
      };

      openAISocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('OpenAI → Client:', message.type);
        
        // Handle session establishment
        if (message.type === 'session.created' && !sessionEstablished) {
          console.log('Session created, sending configuration...');
          
          // Send session update with proper configuration
          const sessionConfig = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: `Você é um assistente médico especializado em triagem e análise de saúde. 

Sua função é:
- COMEÇAR IMEDIATAMENTE falando e cumprimentando o paciente
- Conduzir entrevistas médicas de forma empática e profissional
- Fazer perguntas direcionadas sobre sintomas e histórico médico
- Avaliar urgência médica baseada nas respostas
- Fornecer orientações gerais (sem diagnósticos específicos)

CRÍTICO: Assim que a sessão estiver configurada, comece IMEDIATAMENTE a falar cumprimentando o paciente e perguntando como ele está se sentindo. Não espere por input do usuário.

Use linguagem acessível e empática em português brasileiro.`,
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1'
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.3,
                prefix_padding_ms: 300,
                silence_duration_ms: 800,
                create_response: true
              },
              temperature: 0.8,
              max_response_output_tokens: 'inf'
            }
          };
          
          openAISocket.send(JSON.stringify(sessionConfig));
        }
        
        if (message.type === 'session.updated' && !sessionEstablished) {
          sessionEstablished = true;
          console.log('Session updated, sending initial greeting...');
          
          // Force initial response to start conversation
          setTimeout(() => {
            const initialMessage = {
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{
                  type: 'input_text',
                  text: 'Olá doutor, estou aqui para uma consulta médica. Por favor, comece me cumprimentando e perguntando como estou me sentindo.'
                }]
              }
            };
            
            openAISocket.send(JSON.stringify(initialMessage));
            openAISocket.send(JSON.stringify({ type: 'response.create' }));
            console.log('Initial greeting message sent');
          }, 1000);
        }

        // Forward all messages to client
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(event.data);
        }
      };

      openAISocket.onerror = (error) => {
        console.error('OpenAI WebSocket error:', error);
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'error',
            error: 'OpenAI connection error'
          }));
        }
      };

      openAISocket.onclose = () => {
        console.log('OpenAI WebSocket closed');
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.close();
        }
      };

      // Handle client WebSocket events
      clientSocket.onopen = () => {
        console.log('Client WebSocket connected');
      };

      clientSocket.onmessage = (event) => {
        console.log('Client → OpenAI: forwarding message');
        // Forward client messages to OpenAI
        if (openAISocket.readyState === WebSocket.OPEN) {
          openAISocket.send(event.data);
        }
      };

      clientSocket.onerror = (error) => {
        console.error('Client WebSocket error:', error);
      };

      clientSocket.onclose = () => {
        console.log('Client WebSocket closed');
        if (openAISocket.readyState === WebSocket.OPEN) {
          openAISocket.close();
        }
      };

      return response;

    } catch (error) {
      console.error("Error setting up WebSocket proxy:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // If not a WebSocket request, return the ephemeral token (backward compatibility)
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    console.log('Creating OpenAI Realtime session...');

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: `Você é um assistente médico especializado em triagem e análise de saúde. 

Sua função é:
- Conduzir entrevistas médicas de forma empática e profissional
- Fazer perguntas direcionadas sobre sintomas e histórico médico
- Avaliar urgência médica baseada nas respostas
- Fornecer orientações gerais (sem diagnósticos específicos)
- Recomendar busca por atendimento médico quando necessário

Diretrizes importantes:
- Use linguagem acessível e empática
- Seja objetivo mas cuidadoso
- Sempre reforce que não substitui consulta médica presencial
- Em casos de emergência, oriente imediatamente para serviços de urgência

Responda sempre em português brasileiro e mantenha um tom profissional e acolhedor.`
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("Session created successfully:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating realtime session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});