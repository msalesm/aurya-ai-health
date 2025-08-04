import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, Square, Play, Pause, MessageCircle } from "lucide-react";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import VoiceMedicalChat from "./VoiceMedicalChat";

interface VoiceAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (analysis: any) => void;
}

const VoiceAnalysisModal = ({ isOpen, onClose, onComplete }: VoiceAnalysisModalProps) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [maxRecordingTime] = useState(60); // 60 segundos máximo
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showMedicalChat, setShowMedicalChat] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'recording' | 'analysis' | 'chat'>('recording');
  
  const {
    isRecording,
    isProcessing,
    audioData,
    startRecording,
    stopRecording,
    analyzeVoice,
    error
  } = useVoiceRecording();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxRecordingTime) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxRecordingTime, stopRecording]);

  const handleStartRecording = async () => {
    setRecordingTime(0);
    setAnalysisResult(null);
    await startRecording();
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  const handleAnalyze = async () => {
    try {
      const result = await analyzeVoice();
      setAnalysisResult(result);
      setCurrentPhase('analysis');
    } catch (err) {
      console.error('Erro na análise:', err);
    }
  };

  const handleStartMedicalChat = () => {
    setShowMedicalChat(true);
    setCurrentPhase('chat');
  };

  const handleMedicalChatComplete = (combinedData: any) => {
    // Combinar dados de análise técnica + chat médico
    const finalResult = {
      ...analysisResult,
      medicalChat: combinedData.medicalChat,
      combinedInsights: combinedData.combinedInsights,
      completedPhases: ['recording', 'analysis', 'chat']
    };
    
    onComplete(finalResult);
    onClose();
  };

  const handleSkipChat = () => {
    // Permitir pular o chat médico se o usuário quiser
    onComplete({
      ...analysisResult,
      completedPhases: ['recording', 'analysis']
    });
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={showMedicalChat ? "sm:max-w-[700px]" : "sm:max-w-[500px]"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showMedicalChat ? (
              <MessageCircle className="h-5 w-5 text-primary" />
            ) : (
              <Mic className="h-5 w-5 text-primary" />
            )}
            {showMedicalChat ? 'Chat Médico Contextual' : 'Análise de Voz'}
            <div className="ml-auto text-sm text-muted-foreground">
              Fase {currentPhase === 'recording' ? '1' : currentPhase === 'analysis' ? '1' : '2'}/2
            </div>
          </DialogTitle>
        </DialogHeader>

        {showMedicalChat ? (
          <VoiceMedicalChat 
            voiceAnalysis={analysisResult} 
            onComplete={handleMedicalChatComplete}
          />
        ) : (
          <div className="space-y-6 py-4">
            {/* Status e Timer */}
          <div className="text-center space-y-4">
            <div className={`
              p-8 rounded-full mx-auto w-32 h-32 flex items-center justify-center
              ${isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-muted text-muted-foreground"}
            `}>
              <Mic className="h-12 w-12" />
            </div>
            
            <div>
              <div className="text-2xl font-mono font-bold">
                {formatTime(recordingTime)}
              </div>
              <p className="text-sm text-muted-foreground">
                {isRecording ? "Gravando..." : audioData ? "Gravação concluída" : "Pronto para gravar"}
              </p>
            </div>

            {/* Progress Bar */}
            <Progress 
              value={(recordingTime / maxRecordingTime) * 100} 
              className="w-full"
            />
          </div>

          {/* Controles */}
          <div className="flex justify-center gap-4">
            {!isRecording && !audioData && (
              <Button onClick={handleStartRecording} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Iniciar Gravação
              </Button>
            )}

            {isRecording && (
              <Button onClick={handleStopRecording} variant="destructive" size="lg">
                <Square className="h-4 w-4 mr-2" />
                Parar Gravação
              </Button>
            )}

            {audioData && !analysisResult && !isProcessing && (
              <Button 
                onClick={handleAnalyze} 
                size="lg"
              >
                Analisar Voz
              </Button>
            )}
          </div>

          {/* Resultado da Análise */}
          {isProcessing && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Analisando padrões de voz...</p>
            </div>
          )}

          {/* Botões de Ação - Fase 2 */}
          {analysisResult && currentPhase === 'analysis' && (
            <div className="space-y-3">
              <div className="text-center">
                <Button onClick={handleStartMedicalChat} size="lg" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Continuar com Chat Médico
                </Button>
              </div>
              <div className="text-center">
                <Button 
                  onClick={handleSkipChat} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  Pular Chat e Concluir
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                O chat médico fará perguntas contextuais baseadas na análise de voz para dados mais precisos
              </div>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold">Detalhes da Análise:</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Transcrição:</p>
                  <p className="text-sm bg-background p-2 rounded border">
                    {analysisResult.analysis?.transcription || 'Nenhuma transcrição disponível'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Estado Emocional:</p>
                    <p className="capitalize">{analysisResult.analysis?.emotional_tone?.primary_emotion || 'Normal'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Confiança:</p>
                    <p>{Math.round((analysisResult.analysis?.emotional_tone?.confidence || 0.8) * 100)}%</p>
                  </div>
                </div>

                {analysisResult.analysis?.stress_indicators && (
                  <div>
                    <p className="font-medium">Indicadores de Estresse:</p>
                    <div className="text-sm bg-background p-2 rounded border">
                      <p>Nível: {Math.round(analysisResult.analysis.stress_indicators.stress_level)}/10</p>
                      <p>Taxa de fala: {analysisResult.analysis.stress_indicators.speech_rate}</p>
                      {analysisResult.analysis.stress_indicators.voice_tremor && (
                        <p className="text-amber-600">⚠️ Tremor vocal detectado</p>
                      )}
                    </div>
                  </div>
                )}

                {analysisResult.analysis?.respiratory_analysis && (
                  <div>
                    <p className="font-medium">Análise Respiratória:</p>
                    <div className="text-sm bg-background p-2 rounded border">
                      <p>Taxa respiratória: {analysisResult.analysis.respiratory_analysis.breathing_rate} rpm</p>
                      {analysisResult.analysis.respiratory_analysis.irregularity_detected && (
                        <p className="text-orange-600">⚠️ Irregularidade detectada</p>
                      )}
                      {analysisResult.analysis.respiratory_analysis.shallow_breathing && (
                        <p className="text-orange-600">⚠️ Respiração superficial</p>
                      )}
                    </div>
                  </div>
                )}

                {analysisResult.health_indicators && analysisResult.health_indicators.length > 0 && (
                  <div>
                    <p className="font-medium">Indicadores de Saúde:</p>
                    <div className="space-y-2">
                      {analysisResult.health_indicators.map((indicator: any, index: number) => (
                        <div key={index} className="text-sm bg-background p-2 rounded border">
                          <p className="font-medium text-amber-600">{indicator.concern}</p>
                          <p className="text-muted-foreground">{indicator.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Duração da sessão: {analysisResult.analysis?.session_duration || 0}s
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-destructive text-sm text-center">
              Erro: {error}
            </div>
          )}

            {/* Instruções */}
            <div className="text-xs text-muted-foreground text-center">
              Fale naturalmente sobre como você está se sentindo. 
              A IA analisará padrões de voz, respiração e emoção.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAnalysisModal;