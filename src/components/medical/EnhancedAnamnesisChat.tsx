import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, User, ClipboardList, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  category?: string;
}

interface QuestionSet {
  id: string;
  question: string;
  category: string;
  type: 'yes_no' | 'multiple' | 'scale' | 'text';
  options?: string[];
}

interface EnhancedAnamnesissChatProps {
  onAnalysisComplete: (analysis: any) => void;
  className?: string;
}

const EnhancedAnamnesisChat: React.FC<EnhancedAnamnesissChatProps> = ({
  onAnalysisComplete,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Olá! Sou a IA médica da Triia. Vou fazer 10 perguntas essenciais para entender seu estado de saúde, uma por vez. Após as perguntas, gerei uma análise completa. Está pronto para começar?',
      timestamp: new Date(),
      category: 'introdução'
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 = não iniciado
  const [structuredAnswers, setStructuredAnswers] = useState<Record<string, any>>({});
  const [isStructuredPhase, setIsStructuredPhase] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [questionStarted, setQuestionStarted] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // 10 perguntas obrigatórias com múltipla escolha
  const structuredQuestions: QuestionSet[] = [
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const addMessage = (content: string, type: 'user' | 'ai', category?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      category
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleQuestionResponse = (response: string) => {
    if (isLoading) return;
    
    addMessage(response, 'user');
    
    if (!questionStarted) {
      startStructuredQuestions();
      return;
    }

    if (isStructuredPhase && currentQuestionIndex >= 0) {
      handleStructuredResponse(response);
    }
  };

  const startStructuredQuestions = () => {
    setQuestionStarted(true);
    setCurrentQuestionIndex(0);
    
    setTimeout(() => {
      addMessage(
        `Perfeito! Vamos começar com as 10 perguntas essenciais.\n\n**Pergunta 1/10:**\n${structuredQuestions[0].question}`,
        'ai',
        structuredQuestions[0].category
      );
    }, 1000);
  };

  const handleStructuredResponse = (response: string) => {
    if (isLoading) return; // Prevent duplicate processing
    
    setIsLoading(true);
    const currentQuestion = structuredQuestions[currentQuestionIndex];
    
    // Store the answer
    setStructuredAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: response
    }));

    // Move to next question or complete structured phase
    setTimeout(() => {
      if (currentQuestionIndex < structuredQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        const nextQuestion = structuredQuestions[currentQuestionIndex + 1];
        
        addMessage(
          `**Pergunta ${currentQuestionIndex + 2}/10:**\n${nextQuestion.question}`,
          'ai',
          nextQuestion.category
        );
      } else {
        // Complete structured questions phase
        setIsStructuredPhase(false);
        addMessage(
          'Excelente! Terminamos as 10 perguntas essenciais. Agora posso processar essas informações para gerar sua análise médica completa.',
          'ai',
          'transição'
        );
      }
      setIsLoading(false);
    }, 800);
  };


  const completeAnalysis = async () => {
    setIsLoading(true);
    
    try {
      const urgencyScore = calculateUrgencyScore(structuredAnswers);
      
      const analysis = {
        type: 'complete',
        answers: structuredAnswers,
        urgencyScore,
        urgencyLevel: getUrgencyLevel(urgencyScore),
        recommendations: generateRecommendations(structuredAnswers, urgencyScore),
        conversationHistory: messages,
        timestamp: new Date().toISOString()
      };

      setIsComplete(true);
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
    if (answers.breathing === 'Sim' || answers.breathing?.toLowerCase().includes('sim')) score += 30;
    if (answers.chest_pain === 'Sim' || answers.chest_pain?.toLowerCase().includes('sim')) score += 25;
    if (answers.fever_check === 'Sim' || answers.fever_check?.toLowerCase().includes('sim')) score += 15;
    
    // Pain intensity
    const painLevel = parseInt(answers.pain_intensity) || 0;
    if (painLevel >= 8) score += 20;
    else if (painLevel >= 6) score += 10;
    else if (painLevel >= 4) score += 5;
    
    // Duration factor - shorter duration with high symptoms = urgent
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
    
    // Specific recommendations based on answers
    if (answers.breathing === 'Sim') {
      recommendations.push('🫁 Mantenha-se em posição confortável para respirar');
    }
    if (answers.medications !== 'Não tomo medicamentos') {
      recommendations.push('💊 Leve lista de medicamentos na consulta');
    }
    
    return recommendations;
  };

  const renderQuickOptions = () => {
    if (!questionStarted) {
      return (
        <div className="flex gap-2 mb-2">
          <Button size="sm" variant="outline" onClick={() => {
            handleQuestionResponse('Sim, vamos começar');
          }}>
            Sim, vamos começar
          </Button>
        </div>
      );
    }

    if (isStructuredPhase && currentQuestionIndex >= 0 && currentQuestionIndex < structuredQuestions.length) {
      const currentQuestion = structuredQuestions[currentQuestionIndex];
      
      if (currentQuestion.type === 'yes_no') {
        return (
          <div className="flex gap-3 mb-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                if (!isLoading) {
                  handleQuestionResponse('Sim');
                }
              }}
              disabled={isLoading}
              className="h-12 sm:h-10 px-6 flex-1"
            >
              Sim
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                if (!isLoading) {
                  handleQuestionResponse('Não');
                }
              }}
              disabled={isLoading}
              className="h-12 sm:h-10 px-6 flex-1"
            >
              Não
            </Button>
          </div>
        );
      }
      
      if (currentQuestion.type === 'multiple' && currentQuestion.options) {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!isLoading) {
                    handleQuestionResponse(option);
                  }
                }}
                disabled={isLoading}
                className="text-xs h-12 sm:h-10 py-2 px-3 whitespace-normal text-left justify-start"
              >
                {option}
              </Button>
            ))}
          </div>
        );
      }
      
      if (currentQuestion.type === 'scale') {
        return (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Sem dor</span>
              <span>Insuportável</span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-11 gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!isLoading) {
                      handleQuestionResponse(i.toString());
                    }
                  }}
                  disabled={isLoading}
                  className="h-10 sm:h-8 text-sm sm:text-xs font-medium"
                >
                  {i}
                </Button>
              ))}
            </div>
            <div className="text-xs text-center text-muted-foreground">
              Selecione um número de 0 a 10
            </div>
          </div>
        );
      }
    }

    if (!isStructuredPhase) {
      return (
        <div className="flex gap-2 mb-2">
          <Button size="sm" onClick={completeAnalysis}>
            <ArrowRight className="h-4 w-4 mr-1" />
            Gerar Análise
          </Button>
        </div>
      );
    }
    
    return null;
  };

  const getProgress = () => {
    if (!questionStarted) return 0;
    if (currentQuestionIndex < 0) return 0;
    return ((currentQuestionIndex + 1) / structuredQuestions.length) * 100;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Indicator */}
      {questionStarted && isStructuredPhase && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Questionário Estruturado
              </CardTitle>
              <Badge variant="outline">
                {currentQuestionIndex + 1}/10
              </Badge>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </CardHeader>
        </Card>
      )}

      {/* Phase Indicator */}
      {!isStructuredPhase && !isComplete && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4 text-green-500" />
              <span>Questionário estruturado concluído</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea ref={scrollAreaRef} className="h-[70vh] sm:h-96 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className={`
                    p-2 rounded-full shrink-0
                    ${message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  
                   <div className={`
                     max-w-[85%] sm:max-w-[80%] rounded-lg p-3
                     ${message.type === 'user'
                       ? 'bg-primary text-primary-foreground ml-auto'
                       : 'bg-muted text-muted-foreground'
                     }
                   `}>
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.category && (
                        <Badge variant="outline" className="text-xs">
                          {message.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-muted text-muted-foreground shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted text-muted-foreground rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Options Area */}
      {!isComplete && (
        <Card>
          <CardContent className="p-4 space-y-3">
            {renderQuickOptions()}
            
            <p className="text-xs text-muted-foreground text-center">
              {!questionStarted && 'Clique no botão para iniciar o questionário estruturado'}
              {questionStarted && isStructuredPhase && `Responda usando os botões • ${currentQuestionIndex + 1}/10`}
              {!isStructuredPhase && 'Clique em "Gerar Análise" para processar suas respostas'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedAnamnesisChat;