import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  category: string;
  type: 'yes_no' | 'multiple' | 'scale' | 'text';
  options?: string[];
}

interface StructuredAnamnesisProps {
  onComplete: (analysis: any) => void;
}

const StructuredAnamnesis: React.FC<StructuredAnamnesisProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isComplete, setIsComplete] = useState(false);

  const questions: Question[] = [
    {
      id: 'main_symptom',
      question: 'Qual é o seu principal sintoma ou preocupação hoje?',
      category: 'sintomas',
      type: 'multiple',
      options: ['Dor', 'Febre', 'Náusea', 'Fadiga', 'Ansiedade', 'Dor de cabeça', 'Outro']
    },
    {
      id: 'symptom_duration',
      question: 'Há quanto tempo você sente isso?',
      category: 'tempo',
      type: 'multiple',
      options: ['Menos de 1 dia', '1-3 dias', '1 semana', 'Mais de 1 semana', 'Mais de 1 mês']
    },
    {
      id: 'pain_intensity',
      question: 'Se você sente dor, qual a intensidade de 0 a 10?',
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
      question: 'Tem dificuldade para respirar?',
      category: 'respiratorio',
      type: 'yes_no'
    },
    {
      id: 'chest_pain',
      question: 'Sente dor no peito?',
      category: 'cardiovascular',
      type: 'yes_no'
    },
    {
      id: 'recent_changes',
      question: 'Houve alguma mudança recente na sua rotina, medicamentos ou estilo de vida?',
      category: 'historico',
      type: 'yes_no'
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const progress = (currentQuestionIndex / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswer = (answer: string | number) => {
    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: answer
    };
    setAnswers(updatedAnswers);

    if (isLastQuestion) {
      // Análise final
      completeAnalysis(updatedAnswers);
    } else {
      // Próxima pergunta
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const completeAnalysis = (finalAnswers: Record<string, any>) => {
    const urgencyData = calculateUrgencyScore(finalAnswers);

    const analysis = {
      type: 'structured',
      answers: finalAnswers,
      urgencyScore: urgencyData.score,
      urgencyLevel: urgencyData.level,
      recommendations: generateRecommendations(finalAnswers, urgencyData.score),
      symptoms: extractSymptoms(finalAnswers),
      timestamp: new Date().toISOString()
    };

    setIsComplete(true);
    setTimeout(() => {
      onComplete(analysis);
    }, 1500);
  };

  // Função unificada de cálculo de urgência Manchester
  const calculateUrgencyScore = (answers: Record<string, any>): { score: number; level: string } => {
    // SEMPRE verificar combinação crítica primeiro
    if (answers.breathing === 'Sim' && answers.chest_pain === 'Sim') {
      return { score: 100, level: 'crítica' }; // Manchester Vermelho - EMERGÊNCIA IMEDIATA
    }
    
    let score = 0;
    
    // Sintomas críticos individuais que levam à emergência
    if (answers.breathing === 'Sim') score = 90;  // Dificuldade respiratória isolada = emergência
    else if (answers.chest_pain === 'Sim') score = 70; // Dor no peito isolada = muito urgente
    
    // Intensidade da dor pode elevar o nível
    const painIntensity = Number(answers.pain_intensity);
    if (painIntensity >= 9) score = Math.max(score, 85); // Dor extrema = emergência
    else if (painIntensity >= 7) score = Math.max(score, 60); // Dor severa = urgente
    else if (painIntensity >= 5) score = Math.max(score, 40); // Dor moderada = pouco urgente
    
    // Outros sintomas graves
    if (answers.fever_check === 'Sim') score = Math.max(score, 30);
    
    // Sintomas agudos (menos de 1 dia) elevam urgência se já há outros sintomas
    if (answers.symptom_duration === 'Menos de 1 dia' && score > 40) {
      score = Math.min(score + 15, 100);
    }
    
    // Determinar nível Manchester baseado no score
    let level: string;
    if (score >= 80) level = 'crítica';   // Manchester Vermelho - Emergência
    else if (score >= 60) level = 'alta';      // Manchester Laranja - Muito Urgente  
    else if (score >= 40) level = 'média';     // Manchester Amarelo - Urgente
    else level = 'baixa';                      // Manchester Verde/Azul - Pouco/Não Urgente
    
    return { score, level };
  };

  const generateRecommendations = (answers: Record<string, any>, score: number): string[] => {
    const recommendations = [];
    
    // Recomendações baseadas no score unificado
    if (score >= 80) {
      recommendations.push('🚨 EMERGÊNCIA: Procurar atendimento médico IMEDIATAMENTE');
      recommendations.push('Ligar para 192 (SAMU) ou dirigir-se ao pronto-socorro AGORA');
      recommendations.push('NÃO aguardar - risco iminente à vida');
      if (answers.breathing === 'Sim' && answers.chest_pain === 'Sim') {
        recommendations.push('⚠️ Possível emergência cardiorrespiratória - ação imediata necessária');
      }
    } else if (score >= 60) {
      recommendations.push('⚠️ MUITO URGENTE: Procurar atendimento em até 10 minutos');
      recommendations.push('Dirigir-se ao pronto-socorro sem demora');
      recommendations.push('Condição pode deteriorar rapidamente');
    } else if (score >= 40) {
      recommendations.push('⏰ URGENTE: Procurar atendimento em até 60 minutos');
      recommendations.push('Dirigir-se à UPA ou pronto-socorro');
      recommendations.push('Monitorar sintomas continuamente');
    } else {
      recommendations.push('Procurar atendimento médico em algumas horas');
      recommendations.push('Pode aguardar em UPA ou agendar consulta');
      recommendations.push('Observar evolução dos sintomas');
    }
    
    return recommendations;
  };

  const extractSymptoms = (answers: Record<string, any>): string[] => {
    const symptoms = [];
    
    if (answers.main_symptom) symptoms.push(answers.main_symptom);
    if (answers.breathing === 'Sim') symptoms.push('Dificuldade respiratória');
    if (answers.chest_pain === 'Sim') symptoms.push('Dor no peito');
    if (answers.fever_check === 'Sim') symptoms.push('Febre');
    
    return symptoms.filter(Boolean);
  };

  const renderAnswerOptions = () => {
    if (currentQuestion.type === 'yes_no') {
      return (
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleAnswer('Sim')}
            className="h-14 text-base font-medium hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Sim
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleAnswer('Não')}
            className="h-14 text-base font-medium hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Não
          </Button>
        </div>
      );
    }

    if (currentQuestion.type === 'multiple' && currentQuestion.options) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {currentQuestion.options.map((option, index) => (
            <Button
              key={index}
              size="lg"
              variant="outline"
              onClick={() => handleAnswer(option)}
              className="h-14 text-base font-medium hover:bg-primary hover:text-primary-foreground transition-all text-left justify-start"
            >
              {option}
            </Button>
          ))}
        </div>
      );
    }

    if (currentQuestion.type === 'scale') {
      return (
        <div className="space-y-4 mt-6">
          <div className="text-center text-sm text-muted-foreground">
            <span>0 = Sem dor</span>
            <span className="mx-4">|</span>
            <span>10 = Dor extrema</span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
            {Array.from({ length: 11 }, (_, i) => (
              <Button
                key={i}
                size="lg"
                variant="outline"
                onClick={() => handleAnswer(i)}
                className="h-14 w-full font-bold text-lg hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {i}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  if (isComplete) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Anamnese Concluída!</h3>
          <p className="text-muted-foreground">
            Processando suas respostas e gerando análise...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Pergunta {currentQuestionIndex + 1} de {questions.length}</span>
          <span>{Math.round(progress)}% concluído</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {currentQuestion.category}
            </Badge>
          </div>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderAnswerOptions()}
        </CardContent>
      </Card>

      {/* Navigation hint */}
      <div className="text-center text-sm text-muted-foreground">
        Toque na resposta que melhor se adequa à sua situação
      </div>
    </div>
  );
};

export default StructuredAnamnesis;