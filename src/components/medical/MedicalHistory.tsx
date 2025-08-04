import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, ChevronDown, ChevronUp, Clock, AlertTriangle, Stethoscope, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConsultationHistory {
  id: string;
  created_at: string;
  chief_complaint: string;
  symptoms: string[];
  urgency_level: string;
  ai_diagnosis: string;
  status: string;
  assessment_score: number;
}

const MedicalHistory = () => {
  const [consultations, setConsultations] = useState<ConsultationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchMedicalHistory();
  }, []);

  const fetchMedicalHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Faça login para ver seu histórico médico.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.rpc('get_user_consultation_history', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        toast({
          title: "Erro ao carregar histórico",
          description: "Não foi possível carregar suas consultas anteriores.",
          variant: "destructive",
        });
        return;
      }

      setConsultations(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'alta':
      case 'emergência':
        return 'destructive';
      case 'média':
      case 'moderada':
        return 'default';
      case 'baixa':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'concluída':
      case 'finalizada':
        return 'default';
      case 'em_andamento':
      case 'ativa':
        return 'secondary';
      case 'cancelada':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3 mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <Stethoscope className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma consulta encontrada</h3>
            <p className="text-muted-foreground mb-6">
              Você ainda não realizou nenhuma consulta. Comece uma nova triagem para criar seu histórico médico.
            </p>
            <Button onClick={() => window.location.reload()}>
              Atualizar página
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Histórico Médico</h1>
        <p className="text-muted-foreground">
          Consulte suas {consultations.length} consultas anteriores e acompanhe sua evolução de saúde.
        </p>
      </div>

      <div className="space-y-4">
        {consultations.map((consultation) => (
          <Collapsible key={consultation.id}>
            <Card className="transition-shadow hover:shadow-card">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {consultation.chief_complaint || "Consulta médica"}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(consultation.created_at)}</span>
                        </div>
                        {consultation.assessment_score && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Score: {consultation.assessment_score}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {consultation.urgency_level && (
                        <Badge variant={getUrgencyColor(consultation.urgency_level)}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {consultation.urgency_level}
                        </Badge>
                      )}
                      <Badge variant={getStatusColor(consultation.status)}>
                        {consultation.status?.replace('_', ' ')}
                      </Badge>
                      <Button variant="ghost" size="sm" className="p-1">
                        {expandedItems.has(consultation.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    {consultation.symptoms && consultation.symptoms.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Sintomas relatados
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {consultation.symptoms.map((symptom, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {consultation.ai_diagnosis && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          Análise da IA
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {consultation.ai_diagnosis}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Funcionalidade em desenvolvimento",
                          description: "Em breve você poderá visualizar relatórios detalhados.",
                        });
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver relatório completo
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default MedicalHistory;