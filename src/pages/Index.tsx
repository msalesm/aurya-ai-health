import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProgressStepper } from "@/components/ui/progress-stepper";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { MobileNav, MobileNavItem } from "@/components/ui/mobile-nav";
import { MobileTabsDemo } from "@/components/mobile/MobileTabsDemo";
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
import { LogIn, LogOut, User, Activity, Heart, BarChart3, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const [activeTab, setActiveTab] = useState("triage");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const steps = [
    { id: 'preparation', title: 'Preparação', status: 'completed' as const },
    { id: 'triage', title: 'Triagem', status: 'current' as const },
    { id: 'analysis', title: 'Análise', status: 'pending' as const },
    { id: 'results', title: 'Resultados', status: 'pending' as const }
  ];

  const breadcrumbItems = [
    { label: 'Triia', current: false },
    { label: getTabLabel(activeTab), current: true }
  ];

  function getTabLabel(tab: string) {
    const labels = {
      triage: 'Triagem IA',
      anamnesis: 'Anamnese',
      historico: 'Histórico',
      dados: 'Dados Saúde',
      results: 'Resultados'
    };
    return labels[tab as keyof typeof labels] || 'Triagem IA';
  }

  const navItems = [
    { id: 'triage', label: 'Triagem IA', icon: Activity },
    { id: 'anamnesis', label: 'Anamnese', icon: Heart },
    { id: 'historico', label: 'Histórico', icon: Clock },
    { id: 'dados', label: 'Dados Saúde', icon: BarChart3 },
    { id: 'results', label: 'Resultados', icon: FileText }
  ];

  return (
    <div className={cn("min-h-screen bg-gradient-subtle transition-opacity duration-500", isLoaded ? "opacity-100" : "opacity-0")}>
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md"
      >
        Pular para conteúdo principal
      </a>

      {/* Hero Section */}
      <div 
        className="relative h-64 lg:h-80 bg-cover bg-center mb-8"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-primary/80"></div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full">
          {/* Mobile Navigation */}
          <div className="flex items-center justify-between py-4 md:hidden">
            <MobileNav>
              {navItems.map((item) => (
                <MobileNavItem
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  active={activeTab === item.id}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </MobileNavItem>
              ))}
            </MobileNav>
            
            <div className="flex items-center gap-3">
              {user ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => signOut()}
                  className="text-white hover:bg-white/20"
                  aria-label="Fazer logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAuthModal(true)}
                  className="text-white hover:bg-white/20"
                  aria-label="Fazer login"
                >
                  <LogIn className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between h-full">
            <TriageHeader />
            
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden lg:flex items-center gap-2 text-white">
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
      </div>

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-4 sm:px-6 pb-12 pb-safe-bottom">
        {/* Progress Stepper */}
        <div className="animate-fade-in">
          <ProgressStepper steps={steps} currentStepId="triage" className="mb-6" />
        </div>

        {/* Breadcrumb Navigation */}
        <div className="animate-slide-up mb-6">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop Navigation */}
          <TabsList className="hidden md:grid w-full grid-cols-5 bg-card shadow-card animate-scale-in" role="tablist">
            {navItems.map((item) => (
              <TabsTrigger 
                key={item.id}
                value={item.id} 
                aria-label={`${item.label} - ${item.id === 'triage' ? 'Triagem com Inteligência Artificial' : item.label}`}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <item.icon className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">{item.label}</span>
                <span className="lg:hidden">{item.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="triage" className="space-y-6 animate-fade-in" role="tabpanel" tabIndex={0}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2">
                <TriageFlow />
              </div>
              <div className="order-first lg:order-last">
                <VitalSignsCard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="anamnesis" className="space-y-6 animate-fade-in" role="tabpanel" tabIndex={0}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <AnamnesisChat />
              <VitalSignsCard />
            </div>
          </TabsContent>

          <TabsContent value="historico" className="space-y-6 animate-fade-in" role="tabpanel" tabIndex={0}>
            <MedicalHistory />
          </TabsContent>

          <TabsContent value="dados" className="space-y-6 animate-fade-in" role="tabpanel" tabIndex={0}>
            <HealthDataDashboard />
            <div className="mt-6">
              <MobileTabsDemo />
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6 animate-fade-in" role="tabpanel" tabIndex={0}>
            <DiagnosticResults />
          </TabsContent>
        </Tabs>
      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default Index;