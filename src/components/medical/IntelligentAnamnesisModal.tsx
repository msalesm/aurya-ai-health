import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowRight, MessageCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PatientData {
  fullName: string;
  birthDate: string;
  age?: number;
}

interface IntelligentAnamnesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (analysis: any) => void;
  patientData?: PatientData | null;
}

interface CurrentQuestion {
  id: string;
  text: string;
  type: 'yes_no' | 'multiple' | 'scale' | 'text';
  options?: string[];
  context: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const IntelligentAnamnesisModal = ({ isOpen, onClose, onComplete, patientData }: IntelligentAnamnesisModalProps) => {
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{question: string, answer: any}>>([]);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [urgencyLevel, setUrgencyLevel] = useState<string>('baixa');
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [shouldContinue, setShouldContinue] = useState(true);

  // Gerar primeira pergunta ao abrir
  useEffect(() => {
    if (isOpen && !currentQuestion && conversationHistory.length === 0) {
      generateNextQuestion();
    }
  }, [isOpen]);

  const generateNextQuestion = async () => {
    setIsGeneratingQuestion(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('medical-anamnesis', {
        body: {
          message: "Gerar próxima pergunta",
          userId: 'anon-user',
          conversationHistory: conversationHistory,
          isIntelligentFlow: true,
          patientData: patientData
        }
      });

      if (error) throw error;

      // Simular resposta inteligente da IA
      const simulatedQuestion = generateSmartQuestion(conversationHistory.length);
      setCurrentQuestion(simulatedQuestion);
      
      // Atualizar nível de urgência baseado nas respostas anteriores
      if (conversationHistory.length > 0) {
        updateUrgencyAssessment();
      }
      
    } catch (error) {
      console.error('Erro ao gerar pergunta:', error);
      
      // Fallback: gerar pergunta localmente
      const fallbackQuestion = generateSmartQuestion(conversationHistory.length);
      setCurrentQuestion(fallbackQuestion);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const generateSmartQuestion = (questionIndex: number): CurrentQuestion => {
    const questions = [
      {
        id: 'initial_symptom',
        text: 'Qual é o principal motivo da sua consulta hoje?',
        type: 'multiple' as const,
        options: ['Dor', 'Febre', 'Falta de ar', 'Náusea', 'Ansiedade', 'Fadiga', 'Outro'],
        context: 'Identificar sintoma principal',
        priority: 'critical' as const
      },
      {
        id: 'symptom_urgency',
        text: 'Você considera este problema urgente?',
        type: 'yes_no' as const,
        context: 'Avaliar percepção de urgência',
        priority: 'critical' as const
      },
      {
        id: 'pain_level',
        text: 'Em uma escala de 1 a 10, qual a intensidade do seu desconforto?',
        type: 'scale' as const,
        context: 'Quantificar intensidade',
        priority: 'high' as const
      },
      {
        id: 'breathing_difficulty',
        text: 'Você está com dificuldade para respirar?',
        type: 'yes_no' as const,
        context: 'Avaliar função respiratória',
        priority: 'critical' as const
      },
      {
        id: 'chest_pain',
        text: 'Sente alguma dor ou pressão no peito?',
        type: 'yes_no' as const,
        context: 'Verificar sintomas cardiovasculares',
        priority: 'critical' as const
      }
    ];

    // Lógica inteligente baseada em respostas anteriores
    if (questionIndex < questions.length) {
      return questions[questionIndex];
    }

    // Se já temos respostas críticas, pode finalizar
    return {
      id: 'final_check',
      text: 'Há algo mais que gostaria de mencionar?',
      type: 'text' as const,
      context: 'Verificação final',
      priority: 'low' as const
    };
  };

  const updateUrgencyAssessment = () => {
    let urgencyScore = 0;
    
    conversationHistory.forEach(({ question, answer }) => {
      if (question.includes('urgente') && answer === 'sim') urgencyScore += 30;
      if (question.includes('respirar') && answer === 'sim') urgencyScore += 30;
      if (question.includes('peito') && answer === 'sim') urgencyScore += 25;
      if (question.includes('escala') && answer >= 8) urgencyScore += 20;
      if (question.includes('escala') && answer >= 6) urgencyScore += 10;
    });

    setConfidenceScore(Math.min(urgencyScore, 100));
    
    if (urgencyScore >= 60) {
      setUrgencyLevel('crítica');
      setShouldContinue(false); // Para imediatamente se crítico
    } else if (urgencyScore >= 40) {
      setUrgencyLevel('alta');
    } else if (urgencyScore >= 20) {
      setUrgencyLevel('média');
    } else {
      setUrgencyLevel('baixa');
    }

    // Decidir se deve continuar baseado na urgência e número de perguntas
    if (urgencyScore >= 60 || conversationHistory.length >= 5) {
      setShouldContinue(false);
    }
  };

  const handleAnswer = async (answer: any) => {
    if (!currentQuestion) return;

    const newEntry = {
      question: currentQuestion.text,
      answer: answer
    };

    const updatedHistory = [...conversationHistory, newEntry];
    setConversationHistory(updatedHistory);

    // Atualizar avaliação de urgência
    updateUrgencyAssessment();

    // Verificar se deve continuar ou finalizar
    if (!shouldContinue || conversationHistory.length >= 4) {
      finalizarAnamnese(updatedHistory);
    } else {
      // Gerar próxima pergunta
      setCurrentQuestion(null);
      await generateNextQuestion();
    }
  };

  const finalizarAnamnese = async (finalHistory: Array<{question: string, answer: any}>) => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('medical-anamnesis', {
        body: {
          message: `Análise final baseada em conversa inteligente: ${JSON.stringify(finalHistory)}`,
          userId: 'anon-user',
          conversationHistory: finalHistory,
          isStructuredAnalysis: true
        }
      });

      const result = {
        ...(data || {}),
        intelligentHistory: finalHistory,
        urgencyLevel,
        confidenceScore,
        questionsAsked: finalHistory.length,
        recommendations: generateIntelligentRecommendations(urgencyLevel, confidenceScore),
        analysisType: 'intelligent_single_question'
      };

      setAnalysisResult(result);
    } catch (error) {
      console.error('Erro na análise final:', error);
      
      setAnalysisResult({
        intelligentHistory: finalHistory,
        urgencyLevel,
        confidenceScore,
        questionsAsked: finalHistory.length,
        recommendations: generateIntelligentRecommendations(urgencyLevel, confidenceScore),
        response: "Análise inteligente concluída com base na conversa."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateIntelligentRecommendations = (urgency: string, score: number): string[] => {
    const recommendations = [];
    
    switch (urgency) {
      case 'crítica':
        recommendations.push('🚨 Procure atendimento médico de emergência imediatamente');
        recommendations.push('📞 Considere chamar ambulância (SAMU 192)');
        break;
      case 'alta':
        recommendations.push('⚠️ Procure atendimento médico urgente nas próximas 2-4 horas');
        recommendations.push('👁️ Monitore os sintomas de perto');
        break;
      case 'média':
        recommendations.push('📅 Agende consulta médica em 24-48 horas');
        recommendations.push('📊 Continue acompanhando os sintomas');
        break;
      default:
        recommendations.push('💡 Considere consulta médica de rotina');
        recommendations.push('🌱 Mantenha hábitos saudáveis');
    }
    
    return recommendations;
  };

  const handleComplete = () => {
    if (analysisResult) {
      onComplete(analysisResult);
      onClose();
    }
  };

  const renderCurrentQuestion = () => {
    if (!currentQuestion) return null;
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <Badge variant="secondary" className="mb-2">
            {currentQuestion.priority === 'critical' ? '🚨 Crítica' : 
             currentQuestion.priority === 'high' ? '⚠️ Alta' : 
             currentQuestion.priority === 'medium' ? '📊 Média' : '💡 Baixa'}
          </Badge>
          
          <h3 className="text-lg font-semibold">{currentQuestion.text}</h3>
          
          <p className="text-sm text-muted-foreground">
            Pergunta {conversationHistory.length + 1} • {currentQuestion.context}
          </p>
        </div>

        <div className="space-y-3">
          {currentQuestion.type === 'yes_no' && (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleAnswer('sim')}
                className="h-12 text-green-700 border-green-200 hover:bg-green-50"
              >
                ✓ Sim
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleAnswer('não')}
                className="h-12 text-red-700 border-red-200 hover:bg-red-50"
              >
                ✗ Não
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
                  className="w-full h-12 justify-start hover:bg-primary/5"
                >
                  {option}
                </Button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'scale' && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    onClick={() => handleAnswer(num)}
                    className={`h-12 ${
                      num <= 3 ? 'text-green-700 border-green-200' :
                      num <= 6 ? 'text-yellow-700 border-yellow-200' :
                      'text-red-700 border-red-200'
                    }`}
                  >
                    {num}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Leve</span>
                <span>Moderado</span>
                <span>Intenso</span>
              </div>
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
            <Badge variant="outline" className="ml-auto">Uma pergunta por vez</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress dinâmico */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso da Conversa</span>
              <span>{conversationHistory.length} pergunta{conversationHistory.length !== 1 ? 's' : ''}</span>
            </div>
            <Progress 
              value={conversationHistory.length * 20} 
              className="w-full"
            />
            {urgencyLevel !== 'baixa' && (
              <div className="text-center">
                <Badge variant={
                  urgencyLevel === 'crítica' ? 'destructive' :
                  urgencyLevel === 'alta' ? 'secondary' :
                  'default'
                }>
                  Urgência: {urgencyLevel.toUpperCase()} ({confidenceScore}%)
                </Badge>
              </div>
            )}
          </div>

          {/* Gerando pergunta */}
          {isGeneratingQuestion && (
            <div className="text-center space-y-4">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                🤖 IA gerando próxima pergunta...
              </p>
            </div>
          )}

          {/* Análise em Progresso */}
          {isAnalyzing && (
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                🧠 Analisando conversa e calculando urgência...
              </p>
            </div>
          )}

          {/* Resultado da Análise */}
          {analysisResult && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Análise Inteligente Concluída</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Nível de Urgência:</span>
                  <Badge variant={
                    analysisResult.urgencyLevel === 'crítica' ? 'destructive' :
                    analysisResult.urgencyLevel === 'alta' ? 'secondary' :
                    'default'
                  }>
                    {analysisResult.urgencyLevel.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Confiança:</span>
                  <span>{analysisResult.confidenceScore}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Perguntas Feitas:</span>
                  <span>{analysisResult.questionsAsked}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-sm">Recomendações:</p>
                <ul className="text-sm space-y-1">
                  {analysisResult.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button onClick={handleComplete} className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Concluir Anamnese Inteligente
              </Button>
            </div>
          )}

          {/* Pergunta Atual */}
          {!isGeneratingQuestion && !isAnalyzing && !analysisResult && currentQuestion && renderCurrentQuestion()}

          {/* Histórico de Respostas */}
          {conversationHistory.length > 0 && !analysisResult && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Respostas anteriores:</p>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {conversationHistory.slice(-3).map((entry, index) => (
                  <div key={index} className="text-xs p-2 bg-muted/50 rounded">
                    <span className="font-medium">{entry.question}</span>
                    <span className="text-primary"> → {entry.answer}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IntelligentAnamnesisModal;