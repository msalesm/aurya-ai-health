import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, PlayCircle, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeVoiceChat } from '@/utils/RealtimeVoiceChat';
import { AudioVisualization } from './AudioVisualization';

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
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [assistantTranscript, setAssistantTranscript] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Desconectado');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [microphoneTest, setMicrophoneTest] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const chatRef = useRef<RealtimeVoiceChat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMessage = (event: any) => {
    console.log('[VoiceAssistantModal] Received event:', event.type, event);

    // Update connection status based on events
    switch (event.type) {
      case 'session.created':
        setConnectionStatus('Configurando sessão...');
        break;
      case 'session.updated':
        setConnectionStatus('Conectado - Pronto para conversar');
        break;
      case 'input_audio_buffer.speech_started':
        setIsListening(true);
        setConnectionStatus('🎤 Ouvindo você falar...');
        setIsTranscribing(true);
        break;
      case 'input_audio_buffer.speech_stopped':
        setIsListening(false);
        setIsTranscribing(false);
        setConnectionStatus('🤔 Processando sua fala...');
        break;
      case 'response.audio.delta':
        setConnectionStatus('🗣️ Assistente respondendo...');
        setAssistantTranscript(''); // Clear when starting new response
        break;
      case 'response.audio.done':
        setConnectionStatus('✅ Aguardando sua próxima pergunta...');
        break;
      case 'response.audio_transcript.delta':
        // Real-time transcription of assistant speech
        if (event.delta) {
          setAssistantTranscript(prev => prev + event.delta);
        }
        break;
      case 'transcript_complete':
        // Final assistant transcript from our utility
        if (event.content && event.content.trim()) {
          addMessage('assistant', event.content.trim());
          setAssistantTranscript('');
        }
        break;
      case 'user_transcript':
        // User speech transcription from our utility
        if (event.content && event.content.trim()) {
          addMessage('user', event.content.trim());
        }
        break;
      case 'conversation.item.input_audio_transcription.completed':
        // Direct OpenAI user transcription
        if (event.transcript && event.transcript.trim()) {
          addMessage('user', event.transcript.trim());
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
      case 'error':
        setConnectionStatus('❌ Erro na conexão');
        console.error('Voice chat error:', event);
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
      setConnectionStatus('Conectando...');
      
      chatRef.current = new RealtimeVoiceChat(
        handleMessage, 
        setIsSpeaking, 
        setAssistantTranscript
      );
      await chatRef.current.connect();
      setIsConnected(true);
      setConnectionStatus('Conectado');
      
      // Fallback: se após 8 segundos não houver resposta, forçar início
      setTimeout(() => {
        if (chatRef.current && messages.length === 0) {
          console.log('[VoiceAssistantModal] Forcing conversation start due to timeout');
          chatRef.current.forceStartConversation();
        }
      }, 8000);
      
      toast({
        title: "Assistente Conectado",
        description: "O assistente médico está se preparando para falar...",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      setConnectionStatus('Erro na conexão');
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
    setIsListening(false);
    setConnectionStatus('Desconectado');
    setCurrentTranscript('');
  };

  const forceStart = () => {
    if (chatRef.current) {
      console.log('[VoiceAssistantModal] Manual force start triggered');
      chatRef.current.forceStartConversation();
    }
  };

  const testMicrophone = async () => {
    setMicrophoneTest('testing');
    
    try {
      console.log('Testing microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Test for 3 seconds with real audio analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxLevel = 0;
      
      const checkAudio = () => {
        analyser.getByteTimeDomainData(dataArray);
        const level = Math.max(...dataArray) / 255;
        maxLevel = Math.max(maxLevel, level);
      };
      
      const interval = setInterval(checkAudio, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        
        if (maxLevel > 0.1) {
          setMicrophoneTest('success');
          setAudioStream(stream);
          toast({
            title: "Microfone funcionando",
            description: `Nível de áudio detectado: ${Math.round(maxLevel * 100)}%`,
          });
        } else {
          setMicrophoneTest('error');
          toast({
            title: "Microfone silencioso",
            description: "Microfone acessível mas não detecta áudio. Fale durante o teste.",
            variant: "destructive",
          });
        }
      }, 3000);
      
    } catch (error) {
      console.error('Erro no teste do microfone:', error);
      setMicrophoneTest('error');
      toast({
        title: "Erro no microfone",
        description: "Verifique as permissões e se o microfone está conectado",
        variant: "destructive",
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
            <Mic className="h-5 w-5" />
            Assistente Médico por Voz
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{connectionStatus}</span>
            {isListening && (
              <div className="flex items-center gap-1 text-blue-600">
                <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-xs">Ouvindo</span>
              </div>
            )}
            {isSpeaking && (
              <div className="flex items-center gap-1 text-green-600">
                <div className="w-1 h-1 bg-green-600 rounded-full animate-pulse" />
                <span className="text-xs">Falando</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 justify-center flex-wrap">
            {!isConnected ? (
              <>
                <Button 
                  onClick={startConversation}
                  disabled={isConnecting}
                  className="flex items-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Iniciar Conversa
                    </>
                  )}
                </Button>
                <Button 
                  onClick={testMicrophone}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={microphoneTest === 'testing'}
                >
                  <Volume2 className="h-4 w-4" />
                  {microphoneTest === 'testing' ? 'Testando...' : 'Testar Microfone'}
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={forceStart}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isSpeaking}
                >
                  <PlayCircle className="h-4 w-4" />
                  Forçar Início
                </Button>
                <Button 
                  onClick={endConversation}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <MicOff className="h-4 w-4" />
                  Encerrar
                </Button>
              </div>
            )}
          </div>

          {/* Status do teste de microfone */}
          {microphoneTest !== 'idle' && (
            <div className="flex items-center gap-2 justify-center">
              {microphoneTest === 'testing' && (
                <>
                  <Activity className="w-4 h-4 animate-pulse text-blue-500" />
                  <span className="text-sm text-muted-foreground">Fale no microfone...</span>
                </>
              )}
              {microphoneTest === 'success' && (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Microfone funcionando</span>
                </>
              )}
              {microphoneTest === 'error' && (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-600">Problema no microfone</span>
                </>
              )}
            </div>
          )}

          {/* Audio Visualization */}
          {isConnected && (
            <AudioVisualization 
              isRecording={isConnected}
              audioStream={audioStream}
            />
          )}

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
                
                {/* Transcrição do assistente em tempo real */}
                {assistantTranscript && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] p-3 rounded-lg bg-green-50 border-2 border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-700 font-medium">Assistente falando...</span>
                      </div>
                      <p className="text-sm text-green-900">{assistantTranscript}</p>
                    </div>
                  </div>
                )}
                
                {/* Indicador de transcrição do usuário */}
                {isTranscribing && (
                  <div className="flex justify-end">
                    <div className="max-w-[70%] p-3 rounded-lg bg-blue-50 border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-xs text-blue-700 font-medium">Transcrevendo sua fala...</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
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