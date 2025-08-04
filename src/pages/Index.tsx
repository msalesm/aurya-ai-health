import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import TriageHeader from "@/components/medical/TriageHeader";
import VitalSignsCard from "@/components/medical/VitalSignsCard";
import TriageFlow from "@/components/medical/TriageFlow";
import AnamnesisChat from "@/components/medical/AnamnesisChat";
import DiagnosticResults from "@/components/medical/DiagnosticResults";
import HealthDataDashboard from "@/components/medical/HealthDataDashboard";
import MedicalHistory from "@/components/medical/MedicalHistory";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/components/auth/AuthContext";
import heroImage from "@/assets/medical-hero.jpg";
import { LogIn, LogOut, User } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("triage");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, signOut } = useAuth();

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
          
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-white">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => signOut()}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  aria-label="Fazer logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAuthModal(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                aria-label="Fazer login"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card shadow-card" role="tablist">
            <TabsTrigger value="triage" aria-label="Triagem com Inteligência Artificial">Triagem IA</TabsTrigger>
            <TabsTrigger value="anamnesis" aria-label="Anamnese médica">Anamnese</TabsTrigger>
            <TabsTrigger value="historico" aria-label="Histórico de consultas">Histórico</TabsTrigger>
            <TabsTrigger value="dados" aria-label="Dados de saúde">Dados Saúde</TabsTrigger>
            <TabsTrigger value="results" aria-label="Resultados diagnósticos">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="triage" className="space-y-6" role="tabpanel">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TriageFlow />
              </div>
              <div>
                <VitalSignsCard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="anamnesis" className="space-y-6" role="tabpanel">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnamnesisChat />
              <VitalSignsCard />
            </div>
          </TabsContent>

          <TabsContent value="historico" className="space-y-6" role="tabpanel">
            <MedicalHistory />
          </TabsContent>

          <TabsContent value="dados" className="space-y-6" role="tabpanel">
            <HealthDataDashboard />
          </TabsContent>

          <TabsContent value="results" className="space-y-6" role="tabpanel">
            <DiagnosticResults />
          </TabsContent>
        </Tabs>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default Index;