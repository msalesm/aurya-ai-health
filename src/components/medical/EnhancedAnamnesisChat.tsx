import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bot, User, Send, MessageCircle, ClipboardList } from 'lucide-react';
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
      content: 'Olá! Sou sua assistente médica virtual. Vou fazer algumas perguntas para entender melhor como você está se sentindo. Podemos conversar de forma livre ou seguir um questionário estruturado. O que prefere?',
      timestamp: new Date(),
      category: 'introdução'
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useStructuredMode, setUseStructuredMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [structuredAnswers, setStructuredAnswers] = useState<Record<string, any>>({});
  const [isComplete, setIsComplete] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const structuredQuestions: QuestionSet[] = [
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
      type: 'text'
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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage(userMessage, 'user');

    if (useStructuredMode) {
      handleStructuredResponse(userMessage);
    } else {
      await handleFreeConversation(userMessage);
    }
  };

  const handleStructuredResponse = (response: string) => {
    const currentQuestion = structuredQuestions[currentQuestionIndex];
    
    // Store the answer
    setStructuredAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: response
    }));

    // Move to next question or complete
    if (currentQuestionIndex < structuredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestion = structuredQuestions[currentQuestionIndex + 1];
      
      setTimeout(() => {
        addMessage(nextQuestion.question, 'ai', nextQuestion.category);
      }, 1000);
    } else {
      // Complete structured assessment
      setTimeout(() => {
        addMessage(
          'Obrigada pelas respostas! Vou processar essas informações e gerar uma análise para você.',
          'ai',
          'conclusão'
        );
        completeStructuredAnalysis();
      }, 1000);
    }
  };

  const handleFreeConversation = async (userMessage: string) => {
    setIsLoading(true);
    
    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('medical-anamnesis', {
        body: {
          message: userMessage,
          userId: 'anon-user',
          conversationHistory,
          isStructuredAnalysis: false
        }
      });

      if (error) throw error;

      addMessage(data.response, 'ai');
      
      // Check if we have enough information to complete
      if (messages.length >= 8) { // After a few exchanges
        setTimeout(() => {
          addMessage(
            'Com base na nossa conversa, posso gerar uma análise inicial. Gostaria de continuar conversando ou posso processar as informações que temos?',
            'ai',
            'análise'
          );
        }, 2000);
      }

    } catch (error) {
      console.error('Erro na conversa:', error);
      addMessage(
        'Desculpe, houve um problema. Pode repetir ou reformular sua resposta?',
        'ai'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const switchToStructuredMode = () => {
    setUseStructuredMode(true);
    setCurrentQuestionIndex(0);
    
    setTimeout(() => {
      addMessage(
        'Perfeito! Vou fazer perguntas específicas para ter um quadro completo. ' + 
        structuredQuestions[0].question,
        'ai',
        structuredQuestions[0].category
      );
    }, 500);
  };

  const completeStructuredAnalysis = async () => {
    setIsLoading(true);
    
    try {
      // Calculate urgency score based on structured answers
      const urgencyScore = calculateUrgencyScore(structuredAnswers);
      
      const analysis = {
        type: 'structured',
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
      console.error('Erro na análise estruturada:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeConversationAnalysis = async () => {
    setIsLoading(true);
    
    try {
      const conversationText = messages
        .filter(msg => msg.type === 'user')
        .map(msg => msg.content)
        .join(' ');

      const { data, error } = await supabase.functions.invoke('medical-anamnesis', {
        body: {
          message: `Análise final da conversa: ${conversationText}`,
          userId: 'anon-user',
          conversationHistory: messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          isStructuredAnalysis: true
        }
      });

      if (error) throw error;

      const analysis = {
        type: 'conversational',
        conversationSummary: data.response,
        conversationHistory: messages,
        extractedSymptoms: extractSymptomsFromConversation(),
        urgencyLevel: 'média', // Default for conversational
        recommendations: ['Acompanhamento médico recomendado'],
        timestamp: new Date().toISOString()
      };

      setIsComplete(true);
      onAnalysisComplete(analysis);
      
    } catch (error) {
      console.error('Erro na análise conversacional:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateUrgencyScore = (answers: Record<string, any>): number => {
    let score = 0;
    
    // High priority symptoms
    if (answers.breathing === 'sim' || answers.breathing?.toLowerCase().includes('sim')) score += 30;
    if (answers.chest_pain === 'sim' || answers.chest_pain?.toLowerCase().includes('sim')) score += 25;
    if (answers.fever_check === 'sim' || answers.fever_check?.toLowerCase().includes('sim')) score += 15;
    
    // Pain intensity
    if (answers.pain_intensity >= 8) score += 20;
    else if (answers.pain_intensity >= 6) score += 10;
    else if (answers.pain_intensity >= 4) score += 5;
    
    // Duration factor
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
    } else if (score >= 30) {
      recommendations.push('Agende consulta médica em 24-48 horas');
    } else {
      recommendations.push('Considere consulta médica de rotina');
    }
    
    return recommendations;
  };

  const extractSymptomsFromConversation = (): string[] => {
    const symptoms = [];
    const userMessages = messages.filter(msg => msg.type === 'user').map(msg => msg.content.toLowerCase());
    
    const symptomKeywords = ['dor', 'febre', 'náusea', 'fadiga', 'ansiedade', 'tontura', 'vômito'];
    
    symptomKeywords.forEach(symptom => {
      if (userMessages.some(msg => msg.includes(symptom))) {
        symptoms.push(symptom);
      }
    });
    
    return symptoms;
  };

  const renderQuickOptions = () => {
    if (useStructuredMode && currentQuestionIndex < structuredQuestions.length) {
      const currentQuestion = structuredQuestions[currentQuestionIndex];
      
      if (currentQuestion.type === 'yes_no') {
        return (
          <div className="flex gap-2 mb-2">
            <Button size="sm" variant="outline" onClick={() => {
              setInputValue('Sim');
              setTimeout(() => handleSendMessage(), 100);
            }}>
              Sim
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setInputValue('Não');
              setTimeout(() => handleSendMessage(), 100);
            }}>
              Não
            </Button>
          </div>
        );
      }
      
      if (currentQuestion.type === 'multiple' && currentQuestion.options) {
        return (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                onClick={() => {
                  setInputValue(option);
                  setTimeout(() => handleSendMessage(), 100);
                }}
                className="text-xs"
              >
                {option}
              </Button>
            ))}
          </div>
        );
      }
      
      if (currentQuestion.type === 'scale') {
        return (
          <div className="grid grid-cols-11 gap-1 mb-2">
            {Array.from({ length: 11 }, (_, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                onClick={() => {
                  setInputValue(i.toString());
                  setTimeout(() => handleSendMessage(), 100);
                }}
                className="p-1 h-8 text-xs"
              >
                {i}
              </Button>
            ))}
          </div>
        );
      }
    }
    
    return null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="mode-switch" className="text-sm">
                Modo Estruturado
              </Label>
              <Switch
                id="mode-switch"
                checked={useStructuredMode}
                onCheckedChange={setUseStructuredMode}
                disabled={messages.length > 1}
              />
            </div>
            <div className="flex gap-2">
              {!useStructuredMode && messages.length > 1 && (
                <Button size="sm" variant="outline" onClick={switchToStructuredMode}>
                  <ClipboardList className="h-4 w-4 mr-1" />
                  Perguntas Dirigidas
                </Button>
              )}
              {!useStructuredMode && messages.length >= 6 && (
                <Button size="sm" onClick={completeConversationAnalysis}>
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Analisar Conversa
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea ref={scrollAreaRef} className="h-80 p-4">
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
                    max-w-[80%] rounded-lg p-3
                    ${message.type === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    <p className="text-sm">{message.content}</p>
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

      {/* Input Area */}
      {!isComplete && (
        <Card>
          <CardContent className="p-4 space-y-3">
            {renderQuickOptions()}
            
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digite sua resposta..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              {useStructuredMode 
                ? `Pergunta ${currentQuestionIndex + 1} de ${structuredQuestions.length}`
                : 'Converse livremente sobre seus sintomas'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedAnamnesisChat;