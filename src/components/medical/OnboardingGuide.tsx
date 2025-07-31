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
  "preparation": {
    title: "Bem-vindo ao Sistema de Triagem Inteligente",
    subtitle: "Sua avaliação médica personalizada em 5-10 minutos",
    description: "Este sistema utiliza inteligência artificial para realizar uma triagem médica completa e segura.",
    icon: <CheckCircle className="h-8 w-8" />,
    color: "text-success",
    bgColor: "bg-success/10",
    steps: [
      {
        icon: "📱",
        title: "Ambiente Adequado",
        description: "Local bem iluminado e silencioso para melhor precisão"
      },
      {
        icon: "🔒",
        title: "Privacidade Total",
        description: "Seus dados são processados localmente e de forma segura"
      },
      {
        icon: "⏱️",
        title: "Processo Rápido",
        description: "5-10 minutos para avaliação completa e resultado"
      },
      {
        icon: "🩺",
        title: "Tecnologia Médica",
        description: "IA treinada com dados médicos validados"
      }
    ],
    tips: [
      "Mantenha celular carregado durante todo o processo",
      "Conceda permissões de câmera e microfone quando solicitado",
      "Responda com honestidade para melhores resultados",
      "Você pode pausar a qualquer momento"
    ],
    nextAction: "Iniciar Primeira Análise"
  },
  "voice-analysis": {
    title: "Análise de Voz Inteligente",
    subtitle: "Detecção de padrões respiratórios e vocais",
    description: "Nossa IA analisará sua voz para identificar indicadores de saúde respiratória e emocional.",
    icon: <Mic className="h-8 w-8" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    steps: [
      {
        icon: "🎤",
        title: "Posição do Microfone",
        description: "20-30cm de distância da boca para melhor captação"
      },
      {
        icon: "🗣️",
        title: "Fala Natural",
        description: "Fale normalmente, sem forçar ou alterar sua voz"
      },
      {
        icon: "📊",
        title: "Análise Automática",
        description: "IA detecta respiração, ritmo e padrões emocionais"
      }
    ],
    tips: [
      "Gravação dura apenas 30 segundos",
      "Fale de forma natural e relaxada",
      "Ambiente silencioso melhora a precisão"
    ],
    nextAction: "Iniciar Gravação"
  },
  "visual-assessment": {
    title: "Análise Facial Avançada", 
    subtitle: "Detecção de sinais vitais por câmera",
    description: "Tecnologia de visão computacional para medir frequência cardíaca e outros sinais vitais.",
    icon: <Video className="h-8 w-8" />,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    steps: [
      {
        icon: "📹",
        title: "Posicionamento",
        description: "Rosto centralizado, distância de 50cm da câmera"
      },
      {
        icon: "💡",
        title: "Iluminação Frontal",
        description: "Boa luz no rosto, evite contraluz"
      },
      {
        icon: "❤️",
        title: "Sinais Vitais",
        description: "Detecção de frequência cardíaca via mudanças sutis na pele"
      }
    ],
    tips: [
      "Mantenha-se imóvel durante 30 segundos",
      "Olhe diretamente para a câmera",
      "Expressão neutra e relaxada"
    ],
    nextAction: "Iniciar Análise Facial"
  },
  "anamnesis": {
    title: "Anamnese com IA",
    subtitle: "Conversa médica inteligente",
    description: "Chat com IA médica que fará perguntas personalizadas baseadas em suas respostas anteriores.",
    icon: <Brain className="h-8 w-8" />,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    steps: [
      {
        icon: "💬",
        title: "Conversa Natural",
        description: "Responda como se estivesse falando com um médico"
      },
      {
        icon: "📝",
        title: "Detalhes Importantes",
        description: "Mencione sintomas, duração e medicamentos"
      },
      {
        icon: "🧠",
        title: "IA Adaptativa",
        description: "Perguntas inteligentes baseadas nas suas respostas"
      }
    ],
    tips: [
      "Seja específico sobre sintomas",
      "Mencione quando começaram os sintomas",
      "Liste medicamentos em uso"
    ],
    nextAction: "Iniciar Conversa"
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
            <div className={`p-2 rounded-full ${guide.bgColor}`}>
              <div className={guide.color}>{guide.icon}</div>
            </div>
            <div>
              <div>{guide.title}</div>
              <div className="text-sm text-muted-foreground font-normal">
                {guide.subtitle}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {currentPage === 0 ? (
            // Página de instruções
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {guide.description}
              </p>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    Passos do processo:
                  </h3>
                  <div className="grid gap-3">
                    {guide.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="text-xl">{step.icon}</div>
                        <div>
                          <div className="font-medium text-sm">{step.title}</div>
                          <div className="text-xs text-muted-foreground">{step.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-2">💡 Dicas importantes:</h4>
                <ul className="space-y-1">
                  {guide.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-blue-600 dark:text-blue-400">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-center">
                <Button onClick={() => setCurrentPage(1)} size="lg" className="w-full">
                  Entendi, continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            // Página de confirmação
            <div className="text-center space-y-6">
              <div className={`w-20 h-20 rounded-full ${guide.bgColor} flex items-center justify-center mx-auto`}>
                <div className={guide.color}>{guide.icon}</div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Pronto para começar!</h3>
                <p className="text-muted-foreground">
                  Você está preparado para a {guide.title.toLowerCase()}. 
                  O processo começará assim que você clicar no botão abaixo.
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
                  {guide.nextAction}
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