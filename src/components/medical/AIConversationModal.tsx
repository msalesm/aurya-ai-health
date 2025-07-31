import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User,
  Brain,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface AIConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (conversationData: any) => void;
  structuredAnswers?: Record<string, any>;
  patientName?: string;
}

const AIConversationModal: React.FC<AIConversationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  structuredAnswers,
  patientName
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxQuestions = 10;

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Mensagem inicial personalizada
      const initialMessage: Message = {
        id: 'init',
        type: 'ai',
        content: `Olá${patientName ? `, ${patientName}` : ''}! Sou a IA médica e vou fazer algumas perguntas adicionais para entender melhor seus sintomas. 

${structuredAnswers ? 'Com base nas suas respostas anteriores, ' : ''}gostaria de aprofundar alguns aspectos. Pode me contar mais sobre como você está se sentindo hoje?`,
        timestamp: new Date().toISOString()
      };
      setMessages([initialMessage]);
    }
  }, [isOpen, patientName, structuredAnswers]);

  useEffect(() => {
    // Auto-scroll para a última mensagem
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        type: msg.type,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('medical-anamnesis', {
        body: {
          message: userMessage.content,
          userId: 'anon-user',
          conversationHistory,
          patientName,
          structuredAnswers
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      setQuestionCount(prev => prev + 1);

      // Verificar se chegou ao limite ou se deve finalizar
      if (questionCount >= maxQuestions - 1) {
        setTimeout(() => {
          finalizarConversa();
        }, 1000);
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: 'Desculpe, houve um erro. Pode repetir sua resposta?',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const finalizarConversa = async () => {
    setIsAnalyzing(true);

    // Extrair apenas as mensagens do usuário para análise
    const userResponses = messages
      .filter(msg => msg.type === 'user')
      .map(msg => msg.content);

    try {
      // Análise semântica das respostas
      const { data, error } = await supabase.functions.invoke('medical-anamnesis', {
        body: {
          message: `Análise semântica final das respostas: ${JSON.stringify(userResponses)}`,
          userId: 'anon-user',
          conversationHistory: messages.map(msg => ({
            type: msg.type,
            content: msg.content
          })),
          isSemanticAnalysis: true,
          structuredAnswers
        }
      });

      const conversationData = {
        transcript: messages,
        userResponses,
        aiAnalysis: data?.response || 'Análise conversacional concluída',
        extractedSymptoms: extractSymptomsFromConversation(userResponses),
        emotionalState: analyzeEmotionalTone(userResponses),
        conversationSummary: generateConversationSummary(),
        questionCount: questionCount + 1,
        structuredAnswers // Incluir respostas estruturadas para integração
      };

      setAnalysisResult(conversationData);
      setConversationComplete(true);

    } catch (error) {
      console.error('Erro na análise final:', error);
      
      // Fallback para análise local
      const conversationData = {
        transcript: messages,
        userResponses,
        aiAnalysis: 'Análise conversacional local concluída',
        extractedSymptoms: extractSymptomsFromConversation(userResponses),
        emotionalState: analyzeEmotionalTone(userResponses),
        conversationSummary: generateConversationSummary(),
        questionCount: questionCount + 1,
        structuredAnswers
      };

      setAnalysisResult(conversationData);
      setConversationComplete(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractSymptomsFromConversation = (responses: string[]): string[] => {
    const symptoms = new Set<string>();
    const symptomKeywords = [
      'dor', 'febre', 'náusea', 'tontura', 'cansaço', 'fadiga',
      'ansiedade', 'estresse', 'insônia', 'dor de cabeça',
      'falta de ar', 'palpitação', 'mal-estar'
    ];

    responses.forEach(response => {
      const lowerResponse = response.toLowerCase();
      symptomKeywords.forEach(keyword => {
        if (lowerResponse.includes(keyword)) {
          symptoms.add(keyword);
        }
      });
    });

    return Array.from(symptoms);
  };

  const analyzeEmotionalTone = (responses: string[]): string => {
    const combinedText = responses.join(' ').toLowerCase();
    
    if (combinedText.includes('preocupado') || combinedText.includes('ansioso') || combinedText.includes('nervoso')) {
      return 'ansioso';
    }
    if (combinedText.includes('triste') || combinedText.includes('deprimido')) {
      return 'deprimido';
    }
    if (combinedText.includes('dor') || combinedText.includes('sofrendo')) {
      return 'desconfortável';
    }
    
    return 'neutro';
  };

  const generateConversationSummary = (): string => {
    return `Conversa com ${questionCount + 1} perguntas e respostas. Paciente ${patientName || 'anônimo'} demonstrou ${analyzeEmotionalTone(messages.filter(m => m.type === 'user').map(m => m.content))} durante a conversa.`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleComplete = () => {
    if (analysisResult) {
      onComplete(analysisResult);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Conversa com IA Médica
            <Badge variant="secondary" className="ml-auto">
              {questionCount}/{maxQuestions}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {!conversationComplete ? (
          <div className="flex-1 flex flex-col space-y-4 min-h-0">
            {/* Área de mensagens */}
            <ScrollArea 
              ref={scrollAreaRef}
              className="flex-1 rounded-md border p-4"
            >
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        flex items-start gap-2 max-w-[80%]
                        ${message.type === 'user' ? 'flex-row-reverse' : ''}
                      `}
                    >
                      <div className={`
                        p-2 rounded-full flex-shrink-0
                        ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                      `}>
                        {message.type === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div
                        className={`
                          p-3 rounded-lg text-sm
                          ${message.type === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'}
                        `}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-muted">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Campo de entrada */}
            <div className="flex gap-2 flex-shrink-0">
              <Input
                ref={inputRef}
                placeholder="Digite sua resposta..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || questionCount >= maxQuestions}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || questionCount >= maxQuestions}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {questionCount >= maxQuestions && (
              <div className="text-center">
                <Button 
                  onClick={finalizarConversa}
                  disabled={isAnalyzing}
                  variant="outline"
                >
                  {isAnalyzing ? 'Analisando...' : 'Finalizar Conversa'}
                </Button>
              </div>
            )}

            {isAnalyzing && (
              <Card className="border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-center space-y-2">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    Analisando conversa e extraindo insights médicos...
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex-1 space-y-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-4">
                <div className="text-center space-y-3">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <h3 className="font-semibold text-green-700">
                    Conversa Analisada!
                  </h3>
                  <p className="text-sm text-green-600">
                    Coletamos informações adicionais valiosas sobre seus sintomas.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Perguntas:</span>
                  <span className="text-sm font-medium">{analysisResult?.questionCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sintomas identificados:</span>
                  <span className="text-sm font-medium">
                    {analysisResult?.extractedSymptoms?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Estado emocional:</span>
                  <Badge variant="outline">
                    {analysisResult?.emotionalState || 'neutro'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleComplete} className="w-full">
              <Brain className="h-4 w-4 mr-2" />
              Integrar à Análise Completa
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIConversationModal;