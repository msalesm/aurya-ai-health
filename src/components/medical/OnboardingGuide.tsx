import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Mic, Video, Brain, ArrowRight, Play } from "lucide-react";

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onStartStep: (stepId: string) => void;
  currentStep: string;
}

const stepGuides = {
  "voice-analysis": {
    title: "Análise de Voz Inteligente",
    description: "Nossa IA analisará padrões na sua voz para identificar indicadores de saúde",
    icon: <Mic className="h-8 w-8 text-primary" />,
    instructions: [
      "Encontre um ambiente silencioso",
      "Fale naturalmente sobre como está se sentindo",
      "A gravação dura no máximo 60 segundos",
      "Nossa IA detecta padrões respiratórios e emocionais"
    ],
    preparation: "Respire fundo e relaxe. Você pode falar sobre qualquer sintoma ou como está se sentindo hoje.",
    tips: "💡 Dica: Fale de forma natural, como se conversasse com um amigo"
  },
  "visual-assessment": {
    title: "Análise Facial Avançada",
    description: "Tecnologia de visão computacional detecta sinais vitais através da sua face",
    icon: <Video className="h-8 w-8 text-primary" />,
    instructions: [
      "Posicione-se bem à frente da câmera",
      "Mantenha boa iluminação no rosto",
      "Permaneça relativamente imóvel",
      "O sistema detecta batimentos cardíacos e níveis de estresse"
    ],
    preparation: "Certifique-se de que sua face está bem visível e iluminada. Remova óculos se possível.",
    tips: "💡 Dica: Mantenha-se relaxado e olhe diretamente para a câmera"
  },
  "anamnesis": {
    title: "Anamnese com IA",
    description: "Conversa inteligente guiada por IA para compreender seu histórico médico",
    icon: <Brain className="h-8 w-8 text-primary" />,
    instructions: [
      "Responda às perguntas com sinceridade",
      "Seja específico sobre sintomas e datas",
      "A IA adapta as perguntas conforme suas respostas",
      "Não se preocupe se não souber alguma informação"
    ],
    preparation: "Pense em sintomas recentes, medicamentos que toma e seu histórico familiar de saúde.",
    tips: "💡 Dica: Quanto mais detalhes você fornecer, mais precisa será a análise"
  }
};

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  isOpen,
  onClose,
  onStartStep,
  currentStep
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const guide = stepGuides[currentStep as keyof typeof stepGuides];
  
  if (!guide) return null;

  const handleStart = () => {
    onStartStep(currentStep);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {guide.icon}
            <div>
              <div>{guide.title}</div>
              <div className="text-sm text-muted-foreground font-normal">
                {guide.description}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {currentPage === 0 ? (
            // Página de instruções
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Como funciona:
                  </h3>
                  <ul className="space-y-2">
                    {guide.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-sm">{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Preparação:</strong> {guide.preparation}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">{guide.tips}</p>
                <Button onClick={() => setCurrentPage(1)} size="lg">
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            // Página de confirmação
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Pronto para começar!</h3>
                <p className="text-muted-foreground">
                  Você está preparado para a {guide.title.toLowerCase()}. 
                  O teste começará assim que você clicar no botão abaixo.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  ⚠️ <strong>Importante:</strong> Mantenha-se relaxado durante todo o processo. 
                  Os resultados são mais precisos quando você está calmo e natural.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentPage(0)} className="flex-1">
                  Revisar Instruções
                </Button>
                <Button onClick={handleStart} size="lg" className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Teste
                </Button>
              </div>
            </div>
          )}

          <Progress value={currentPage === 0 ? 50 : 100} className="w-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
};