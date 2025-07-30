import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Mic, 
  Video, 
  Cloud, 
  Settings,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";

const AIIntegrationStatus = () => {
  const integrations = [
    {
      name: "OpenAI GPT-4o",
      description: "Anamnese e análise clínica",
      status: "ready",
      icon: <Brain className="h-5 w-5" />,
      features: ["Conversa natural", "Raciocínio médico", "Relatórios"]
    },
    {
      name: "Hugging Face Voice AI",
      description: "Análise de padrões de voz",
      status: "pending",
      icon: <Mic className="h-5 w-5" />,
      features: ["Detecção emocional", "Padrões respiratórios", "Clareza da fala"]
    },
    {
      name: "Computer Vision",
      description: "Análise facial e visual",
      status: "pending",
      icon: <Video className="h-5 w-5" />,
      features: ["Detecção de palidez", "Expressões faciais", "Sinais vitais"]
    },
    {
      name: "Google Cloud Healthcare",
      description: "Dados de sensores e historico",
      status: "ready",
      icon: <Cloud className="h-5 w-5" />,
      features: ["Google Fit", "Sinais vitais", "Histórico médico"]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ready":
        return "default";
      case "pending":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ready":
        return "Conectado";
      case "pending":
        return "Configuração Pendente";
      case "error":
        return "Erro";
      default:
        return "Desconhecido";
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Status das Integrações IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {integrations.map((integration, index) => (
            <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {integration.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold">{integration.name}</h4>
                  <Badge variant={getStatusVariant(integration.status) as any}>
                    {getStatusIcon(integration.status)}
                    <span className="ml-1">{getStatusText(integration.status)}</span>
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {integration.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {integration.features.map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                
                {integration.status === "pending" && (
                  <Button size="sm" variant="outline">
                    Configurar Integração
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Próximas Implementações</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Integração com APIs de laboratórios</li>
            <li>• Análise de imagens médicas (raio-X, exames)</li>
            <li>• Conexão com prontuários eletrônicos</li>
            <li>• Telemedicina integrada</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIIntegrationStatus;