import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Heart, Activity, Mic, AlertTriangle, CheckCircle } from 'lucide-react';

interface EnhancedVoiceAnalysisDisplayProps {
  analysis: any;
}

const EnhancedVoiceAnalysisDisplay: React.FC<EnhancedVoiceAnalysisDisplayProps> = ({ analysis }) => {
  if (!analysis) return null;

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'joy': return 'bg-yellow-500';
      case 'sadness': return 'bg-blue-500';
      case 'anger': return 'bg-red-500';
      case 'anxiety': return 'bg-orange-500';
      case 'calm': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStressLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Transcrição */}
      {analysis.transcription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Transcrição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm italic bg-muted p-3 rounded-lg">
              "{analysis.transcription}"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Análise Emocional */}
      {analysis.emotional_tone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Análise Emocional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Estado Dominante:</span>
              <Badge variant="secondary" className={getEmotionColor(analysis.emotional_tone.dominant)}>
                {analysis.emotional_tone.dominant}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ({Math.round((analysis.emotional_tone.confidence || 0) * 100)}% confiança)
              </span>
            </div>
            
            {analysis.emotional_tone.emotions && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Distribuição Emocional:</span>
                {Object.entries(analysis.emotional_tone.emotions).map(([emotion, score]) => (
                  <div key={emotion} className="flex items-center gap-2">
                    <span className="text-xs w-16 capitalize">{emotion}</span>
                    <Progress value={(score as number) * 100} className="flex-1 h-2" />
                    <span className="text-xs w-8">{Math.round((score as number) * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Indicadores de Stress */}
      {analysis.stress_indicators && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Indicadores de Stress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Nível de Stress:</span>
              <Badge 
                variant="outline" 
                className={getStressLevelColor(analysis.stress_indicators.level)}
              >
                {analysis.stress_indicators.level}
              </Badge>
              {analysis.stress_indicators.score && (
                <span className="text-xs text-muted-foreground">
                  (Score: {analysis.stress_indicators.score}/100)
                </span>
              )}
            </div>
            
            {analysis.stress_indicators.indicators && analysis.stress_indicators.indicators.length > 0 && (
              <div>
                <span className="text-sm font-medium">Indicadores Detectados:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.stress_indicators.indicators.map((indicator: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {indicator}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Análise Psicológica */}
      {analysis.psychological_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Análise Psicológica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {analysis.psychological_analysis.mood_score !== undefined && (
                <div>
                  <span className="text-sm font-medium">Humor:</span>
                  <Progress value={analysis.psychological_analysis.mood_score} className="mt-1" />
                  <span className="text-xs text-muted-foreground">
                    {analysis.psychological_analysis.mood_score}/100
                  </span>
                </div>
              )}
              
              {analysis.psychological_analysis.energy_level !== undefined && (
                <div>
                  <span className="text-sm font-medium">Energia:</span>
                  <Progress value={analysis.psychological_analysis.energy_level} className="mt-1" />
                  <span className="text-xs text-muted-foreground">
                    {analysis.psychological_analysis.energy_level}/100
                  </span>
                </div>
              )}
            </div>

            {analysis.psychological_analysis.insights && analysis.psychological_analysis.insights.length > 0 && (
              <div>
                <span className="text-sm font-medium">Insights:</span>
                <ul className="mt-1 space-y-1">
                  {analysis.psychological_analysis.insights.map((insight: string, index: number) => (
                    <li key={index} className="text-xs flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.psychological_analysis.recommendations && analysis.psychological_analysis.recommendations.length > 0 && (
              <div>
                <span className="text-sm font-medium">Recomendações:</span>
                <ul className="mt-1 space-y-1">
                  {analysis.psychological_analysis.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-xs flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 mt-0.5 text-orange-500 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Métricas Vocais */}
      {analysis.voice_metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Métricas Vocais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {analysis.voice_metrics.pitch_average && (
                <div>
                  <span className="font-medium">Pitch Médio:</span>
                  <span className="ml-2">{Math.round(analysis.voice_metrics.pitch_average)} Hz</span>
                </div>
              )}
              
              {analysis.voice_metrics.volume_average && (
                <div>
                  <span className="font-medium">Volume Médio:</span>
                  <span className="ml-2">{Math.round(analysis.voice_metrics.volume_average)}%</span>
                </div>
              )}
              
              {analysis.voice_metrics.speech_rate && (
                <div>
                  <span className="font-medium">Taxa de Fala:</span>
                  <span className="ml-2">{Math.round(analysis.voice_metrics.speech_rate)} ppm</span>
                </div>
              )}
              
              {analysis.voice_metrics.jitter && (
                <div>
                  <span className="font-medium">Jitter:</span>
                  <span className="ml-2">{(analysis.voice_metrics.jitter * 100).toFixed(2)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score de Confiança */}
      {analysis.confidence_score !== undefined && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Confiança da Análise:</span>
              <Badge variant={analysis.confidence_score > 0.7 ? "default" : "secondary"}>
                {Math.round(analysis.confidence_score * 100)}%
              </Badge>
            </div>
            <Progress value={analysis.confidence_score * 100} className="mt-2" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedVoiceAnalysisDisplay;