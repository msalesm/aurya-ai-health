import { useState, useEffect } from "react";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current?: boolean;
}

interface ProgressTrackerProps {
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

const ProgressTracker = ({ currentStep = 1, onStepChange }: ProgressTrackerProps) => {
  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: "symptoms",
      title: "Sintomas Iniciais",
      description: "Descreva seus sintomas principais",
      completed: currentStep > 1,
      current: currentStep === 1
    },
    {
      id: "anamnesis",
      title: "Anamnese Detalhada",
      description: "Conversa com IA médica",
      completed: currentStep > 2,
      current: currentStep === 2
    },
    {
      id: "analysis",
      title: "Análise Multimodal",
      description: "Análise de voz e facial",
      completed: currentStep > 3,
      current: currentStep === 3
    },
    {
      id: "vitals",
      title: "Sinais Vitais",
      description: "Dados de saúde complementares",
      completed: currentStep > 4,
      current: currentStep === 4
    },
    {
      id: "results",
      title: "Resultados",
      description: "Diagnóstico e recomendações",
      completed: currentStep > 5,
      current: currentStep === 5
    }
  ]);

  const [progressPercentage, setProgressPercentage] = useState(0);

  useEffect(() => {
    setSteps(prevSteps => 
      prevSteps.map((step, index) => ({
        ...step,
        completed: currentStep > index + 1,
        current: currentStep === index + 1
      }))
    );

    setProgressPercentage((currentStep / steps.length) * 100);
  }, [currentStep, steps.length]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Progresso da Consulta</h3>
          <p className="text-sm text-muted-foreground">
            Etapa {currentStep} de {steps.length}
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {Math.round(progressPercentage)}% Completo
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              step.current 
                ? "bg-primary/5 border-primary/20" 
                : step.completed 
                ? "bg-success/5 border-success/20" 
                : "bg-muted/30 border-border"
            }`}
          >
            {/* Step Icon */}
            <div className="flex-shrink-0">
              {step.completed ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : step.current ? (
                <div className="h-5 w-5 rounded-full bg-primary border-2 border-primary animate-pulse" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-grow">
              <div className={`font-medium text-sm ${
                step.current ? "text-primary" : 
                step.completed ? "text-success" : 
                "text-muted-foreground"
              }`}>
                {step.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {step.description}
              </div>
            </div>

            {/* Next Arrow */}
            {step.current && index < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-primary animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Details */}
      {currentStep <= steps.length && (
        <div className="mt-4 p-3 bg-gradient-medical/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Circle className="h-3 w-3 fill-primary" />
            Etapa Atual: {steps[currentStep - 1]?.title}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {steps[currentStep - 1]?.description}
          </p>
        </div>
      )}
    </Card>
  );
};

export default ProgressTracker;