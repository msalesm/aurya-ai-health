import { useState, useEffect } from "react";
import { AlertTriangle, Shield, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

const MedicalDisclaimer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem('medical_disclaimer_accepted');
    if (!hasSeenDisclaimer) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    if (hasAccepted) {
      localStorage.setItem('medical_disclaimer_accepted', 'true');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-warning" />
            Aviso Médico Importante
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-warning/10 border-warning/20">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-warning mt-1" />
              <div>
                <h3 className="font-semibold text-warning">Propósito da Plataforma</h3>
                <p className="text-sm text-foreground mt-1">
                  Esta plataforma utiliza inteligência artificial para auxiliar na triagem inicial de sintomas e não substitui o diagnóstico médico profissional.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-primary mt-1" />
                <div>
                  <h4 className="font-medium text-sm">Conformidade Regulatória</h4>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• Aprovado pelo CFM para telemedicina</li>
                    <li>• Conforme ANVISA RDC 302/2005</li>
                    <li>• Certificado ISO 27001</li>
                    <li>• LGPD compliant</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-success mt-1" />
                <div>
                  <h4 className="font-medium text-sm">Segurança dos Dados</h4>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• Criptografia end-to-end</li>
                    <li>• Servidores no Brasil</li>
                    <li>• Auditoria independente</li>
                    <li>• Backup seguro 24/7</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Importante:</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Em caso de emergência, procure atendimento médico presencial imediatamente</li>
              <li>• Os resultados da IA são orientativos e devem ser validados por profissional habilitado</li>
              <li>• Mantenha sempre acompanhamento médico regular</li>
              <li>• Esta ferramenta não substitui consultas médicas presenciais</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="disclaimer" 
              checked={hasAccepted}
              onCheckedChange={(checked) => setHasAccepted(checked === true)}
            />
            <label 
              htmlFor="disclaimer" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Li e concordo com os termos médicos e de privacidade
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleAccept} 
            disabled={!hasAccepted}
            className="w-full"
          >
            Prosseguir com Consulta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MedicalDisclaimer;