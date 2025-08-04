import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, ArrowRight } from 'lucide-react';

interface QuestionSet {
  id: string;
  question: string;
  category: string;
  type: 'yes_no' | 'multiple' | 'scale';
  options?: string[];
}

interface StructuredQuestionnaireProps {
  onAnalysisComplete: (analysis: any) => void;
  className?: string;
}

const StructuredQuestionnaire: React.FC<StructuredQuestionnaireProps> = ({
  onAnalysisComplete,
  className = ''
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 10 perguntas obrigatórias com múltipla escolha
  const questions: QuestionSet[] = [
    {
      id: 'main_symptom',
      question: 'Qual é o seu principal sintoma ou preocupação hoje?',
      category: 'sintomas',
      type: 'multiple',
      options: ['Dor', 'Febre', 'Náusea', 'Fadiga', 'Ansiedade', 'Dor de cabeça', 'Tontura', 'Outro']
    },
    {
      id: 'symptom_duration',
      question: 'Há quanto tempo você sente isso?',
      category: 'tempo',
      type: 'multiple',
      options: ['Menos de 1 hora', 'Algumas horas', '1 dia', '2-3 dias', '1 semana', 'Mais de 1 semana']
    },
    {
      id: 'pain_intensity',
      question: 'Se você sente dor, qual a intensidade de 0 a 10? (0 = sem dor, 10 = dor insuportável)',
      category: 'intensidade',
      type: 'scale'
    },
    {
      id: 'fever_check',
      question: 'Você tem febre ou se sente febril?',
      category: 'sintomas',
      type: 'yes_no'
    },
    {
      id: 'breathing',
      question: 'Tem dificuldade para respirar ou falta de ar?',
      category: 'respiratorio',
      type: 'yes_no'
    },
    {
      id: 'chest_pain',
      question: 'Sente dor, aperto ou desconforto no peito?',
      category: 'cardiovascular',
      type: 'yes_no'
    },
    {
      id: 'medications',
      question: 'Você está tomando algum medicamento atualmente?',
      category: 'medicamentos',
      type: 'multiple',
      options: ['Não tomo medicamentos', 'Medicamentos prescritos', 'Medicamentos sem receita', 'Vitaminas/Suplementos', 'Prefiro não informar']
    },
    {
      id: 'family_history',
      question: 'Há histórico familiar de doenças cardíacas, diabetes ou outras condições importantes?',
      category: 'histórico',
      type: 'multiple',
      options: ['Não há histórico conhecido', 'Doenças cardíacas', 'Diabetes', 'Hipertensão', 'Câncer', 'Outras condições', 'Não sei informar']
    },
    {
      id: 'associated_symptoms',
      question: 'Você apresenta algum destes sintomas adicionais?',
      category: 'sintomas',
      type: 'multiple',
      options: ['Nenhum dos listados', 'Náusea/Vômito', 'Sudorese excessiva', 'Tontura/Desmaio', 'Dor de cabeça intensa', 'Alterações na visão']
    },
    {
      id: 'recent_changes',
      question: 'Houve alguma mudança recente na sua rotina, estresse ou estilo de vida?',
      category: 'contextual',
      type: 'multiple',
      options: ['Nenhuma mudança significativa', 'Aumento do estresse', 'Mudança na alimentação', 'Menos exercício', 'Problemas de sono', 'Outras mudanças']
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    if (isLoading) return;

    const newAnswers = {
      ...answers,
      [currentQuestion.id]: answer
    };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      // Generate analysis
      generateAnalysis(newAnswers);
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const generateAnalysis = async (finalAnswers: Record<string, any>) => {
    setIsLoading(true);
    
    try {
      const urgencyScore = calculateUrgencyScore(finalAnswers);
      
      const analysis = {
        type: 'structured',
        answers: finalAnswers,
        urgencyScore,
        urgencyLevel: getUrgencyLevel(urgencyScore),
        recommendations: generateRecommendations(finalAnswers, urgencyScore),
        timestamp: new Date().toISOString()
      };

      onAnalysisComplete(analysis);
      
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateUrgencyScore = (answers: Record<string, any>): number => {
    let score = 0;
    
    // High priority symptoms
    if (answers.breathing === 'Sim') score += 30;
    if (answers.chest_pain === 'Sim') score += 25;
    if (answers.fever_check === 'Sim') score += 15;
    
    // Pain intensity
    const painLevel = parseInt(answers.pain_intensity) || 0;
    if (painLevel >= 8) score += 20;
    else if (painLevel >= 6) score += 10;
    else if (painLevel >= 4) score += 5;
    
    // Duration factor
    if (answers.symptom_duration === 'Menos de 1 hora' && score > 20) score += 15;
    if (answers.symptom_duration === 'Algumas horas' && score > 15) score += 10;
    
    // Associated symptoms
    if (answers.associated_symptoms?.includes('Sudorese excessiva')) score += 10;
    if (answers.associated_symptoms?.includes('Tontura/Desmaio')) score += 10;
    if (answers.associated_symptoms?.includes('Dor de cabeça intensa')) score += 8;
    
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
      recommendations.push('🚨 Procure atendimento médico de emergência IMEDIATAMENTE');
      recommendations.push('📞 Considere chamar SAMU (192) se necessário');
      recommendations.push('🏥 Vá ao pronto-socorro mais próximo');
    } else if (score >= 50) {
      recommendations.push('⚠️ Procure atendimento médico urgente nas próximas 2-4 horas');
      recommendations.push('🏥 Vá a uma UPA ou pronto-socorro');
    } else if (score >= 30) {
      recommendations.push('📅 Agende consulta médica em 24-48 horas');
      recommendations.push('📋 Monitore os sintomas e procure ajuda se piorarem');
    } else {
      recommendations.push('🩺 Considere consulta médica de rotina');
      recommendations.push('💊 Mantenha cuidados básicos de saúde');
    }
    
    // Specific recommendations
    if (answers.breathing === 'Sim') {
      recommendations.push('🫁 Mantenha-se em posição confortável para respirar');
    }
    if (answers.medications !== 'Não tomo medicamentos') {
      recommendations.push('💊 Leve lista de medicamentos na consulta');
    }
    
    return recommendations;
  };

  const renderAnswerOptions = () => {
    if (currentQuestion.type === 'yes_no') {
      return (
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleAnswer('Sim')}
            disabled={isLoading}
            className="h-12 px-6 flex-1"
          >
            Sim
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleAnswer('Não')}
            disabled={isLoading}
            className="h-12 px-6 flex-1"
          >
            Não
          </Button>
        </div>
      );
    }
    
    if (currentQuestion.type === 'multiple' && currentQuestion.options) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQuestion.options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleAnswer(option)}
              disabled={isLoading}
              className="h-auto py-3 px-4 whitespace-normal text-left justify-start"
            >
              {option}
            </Button>
          ))}
        </div>
      );
    }
    
    if (currentQuestion.type === 'scale') {
      return (
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Sem dor</span>
            <span>Insuportável</span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
            {Array.from({ length: 11 }, (_, i) => (
              <Button
                key={i}
                variant="outline"
                onClick={() => handleAnswer(i.toString())}
                disabled={isLoading}
                className="h-10 text-sm font-medium"
              >
                {i}
              </Button>
            ))}
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Selecione um número de 0 a 10
          </p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Questionário Médico
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {currentQuestionIndex + 1}/{questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Pergunta {currentQuestionIndex + 1}
          </CardTitle>
          <p className="text-muted-foreground text-base">
            {currentQuestion.question}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderAnswerOptions()}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4 animate-pulse" />
              <span>Processando resposta...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StructuredQuestionnaire;