import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TriageHeader from "@/components/medical/TriageHeader";
import VitalSignsCard from "@/components/medical/VitalSignsCard";
import TriageFlow from "@/components/medical/TriageFlow";
import AnamnesisChat from "@/components/medical/AnamnesisChat";
import DiagnosticResults from "@/components/medical/DiagnosticResults";
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
            <TabsTrigger value="triage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Triagem
            </TabsTrigger>
            <TabsTrigger value="vitals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Sinais Vitais
            </TabsTrigger>
            <TabsTrigger value="anamnesis" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Anamnese
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Resultados
            </TabsTrigger>
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

          <TabsContent value="vitals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <VitalSignsCard 
                heartRate={75}
                bloodPressure="118/76"
                temperature={36.7}
                oxygenSaturation={99}
              />
              <VitalSignsCard 
                heartRate={68}
                bloodPressure="115/72"
                temperature={36.4}
                oxygenSaturation={98}
              />
              <VitalSignsCard 
                heartRate={82}
                bloodPressure="125/80"
                temperature={36.8}
                oxygenSaturation={97}
              />
            </div>
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
