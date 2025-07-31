import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Video,
  Calendar,
  Download,
  TrendingUp,
  Shield,
  AlertTriangle,
  Heart
} from "lucide-react";
import { useEnhancedMedicalAnalysis } from "@/hooks/useEnhancedMedicalAnalysis";
import { correlationEngine } from "@/utils/MedicalCorrelationEngine";

const DiagnosticResults = () => {
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<any>(null);
  const { analyzeWithCorrelation } = useEnhancedMedicalAnalysis();

  // Simulate enhanced analysis with correlation engine
  useEffect(() => {
    const runEnhancedAnalysis = async () => {
      // Mock data - in real app this would come from actual analysis
      const mockVitals = {
        heartRate: 72,
        bloodPressure: "120/80",
        temperature: 36.5,
        oxygenSaturation: 98,
        timestamp: new Date(),
        source: "facial",
        confidence: 0.85
      };

      const mockVoiceAnalysis = {
        emotionalState: "anxious" as const,
        respiratoryPattern: "normal" as const,
        speechClarity: 85,
        confidence: 0.82
      };

      const mockTriageResult = {
        urgencyLevel: "low",
        confidence: 0.78,
        symptoms: ["ansiedade leve", "fadiga"],
        recommendations: ["Consulta médica preventiva", "Técnicas de relaxamento"],
        followUpRequired: true,
        estimatedConditions: ["Ansiedade generalizada"]
      };

      try {
        const enhanced = await analyzeWithCorrelation(
          mockVitals,
          mockVoiceAnalysis,
          mockTriageResult,
          0.8, // audioQuality
          0.9, // videoQuality
          { consistency: 0.85, completeness: 0.9 }
        );
        setEnhancedAnalysis(enhanced);
      } catch (error) {
        console.error("Enhanced analysis failed:", error);
      }
    };

    runEnhancedAnalysis();
  }, [analyzeWithCorrelation]);

  // Original analysis results with enhanced confidence
  const analysisResults = [
    {
      category: "Análise de Voz",
      status: "completed",
      originalConfidence: 82,
      enhancedConfidence: enhancedAnalysis ? Math.round(enhancedAnalysis.correlation.weightedConfidence * 100) : 89,
      improvement: enhancedAnalysis ? Math.round((enhancedAnalysis.correlation.weightedConfidence - 0.82) * 100) : 7,
      findings: [
        "Padrão respiratório normal",
        "Indicadores de leve ansiedade detectados",
        "Tom de voz estável",
        "Correlação positiva com dados faciais"
      ]
    },
    {
      category: "Sinais Vitais",
      status: "completed", 
      originalConfidence: 85,
      enhancedConfidence: 92,
      improvement: 7,
      findings: [
        "Frequência cardíaca normal (72 BPM)",
        "Pressão arterial adequada (120/80)",
        "Saturação de oxigênio normal (98%)",
        "Boa estabilidade dos sinais"
      ]
    },
    {
      category: "Anamnese",
      status: "completed",
      originalConfidence: 78,
      enhancedConfidence: 85,
      improvement: 7,
      findings: [
        "Respostas consistentes detectadas",
        "Sintomas compatíveis com ansiedade leve",
        "Correlação com análise objetiva",
        "Alto índice de completude"
      ]
    }
  ];

  const recommendation = {
    urgency: enhancedAnalysis?.triageResult.urgencyLevel || "low",
    title: "Análise Multi-Modal Concluída - Confiabilidade Aprimorada",
    description: enhancedAnalysis ? 
      `Análise com ${Math.round(enhancedAnalysis.enhancedConfidence * 100)}% de confiabilidade (melhoria de +${Math.round(enhancedAnalysis.reliabilityImprovement * 100)}% vs análise tradicional).` :
      "Com base na análise correlacional multimodal, recomendamos acompanhamento médico de rotina.",
    nextSteps: enhancedAnalysis?.nextSteps || [
      "Consulta médica preventiva em 30 dias",
      "Técnicas de relaxamento para ansiedade",
      "Manter monitoramento dos sinais vitais"
    ],
    trustLevel: enhancedAnalysis?.correlation.trustLevel || "high"
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "default";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Relatório - Aprimorado */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Relatório de Triagem Médica
                </CardTitle>
                <p className="text-muted-foreground font-medium">
                  Análise Completa • {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    📊 Confiabilidade: {enhancedAnalysis?.enhancedReliability?.overallScore || 89}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    🎯 Precisão: {enhancedAnalysis?.enhancedReliability?.precision || 92}%
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge 
                variant={getUrgencyColor(recommendation.urgency)} 
                className="text-sm font-bold px-4 py-2 shadow-md"
              >
                {recommendation.urgency?.toUpperCase() || 'BAIXA'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Score: {enhancedAnalysis?.enhancedReliability?.confidenceScore || 89}/100
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sinais Vitais Destacados */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Heart className="h-5 w-5 text-red-500" />
            Sinais Vitais Monitorados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-red-100">
              <div className="text-2xl font-bold text-red-600">
                72
              </div>
              <div className="text-xs text-red-500 font-medium">BPM</div>
              <div className="text-xs text-muted-foreground">Freq. Cardíaca</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">
                120/80
              </div>
              <div className="text-xs text-blue-500 font-medium">mmHg</div>
              <div className="text-xs text-muted-foreground">Pressão</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-orange-100">
              <div className="text-2xl font-bold text-orange-600">
                36.5°
              </div>
              <div className="text-xs text-orange-500 font-medium">°C</div>
              <div className="text-xs text-muted-foreground">Temperatura</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-cyan-100">
              <div className="text-2xl font-bold text-cyan-600">
                98%
              </div>
              <div className="text-xs text-cyan-500 font-medium">SpO₂</div>
              <div className="text-xs text-muted-foreground">Oxigenação</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status da Análise */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Análise Completa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysisResults.map((result, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{result.category}</h4>
                  <Badge variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completo
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span>Confiança</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground line-through">{result.originalConfidence}%</span>
                      <span className="font-medium text-success">{result.enhancedConfidence}%</span>
                      {result.improvement > 0 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          <TrendingUp className="h-2 w-2 mr-1" />
                          +{result.improvement}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={result.enhancedConfidence} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Melhoria: {result.improvement}% com análise correlacional
                  </div>
                </div>
                
                <ul className="text-xs text-muted-foreground space-y-1">
                  {result.findings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análise de Correlação e Transparência */}
      {enhancedAnalysis && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Análise de Correlação Multi-Modal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Confiabilidade Aprimorada */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confiabilidade Original:</span>
                  <span className="text-muted-foreground">{Math.round(enhancedAnalysis.originalConfidence * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confiabilidade Aprimorada:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-success">{Math.round(enhancedAnalysis.enhancedConfidence * 100)}%</span>
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="h-2 w-2 mr-1" />
                      +{Math.round(enhancedAnalysis.reliabilityImprovement * 100)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={enhancedAnalysis.enhancedConfidence * 100} className="h-3" />
                
                <div className="pt-2">
                  <Badge 
                    variant={enhancedAnalysis.correlation.trustLevel === 'very_high' ? 'default' : 
                             enhancedAnalysis.correlation.trustLevel === 'high' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {correlationEngine.getTrustLevelDescription(enhancedAnalysis.correlation.trustLevel)}
                  </Badge>
                </div>
              </div>

              {/* Fatores de Correlação */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Fatores de Correlação:</h4>
                {enhancedAnalysis.correlation.correlationFactors.length > 0 ? (
                  enhancedAnalysis.correlation.correlationFactors.map((factor: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{factor.description}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Análise padrão aplicada</span>
                )}
                
                {enhancedAnalysis.correlation.inconsistencies.length > 0 && (
                  <div className="pt-2">
                    <h5 className="font-medium text-xs text-warning">Inconsistências Detectadas:</h5>
                    {enhancedAnalysis.correlation.inconsistencies.map((inconsistency: any, index: number) => (
                      <div key={index} className="flex items-start gap-2 text-xs mt-1">
                        <AlertTriangle className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{inconsistency.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Qualidade dos Dados */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-sm mb-3">Qualidade dos Dados:</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Áudio</div>
                  <div className="font-medium text-sm">{Math.round(enhancedAnalysis.dataQualityReport.voice.quality * 100)}%</div>
                  <div className="w-full bg-muted rounded-full h-1 mt-1">
                    <div 
                      className="bg-primary h-1 rounded-full" 
                      style={{width: `${enhancedAnalysis.dataQualityReport.voice.quality * 100}%`}}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Vídeo</div>
                  <div className="font-medium text-sm">{Math.round(enhancedAnalysis.dataQualityReport.facial.quality * 100)}%</div>
                  <div className="w-full bg-muted rounded-full h-1 mt-1">
                    <div 
                      className="bg-primary h-1 rounded-full" 
                      style={{width: `${enhancedAnalysis.dataQualityReport.facial.quality * 100}%`}}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Anamnese</div>
                  <div className="font-medium text-sm">{Math.round(enhancedAnalysis.dataQualityReport.anamnesis.quality * 100)}%</div>
                  <div className="w-full bg-muted rounded-full h-1 mt-1">
                    <div 
                      className="bg-primary h-1 rounded-full" 
                      style={{width: `${enhancedAnalysis.dataQualityReport.anamnesis.quality * 100}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Recomendações Médicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={getUrgencyColor(recommendation.urgency) as any} className="text-sm">
                {recommendation.urgency === "low" ? "Baixa Urgência" : 
                 recommendation.urgency === "medium" ? "Média Urgência" : "Alta Urgência"}
              </Badge>
              <h3 className="text-lg font-semibold">{recommendation.title}</h3>
            </div>
            
            <p className="text-muted-foreground">{recommendation.description}</p>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Próximos Passos:</h4>
              <ul className="space-y-2">
                {recommendation.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Próximas Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-auto p-4 flex-col gap-2" variant="outline">
              <Calendar className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Agendar Consulta</div>
                <div className="text-xs text-muted-foreground">Telemedicina disponível</div>
              </div>
            </Button>
            
            <Button className="h-auto p-4 flex-col gap-2" variant="outline">
              <FileText className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Relatório Completo</div>
                <div className="text-xs text-muted-foreground">PDF detalhado</div>
              </div>
            </Button>
            
            <Button className="h-auto p-4 flex-col gap-2" variant="outline">
              <Download className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Exportar Dados</div>
                <div className="text-xs text-muted-foreground">Compartilhar com médico</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticResults;