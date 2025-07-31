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
import { OnboardingGuide } from "./OnboardingGuide";
import { StepSuccess } from "./StepSuccess";
import { useToast } from "@/hooks/use-toast";

type TriageStep = "preparation" | "voice-analysis" | "visual-assessment" | "anamnesis" | "analysis" | "results";

const TriageFlow = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<TriageStep>("preparation");
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set(["preparation"]));
  
  // Modal states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showFacialModal, setShowFacialModal] = useState(false);
  const [showAnamnesisModal, setShowAnamnesisModal] = useState(false);
  const [showClinicalModal, setShowClinicalModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successStepTitle, setSuccessStepTitle] = useState("");
  
  // Analysis results storage
  const [stepResults, setStepResults] = useState<any>({});
  const [currentVitalSigns, setCurrentVitalSigns] = useState<any>(null);

  const steps = [
    {
      id: "preparation",
      title: "Preparação",
      description: "Verificação de equipamentos e orientações iniciais",
      icon: <ClipboardList className="h-6 w-6" />,
      status: "completed"
    },
    {
      id: "voice-analysis",
      title: "Análise de Voz Inteligente",
      description: "Análise avançada de padrões vocais e respiratórios",
      icon: <Mic className="h-6 w-6" />,
      status: currentStep === "voice-analysis" ? "active" : "pending"
    },
    {
      id: "visual-assessment",
      title: "Análise Facial Avançada",
      description: "Detecção de sinais vitais através de visão computacional",
      icon: <Video className="h-6 w-6" />,
      status: "pending"
    },
    {
      id: "anamnesis",
      title: "Anamnese com IA",
      description: "Conversa inteligente sobre sintomas e histórico médico",
      icon: <Brain className="h-6 w-6" />,
      status: "pending"
    },
    {
      id: "analysis",
      title: "Análise Clínica",
      description: "Processamento dos dados e inferência diagnóstica",
      icon: <Stethoscope className="h-6 w-6" />,
      status: "pending"
    }
  ];

  const handleStartStep = (step: TriageStep) => {
    // Show onboarding guide first for medical tests
    if (step === "voice-analysis" || step === "visual-assessment" || step === "anamnesis") {
      setOnboardingStep(step);
      setShowOnboarding(true);
      return;
    }
    
    setCurrentStep(step);
    
    // Open appropriate modal based on step
    if (step === "analysis") {
      setShowClinicalModal(true);
    }
  };

  const handleOnboardingStart = (stepId: string) => {
    setCurrentStep(stepId as TriageStep);
    
    // Open appropriate modal after onboarding
    if (stepId === "voice-analysis") {
      setShowVoiceModal(true);
    } else if (stepId === "visual-assessment") {
      setShowFacialModal(true);
    } else if (stepId === "anamnesis") {
      setShowAnamnesisModal(true);
    }
  };

  const handleStepComplete = (stepId: string, result: any) => {
    // Mark step as completed
    setCompletedSteps(prev => new Set(prev).add(stepId));
    
    // Store results
    setStepResults(prev => ({
      ...prev,
      [stepId === "voice-analysis" ? "voice" : 
       stepId === "visual-assessment" ? "facial" : 
       stepId === "anamnesis" ? "anamnesis" : stepId]: result
    }));
    
    // Se o resultado contém sinais vitais, atualizar
    if (result.vitalSigns) {
      setCurrentVitalSigns(result.vitalSigns);
    }
    
    // Show success feedback - apenas um método
    const stepName = steps.find(s => s.id === stepId)?.title || stepId;
    setSuccessStepTitle(stepName);
    setShowSuccess(true);
    
    // Não mostrar toast se o modal de sucesso já está visível
    // O feedback visual será apenas o modal animado
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
                    
                    {step.id === "analysis" && completedSteps.size >= 4 && (
                      <Button 
                        size="sm"
                        onClick={() => handleStartStep(step.id as TriageStep)}
                        className="w-full sm:w-auto min-h-[40px] text-xs md:text-sm"
                      >
                        <Brain className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Ver Análise
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
          <OnboardingGuide
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            onStartStep={handleOnboardingStart}
            currentStep={onboardingStep}
          />

          <VoiceAnalysisModal 
            isOpen={showVoiceModal}
            onClose={() => setShowVoiceModal(false)}
            onComplete={(result) => handleStepComplete("voice-analysis", result)}
          />
          
          <FacialTelemetryModal 
            isOpen={showFacialModal}
            onClose={() => setShowFacialModal(false)}
            onComplete={(result) => handleStepComplete("visual-assessment", result)}
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

          <StepSuccess
            stepTitle={successStepTitle}
            isVisible={showSuccess}
            onComplete={() => {
              setShowSuccess(false);
              // Não avançar automaticamente - deixar o usuário escolher
              // Apenas dar feedback de conclusão
            }}
          />
    </div>
  );
};

export default TriageFlow;