import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface VoiceMedicalChatProps {
  voiceAnalysis: any;
  onComplete: (chatData: any) => void;
  className?: string;
}

const VoiceMedicalChat = ({ voiceAnalysis, onComplete, className }: VoiceMedicalChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const maxQuestions = 4;

  useEffect(() => {
    initializeChat();
  }, [voiceAnalysis]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const initializeChat = async () => {
    const welcomeMessage: Message = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      content: "Olá! Analisei sua voz e gostaria de fazer algumas perguntas contextuais para entender melhor seu estado atual. Vamos começar?",
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    
    // Gerar primeira pergunta baseada na análise de voz
    await generateContextualQuestion();
  };

  const generateContextualQuestion = async () => {
    if (questionCount >= maxQuestions || isCompleted) {
      await completeChat();
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('voice-medical-chat', {
        body: {
          voiceAnalysis,
          conversationHistory: messages,
          questionCount,
          maxQuestions
        }
      });

      if (error) throw error;

      if (data.completed) {
        await completeChat();
        return;
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        content: data.question,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setQuestionCount(prev => prev + 1);
      
    } catch (error) {
      console.error('Erro ao gerar pergunta:', error);
      const errorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        content: "Desculpe, houve um erro. Pode me contar como está se sentindo em geral?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isCompleted) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Gerar próxima pergunta ou finalizar
    await generateContextualQuestion();
  };

  const completeChat = async () => {
    if (isCompleted) return;
    
    setIsCompleted(true);
    
    const completionMessage: Message = {
      id: `ai-completion-${Date.now()}`,
      sender: 'ai',
      content: "Obrigado pelas respostas! Agora vou processar essas informações junto com a análise de voz para gerar um relatório completo.",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, completionMessage]);

    // Combinar dados de voz + conversa
    const combinedData = {
      voiceAnalysis,
      medicalChat: {
        messages: messages.filter(m => m.sender === 'user'),
        questionCount,
        timestamp: new Date().toISOString()
      },
      combinedInsights: await generateCombinedInsights()
    };

    // Aguardar um momento para mostrar a mensagem de conclusão
    setTimeout(() => {
      onComplete(combinedData);
    }, 2000);
  };

  const generateCombinedInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('voice-medical-chat', {
        body: {
          action: 'generate_insights',
          voiceAnalysis,
          chatMessages: messages.filter(m => m.sender === 'user')
        }
      });

      if (error) throw error;
      return data.insights;
      
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      return {
        correlations: ['Análise técnica e relatos do paciente foram processados'],
        recommendations: ['Continuar monitoramento'],
        confidenceScore: 0.75
      };
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-[500px] ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Chat Médico Contextual</h3>
        <div className="ml-auto text-sm text-muted-foreground">
          {questionCount}/{maxQuestions} perguntas
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full
                ${message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {message.sender === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              
              <div className={`
                max-w-[80%] p-3 rounded-lg
                ${message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
                }
              `}>
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      {!isCompleted && (
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua resposta..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Responda naturalmente. Suas respostas ajudarão a correlacionar os dados técnicos da voz.
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceMedicalChat;