import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Eye, Loader2 } from 'lucide-react';
import { NativeCameraCapture } from './NativeCameraCapture';
import { Badge } from '@/components/ui/badge';

interface MobileOptimizedCameraProps {
  onAnalysisComplete?: (results: any) => void;
  analysisType?: 'facial' | 'skin' | 'vitals';
}

export const MobileOptimizedCamera: React.FC<MobileOptimizedCameraProps> = ({
  onAnalysisComplete,
  analysisType = 'facial'
}) => {
  const [capturedPhoto, setCapturedPhoto] = useState<{ webPath?: string; base64String?: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getAnalysisTitle = () => {
    switch (analysisType) {
      case 'facial': return 'Análise Facial para Sinais Vitais';
      case 'skin': return 'Análise Dermatológica';
      case 'vitals': return 'Medição de Sinais Vitais';
      default: return 'Análise de Imagem';
    }
  };

  const getAnalysisDescription = () => {
    switch (analysisType) {
      case 'facial': return 'Capture seu rosto para análise de sinais vitais via rPPG';
      case 'skin': return 'Fotografe a área da pele para análise dermatológica';
      case 'vitals': return 'Posicione a câmera próxima ao dedo para medição de pulso';
      default: return 'Capture uma imagem para análise médica';
    }
  };

  const handlePhotoCapture = (photo: { webPath?: string; base64String?: string }) => {
    setCapturedPhoto(photo);
  };

  const analyzePhoto = async () => {
    if (!capturedPhoto?.base64String) return;

    setIsAnalyzing(true);
    
    try {
      // Simulação de análise - seria substituído por chamada real à API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults = {
        analysisType,
        confidence: 0.85,
        findings: analysisType === 'facial' 
          ? { heartRate: 72, skinTone: 'normal', stress: 'low' }
          : analysisType === 'skin'
          ? { condition: 'normal', risk: 'low', recommendations: ['Use protetor solar'] }
          : { pulse: 68, oxygenation: '98%', rhythm: 'regular' },
        timestamp: new Date().toISOString(),
      };

      onAnalysisComplete?.(mockResults);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetCapture = () => {
    setCapturedPhoto(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <NativeCameraCapture
        title={getAnalysisTitle()}
        description={getAnalysisDescription()}
        onPhotoCapture={handlePhotoCapture}
      />

      {capturedPhoto && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Foto Capturada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {capturedPhoto.webPath && (
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={capturedPhoto.webPath}
                  alt="Captured for analysis"
                  className="w-full h-48 object-cover"
                />
                <Badge className="absolute top-2 right-2">
                  {analysisType === 'facial' ? 'Rosto' : 
                   analysisType === 'skin' ? 'Pele' : 'Sinais Vitais'}
                </Badge>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={analyzePhoto}
                disabled={isAnalyzing}
                className="flex-1 flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Analisar Imagem
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={resetCapture}
                disabled={isAnalyzing}
              >
                Nova Foto
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};