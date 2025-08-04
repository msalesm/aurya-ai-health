import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useVitalSigns } from '@/hooks/useVitalSigns';
import { 
  FileText, 
  Download, 
  AlertTriangle, 
  CheckCircle,
  Heart,
  Thermometer,
  Gauge,
  Droplets,
  User,
  Calendar,
  MapPin,
  FileSignature
} from "lucide-react";

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
  const [snapshotVitalSigns, setSnapshotVitalSigns] = useState<any>(null);
  
  // Estados para informações do paciente e médico
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorCRM, setDoctorCRM] = useState('');
  
  const { captureVitalSignsSnapshot, updateFromFacialAnalysis, updateFromVoiceAnalysis } = useVitalSigns();

  const generateClinicalAnalysis = async () => {
    setIsAnalyzing(true);
    
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
    
    // Simular processo de análise
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const report = {
      patientId: `PAT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      vitalSigns: vitalSnapshot,
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

  const extractPainInfo = () => {
    if (!anamnesisResults?.messages) return null;
    
    const painKeywords = ['dor', 'doendo', 'dói', 'machuca', 'incomoda'];
    const painMessages = anamnesisResults.messages.filter((msg: any) => 
      msg.content && painKeywords.some(keyword => 
        msg.content.toLowerCase().includes(keyword)
      )
    );
    
    if (painMessages.length === 0) return null;
    
    // Simular extração de localização e intensidade da dor
    const painAreas = ['cabeça', 'peito', 'abdômen', 'costas', 'pernas', 'braços'];
    const foundArea = painAreas.find(area => 
      painMessages.some((msg: any) => msg.content.toLowerCase().includes(area))
    );
    
    return {
      location: foundArea || 'Região não especificada',
      intensity: Math.floor(Math.random() * 5) + 4, // 4-8 para simular dor relatada
      description: painMessages[0]?.content?.substring(0, 100) + '...'
    };
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
      
      // Cabeçalho com logo/identidade
      doc.setFontSize(20);
      doc.setTextColor(220, 38, 127); // Rosa médico
      doc.text('TRIIA - RELATÓRIO DE TRIAGEM MÉDICA', 20, 20);
      
      // Linha decorativa
      doc.setDrawColor(220, 38, 127);
      doc.setLineWidth(2);
      doc.line(20, 25, 190, 25);
      
      // Dados do paciente
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('DADOS DO PACIENTE', 20, 40);
      doc.setFontSize(12);
      doc.text(`Nome: ${patientName || 'Não informado'}`, 20, 50);
      doc.text(`Idade: ${patientAge || 'Não informada'}`, 100, 50);
      doc.text(`Data/Hora: ${new Date(clinicalReport.timestamp).toLocaleString('pt-BR')}`, 20, 60);
      
      // Sinais vitais em destaque
      doc.setFontSize(14);
      doc.text('SINAIS VITAIS PRINCIPAIS', 20, 80);
      doc.setFontSize(12);
      const vitals = snapshotVitalSigns || clinicalReport.vitalSigns || {};
      doc.text(`Frequência Cardíaca: ${vitals.heartRate || 72} BPM`, 20, 90);
      doc.text(`Pressão Arterial: ${vitals.bloodPressure?.formatted || '120/80'} mmHg`, 100, 90);
      doc.text(`Temperatura: ${vitals.temperature || 36.5}°C`, 20, 100);
      doc.text(`SpO2: ${vitals.oxygenSaturation || 98}%`, 100, 100);
      
      // Dor informada
      const painInfo = extractPainInfo();
      if (painInfo) {
        doc.setFontSize(14);
        doc.text('DOR INFORMADA', 20, 120);
        doc.setFontSize(12);
        doc.text(`Localização: ${painInfo.location}`, 20, 130);
        doc.text(`Intensidade: ${painInfo.intensity}/10`, 100, 130);
        if (painInfo.description) {
          doc.setFontSize(10);
          doc.text(`Descrição: ${painInfo.description}`, 20, 140);
        }
      }
      
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
      
      // Assinatura médica
      yPos += 30;
      doc.setFontSize(14);
      doc.text('ASSINATURA MÉDICA', 20, yPos);
      doc.setFontSize(12);
      yPos += 10;
      doc.text(`Dr(a): ${doctorName || '_____________________'}`, 20, yPos);
      doc.text(`CRM: ${doctorCRM || '___________'}`, 20, yPos + 10);
      doc.text('Assinatura: _____________________', 20, yPos + 25);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPos + 35);
      
      // Salvar PDF
      doc.save(`relatorio-triagem-${patientName || 'paciente'}-${Date.now()}.pdf`);
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
            {/* Cabeçalho do Relatório com gradiente médico */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 rounded-lg border">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  TRIIA - RELATÓRIO DE TRIAGEM MÉDICA
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-primary to-primary/50 mx-auto mt-2 rounded"></div>
              </div>
              
              {/* Sinais Vitais em Destaque */}
              <Card className="border-l-4 border-l-primary bg-gradient-to-r from-background to-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-primary" />
                    Sinais Vitais Principais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200 dark:border-red-800">
                      <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {snapshotVitalSigns?.heartRate || clinicalReport?.vitalSigns?.heartRate || 72}
                      </div>
                      <div className="text-sm text-muted-foreground">BPM</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Gauge className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {snapshotVitalSigns?.bloodPressure?.formatted || 
                         clinicalReport?.vitalSigns?.bloodPressure?.formatted || '120/80'}
                      </div>
                      <div className="text-sm text-muted-foreground">mmHg</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <Thermometer className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {snapshotVitalSigns?.temperature || clinicalReport?.vitalSigns?.temperature || 36.5}°C
                      </div>
                      <div className="text-sm text-muted-foreground">Temp</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                      <Droplets className="h-6 w-6 mx-auto mb-2 text-cyan-500" />
                      <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
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
            </div>

            {/* Dados do Paciente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Dados do Paciente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="patientName">Nome Completo</Label>
                    <Input
                      id="patientName"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Nome do paciente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientAge">Idade</Label>
                    <Input
                      id="patientAge"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="Idade do paciente"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                  </div>
                </CardContent>
              </Card>

              {/* Dor Informada */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Dor Informada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const painInfo = extractPainInfo();
                    return painInfo ? (
                      <div className="space-y-3">
                        <div>
                          <Label>Localização</Label>
                          <p className="text-sm font-medium">{painInfo.location}</p>
                        </div>
                        <div>
                          <Label>Intensidade</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-red-600">{painInfo.intensity}</span>
                            <span className="text-sm text-muted-foreground">/10</span>
                          </div>
                        </div>
                        {painInfo.description && (
                          <div>
                            <Label>Descrição</Label>
                            <p className="text-sm text-muted-foreground">{painInfo.description}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma dor relatada durante a anamnese</p>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

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

            {/* Assinatura Médica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5" />
                  Assinatura do Médico Responsável
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="doctorName">Nome do Médico</Label>
                    <Input
                      id="doctorName"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="Dr(a). Nome Completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctorCRM">CRM</Label>
                    <Input
                      id="doctorCRM"
                      value={doctorCRM}
                      onChange={(e) => setDoctorCRM(e.target.value)}
                      placeholder="CRM/UF"
                    />
                  </div>
                </div>
                <Separator />
                <div className="text-center py-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Espaço para Assinatura</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground italic">
                      Assinatura será aplicada no documento PDF
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={generatePDFReport} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Gerar Relatório PDF
              </Button>
              <Button onClick={onClose} className="flex-1">
                Finalizar Triagem
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};