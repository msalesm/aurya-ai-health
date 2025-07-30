import { useState } from "react";
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

type TriageStep = "preparation" | "voice-analysis" | "visual-assessment" | "anamnesis" | "analysis" | "results";

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
      id: "voice-analysis",
      title: "Análise de Voz Híbrida",
      description: "OpenAI Whisper + Google Speech + Análise emocional",
      icon: <Mic className="h-6 w-6" />,
      status: currentStep === "voice-analysis" ? "active" : "pending"
    },
    {
      id: "visual-assessment",
      title: "Telemetria Facial Google",
      description: "Google Vision API + detecção PPG de batimentos",
      icon: <Video className="h-6 w-6" />,
      status: "pending"
    },
    {
      id: "anamnesis",
      title: "Anamnese com IA",
      description: "Conversa direcionada sobre sintomas e histórico",
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
    setCurrentStep(step);
    
    // Open appropriate modal based on step
    switch (step) {
      case "voice-analysis":
        setShowVoiceModal(true);
        break;
      case "visual-assessment":
        setShowFacialModal(true);
        break;
      case "anamnesis":
        setShowAnamnesisModal(true);
        break;
      case "analysis":
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
      [stepId === "voice-analysis" ? "voice" : 
       stepId === "visual-assessment" ? "facial" : 
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
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Fluxo de Triagem Médica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              
              return (
                <div key={step.id} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                  <div className={`
                    p-3 rounded-full flex items-center justify-center
                    ${status === "completed" ? "bg-success text-success-foreground" : ""}
                    ${status === "active" ? "bg-primary text-primary-foreground" : ""}
                    ${status === "pending" ? "bg-muted text-muted-foreground" : ""}
                  `}>
                    {step.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{step.title}</h3>
                      <Badge variant={
                        status === "completed" ? "default" : 
                        status === "active" ? "secondary" : "outline"
                      }>
                        {status === "completed" ? "Concluído" : 
                         status === "active" ? "Em Andamento" : "Pendente"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  
                  {status === "active" && (
                    <Button 
                      size="sm" 
                      onClick={() => handleStartStep(step.id as TriageStep)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar
                    </Button>
                  )}
                  
                   {status === "pending" && index === steps.findIndex(s => s.id === currentStep) + 1 && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStartStep(step.id as TriageStep)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar
                    </Button>
                  )}
                  
                  {step.id === "analysis" && completedSteps.size >= 4 && (
                    <Button 
                      size="sm"
                      onClick={() => handleStartStep(step.id as TriageStep)}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Ver Análise
                    </Button>
                  )}
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
    </div>
  );
};

export default TriageFlow;