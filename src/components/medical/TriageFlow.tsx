import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Video, 
  Brain, 
  ClipboardList, 
  Stethoscope,
  ArrowRight,
  Play,
  Pause
} from "lucide-react";
import VoiceAnalysisModal from "./VoiceAnalysisModal";
import { FacialTelemetryModal } from "./FacialTelemetryModal";
import AnamnesisModal from "./AnamnesisModal";
import { ClinicalAnalysisModal } from "./ClinicalAnalysisModal";

type TriageStep = "preparation" | "facial-analysis" | "voice-analysis" | "anamnesis" | "clinical-analysis";

const TriageFlow = () => {
  const [currentStep, setCurrentStep] = useState<TriageStep>("preparation");
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set(["preparation"]));
  
  // Modal states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showFacialModal, setShowFacialModal] = useState(false);
  const [showAnamnesisModal, setShowAnamnesisModal] = useState(false);
  const [showClinicalModal, setShowClinicalModal] = useState(false);
  
  // Analysis results storage
  const [stepResults, setStepResults] = useState<any>({});

  const steps = [
    {
      id: "preparation",
      title: "Preparação",
      description: "Verificação de equipamentos e orientações iniciais",
      icon: <ClipboardList className="h-6 w-6" />,
      status: "completed"
    },
    {
      id: "facial-analysis",
      title: "Análise Facial Completa",
      description: "Telemetria facial, rPPG e análise biométrica",
      icon: <Video className="h-6 w-6" />,
      status: currentStep === "facial-analysis" ? "active" : "pending"
    },
    {
      id: "voice-analysis",
      title: "Análise de Voz",
      description: "Padrões vocais, emocionais e respiratórios",
      icon: <Mic className="h-6 w-6" />,
      status: "pending"
    },
    {
      id: "anamnesis",
      title: "Anamnese Inteligente",
      description: "Conversa estruturada com IA sobre sintomas",
      icon: <Brain className="h-6 w-6" />,
      status: "pending"
    },
    {
      id: "clinical-analysis",
      title: "Análise Clínica Final",
      description: "Relatório consolidado com snapshot de sinais vitais",
      icon: <Stethoscope className="h-6 w-6" />,
      status: "pending"
    }
  ];

  const handleStartStep = (step: TriageStep) => {
    setCurrentStep(step);
    
    // Open appropriate modal based on step
    switch (step) {
      case "facial-analysis":
        setShowFacialModal(true);
        break;
      case "voice-analysis":
        setShowVoiceModal(true);
        break;
      case "anamnesis":
        setShowAnamnesisModal(true);
        break;
      case "clinical-analysis":
        setShowClinicalModal(true);
        break;
    }
  };

  const handleStepComplete = (stepId: string, result: any) => {
    // Mark step as completed
    setCompletedSteps(prev => new Set(prev).add(stepId));
    
    // Store results
    setStepResults(prev => ({
      ...prev,
      [stepId === "facial-analysis" ? "facial" : 
       stepId === "voice-analysis" ? "voice" : 
       stepId === "anamnesis" ? "anamnesis" : stepId]: result
    }));
    
    // Progress to next step
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id as TriageStep);
    }
  };

  const getStepStatus = (stepId: string) => {
    if (completedSteps.has(stepId)) return "completed";
    if (stepId === currentStep) return "active";
    return "pending";
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <Card className="shadow-card">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Stethoscope className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Fluxo de Triagem Médica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              
              return (
                <div key={step.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 md:p-4 rounded-lg border border-border">
                  {/* Cabeçalho com ícone e badge */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`
                      p-2 md:p-3 rounded-full flex items-center justify-center shrink-0
                      ${status === "completed" ? "bg-success text-success-foreground" : ""}
                      ${status === "active" ? "bg-primary text-primary-foreground" : ""}
                      ${status === "pending" ? "bg-muted text-muted-foreground" : ""}
                    `}>
                      {React.cloneElement(step.icon, { className: "h-4 w-4 md:h-6 md:w-6" })}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <h3 className="font-semibold text-sm md:text-base truncate">{step.title}</h3>
                        <Badge 
                          variant={
                            status === "completed" ? "default" : 
                            status === "active" ? "secondary" : "outline"
                          }
                          className="text-xs w-fit"
                        >
                          {status === "completed" ? "Concluído" : 
                           status === "active" ? "Ativo" : "Pendente"}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Botões de ação */}
                  <div className="flex gap-2 sm:shrink-0">
                    {status === "active" && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStartStep(step.id as TriageStep)}
                        className="w-full sm:w-auto min-h-[40px] text-xs md:text-sm"
                      >
                        <Play className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Iniciar
                      </Button>
                    )}
                    
                    {status === "pending" && index === steps.findIndex(s => s.id === currentStep) + 1 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStartStep(step.id as TriageStep)}
                        className="w-full sm:w-auto min-h-[40px] text-xs md:text-sm"
                      >
                        <Play className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Iniciar
                      </Button>
                    )}
                    
                    {step.id === "clinical-analysis" && completedSteps.size >= 4 && (
                      <Button 
                        size="sm"
                        onClick={() => handleStartStep(step.id as TriageStep)}
                        className="w-full sm:w-auto min-h-[40px] text-xs md:text-sm"
                      >
                        <Stethoscope className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Gerar Relatório
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
          
          {/* Modals */}
          <VoiceAnalysisModal 
            isOpen={showVoiceModal}
            onClose={() => setShowVoiceModal(false)}
            onComplete={(result) => handleStepComplete("voice-analysis", result)}
          />
          
          <FacialTelemetryModal 
            isOpen={showFacialModal}
            onClose={() => setShowFacialModal(false)}
            onComplete={(result) => handleStepComplete("facial-analysis", result)}
          />
          
          <AnamnesisModal 
            isOpen={showAnamnesisModal}
            onClose={() => setShowAnamnesisModal(false)}
            onComplete={(result) => handleStepComplete("anamnesis", result)}
          />

          <ClinicalAnalysisModal
            isOpen={showClinicalModal}
            onClose={() => setShowClinicalModal(false)}
            voiceAnalysis={stepResults.voice}
            facialAnalysis={stepResults.facial}
            anamnesisResults={stepResults.anamnesis}
          />
    </div>
  );
};

export default TriageFlow;