import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowRight, ArrowLeft, MessageCircle, SkipForward } from "lucide-react";
import AIConversationModal from "./AIConversationModal";
import { supabase } from "@/integrations/supabase/client";
import { useIntelligentQuestioning } from "@/hooks/useIntelligentQuestioning";

interface PatientData {
  fullName: string;
  birthDate: string;
  age?: number;
}

interface AnamnesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (analysis: any) => void;
  patientData?: PatientData | null;
  facialData?: any;
  voiceData?: any;
}

interface Question {
  id: string;
  text: string;
  type: 'yes_no' | 'multiple' | 'scale';
  options?: string[];
  category: string;
}

const AnamnesisModal = ({ isOpen, onClose, onComplete, patientData, facialData, voiceData }: AnamnesisModalProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAIConversation, setShowAIConversation] = useState(false);
  const [useIntelligentMode, setUseIntelligentMode] = useState(true);

  // Intelligent questioning hook
  const {
    currentQuestion,
    answers,
    isGeneratingQuestion,
    isComplete,
    urgencyScore,
    error: questioningError,
    questionCount,
    answerQuestion,
    skipQuestion,
    resetQuestioning,
    getFinalAnalysis
  } = useIntelligentQuestioning({ 
    facialData, 
    voiceData, 
    patientData 
  });

  // Reset questioning when modal opens
  useEffect(() => {
    if (isOpen && !currentQuestion && !isComplete) {
      resetQuestioning();
    }
  }, [isOpen, resetQuestioning, currentQuestion, isComplete]);

  const handleAnswer = async (answer: any) => {
    await answerQuestion(answer);
  };

  const handleSkipQuestion = () => {
    skipQuestion();
  };

  const performFinalAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      // Get final analysis from intelligent questioning
      const finalResult = await getFinalAnalysis();
      
      setAnalysisResult({
        ...finalResult,
        intelligentMode: true,
        facialData,
        voiceData,
        correlationData: {
          heartRateFromFacial: facialData?.heartRate,
          stressFromVoice: voiceData?.stressLevel,
          urgencyFromAnamnesis: urgencyScore
        }
      });
    } catch (error) {
      console.error('Erro na análise final:', error);
      
      // Fallback analysis
      setAnalysisResult({
        answers,
        urgencyScore,
        urgencyLevel: getUrgencyLevel(urgencyScore),
        recommendations: generateBasicRecommendations(urgencyScore),
        response: "Análise concluída com base nas respostas fornecidas.",
        questionCount,
        intelligentMode: true
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-analyze when questioning is complete
  useEffect(() => {
    if (isComplete && !analysisResult && !isAnalyzing) {
      performFinalAnalysis();
    }
  }, [isComplete, analysisResult, isAnalyzing]);

  const calculateUrgencyScore = (answers: Record<string, any>): number => {
    // Use the intelligent questioning urgency score when available
    if (urgencyScore > 0) return urgencyScore;
    
    let score = 0;
    
    // Sintomas de alta prioridade
    if (answers.breathing_difficulty === 'sim') score += 30;
    if (answers.chest_pain === 'sim') score += 25;
    if (answers.pain_presence === 'sim') score += 15;
    
    // Text analysis
    const complaint = answers.chief_complaint?.toLowerCase() || '';
    if (complaint.includes('dor forte')) score += 15;
    if (complaint.includes('febre')) score += 10;
    
    return Math.min(score, 100);
  };

  const getUrgencyLevel = (score: number): string => {
    if (score >= 70) return 'crítica';
    if (score >= 50) return 'alta';
    if (score >= 30) return 'média';
    return 'baixa';
  };

  const generateBasicRecommendations = (score: number): string[] => {
    const recommendations = [];
    
    if (score >= 70) {
      recommendations.push('Procure atendimento médico de emergência imediatamente');
      recommendations.push('Considere chamar ambulância se necessário');
    } else if (score >= 50) {
      recommendations.push('Procure atendimento médico urgente nas próximas horas');
      recommendations.push('Monitore os sintomas de perto');
    } else if (score >= 30) {
      recommendations.push('Agende consulta médica em 24-48 horas');
      recommendations.push('Continue monitorando os sintomas');
    } else {
      recommendations.push('Considere consulta médica de rotina');
      recommendations.push('Mantenha hábitos saudáveis');
    }
    
    // Add correlation-based recommendations
    if (facialData?.heartRate > 100) {
      recommendations.push('Monitore frequência cardíaca elevada');
    }
    
    if (voiceData?.stressLevel > 7) {
      recommendations.push('Considere técnicas de redução de estresse');
    }
    
    return recommendations;
  };

  const handleComplete = () => {
    if (analysisResult) {
      onComplete(analysisResult);
      onClose();
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="secondary" className="mb-2">
            {currentQuestion.category}
          </Badge>
          <h3 className="text-lg font-semibold">{currentQuestion.text}</h3>
          <p className="text-sm text-muted-foreground">
            Pergunta {questionCount} • Urgência: {urgencyScore}/100
          </p>
          
          {facialData?.heartRate && (
            <div className="text-xs text-muted-foreground">
              FC: {facialData.heartRate}bpm | Estresse Vocal: {voiceData?.stressLevel || 'N/A'}/10
            </div>
          )}
        </div>

        <div className="space-y-3">
          {currentQuestion.type === 'yes_no' && (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleAnswer('sim')}
                className="h-12"
              >
                Sim
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleAnswer('não')}
                className="h-12"
              >
                Não
              </Button>
            </div>
          )}

          {currentQuestion.type === 'multiple' && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleAnswer(option)}
                  className="w-full h-12 justify-start"
                >
                  {option}
                </Button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'scale' && (
            <div className="space-y-4">
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }, (_, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    onClick={() => handleAnswer(i)}
                    className="h-12 p-0 text-xs"
                  >
                    {i}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mínimo</span>
                <span>Máximo</span>
              </div>
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <div className="space-y-3">
              <textarea 
                className="w-full p-3 border rounded-md resize-none h-24"
                placeholder="Descreva em suas próprias palavras..."
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    handleAnswer(e.target.value.trim());
                  }
                }}
              />
              <Button 
                variant="outline"
                onClick={() => handleAnswer('Não especificado')}
                className="w-full"
              >
                Pular pergunta
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Anamnese Inteligente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Anamnese Inteligente</span>
              <span>Urgência: {urgencyScore}/100</span>
            </div>
            <Progress 
              value={isComplete ? 100 : Math.min((questionCount / 5) * 100, 90)} 
              className="w-full"
            />
          </div>

          {/* Status indicators */}
          {(facialData || voiceData) && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-xs font-medium mb-2">Dados Correlacionados:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {facialData && (
                  <div>FC: {facialData.heartRate || 'N/A'}bpm</div>
                )}
                {voiceData && (
                  <div>Estresse Vocal: {voiceData.stressLevel || 'N/A'}/10</div>
                )}
              </div>
            </div>
          )}

          {/* Generating Question */}
          {isGeneratingQuestion && (
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                Gerando próxima pergunta baseada no contexto...
              </p>
            </div>
          )}

          {/* Análise em Progresso */}
          {isAnalyzing && (
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                Analisando respostas com correlação multi-modal...
              </p>
            </div>
          )}

          {/* Resultado da Análise */}
          {analysisResult && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Análise Concluída</h3>
                {analysisResult.intelligentMode && (
                  <Badge variant="outline">IA Correlacionada</Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Nível de Urgência:</span>
                  <Badge variant={
                    analysisResult.urgencyLevel === 'crítica' ? 'destructive' :
                    analysisResult.urgencyLevel === 'alta' ? 'secondary' :
                    'default'
                  }>
                    {analysisResult.urgencyLevel?.toUpperCase() || 'BAIXA'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Score:</span>
                  <span>{analysisResult.urgencyScore}/100</span>
                </div>

                {analysisResult.questionCount && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Perguntas:</span>
                    <span>{analysisResult.questionCount} pergunta(s)</span>
                  </div>
                )}
              </div>

              {/* Correlation insights */}
              {analysisResult.correlationData && (
                <div className="p-3 bg-background rounded border">
                  <p className="font-medium text-sm mb-2">Correlação Multi-modal:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>FC: {analysisResult.correlationData.heartRateFromFacial || 'N/A'}</div>
                    <div>Estresse: {analysisResult.correlationData.stressFromVoice || 'N/A'}</div>
                    <div>Urgência: {analysisResult.correlationData.urgencyFromAnamnesis || 'N/A'}</div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="font-medium text-sm">Recomendações:</p>
                <ul className="text-sm space-y-1">
                  {(analysisResult.recommendations || []).map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => setShowAIConversation(true)}
                  variant="outline"
                  className="w-full"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Conversar com IA (Opcional)
                </Button>
                
                <Button onClick={handleComplete} className="w-full">
                  Concluir Anamnese
                </Button>
              </div>
            </div>
          )}

          {/* Pergunta Atual */}
          {!isAnalyzing && !analysisResult && !isGeneratingQuestion && currentQuestion && renderQuestion()}

          {/* Navigation and Error */}
          {!isAnalyzing && !analysisResult && currentQuestion && (
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleSkipQuestion}
                size="sm"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Pular
              </Button>
              
              <div className="text-xs text-muted-foreground text-center">
                {questioningError && (
                  <div className="text-destructive mb-1">{questioningError}</div>
                )}
                Perguntas adaptadas aos seus dados biométricos
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* AI Conversation Modal */}
      <AIConversationModal
        isOpen={showAIConversation}
        onClose={() => setShowAIConversation(false)}
        onComplete={(conversationData) => {
          // Integrar dados da conversa com resultados estruturados
          const enhancedResult = {
            ...analysisResult,
            conversationalData: conversationData,
            combinedUrgency: analysisResult?.urgencyLevel || 'baixa',
            confidenceScore: analysisResult?.urgencyScore || 0
          };
          setAnalysisResult(enhancedResult);
          setShowAIConversation(false);
        }}
        structuredAnswers={answers}
        patientName={patientData?.fullName}
      />
    </Dialog>
  );
};

export default AnamnesisModal;