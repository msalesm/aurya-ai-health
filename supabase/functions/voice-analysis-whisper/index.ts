import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const { audioData } = await req.json();
    
    if (!audioData) {
      throw new Error('Nenhum áudio fornecido');
    }

    console.log('Recebido audioData para transcrição');

    // Converter base64 para Blob
    const base64Data = audioData.split(',')[1] || audioData;
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    // Criar FormData para envio ao OpenAI
    const formData = new FormData();
    const audioBlob = new Blob([bytes], { type: 'audio/webm' });
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "pt");

    console.log('Enviando para OpenAI Whisper...');

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta da OpenAI:', errorText);
      throw new Error(`Erro na transcrição: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Transcrição concluída:", data.text);
    
    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          transcription: data.text,
          emotionalTone: 'neutral',
          confidence: 0.8
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro na edge function voice-analysis-whisper:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro desconhecido na análise de voz'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});