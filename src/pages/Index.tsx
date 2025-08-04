import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import TriageHeader from "@/components/medical/TriageHeader";
import VitalSignsCard from "@/components/medical/VitalSignsCard";
import TriageFlow from "@/components/medical/TriageFlow";
import AnamnesisChat from "@/components/medical/AnamnesisChat";
import DiagnosticResults from "@/components/medical/DiagnosticResults";
import HealthDataDashboard from "@/components/medical/HealthDataDashboard";
import MedicalHistory from "@/components/medical/MedicalHistory";
import AIIntegrationStatus from "@/components/medical/AIIntegrationStatus";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/medical-hero.jpg";

const Index = () => {
  const [activeTab, setActiveTab] = useState("triage");
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div 
        className="relative h-64 bg-cover bg-center mb-8"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-primary/80"></div>
        <div className="relative z-10 container mx-auto px-6 h-full flex items-center justify-between">
          <TriageHeader />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <User className="h-5 w-5" />
              <span className="text-sm">
                {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}
              </span>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center gap-2"
              aria-label="Fazer logout"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card shadow-card">
            <TabsTrigger value="triage">Triagem IA</TabsTrigger>
            <TabsTrigger value="anamnesis">Anamnese</TabsTrigger>
            <TabsTrigger value="dados">Dados Saúde</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="triage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TriageFlow />
              </div>
              <div>
                <VitalSignsCard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dados" className="space-y-6">
            <HealthDataDashboard />
          </TabsContent>


          <TabsContent value="anamnesis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnamnesisChat />
              <VitalSignsCard />
            </div>
          </TabsContent>

          <TabsContent value="historico" className="space-y-6">
            <MedicalHistory />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <DiagnosticResults />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
