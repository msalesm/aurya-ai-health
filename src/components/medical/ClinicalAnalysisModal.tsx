import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useVitalSigns } from '@/hooks/useVitalSigns';
import { useCorrelationAnalysis } from '@/hooks/useCorrelationAnalysis';
import { CorrelationDashboard } from './CorrelationDashboard';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  AlertTriangle, 
  CheckCircle,
  Heart,
  Thermometer,
  Gauge,
  Droplets,
  Share2,
  Printer,
  X,
  Mail,
  ArrowRight
} from "lucide-react";

interface PatientData {
  fullName: string;
  birthDate: string;
  age?: number;
}

interface ClinicalAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (data: any) => void;
  voiceAnalysis?: any;
  facialAnalysis?: any;
  anamnesisResults?: any;
  patientData?: PatientData | null;
}

export const ClinicalAnalysisModal: React.FC<ClinicalAnalysisModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  voiceAnalysis,
  facialAnalysis,
  anamnesisResults,
  patientData
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [clinicalReport, setClinicalReport] = useState<any>(null);
  const [snapshotVitalSigns, setSnapshotVitalSigns] = useState<any>(null);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const { captureVitalSignsSnapshot, updateFromFacialAnalysis, updateFromVoiceAnalysis } = useVitalSigns();
  
  // Use correlation analysis hook
  const {
    isAnalyzing: isCorrelating,
    consolidatedResult,
    outliers,
    error: correlationError,
    performCorrelationAnalysis
  } = useCorrelationAnalysis();

  const generateClinicalAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      // Capturar dados dos sinais vitais no momento da análise
      if (facialAnalysis) {
        updateFromFacialAnalysis(facialAnalysis);
      }
      if (voiceAnalysis) {
        updateFromVoiceAnalysis(voiceAnalysis);
      }
      
      // Aguardar um pouco para os dados serem processados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Capturar snapshot dos sinais vitais fixos
      const vitalSnapshot = captureVitalSignsSnapshot();
      setSnapshotVitalSigns(vitalSnapshot);
      
      // Perform cross-modal correlation analysis
      const correlationResult = await performCorrelationAnalysis(
        facialAnalysis,
        voiceAnalysis,
        anamnesisResults
      );
      
      if (!correlationResult) {
        throw new Error('Falha na análise de correlação');
      }
      
      const report = {
        patientId: `PAT-${Date.now()}`,
        patientName: patientData?.fullName || 'Paciente Anônimo',
        patientAge: patientData?.age,
        timestamp: new Date().toISOString(),
        vitalSigns: vitalSnapshot,
        
        // Use consolidated analysis from correlation
        overallUrgency: correlationResult.overallUrgency,
        consolidatedSymptoms: correlationResult.combinedSymptoms,
        riskFactors: correlationResult.riskFactors,
        recommendations: correlationResult.recommendations,
        confidence: correlationResult.reliability.score,
        dataQuality: correlationResult.reliability.dataQuality,
        
        // Include correlation data
        crossModalCorrelation: correlationResult.crossModalData,
        biometricCorrelation: correlationResult.biometricCorrelation,
        outliers: outliers,
        correlationError: correlationError,
        
        // Legacy fields for compatibility
        hasConversationalData: !!anamnesisResults?.conversationalData,
        enhancedWithCorrelation: true
      };
      
      setClinicalReport(report);
      setAnalysisComplete(true);
      
      // Show correlation insights
      if (correlationResult.crossModalData.reliability === 'high') {
        toast({
          title: "Alta Confiabilidade",
          description: `Correlação de ${correlationResult.crossModalData.consistencyScore}% entre as análises.`,
        });
      } else if (correlationResult.crossModalData.conflictingMetrics.length > 0) {
        toast({
          title: "Métricas Conflitantes Detectadas",
          description: correlationResult.crossModalData.conflictingMetrics[0],
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Erro na análise correlacionada:', error);
      toast({
        title: "Erro na Análise",
        description: "Usando análise básica devido a erro na correlação.",
        variant: "destructive"
      });
      
      // Fallback to basic analysis
      await generateBasicAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateBasicAnalysis = async () => {
    const vitalSnapshot = captureVitalSignsSnapshot();
    setSnapshotVitalSigns(vitalSnapshot);
    
    const report = {
      patientId: `PAT-${Date.now()}`,
      patientName: patientData?.fullName || 'Paciente Anônimo',
      patientAge: patientData?.age,
      timestamp: new Date().toISOString(),
      vitalSigns: vitalSnapshot,
      overallUrgency: calculateOverallUrgency(),
      consolidatedSymptoms: extractAllSymptoms(),
      riskFactors: identifyRiskFactors(),
      recommendations: generateRecommendations(),
      confidence: calculateOverallConfidence(),
      dataQuality: assessDataQuality(),
      hasConversationalData: !!anamnesisResults?.conversationalData,
      enhancedWithCorrelation: false
    };
    
    setClinicalReport(report);
    setAnalysisComplete(true);
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

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const previewReport = () => {
    setShowReportPreview(true);
  };

  const downloadPDFReport = async () => {
    if (!clinicalReport || isGeneratingReport) return;
    
    setIsGeneratingReport(true);
    
    try {
      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Configurar fonte
      doc.setFont('helvetica');
      
      // CABEÇALHO ESTILO DASHBOARD
      doc.setFillColor(240, 248, 255); // bg-gradient-subtle equivalent
      doc.rect(15, 15, 180, 45, 'F');
      
      doc.setFontSize(24);
      doc.setTextColor(41, 128, 185); // primary color
      doc.text('AURYA', 20, 32);
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Triagem Médica Inteligente com IA', 20, 40);
      
      // Score Geral de Saúde - Card estilo dashboard
      doc.setFillColor(245, 250, 255); // Card background
      doc.setDrawColor(230, 230, 230);
      doc.rect(20, 70, 170, 35, 'FD');
      
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text('Score Geral de Saúde', 25, 82);
      
      const healthScore = clinicalReport.confidence;
      const scoreColor: [number, number, number] = healthScore >= 80 ? [34, 197, 94] : healthScore >= 60 ? [245, 158, 11] : [239, 68, 68];
      doc.setFontSize(24);
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.text(`${healthScore}/100`, 25, 95);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Baseado em dados de ${clinicalReport.dataQuality} qualidade`, 25, 100);
      
      // Badge de urgência
      const urgencyColors: Record<string, [number, number, number]> = {
        'Crítica': [239, 68, 68],
        'Alta': [245, 158, 11],
        'Média': [156, 163, 175],
        'Baixa': [34, 197, 94]
      };
      const urgencyColor = urgencyColors[clinicalReport.overallUrgency.level] || [156, 163, 175];
      doc.setFillColor(urgencyColor[0], urgencyColor[1], urgencyColor[2]);
      doc.roundedRect(140, 75, 45, 12, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(clinicalReport.overallUrgency.level, 145, 83);
      
      // Grid de Métricas (estilo dashboard cards)
      let cardY = 120;
      const cardWidth = 85;
      const cardHeight = 35;
      const cardSpacing = 5;
      
      // Card 1: Frequência Cardíaca
      doc.setFillColor(254, 242, 242); // Heart card background
      doc.setDrawColor(220, 220, 220);
      doc.rect(20, cardY, cardWidth, cardHeight, 'FD');
      doc.setFontSize(10);
      doc.setTextColor(220, 53, 69);
      doc.text('♥ Frequência Cardíaca', 25, cardY + 8);
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(`${snapshotVitalSigns?.heartRate || 72} bpm`, 25, cardY + 20);
      
      // Progress bar simulada
      doc.setFillColor(220, 220, 220);
      doc.rect(25, cardY + 25, 50, 3, 'F');
      const heartProgress = Math.min(((snapshotVitalSigns?.heartRate || 72) / 120) * 50, 50);
      doc.setFillColor(220, 53, 69);
      doc.rect(25, cardY + 25, heartProgress, 3, 'F');
      
      // Card 2: Pressão Arterial
      doc.setFillColor(255, 247, 237); // Warning background
      doc.rect(20 + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, 'FD');
      doc.setFontSize(10);
      doc.setTextColor(245, 158, 11);
      doc.text('♥ Pressão Arterial', 25 + cardWidth + cardSpacing, cardY + 8);
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(`${snapshotVitalSigns?.bloodPressure?.formatted || '120/80'}`, 25 + cardWidth + cardSpacing, cardY + 20);
      
      // Card 3: Temperatura
      cardY += cardHeight + 10;
      doc.setFillColor(240, 253, 244); // Success background
      doc.rect(20, cardY, cardWidth, cardHeight, 'FD');
      doc.setFontSize(10);
      doc.setTextColor(34, 197, 94);
      doc.text('🌡️ Temperatura', 25, cardY + 8);
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(`${snapshotVitalSigns?.temperature || 36.5}°C`, 25, cardY + 20);
      
      // Card 4: Saturação
      doc.setFillColor(240, 249, 255); // Primary background
      doc.rect(20 + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, 'FD');
      doc.setFontSize(10);
      doc.setTextColor(41, 128, 185);
      doc.text('📊 Saturação O2', 25 + cardWidth + cardSpacing, cardY + 8);
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(`${snapshotVitalSigns?.oxygenSaturation || 98}%`, 25 + cardWidth + cardSpacing, cardY + 20);
      
      // Seção Sintomas (estilo card)
      cardY += cardHeight + 15;
      doc.setFillColor(248, 250, 252);
      doc.rect(20, cardY, 170, 25, 'FD');
      doc.setFontSize(12);
      doc.setTextColor(41, 128, 185);
      doc.text('Sintomas Identificados', 25, cardY + 8);
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      let symptomY = cardY + 15;
      clinicalReport.consolidatedSymptoms?.slice(0, 2).forEach((symptom: string) => {
        // Badge simulado para sintomas
        doc.setFillColor(229, 231, 235);
        const textWidth = doc.getTextWidth(symptom);
        doc.roundedRect(25, symptomY - 3, textWidth + 6, 8, 2, 2, 'F');
        doc.setTextColor(75, 85, 99);
        doc.text(symptom, 28, symptomY + 1);
        symptomY += 10;
      });
      
      // Seção Recomendações (estilo card)
      cardY += 35;
      doc.setFillColor(240, 253, 244);
      doc.rect(20, cardY, 170, 30, 'FD');
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text('Recomendações', 25, cardY + 8);
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      let recY = cardY + 15;
      clinicalReport.recommendations?.slice(0, 3).forEach((rec: string) => {
        doc.text(`✓ ${rec}`, 25, recY);
        recY += 7;
      });
      
      // Footer com dados do paciente
      const footerY = 270;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, footerY, 180, 25, 'F');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Paciente: ${clinicalReport.patientName}`, 20, footerY + 8);
      doc.text(`ID: ${clinicalReport.patientId}`, 20, footerY + 16);
      doc.text(`Data: ${new Date(clinicalReport.timestamp).toLocaleString('pt-BR')}`, 120, footerY + 8);
      doc.text(`Confiabilidade: ${clinicalReport.confidence}%`, 120, footerY + 16);
      
      // Salvar PDF
      doc.save(`relatorio-triagem-${clinicalReport.patientName.replace(/\s+/g, '-')}-${clinicalReport.patientId}.pdf`);
      
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
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleComplete = async () => {
    if (!onComplete) {
      onClose();
      return;
    }

    setIsCompleting(true);

    // Chamar onComplete passando os dados da análise
    const completionData = {
      type: 'clinical-analysis',
      report: clinicalReport,
      timestamp: new Date().toISOString(),
      completed: true
    };

    try {
      await onComplete(completionData);
      toast({
        title: "Análise Clínica Finalizada",
        description: "Triagem médica concluída com sucesso. Todas as etapas foram finalizadas.",
      });
      onClose();
    } catch (error) {
      console.error('Erro ao finalizar análise:', error);
      toast({
        title: "Erro ao finalizar",
        description: "Houve um problema ao finalizar a análise. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Análise Clínica Multi-Modal
            {clinicalReport?.enhancedWithCorrelation && (
              <Badge variant="outline" className="ml-2">Correlação Ativa</Badge>
            )}
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
                disabled={isAnalyzing || isCorrelating}
                size="lg"
              >
                {(isAnalyzing || isCorrelating) ? 'Analisando...' : 'Gerar Análise Multi-Modal'}
              </Button>
              
              {(isAnalyzing || isCorrelating) && (
                <div className="mt-4">
                  <Progress value={isCorrelating ? 30 : 66} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {isCorrelating ? 
                      'Realizando correlação cross-modal...' : 
                      'Consolidando dados e gerando relatório clínico...'
                    }
                  </p>
                </div>
              )}
              
              {correlationError && (
                <div className="mt-2 text-sm text-destructive">
                  Erro na correlação: {correlationError}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sinais Vitais Principais */}
            <Card className="mb-6 border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  Sinais Vitais Principais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
                    <div className="text-2xl font-bold text-red-600">
                      {snapshotVitalSigns?.heartRate || clinicalReport?.vitalSigns?.heartRate || 72}
                    </div>
                    <div className="text-sm text-muted-foreground">BPM</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Gauge className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold text-blue-600">
                      {snapshotVitalSigns?.bloodPressure?.formatted || 
                       clinicalReport?.vitalSigns?.bloodPressure?.formatted || '120/80'}
                    </div>
                    <div className="text-sm text-muted-foreground">mmHg</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Thermometer className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold text-orange-600">
                      {snapshotVitalSigns?.temperature || clinicalReport?.vitalSigns?.temperature || 36.5}°C
                    </div>
                    <div className="text-sm text-muted-foreground">Temp</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Droplets className="h-6 w-6 mx-auto mb-2 text-cyan-500" />
                    <div className="text-2xl font-bold text-cyan-600">
                      {snapshotVitalSigns?.oxygenSaturation || clinicalReport?.vitalSigns?.oxygenSaturation || 98}%
                    </div>
                    <div className="text-sm text-muted-foreground">SpO2</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground text-center">
                  Coletados em: {snapshotVitalSigns?.timestamp ? 
                    new Date(snapshotVitalSigns.timestamp).toLocaleString('pt-BR') : 
                    new Date().toLocaleString('pt-BR')}
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

            {/* Correlation Dashboard */}
            {clinicalReport?.enhancedWithCorrelation && clinicalReport?.crossModalCorrelation && (
              <CorrelationDashboard
                correlationData={clinicalReport.crossModalCorrelation}
                biometricData={clinicalReport.biometricCorrelation}
                outliers={clinicalReport.outliers}
                urgencyData={clinicalReport.overallUrgency}
              />
            )}

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
              <Button 
                onClick={previewReport} 
                variant="outline" 
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Visualizar Relatório
              </Button>
              <Button 
                onClick={handleComplete} 
                className="flex-1"
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Finalizando...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Finalizar e Concluir
                  </>
                )}
              </Button>
            </div>

            {/* Modal de Preview do Relatório */}
            <Dialog open={showReportPreview} onOpenChange={setShowReportPreview}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Preview do Relatório Médico
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Preview do Conteúdo do Relatório */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold text-primary">AURYA</h2>
                      <p className="text-sm text-muted-foreground">Triagem Médica Inteligente com IA</p>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <h3 className="font-semibold">Paciente:</h3>
                        <p>{clinicalReport?.patientName}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">Sinais Vitais:</h3>
                        <p>FC: {snapshotVitalSigns?.heartRate || 72} BPM | PA: {snapshotVitalSigns?.bloodPressure?.formatted || '120/80'} mmHg</p>
                        <p>Temp: {snapshotVitalSigns?.temperature || 36.5}°C | SpO2: {snapshotVitalSigns?.oxygenSaturation || 98}%</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">Urgência:</h3>
                        <p>{clinicalReport?.overallUrgency?.level} - {clinicalReport?.overallUrgency?.action}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">Sintomas:</h3>
                        <p>{clinicalReport?.consolidatedSymptoms?.join(', ') || 'Nenhum sintoma identificado'}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">Recomendações:</h3>
                        <ul className="list-disc list-inside">
                          {clinicalReport?.recommendations?.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Ações do Preview */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={downloadPDFReport} 
                      variant="default" 
                      className="flex-1"
                      disabled={isGeneratingReport}
                    >
                      {isGeneratingReport ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Baixar PDF
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Relatório Médico Aurya',
                            text: `Relatório de triagem médica de ${clinicalReport?.patientName}`,
                            url: window.location.href
                          });
                        }
                      }}
                      variant="outline" 
                      className="flex-1"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                    
                    <Button 
                      onClick={() => window.print()}
                      variant="outline" 
                      className="flex-1"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};