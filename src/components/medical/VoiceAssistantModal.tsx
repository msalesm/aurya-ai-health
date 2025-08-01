import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeVoiceChat } from '@/utils/RealtimeVoiceChat';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete?: (analysis: any) => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete
}) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const chatRef = useRef<RealtimeVoiceChat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMessage = (message: any) => {
    console.log('Voice Assistant received message:', message.type);

    switch (message.type) {
      case 'response.audio_transcript.delta':
        if (message.delta) {
          setCurrentTranscript(prev => prev + message.delta);
        }
        break;

      case 'response.audio_transcript.done':
        if (currentTranscript.trim()) {
          addMessage('assistant', currentTranscript.trim());
          setCurrentTranscript('');
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (message.transcript) {
          addMessage('user', message.transcript);
        }
        break;

      case 'response.done':
        // Análise completa - podemos processar os dados coletados
        if (onAnalysisComplete && messages.length > 0) {
          const analysisData = {
            conversation: messages,
            totalInteractions: messages.length,
            userMessages: messages.filter(m => m.type === 'user').length,
            assistantMessages: messages.filter(m => m.type === 'assistant').length,
            timestamp: new Date().toISOString(),
            type: 'voice_interview'
          };
          onAnalysisComplete(analysisData);
        }
        break;
    }
  };

  const addMessage = (type: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const startConversation = async () => {
    try {
      setIsConnecting(true);
      
      chatRef.current = new RealtimeVoiceChat(
        handleMessage,
        setIsSpeaking
      );
      
      await chatRef.current.connect();
      setIsConnected(true);
      
      toast({
        title: "Assistente Conectado",
        description: "O assistente médico está começando a conversa...",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Erro de Conexão",
        description: error instanceof Error ? error.message : 'Falha ao conectar com o assistente',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
    
    if (messages.length > 0) {
      toast({
        title: "Entrevista Finalizada",
        description: "A conversa foi salva e será analisada",
      });
    }
  };

  const handleClose = () => {
    if (isConnected) {
      endConversation();
    }
    onClose();
  };

  useEffect(() => {
    return () => {
      if (chatRef.current) {
        chatRef.current.disconnect();
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Assistente Médico por Voz
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status da Conexão */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
                <span className="font-medium">
                  {isConnected ? 'Conectado' : isConnecting ? 'Conectando...' : 'Desconectado'}
                </span>
                {isSpeaking && (
                  <div className="flex items-center gap-1 text-primary">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">Assistente falando...</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {!isConnected ? (
                  <Button 
                    onClick={startConversation}
                    disabled={isConnecting}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    {isConnecting ? 'Conectando...' : 'Iniciar Conversa'}
                  </Button>
                ) : (
                  <Button 
                    onClick={endConversation}
                    variant="outline"
                  >
                    <MicOff className="h-4 w-4 mr-2" />
                    Finalizar
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Chat de Conversa */}
          <Card className="p-4 h-96 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Transcrição em tempo real */}
                {currentTranscript && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] p-3 rounded-lg bg-muted border-2 border-primary/20">
                      <p className="text-sm">{currentTranscript}</p>
                      <span className="text-xs opacity-70">Digitando...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Instruções */}
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {!isConnected 
                    ? "Clique em 'Iniciar Conversa' para começar a entrevista médica"
                    : "Fale naturalmente - o assistente está ouvindo e pode responder por voz"
                  }
                </p>
              </div>
            </div>
          </Card>

          {/* Estatísticas da Conversa */}
          {messages.length > 0 && (
            <Card className="p-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total de mensagens: {messages.length}</span>
                <span>Suas respostas: {messages.filter(m => m.type === 'user').length}</span>
                <span>Perguntas do assistente: {messages.filter(m => m.type === 'assistant').length}</span>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAssistantModal;