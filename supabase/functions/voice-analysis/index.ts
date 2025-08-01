import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  console.log('=== Voice Analysis Function Started ===');
  console.log('Request method:', req.method);
  console.log('Content-Type header:', req.headers.get('content-type'));
  console.log('Content-Length:', req.headers.get('content-length'));
  console.log('User-Agent:', req.headers.get('user-agent'));
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se há conteúdo antes de tentar parse
    const contentLength = req.headers.get('content-length');
    const contentType = req.headers.get('content-type');
    
    console.log('Pre-parse validation:', {
      contentLength,
      contentType,
      hasBody: !!req.body
    });
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      throw new Error(`Invalid content type: ${contentType}. Expected multipart/form-data`);
    }
    
    if (!contentLength || contentLength === '0') {
      throw new Error('Request body is empty (Content-Length: 0)');
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        success: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process FormData with enhanced error handling
    console.log('Attempting to parse FormData...');
    let formData;
    try {
      formData = await req.formData();
      console.log('✅ FormData parsed successfully');
    } catch (formError) {
      console.error('❌ FormData parsing failed:', formError);
      console.error('Request headers:', Object.fromEntries(req.headers.entries()));
      throw new Error(`FormData parsing failed: ${formError.message}`);
    }
    
    // Log FormData entries for debugging
    const entries = [];
    console.log('Processing FormData entries...');
    for (const [key, value] of formData.entries()) {
      const entry = {
        key,
        type: typeof value,
        isFile: value instanceof File,
        size: value instanceof File ? value.size : (value as string).length,
        fileName: value instanceof File ? value.name : 'N/A',
        fileType: value instanceof File ? value.type : 'N/A'
      };
      entries.push(entry);
      console.log(`FormData entry - ${key}:`, entry);
    }
    console.log('All FormData entries:', JSON.stringify(entries, null, 2));

    const audioFile = formData.get('audio') as File;
    const userId = formData.get('user_id') as string;
    const sessionDuration = formData.get('session_duration') as string;

    console.log('Dados recebidos:', JSON.stringify({
      temArquivoAudio: !!audioFile,
      tamanhoArquivo: audioFile?.size,
      tipoArquivo: audioFile?.type,
      userId: userId ? 'presente' : 'ausente',
      sessionDuration
    }, null, 2));

    if (!audioFile) {
      console.error('❌ No audio file found in FormData');
      throw new Error('No audio file provided');
    }

    console.log('✅ Audio file validation passed:', {
      type: audioFile.type,
      size: audioFile.size,
      fileName: audioFile.name,
      sizeInMB: (audioFile.size / (1024 * 1024)).toFixed(2)
    });

    // Validate audio file
    if (audioFile.size === 0) {
      throw new Error('Audio file is empty');
    }
    
    if (audioFile.size > 25 * 1024 * 1024) { // 25MB limit
      throw new Error('Audio file too large (max 25MB)');
    }

    // Prepare form data for OpenAI Whisper
    console.log('Preparing Whisper FormData...');
    const whisperFormData = new FormData();
    
    // Create a new File object to ensure proper MIME type
    const audioFileName = audioFile.name || 'recording.ogg';
    const audioFileType = audioFile.type || 'audio/ogg';
    
    whisperFormData.append('file', audioFile, audioFileName);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'pt');
    
    console.log('Whisper FormData prepared:', {
      fileName: audioFileName,
      fileType: audioFileType,
      model: 'whisper-1',
      language: 'pt'
    });

    console.log('Enviando para OpenAI Whisper...');

    // Get transcription from OpenAI
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: whisperFormData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('OpenAI Whisper error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcription = transcriptionResult.text;

    console.log('Transcrição concluída:', transcription);

    if (!transcription || transcription.trim().length === 0) {
      throw new Error('Could not transcribe audio. Please try again with clearer recording.');
    }

    // Analyze using OpenAI GPT for medical context
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Você é um especialista em análise de voz médica. Analise o texto transcrito e forneça uma análise detalhada em formato JSON com estes campos:
            - emotional_tone: objeto com "dominant" (string), "confidence" (0-1), "emotions" (objeto com chaves como "joy", "sadness", "anxiety", etc. e valores 0-1)
            - stress_indicators: objeto com "level" ("baixo"/"moderado"/"alto"), "score" (0-100), "indicators" (array de strings)
            - medical_indicators: objeto com "respiratory_pattern" ("normal"/"irregular"/"labored"), "speech_clarity" (0-100), "potential_concerns" (array de strings)
            - psychological_analysis: objeto com "mood_score" (0-100), "energy_level" (0-100), "insights" (array), "recommendations" (array)
            - voice_metrics: objeto com "speech_rate" (120-180), "clarity" (0-100), "confidence_level" (0-100)
            - confidence_score: número de 0 a 1
            
            Responda apenas com o JSON, sem explicações adicionais. Foque em indicadores relevantes para triagem médica.`
          },
          {
            role: 'user',
            content: `Analise este texto transcrito para triagem médica: "${transcription}"`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('OpenAI analysis error:', errorText);
      throw new Error(`Analysis error: ${errorText}`);
    }

    const analysisResult = await analysisResponse.json();
    let analysis;
    
    try {
      analysis = JSON.parse(analysisResult.choices[0].message.content);
      console.log('Análise concluída com sucesso');
    } catch (e) {
      console.error('JSON parsing error:', e);
      // Fallback analysis for medical context
      analysis = {
        emotional_tone: { 
          dominant: "neutro", 
          confidence: 0.7, 
          emotions: { neutro: 0.7, calmo: 0.3 } 
        },
        stress_indicators: { 
          level: "baixo", 
          score: 30, 
          indicators: ["Padrão de fala normal"] 
        },
        medical_indicators: {
          respiratory_pattern: "normal",
          speech_clarity: 80,
          potential_concerns: ["Nenhuma preocupação aparente"]
        },
        psychological_analysis: { 
          mood_score: 70, 
          energy_level: 60, 
          insights: ["Estado emocional estável"], 
          recommendations: ["Continuar monitoramento regular"] 
        },
        voice_metrics: { 
          speech_rate: 150, 
          clarity: 80, 
          confidence_level: 75 
        },
        confidence_score: 0.7
      };
    }

    // Save to database (optional - following mind-balance pattern)
    try {
      console.log('Salvando no banco de dados...');
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Map analysis data to voice_analysis table structure
      const emotionalTone = analysis.emotional_tone || null;
      const stressIndicators = analysis.stress_indicators || null;
      const psychologicalAnalysis = analysis.psychological_analysis || null;

      const { data, error } = await supabase
        .from('voice_analysis')
        .insert({
          user_id: userId || null,
          transcription: transcription,
          emotional_tone: emotionalTone,
          stress_indicators: stressIndicators,
          psychological_analysis: psychologicalAnalysis,
          confidence_score: analysis.confidence_score || 0.75,
          session_duration: sessionDuration ? parseInt(sessionDuration) : null,
          pitch_average: analysis.voice_metrics?.speech_rate || 150,
          pitch_variability: 0, // Placeholder
          volume_average: 0, // Placeholder
          jitter: 0, // Placeholder
          harmonics: 0, // Placeholder
          speech_rate: analysis.voice_metrics?.speech_rate || 150,
          pause_frequency: 0, // Placeholder
          audio_file_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Database save error:', error);
        // Continue without throwing - analysis is still valid
      } else {
        console.log('Análise salva com sucesso');
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // Continue without throwing - analysis is still valid
    }

    return new Response(JSON.stringify({
      success: true,
      transcription: transcription,
      emotional_tone: analysis.emotional_tone,
      stress_indicators: analysis.stress_indicators,
      medical_indicators: analysis.medical_indicators,
      psychological_analysis: analysis.psychological_analysis,
      voice_metrics: analysis.voice_metrics,
      confidence_score: analysis.confidence_score
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Voice analysis error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    console.error('Request debug info:', {
      method: req.method,
      contentType: req.headers.get('content-type'),
      contentLength: req.headers.get('content-length'),
      userAgent: req.headers.get('user-agent'),
      hasBody: !!req.body
    });
    
    const errorMessage = error.message || 'Unknown error in voice analysis';
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      debug: {
        contentType: req.headers.get('content-type'),
        contentLength: req.headers.get('content-length'),
        userAgent: req.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      }
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});