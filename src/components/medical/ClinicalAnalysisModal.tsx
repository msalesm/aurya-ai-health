import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, AlertTriangle, CheckCircle } from "lucide-react";

interface ClinicalAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceAnalysis?: any;
  facialAnalysis?: any;
  anamnesisResults?: any;
}

export const ClinicalAnalysisModal: React.FC<ClinicalAnalysisModalProps> = ({
  isOpen,
  onClose,
  voiceAnalysis,
  facialAnalysis,
  anamnesisResults
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [clinicalReport, setClinicalReport] = useState<any>(null);

  const generateClinicalAnalysis = () => {
    setIsAnalyzing(true);
    
    // Simular análise consolidada
    setTimeout(() => {
      const report = {
        patientId: `PAT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        overallUrgency: calculateOverallUrgency(),
        consolidatedSymptoms: extractAllSymptoms(),
        riskFactors: identifyRiskFactors(),
        recommendations: generateRecommendations(),
        confidence: calculateOverallConfidence(),
        dataQuality: assessDataQuality()
      };
      
      setClinicalReport(report);
      setAnalysisComplete(true);
      setIsAnalyzing(false);
    }, 3000);
  };

  const calculateOverallUrgency = () => {
    let urgencyScore = 0;
    
    if (anamnesisResults?.urgency?.score) urgencyScore += anamnesisResults.urgency.score;
    if (voiceAnalysis?.stress_indicators?.stress_level && voiceAnalysis.stress_indicators.stress_level > 7) urgencyScore += 3;
    if (facialAnalysis?.stressLevel && facialAnalysis.stressLevel > 7) urgencyScore += 2;
    if (facialAnalysis?.heartRate && facialAnalysis.heartRate > 100) urgencyScore += 2;
    
    if (urgencyScore >= 8) return { level: 'Crítica', color: 'destructive', action: 'Emergência médica' };
    if (urgencyScore >= 5) return { level: 'Alta', color: 'warning', action: 'Atendimento urgente' };
    if (urgencyScore >= 2) return { level: 'Média', color: 'secondary', action: 'Consulta nas próximas 24h' };
    return { level: 'Baixa', color: 'default', action: 'Monitoramento' };
  };

  const extractAllSymptoms = () => {
    const symptoms = [];
    
    if (anamnesisResults?.symptoms) symptoms.push(...anamnesisResults.symptoms);
    if (voiceAnalysis?.emotional_tone?.primary_emotion && voiceAnalysis.emotional_tone.primary_emotion !== 'neutral') {
      symptoms.push(`Estado emocional: ${voiceAnalysis.emotional_tone.primary_emotion}`);
    }
    if (facialAnalysis?.stressLevel > 5) symptoms.push('Sinais de estresse detectados');
    
    return symptoms.filter(Boolean);
  };

  const identifyRiskFactors = () => {
    const risks = [];
    
    if (facialAnalysis?.heartRate > 100) risks.push('Taquicardia');
    if (voiceAnalysis?.stress_indicators?.stress_level > 6) risks.push('Estresse vocal elevado');
    if (facialAnalysis?.stressLevel > 7) risks.push('Sinais de ansiedade');
    
    return risks;
  };

  const generateRecommendations = () => {
    const recommendations = [];
    const urgency = calculateOverallUrgency();
    
    recommendations.push(urgency.action);
    
    if (voiceAnalysis?.emotional_tone?.primary_emotion === 'sadness') {
      recommendations.push('Avaliar estado psicológico');
    }
    
    if (facialAnalysis?.heartRate > 100 || facialAnalysis?.stressLevel > 7) {
      recommendations.push('Monitoramento cardiovascular');
    }
    
    return recommendations;
  };

  const calculateOverallConfidence = () => {
    let totalConfidence = 0;
    let count = 0;
    
    if (voiceAnalysis?.confidence_score) {
      totalConfidence += voiceAnalysis.confidence_score * 100;
      count++;
    }
    
    if (facialAnalysis?.confidence) {
      totalConfidence += facialAnalysis.confidence;
      count++;
    }
    
    if (anamnesisResults) {
      totalConfidence += 85; // Base para anamnese estruturada
      count++;
    }
    
    return count > 0 ? Math.round(totalConfidence / count) : 70;
  };

  const assessDataQuality = () => {
    const hasVoice = !!voiceAnalysis;
    const hasFacial = !!facialAnalysis;
    const hasAnamnesis = !!anamnesisResults;
    
    const completeness = [hasVoice, hasFacial, hasAnamnesis].filter(Boolean).length;
    
    if (completeness === 3) return 'Completa';
    if (completeness === 2) return 'Boa';
    return 'Parcial';
  };

  const generatePDFReport = async () => {
    if (!clinicalReport) return;
    
    try {
      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Configurar fonte
      doc.setFont('helvetica');
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.text('RELATÓRIO DE TRIAGEM MÉDICA', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Paciente ID: ${clinicalReport.patientId}`, 20, 35);
      doc.text(`Data: ${new Date(clinicalReport.timestamp).toLocaleString('pt-BR')}`, 20, 45);
      
      // Urgência
      doc.setFontSize(14);
      doc.text('NÍVEL DE URGÊNCIA:', 20, 65);
      doc.setFontSize(12);
      doc.text(`${clinicalReport.overallUrgency.level} - ${clinicalReport.overallUrgency.action}`, 20, 75);
      
      // Sintomas
      doc.setFontSize(14);
      doc.text('SINTOMAS IDENTIFICADOS:', 20, 95);
      doc.setFontSize(10);
      let yPos = 105;
      clinicalReport.consolidatedSymptoms?.forEach((symptom: string) => {
        doc.text(`• ${symptom}`, 25, yPos);
        yPos += 10;
      });
      
      // Recomendações
      yPos += 10;
      doc.setFontSize(14);
      doc.text('RECOMENDAÇÕES:', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      clinicalReport.recommendations?.forEach((rec: string) => {
        doc.text(`• ${rec}`, 25, yPos);
        yPos += 10;
      });
      
      // Dados técnicos
      yPos += 10;
      doc.setFontSize(12);
      doc.text(`Confiabilidade: ${clinicalReport.confidence}%`, 20, yPos);
      doc.text(`Qualidade dos dados: ${clinicalReport.dataQuality}`, 20, yPos + 10);
      
      // Salvar PDF
      doc.save(`relatorio-triagem-${clinicalReport.patientId}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Fallback para JSON
      const dataStr = JSON.stringify(clinicalReport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-clinico-${clinicalReport?.patientId}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Análise Clínica Consolidada
          </DialogTitle>
        </DialogHeader>

        {!analysisComplete ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Análise de Voz</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    {voiceAnalysis ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Telemetria Facial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    {facialAnalysis ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Anamnese</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    {anamnesisResults ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button 
                onClick={generateClinicalAnalysis}
                disabled={isAnalyzing}
                size="lg"
              >
                {isAnalyzing ? 'Analisando...' : 'Gerar Análise Consolidada'}
              </Button>
              
              {isAnalyzing && (
                <div className="mt-4">
                  <Progress value={66} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Consolidando dados e gerando relatório clínico...
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Seção destacada de Sinais Vitais */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  SINAIS VITAIS PRINCIPAIS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-2xl font-bold text-destructive">
                      {facialAnalysis?.heartRate || '--'} BPM
                    </div>
                    <div className="text-xs text-muted-foreground">Frequência Cardíaca</div>
                    <div className="text-xs mt-1">
                      {facialAnalysis?.heartRate > 100 ? '🔴 Elevada' : 
                       facialAnalysis?.heartRate < 60 ? '🟡 Baixa' : '🟢 Normal'}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-2xl font-bold text-primary">
                      {facialAnalysis?.bloodPressure || '--'}
                    </div>
                    <div className="text-xs text-muted-foreground">Pressão Arterial</div>
                    <div className="text-xs mt-1">
                      {facialAnalysis?.bloodPressure?.includes('130') || facialAnalysis?.bloodPressure?.includes('140') ? 
                       '🟡 Elevada' : '🟢 Normal'}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-2xl font-bold text-warning">
                      {facialAnalysis?.temperature ? `${facialAnalysis.temperature}°C` : '--'}
                    </div>
                    <div className="text-xs text-muted-foreground">Temperatura</div>
                    <div className="text-xs mt-1">
                      {facialAnalysis?.temperature > 37.5 ? '🔴 Febre' : 
                       facialAnalysis?.temperature < 36 ? '🟡 Baixa' : '🟢 Normal'}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-2xl font-bold text-secondary">
                      {facialAnalysis?.oxygenSaturation ? `${facialAnalysis.oxygenSaturation}%` : '--'}
                    </div>
                    <div className="text-xs text-muted-foreground">SpO₂</div>
                    <div className="text-xs mt-1">
                      {facialAnalysis?.oxygenSaturation < 95 ? '🔴 Baixa' : 
                       facialAnalysis?.oxygenSaturation < 97 ? '🟡 Limite' : '🟢 Normal'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Urgência Geral
                    <Badge variant={clinicalReport?.overallUrgency?.color as any}>
                      {clinicalReport?.overallUrgency?.level}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {clinicalReport?.overallUrgency?.action}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Confiabilidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Progress value={clinicalReport?.confidence} className="flex-1" />
                    <span className="text-sm font-medium">{clinicalReport?.confidence}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Qualidade dos dados: {clinicalReport?.dataQuality}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sintomas Identificados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clinicalReport?.consolidatedSymptoms?.map((symptom: string, index: number) => (
                    <Badge key={index} variant="outline">{symptom}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendações</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {clinicalReport?.recommendations?.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={generatePDFReport} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Baixar Relatório PDF
              </Button>
              <Button onClick={onClose} className="flex-1">
                Finalizar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};