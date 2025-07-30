import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Video,
  Calendar,
  Download
} from "lucide-react";

const DiagnosticResults = () => {
  const analysisResults = [
    {
      category: "Análise de Voz",
      status: "completed",
      confidence: 85,
      findings: [
        "Padrão respiratório normal",
        "Indicadores de leve ansiedade",
        "Tom de voz estável"
      ]
    },
    {
      category: "Sinais Vitais",
      status: "completed", 
      confidence: 92,
      findings: [
        "Frequência cardíaca normal",
        "Pressão arterial dentro dos parâmetros",
        "Saturação de oxigênio adequada"
      ]
    },
    {
      category: "Anamnese",
      status: "completed",
      confidence: 78,
      findings: [
        "Sintomas compatíveis com estresse",
        "Sem histórico familiar relevante",
        "Necessita acompanhamento"
      ]
    }
  ];

  const recommendation = {
    urgency: "low",
    title: "Triagem Concluída - Baixa Urgência",
    description: "Com base na análise multimodal realizada, recomendamos acompanhamento médico de rotina.",
    nextSteps: [
      "Consulta médica preventiva em 30 dias",
      "Técnicas de relaxamento para ansiedade",
      "Manter monitoramento dos sinais vitais"
    ]
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "destructive";
      case "medium": return "warning";
      case "low": return "success";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Status da Análise */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Análise Completa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysisResults.map((result, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{result.category}</h4>
                  <Badge variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completo
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span>Confiança</span>
                    <span className="font-medium">{result.confidence}%</span>
                  </div>
                  <Progress value={result.confidence} className="h-2" />
                </div>
                
                <ul className="text-xs text-muted-foreground space-y-1">
                  {result.findings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Recomendações Médicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={getUrgencyColor(recommendation.urgency) as any} className="text-sm">
                {recommendation.urgency === "low" ? "Baixa Urgência" : 
                 recommendation.urgency === "medium" ? "Média Urgência" : "Alta Urgência"}
              </Badge>
              <h3 className="text-lg font-semibold">{recommendation.title}</h3>
            </div>
            
            <p className="text-muted-foreground">{recommendation.description}</p>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Próximos Passos:</h4>
              <ul className="space-y-2">
                {recommendation.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Próximas Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-auto p-4 flex-col gap-2" variant="outline">
              <Calendar className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Agendar Consulta</div>
                <div className="text-xs text-muted-foreground">Telemedicina disponível</div>
              </div>
            </Button>
            
            <Button className="h-auto p-4 flex-col gap-2" variant="outline">
              <FileText className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Relatório Completo</div>
                <div className="text-xs text-muted-foreground">PDF detalhado</div>
              </div>
            </Button>
            
            <Button className="h-auto p-4 flex-col gap-2" variant="outline">
              <Download className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Exportar Dados</div>
                <div className="text-xs text-muted-foreground">Compartilhar com médico</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticResults;