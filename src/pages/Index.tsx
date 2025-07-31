import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TriageHeader from "@/components/medical/TriageHeader";
import VitalSignsCard from "@/components/medical/VitalSignsCard";
import TriageFlow from "@/components/medical/TriageFlow";
import AnamnesisChat from "@/components/medical/AnamnesisChat";
import DiagnosticResults from "@/components/medical/DiagnosticResults";
import HealthDataDashboard from "@/components/medical/HealthDataDashboard";
import heroImage from "@/assets/medical-hero.jpg";

const Index = () => {
  const [activeTab, setActiveTab] = useState("triage");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div 
        className="relative h-64 bg-cover bg-center mb-8"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-primary/80"></div>
        <div className="relative z-10 container mx-auto px-6 h-full flex items-center">
          <TriageHeader />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card shadow-card">
            <TabsTrigger value="triage">Triagem IA</TabsTrigger>
            <TabsTrigger value="anamnesis">Anamnese</TabsTrigger>
            <TabsTrigger value="dados">Dados Saúde</TabsTrigger>
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

          <TabsContent value="results" className="space-y-6">
            <DiagnosticResults />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
