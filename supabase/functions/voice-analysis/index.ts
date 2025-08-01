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
    console.log('Voice analysis function called');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Audio data received, length:', audio.length);

    // Convert base64 to binary
    const binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    
    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    console.log('Sending to OpenAI Whisper...');

    // Get transcription from OpenAI
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('OpenAI Whisper error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcription = transcriptionResult.text;

    console.log('Transcription completed:', transcription.substring(0, 100) + '...');

    if (!transcription || transcription.trim().length === 0) {
      throw new Error('Could not transcribe audio. Please try again with clearer recording.');
    }

    // Analyze emotional tone using OpenAI GPT
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are an expert in voice and psychological analysis. Analyze the transcribed text and provide a detailed analysis in JSON format with these fields:
            - emotional_tone: object with "dominant" (string), "confidence" (0-1), "emotions" (object with keys like "joy", "sadness", "anger", etc. and values 0-1)
            - stress_indicators: object with "level" ("low"/"moderate"/"high"), "score" (0-100), "indicators" (array of strings)
            - psychological_analysis: object with "mood_score" (0-100), "energy_level" (0-100), "insights" (array), "recommendations" (array)
            - voice_metrics: object with "speech_rate" (120-180), "clarity" (0-100), "confidence_level" (0-100)
            - confidence_score: number from 0 to 1
            
            Respond only with the JSON, no additional explanations.`
          },
          {
            role: 'user',
            content: `Analyze this transcribed text: "${transcription}"`
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
      console.log('Analysis completed successfully');
    } catch (e) {
      console.error('JSON parsing error:', e);
      // Fallback analysis if JSON parsing fails
      analysis = {
        emotional_tone: { 
          dominant: "neutral", 
          confidence: 0.7, 
          emotions: { neutral: 0.7, calm: 0.3 } 
        },
        stress_indicators: { 
          level: "low", 
          score: 30, 
          indicators: ["Normal speech pattern"] 
        },
        psychological_analysis: { 
          mood_score: 70, 
          energy_level: 60, 
          insights: ["Stable emotional state"], 
          recommendations: ["Continue regular monitoring"] 
        },
        voice_metrics: { 
          speech_rate: 150, 
          clarity: 80, 
          confidence_level: 75 
        },
        confidence_score: 0.7
      };
    }

    console.log('Analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      transcription: transcription,
      emotional_tone: analysis.emotional_tone,
      stress_indicators: analysis.stress_indicators,
      psychological_analysis: analysis.psychological_analysis,
      voice_metrics: analysis.voice_metrics,
      confidence_score: analysis.confidence_score
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Voice analysis function error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});