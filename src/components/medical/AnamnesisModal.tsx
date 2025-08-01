import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, MessageCircle, ClipboardList, ArrowRight } from "lucide-react";
import EnhancedAnamnesisChat from "./EnhancedAnamnesisChat";

interface AnamnesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (analysis: any) => void;
}

const AnamnesisModal = ({ isOpen, onClose, onComplete }: AnamnesisModalProps) => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleAnalysisComplete = (analysis: any) => {
    setAnalysisResult(analysis);
    setIsComplete(true);
  };

  const handleComplete = () => {
    if (analysisResult) {
      onComplete(analysisResult);
      onClose();
      // Reset state for next use
      setAnalysisResult(null);
      setIsComplete(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Anamnese Inteligente
            <Badge variant="outline" className="ml-2">
              <MessageCircle className="h-3 w-3 mr-1" />
              IA Conversacional
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resultado da Análise */}
          {analysisResult && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Análise Concluída
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="font-medium text-sm">Tipo de Análise:</span>
                  <Badge variant="outline">
                    {analysisResult.type === 'structured' ? 'Estruturada' : 'Conversacional'}
                  </Badge>
                </div>
                
                {analysisResult.urgencyLevel && (
                  <div className="space-y-2">
                    <span className="font-medium text-sm">Nível de Urgência:</span>
                    <Badge variant={
                      analysisResult.urgencyLevel === 'crítica' ? 'destructive' :
                      analysisResult.urgencyLevel === 'alta' ? 'secondary' :
                      'default'
                    }>
                      {analysisResult.urgencyLevel.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>

              {analysisResult.recommendations && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">Recomendações:</p>
                  <ul className="text-sm space-y-1">
                    {analysisResult.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Button onClick={handleComplete} className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Continuar para Análise Clínica
              </Button>
            </div>
          )}

          {/* Chat Interface */}
          {!analysisResult && (
            <EnhancedAnamnesisChat 
              onAnalysisComplete={handleAnalysisComplete}
              className="h-full"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnamnesisModal;