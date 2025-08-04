import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Clock, 
  FileText,
  TrendingUp,
  Heart,
  Activity
} from 'lucide-react';

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

export const MedicalHistory = () => {
  const [consultations, setConsultations] = useState<ConsultationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchConsultationHistory();
    }
  }, [user]);

  const fetchConsultationHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_consultation_history', {
        user_uuid: user.id
      });

      if (error) throw error;

      setConsultations(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar o histórico de consultas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'alta':
      case 'crítica':
        return 'destructive';
      case 'média':
      case 'moderada':
        return 'secondary';
      case 'baixa':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'concluído':
      case 'finalizado':
        return 'default';
      case 'em_andamento':
        return 'secondary';
      case 'cancelado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Faça login para ver seu histórico</h3>
        <p className="text-muted-foreground">
          Acesse sua conta para visualizar o histórico de consultas médicas.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhuma consulta encontrada</h3>
        <p className="text-muted-foreground">
          Suas consultas aparecerão aqui após serem realizadas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Histórico Médico</h2>
          <p className="text-muted-foreground">
            {consultations.length} consulta{consultations.length !== 1 ? 's' : ''} registrada{consultations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={fetchConsultationHistory} variant="outline" size="sm">
          <TrendingUp className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="space-y-4">
        {consultations.map((consultation) => (
          <Card key={consultation.id} className="transition-all duration-200 hover:shadow-md">
            <Collapsible
              open={expandedCards.has(consultation.id)}
              onOpenChange={() => toggleExpanded(consultation.id)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(consultation.created_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {consultation.chief_complaint || 'Consulta médica'}
                      </CardTitle>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getUrgencyColor(consultation.urgency_level)}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {consultation.urgency_level || 'Não informado'}
                        </Badge>
                        
                        <Badge variant={getStatusColor(consultation.status)}>
                          <Clock className="h-3 w-3 mr-1" />
                          {consultation.status || 'Em andamento'}
                        </Badge>

                        {consultation.assessment_score && (
                          <Badge variant="outline">
                            Score: {consultation.assessment_score}/10
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="ml-4">
                      {expandedCards.has(consultation.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {expandedCards.has(consultation.id) ? 'Ocultar detalhes' : 'Ver detalhes'}
                      </span>
                    </Button>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  {consultation.symptoms && consultation.symptoms.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Sintomas relatados:</h4>
                      <div className="flex flex-wrap gap-1">
                        {consultation.symptoms.map((symptom, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {consultation.ai_diagnosis && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Análise IA:</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {consultation.ai_diagnosis}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver relatório completo
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MedicalHistory;