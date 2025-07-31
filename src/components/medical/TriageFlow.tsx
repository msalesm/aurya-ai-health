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
  User
} from "lucide-react";
import PreparationModal from "./PreparationModal";
import VoiceAnalysisModal from "./VoiceAnalysisModal";
import { FacialTelemetryModal } from "./FacialTelemetryModal";
import AnamnesisModal from "./AnamnesisModal";
import { ClinicalAnalysisModal } from "./ClinicalAnalysisModal";

type TriageStep = "preparation" | "facial-analysis" | "voice-analysis" | "anamnesis" | "analysis";

interface PatientData {
  fullName: string;
  birthDate: string;
  age?: number;
}

const TriageFlow = () => {
  const [currentStep, setCurrentStep] = useState<TriageStep>("preparation");
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  
  // Modal states
  const [showPreparationModal, setShowPreparationModal] = useState(false);
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
      description: "Dados do paciente e verificação de equipamentos",
      icon: <User className="h-6 w-6" />,
      status: completedSteps.has("preparation") ? "completed" : (currentStep === "preparation" ? "active" : "pending")
    },
    {
      id: "facial-analysis",
      title: "Análise Facial Completa",
      description: "rPPG para sinais vitais + detecção de estado térmico",
      icon: <Video className="h-6 w-6" />,
      status: completedSteps.has("facial-analysis") ? "completed" : (currentStep === "facial-analysis" ? "active" : "pending")
    },
    {
      id: "voice-analysis",
      title: "Análise de Voz Híbrida",
      description: "OpenAI + Google Speech + indicadores emocionais",
      icon: <Mic className="h-6 w-6" />,
      status: completedSteps.has("voice-analysis") ? "completed" : (currentStep === "voice-analysis" ? "active" : "pending")
    },
    {
      id: "anamnesis",
      title: "Anamnese Inteligente",
      description: "Perguntas estruturadas + conversa com IA (opcional)",
      icon: <Brain className="h-6 w-6" />,
      status: completedSteps.has("anamnesis") ? "completed" : (currentStep === "anamnesis" ? "active" : "pending")
    },
    {
      id: "analysis",
      title: "Análise Clínica Final",
      description: "Consolidação de dados e relatório personalizado",
      icon: <Stethoscope className="h-6 w-6" />,
      status: completedSteps.has("analysis") ? "completed" : (currentStep === "analysis" ? "active" : "pending")
    }
  ];

  const handleStartStep = (step: TriageStep) => {
    setCurrentStep(step);
    
    // Open appropriate modal based on step
    switch (step) {
      case "preparation":
        setShowPreparationModal(true);
        break;
      case "facial-analysis":
        setShowFacialModal(true);
        break;
      case "voice-analysis":
        setShowVoiceModal(true);
        break;
      case "anamnesis":
        setShowAnamnesisModal(true);
        break;
      case "analysis":
        setShowClinicalModal(true);
        break;
    }
  };

  const handlePreparationComplete = (data: PatientData) => {
    setPatientData(data);
    handleStepComplete("preparation", data);
  };

  const handleStepComplete = (stepId: string, result: any) => {
    // Mark step as completed
    setCompletedSteps(prev => new Set(prev).add(stepId));
    
    // Store results with patient data context
    setStepResults(prev => ({
      ...prev,
      [stepId === "voice-analysis" ? "voice" : 
       stepId === "facial-analysis" ? "facial" : 
       stepId === "anamnesis" ? "anamnesis" : stepId]: result,
      patientData // Include patient data in all results
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
                    
                    {status === "pending" && index === steps.findIndex(s => getStepStatus(s.id) === "active") + 1 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStartStep(step.id as TriageStep)}
                        className="w-full sm:w-auto min-h-[40px] text-xs md:text-sm"
                        disabled={step.id !== "preparation" && !patientData}
                      >
                        <Play className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Iniciar
                      </Button>
                    )}
                    
                    {step.id === "analysis" && completedSteps.has("anamnesis") && (
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
          <PreparationModal 
            isOpen={showPreparationModal}
            onClose={() => setShowPreparationModal(false)}
            onComplete={handlePreparationComplete}
          />
          
          <FacialTelemetryModal 
            isOpen={showFacialModal}
            onClose={() => setShowFacialModal(false)}
            onComplete={(result) => handleStepComplete("facial-analysis", result)}
          />
          
          <VoiceAnalysisModal 
            isOpen={showVoiceModal}
            onClose={() => setShowVoiceModal(false)}
            onComplete={(result) => handleStepComplete("voice-analysis", result)}
          />
          
          <AnamnesisModal 
            isOpen={showAnamnesisModal}
            onClose={() => setShowAnamnesisModal(false)}
            onComplete={(result) => handleStepComplete("anamnesis", result)}
            patientData={patientData}
          />

          <ClinicalAnalysisModal
            isOpen={showClinicalModal}
            onClose={() => setShowClinicalModal(false)}
            onComplete={(data) => handleStepComplete('analysis', data)}
            voiceAnalysis={stepResults.voice}
            facialAnalysis={stepResults.facial}
            anamnesisResults={stepResults.anamnesis}
            patientData={patientData}
          />
    </div>
  );
};

export default TriageFlow;