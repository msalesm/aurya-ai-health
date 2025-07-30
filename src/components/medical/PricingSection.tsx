import { Check, Crown, Users, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PricingSection = () => {
  return (
    <div className="py-12 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Planos para sua Saúde
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha o plano ideal para cuidar da sua saúde e da sua família
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Gratuito */}
          <Card className="p-6 relative">
            <div className="text-center mb-6">
              <Zap className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Gratuito</h3>
              <div className="text-3xl font-bold">R$ 0</div>
              <div className="text-muted-foreground">3 consultas/mês</div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">3 consultas IA por mês</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Análise básica de sintomas</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Relatório simples</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full">
              Começar Grátis
            </Button>
          </Card>

          {/* Premium */}
          <Card className="p-6 relative border-primary shadow-medical">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-medical">
              Mais Popular
            </Badge>
            
            <div className="text-center mb-6">
              <Crown className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Premium</h3>
              <div className="text-3xl font-bold text-primary">R$ 29</div>
              <div className="text-muted-foreground">por mês</div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Consultas IA ilimitadas</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Análise completa multimodal</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Relatórios detalhados PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Histórico completo</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Telemedicina com médicos</span>
              </div>
            </div>
            
            <Button className="w-full bg-gradient-medical">
              Upgrade para Premium
            </Button>
          </Card>

          {/* Família */}
          <Card className="p-6 relative">
            <div className="text-center mb-6">
              <Users className="h-8 w-8 mx-auto mb-3 text-secondary" />
              <h3 className="text-xl font-semibold mb-2">Família</h3>
              <div className="text-3xl font-bold text-secondary">R$ 49</div>
              <div className="text-muted-foreground">até 4 pessoas</div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Tudo do Premium</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">4 perfis familiares</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Dashboard familiar</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Relatórios consolidados</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Prioridade no atendimento</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
              Plano Família
            </Button>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            💳 Primeira consulta sempre gratuita • 🔒 Cancele quando quiser • 📞 Suporte 24/7
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;