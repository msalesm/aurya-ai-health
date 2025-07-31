import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AnamnesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (analysis: any) => void;
}

interface Question {
  id: string;
  text: string;
  type: 'yes_no' | 'multiple' | 'scale';
  options?: string[];
  category: string;
}

const AnamnesisModal = ({ isOpen, onClose, onComplete }: AnamnesisModalProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const questions: Question[] = [
    {
      id: 'main_symptom',
      text: 'Qual é o seu principal sintoma hoje?',
      type: 'multiple',
      options: ['Dor', 'Febre', 'Náusea', 'Fadiga', 'Ansiedade', 'Outro'],
      category: 'sintomas'
    },
    {
      id: 'symptom_duration',
      text: 'Há quanto tempo você sente isso?',
      type: 'multiple',
      options: ['Menos de 1 dia', '1-3 dias', '1 semana', 'Mais de 1 semana'],
      category: 'tempo'
    },
    {
      id: 'pain_scale',
      text: 'Em uma escala de 0 a 10, qual a intensidade do desconforto?',
      type: 'scale',
      category: 'intensidade'
    },
    {
      id: 'fever',
      text: 'Você tem febre?',
      type: 'yes_no',
      category: 'sintomas'
    },
    {
      id: 'breathing',
      text: 'Tem dificuldade para respirar?',
      type: 'yes_no',
      category: 'respiratorio'
    },
    {
      id: 'chest_pain',
      text: 'Sente dor no peito?',
      type: 'yes_no',
      category: 'cardiovascular'
    },
    {
      id: 'medications',
      text: 'Está tomando algum medicamento?',
      type: 'yes_no',
      category: 'medicamentos'
    },
    {
      id: 'allergies',
      text: 'Tem alguma alergia conhecida?',
      type: 'yes_no',
      category: 'alergias'
    },
    {
      id: 'chronic_conditions',
      text: 'Tem alguma condição crônica (diabetes, hipertensão, etc.)?',
      type: 'yes_no',
      category: 'historico'
    },
    {
      id: 'urgency_feeling',
      text: 'Você sente que precisa de atendimento médico urgente?',
      type: 'yes_no',
      category: 'urgencia'
    }
  ];

  const handleAnswer = (answer: any) => {
    const newAnswers = { ...answers, [questions[currentQuestion].id]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      analyzeAnswers(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const analyzeAnswers = async (finalAnswers: Record<string, any>) => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('medical-anamnesis', {
        body: {
          message: `Análise estruturada baseada em respostas objetivas: ${JSON.stringify(finalAnswers)}`,
          userId: 'anon-user',
          conversationHistory: [],
          isStructuredAnalysis: true
        }
      });

      if (error) throw error;

      // Calcular score de urgência baseado nas respostas
      const urgencyScore = calculateUrgencyScore(finalAnswers);
      
      const result = {
        ...data,
        structuredAnswers: finalAnswers,
        urgencyScore,
        urgencyLevel: getUrgencyLevel(urgencyScore),
        recommendations: generateRecommendations(finalAnswers, urgencyScore)
      };

      setAnalysisResult(result);
    } catch (error) {
      console.error('Erro na análise:', error);
      
      // Fallback para análise local
      const urgencyScore = calculateUrgencyScore(finalAnswers);
      setAnalysisResult({
        structuredAnswers: finalAnswers,
        urgencyScore,
        urgencyLevel: getUrgencyLevel(urgencyScore),
        recommendations: generateRecommendations(finalAnswers, urgencyScore),
        response: "Análise concluída com base nas respostas fornecidas."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateUrgencyScore = (answers: Record<string, any>): number => {
    let score = 0;
    
    // Sintomas de alta prioridade
    if (answers.breathing === 'sim') score += 30;
    if (answers.chest_pain === 'sim') score += 25;
    if (answers.urgency_feeling === 'sim') score += 20;
    if (answers.fever === 'sim') score += 15;
    
    // Intensidade da dor
    if (answers.pain_scale >= 8) score += 20;
    else if (answers.pain_scale >= 6) score += 10;
    else if (answers.pain_scale >= 4) score += 5;
    
    // Duração dos sintomas
    if (answers.symptom_duration === 'Menos de 1 dia' && score > 20) score += 10;
    
    return Math.min(score, 100);
  };

  const getUrgencyLevel = (score: number): string => {
    if (score >= 70) return 'crítica';
    if (score >= 50) return 'alta';
    if (score >= 30) return 'média';
    return 'baixa';
  };

  const generateRecommendations = (answers: Record<string, any>, score: number): string[] => {
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
    
    if (answers.medications === 'sim') {
      recommendations.push('Informe todos os medicamentos ao médico');
    }
    
    if (answers.chronic_conditions === 'sim') {
      recommendations.push('Considere relação com condições pré-existentes');
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
    const question = questions[currentQuestion];
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="secondary" className="mb-2">
            {question.category}
          </Badge>
          <h3 className="text-lg font-semibold">{question.text}</h3>
          <p className="text-sm text-muted-foreground">
            Pergunta {currentQuestion + 1} de {questions.length}
          </p>
        </div>

        <div className="space-y-3">
          {question.type === 'yes_no' && (
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

          {question.type === 'multiple' && question.options && (
            <div className="space-y-2">
              {question.options.map((option, index) => (
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

          {question.type === 'scale' && (
            <div className="space-y-4">
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }, (_, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    onClick={() => handleAnswer(i)}
                    className="h-12 p-0"
                  >
                    {i}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Sem dor</span>
                <span>Dor máxima</span>
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
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress */}
          <Progress 
            value={((currentQuestion + 1) / questions.length) * 100} 
            className="w-full"
          />

          {/* Análise em Progresso */}
          {isAnalyzing && (
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                Analisando respostas e calculando urgência...
              </p>
            </div>
          )}

          {/* Resultado da Análise */}
          {analysisResult && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold">Análise Concluída</h3>
              
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
                  <span className="font-medium">Score:</span>
                  <span>{analysisResult.urgencyScore}/100</span>
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
                Concluir Anamnese
              </Button>
            </div>
          )}

          {/* Pergunta Atual */}
          {!isAnalyzing && !analysisResult && renderQuestion()}

          {/* Navegação */}
          {!isAnalyzing && !analysisResult && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              
              <div className="text-xs text-muted-foreground self-center">
                Responda com precisão para melhor análise
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnamnesisModal;