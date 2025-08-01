import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, Square, Play, Pause } from "lucide-react";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

interface VoiceAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (analysis: any) => void;
}

const VoiceAnalysisModal = ({ isOpen, onClose, onComplete }: VoiceAnalysisModalProps) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [maxRecordingTime] = useState(60); // 60 segundos máximo
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string>(() => 
    localStorage.getItem('openai_api_key') || ''
  );
  
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
    if (audioData && apiKey) {
      // Salvar a chave no localStorage para próximas sessões
      localStorage.setItem('openai_api_key', apiKey);
      
      try {
        const result = await analyzeVoice(apiKey);
        setAnalysisResult(result);
      } catch (err) {
        console.error('Erro na análise:', err);
      }
    }
  };

  const handleComplete = () => {
    if (analysisResult) {
      onComplete(analysisResult);
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Análise de Voz
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Campo da API Key */}
          <div className="space-y-2">
            <Label htmlFor="api-key">Chave da API OpenAI</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Sua chave será salva localmente apenas neste navegador
            </p>
          </div>

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
                disabled={!apiKey.trim()}
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

          {analysisResult && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold">Resultado da Análise:</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium">Transcrição:</p>
                  <p className="text-sm bg-background p-2 rounded border">
                    {analysisResult.analysis?.transcription || 'Nenhuma transcrição disponível'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Estado Emocional:</p>
                    <p>{analysisResult.analysis?.emotionalTone || 'Normal'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Confiança:</p>
                    <p>{Math.round((analysisResult.analysis?.confidence || 0.8) * 100)}%</p>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleComplete} className="w-full">
                Concluir Análise
              </Button>
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
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAnalysisModal;