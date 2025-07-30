import { useState, useEffect } from "react";
import { Crown, Star, Zap, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UpgradePromptProps {
  consultationsUsed?: number;
  maxFreeConsultations?: number;
  onUpgrade?: () => void;
}

const UpgradePrompt = ({ 
  consultationsUsed = 3, 
  maxFreeConsultations = 3,
  onUpgrade 
}: UpgradePromptProps) => {
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show upgrade prompt when user reaches free limit
    if (consultationsUsed >= maxFreeConsultations && !dismissed) {
      setShowModal(true);
    }
  }, [consultationsUsed, maxFreeConsultations, dismissed]);

  const handleUpgrade = () => {
    setShowModal(false);
    onUpgrade?.();
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowModal(false);
  };

  const remainingConsultations = Math.max(0, maxFreeConsultations - consultationsUsed);
  const isLimitReached = consultationsUsed >= maxFreeConsultations;

  return (
    <>
      {/* Inline Upgrade Card */}
      {consultationsUsed >= maxFreeConsultations - 1 && !dismissed && (
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {isLimitReached ? "Limite Atingido" : "Última Consulta Gratuita"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isLimitReached 
                    ? "Upgrade para Premium e continue cuidando da sua saúde"
                    : `${remainingConsultations} consulta${remainingConsultations !== 1 ? 's' : ''} restante${remainingConsultations !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowModal(true)}
              className="bg-gradient-medical text-primary-foreground"
            >
              <Crown className="h-4 w-4 mr-1" />
              Upgrade
            </Button>
          </div>
        </Card>
      )}

      {/* Upgrade Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                Upgrade para Premium
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleDismiss}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Usage Stats */}
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{consultationsUsed}/{maxFreeConsultations}</div>
              <div className="text-sm text-muted-foreground">Consultas gratuitas utilizadas</div>
            </div>

            {/* Premium Benefits */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                Benefícios Premium
              </h3>
              
              <div className="grid gap-2">
                {[
                  "Consultas IA ilimitadas",
                  "Análise multimodal completa",
                  "Relatórios detalhados PDF",
                  "Histórico médico completo",
                  "Telemedicina com médicos",
                  "Suporte prioritário 24/7"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 bg-success rounded-full" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-2xl font-bold text-primary">R$ 29</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                  <Badge variant="secondary" className="ml-2 bg-success/10 text-success">
                    -52% OFF
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground line-through">
                  De R$ 59/mês
                </div>
              </div>
            </Card>

            {/* CTA Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={handleUpgrade}
                className="w-full bg-gradient-medical text-primary-foreground"
                size="lg"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Agora
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDismiss}
                className="w-full"
                size="sm"
              >
                Continuar Gratuito
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="text-center text-xs text-muted-foreground">
              🔒 Pagamento seguro • 📞 Cancele quando quiser • ⭐ 4.9/5 estrelas
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpgradePrompt;