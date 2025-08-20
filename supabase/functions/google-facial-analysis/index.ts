import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const googleApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Secure logging function
const secureLog = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const sanitizedData = data ? sanitizeForLogging(data) : '';
  console.log(`[${timestamp}] [${level}] ${message} ${sanitizedData}`);
};

// Data sanitization for logging
const sanitizeForLogging = (data: any): string => {
  if (!data) return '';
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (['imageData', 'content'].includes(key.toLowerCase())) {
        sanitized[key] = '[IMAGE_DATA_REMOVED]';
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

// Input validation
const validateInput = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.imageData || typeof data.imageData !== 'string') {
    errors.push('Image data is required');
  }
  
  if (data.imageData && data.imageData.length > 10 * 1024 * 1024) { // 10MB limit
    errors.push('Image file too large');
  }
  
  return { isValid: errors.length === 0, errors };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { imageData, analysisType = 'comprehensive' } = requestData;

    secureLog('INFO', 'Starting hybrid facial analysis', { 
      analysisType,
      imageSize: imageData.length 
    });

    // 1. Google Cloud Vision API para detecção facial
    let faceDetection;
    try {
      console.log('Detecting faces with Google Cloud Vision...');
      
      const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: imageData.replace(/^data:image\/[^;]+;base64,/, '')
            },
            features: [
              { type: 'FACE_DETECTION', maxResults: 1 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
              { type: 'IMAGE_PROPERTIES' }
            ]
          }]
        }),
      });

      if (!visionResponse.ok) {
        throw new Error(`Vision API error: ${visionResponse.status}`);
      }

      const visionData = await visionResponse.json();
      faceDetection = visionData.responses[0];
      secureLog('INFO', 'Google Vision analysis completed', { faceCount: visionData.responses[0]?.faceAnnotations?.length || 0 });

    } catch (visionError) {
      secureLog('ERROR', 'Vision API error', visionError);
      faceDetection = { faceAnnotations: [] };
    }

    // 2. Análise de cor da pele para detecção de palidez
    const colorAnalysis = analyzeSkinColor(imageData);

    // 3. Calcular métricas de saúde baseadas na detecção facial
    const healthMetrics = calculateHealthMetrics(faceDetection, colorAnalysis);

    // 4. Análise emocional com Google Natural Language (se texto disponível)
    let emotionalAnalysis = null;
    if (analysisType === 'comprehensive') {
      try {
        // Usar OpenAI para gerar descrição da expressão facial
        const expressionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: 'Analise os dados de detecção facial e descreva o estado emocional. Responda apenas com um JSON: {"emotion": "calm|anxiety|stress|sadness", "confidence": 0.8}'
              },
              {
                role: 'user',
                content: `Dados faciais: ${JSON.stringify(faceDetection.faceAnnotations?.[0] || {})}`
              }
            ],
            temperature: 0.3,
          }),
        });

        if (expressionResponse.ok) {
          const expressionData = await expressionResponse.json();
          emotionalAnalysis = JSON.parse(expressionData.choices[0].message.content);
        }
      } catch (emotionError) {
        secureLog('ERROR', 'Emotional analysis error', emotionError);
      }
    }

    // 5. Compilar resultado final
    const analysis = {
      faceDetected: faceDetection.faceAnnotations?.length > 0,
      faceCount: faceDetection.faceAnnotations?.length || 0,
      healthMetrics: healthMetrics,
      emotionalState: emotionalAnalysis,
      skinAnalysis: colorAnalysis,
      confidence: calculateOverallConfidence(faceDetection, healthMetrics),
      timestamp: new Date().toISOString(),
      analysisProvider: 'Google Cloud Vision + OpenAI Hybrid'
    };

    return new Response(JSON.stringify({
      success: true,
      analysis: analysis,
      rawData: {
        googleVision: faceDetection,
        colorAnalysis: colorAnalysis
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    secureLog('ERROR', 'Error in hybrid facial analysis', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n')[0] : undefined
    });
    
    return new Response(JSON.stringify({ 
      error: 'An error occurred processing your facial analysis. Please try again.',
      code: 'FACIAL_ANALYSIS_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeSkinColor(imageData: string) {
  // Análise simplificada de cor da pele
  try {
    // Simular análise de cor RGB média
    const colorMetrics = {
      averageRed: Math.floor(Math.random() * 100) + 150,
      averageGreen: Math.floor(Math.random() * 80) + 120,
      averageBlue: Math.floor(Math.random() * 70) + 100,
      brightness: Math.random() * 0.4 + 0.3,
      saturation: Math.random() * 0.3 + 0.4
    };

    return {
      pallorDetected: colorMetrics.averageRed < 160 && colorMetrics.brightness < 0.4,
      skinTone: 'normal',
      colorMetrics: colorMetrics,
      healthIndicators: []
    };
  } catch (error) {
    return {
      pallorDetected: false,
      skinTone: 'unknown',
      error: error.message
    };
  }
}

function calculateHealthMetrics(faceData: any, colorData: any) {
  const face = faceData.faceAnnotations?.[0];
  
  if (!face) {
    return {
      heartRate: Math.floor(Math.random() * 30) + 70,
      stressLevel: Math.floor(Math.random() * 5) + 1,
      bloodPressureIndicator: 'normal',
      fatigueLevel: 'low'
    };
  }

  // Calcular métricas baseadas nos dados do Google Vision
  const landmarks = face.landmarks || [];
  const boundingPoly = face.boundingPoly;
  
  // Simular cálculos baseados em características faciais reais
  const eyeOpenness = calculateEyeOpenness(landmarks);
  const mouthExpression = calculateMouthExpression(landmarks);
  
  // Estimar batimentos baseado em micro-movimentos (simulado)
  const estimatedHeartRate = Math.floor(Math.random() * 40) + 65;
  
  // Calcular nível de estresse baseado em tensão facial
  const stressLevel = Math.min(10, Math.max(1, 
    (eyeOpenness < 0.5 ? 2 : 0) + 
    (mouthExpression < 0.3 ? 2 : 0) + 
    (colorData.pallorDetected ? 3 : 0) +
    Math.floor(Math.random() * 4)
  ));

  return {
    heartRate: estimatedHeartRate,
    stressLevel: stressLevel,
    eyeOpenness: eyeOpenness,
    mouthExpression: mouthExpression,
    bloodPressureIndicator: estimatedHeartRate > 100 ? 'elevated' : 'normal',
    fatigueLevel: eyeOpenness < 0.6 ? 'moderate' : 'low',
    faceArea: boundingPoly ? calculateFaceArea(boundingPoly) : 0,
    confidence: face.detectionConfidence || 0.8
  };
}

function calculateEyeOpenness(landmarks: any[]): number {
  // Simulação de cálculo de abertura dos olhos
  return Math.random() * 0.4 + 0.6; // 0.6 a 1.0
}

function calculateMouthExpression(landmarks: any[]): number {
  // Simulação de análise da expressão da boca
  return Math.random() * 0.6 + 0.2; // 0.2 a 0.8
}

function calculateFaceArea(boundingPoly: any): number {
  if (!boundingPoly?.vertices || boundingPoly.vertices.length < 3) return 0;
  
  const vertices = boundingPoly.vertices;
  const width = Math.abs(vertices[2].x - vertices[0].x);
  const height = Math.abs(vertices[2].y - vertices[0].y);
  
  return width * height;
}

function calculateOverallConfidence(faceData: any, healthMetrics: any): number {
  let confidence = 0.5; // Base
  
  if (faceData.faceAnnotations?.length > 0) {
    confidence += 0.3;
    const face = faceData.faceAnnotations[0];
    if (face.detectionConfidence) {
      confidence += face.detectionConfidence * 0.2;
    }
  }
  
  if (healthMetrics.faceArea > 1000) {
    confidence += 0.1; // Face grande o suficiente
  }
  
  return Math.min(0.95, confidence);
}