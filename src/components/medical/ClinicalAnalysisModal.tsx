import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, AlertTriangle, CheckCircle, Settings } from "lucide-react";
import { MedicalConfiguration, MedicalConfig } from './MedicalConfiguration';
import { ReportPreview } from './ReportPreview';

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
  const [showConfig, setShowConfig] = useState(false);
  const [medicalConfig, setMedicalConfig] = useState<MedicalConfig>({
    doctorName: 'Dr. Maria Silva',
    crm: 'CRM/SP 123456',
    clinic: 'Clínica MedIA - Inteligência Artificial Médica',
    signature: 'Dra. Maria Silva\nCRM/SP 123456\nEspecialista em Medicina Interna',
    patientName: 'João da Silva',
    patientAge: '45',
    patientId: `PAT-${Date.now()}`
  });

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
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Configurar fonte
      doc.setFont('helvetica');
      
      // Cabeçalho com logo e dados da clínica
      doc.setFontSize(20);
      doc.text(medicalConfig.clinic, 20, 25);
      doc.setFontSize(12);
      doc.text('Sistema de Triagem com Inteligência Artificial', 20, 35);
      
      // Linha separadora
      doc.line(20, 45, 190, 45);
      
      // Dados do paciente e médico
      doc.setFontSize(14);
      doc.text('DADOS DO PACIENTE', 20, 60);
      doc.setFontSize(10);
      doc.text(`Nome: ${medicalConfig.patientName}`, 20, 70);
      doc.text(`Idade: ${medicalConfig.patientAge} anos`, 20, 80);
      doc.text(`ID: ${medicalConfig.patientId}`, 20, 90);
      
      doc.setFontSize(14);
      doc.text('MÉDICO RESPONSÁVEL', 110, 60);
      doc.setFontSize(10);
      doc.text(`${medicalConfig.doctorName}`, 110, 70);
      doc.text(`${medicalConfig.crm}`, 110, 80);
      doc.text(`Data: ${new Date(clinicalReport.timestamp).toLocaleString('pt-BR')}`, 110, 90);
      
      // Urgência
      doc.setFontSize(14);
      doc.text('CLASSIFICAÇÃO DE URGÊNCIA', 20, 110);
      doc.setFontSize(12);
      doc.text(`Nível: ${clinicalReport.overallUrgency.level}`, 20, 120);
      doc.text(`Ação: ${clinicalReport.overallUrgency.action}`, 20, 130);
      
      // Sintomas
      doc.setFontSize(14);
      doc.text('SINTOMAS IDENTIFICADOS', 20, 150);
      doc.setFontSize(10);
      let yPos = 160;
      clinicalReport.consolidatedSymptoms?.forEach((symptom: string) => {
        doc.text(`• ${symptom}`, 25, yPos);
        yPos += 8;
      });
      
      // Recomendações
      yPos += 10;
      doc.setFontSize(14);
      doc.text('RECOMENDAÇÕES MÉDICAS', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      clinicalReport.recommendations?.forEach((rec: string) => {
        doc.text(`• ${rec}`, 25, yPos);
        yPos += 8;
      });
      
      // Assinatura digital
      yPos += 20;
      doc.setFontSize(12);
      doc.text('ASSINATURA DIGITAL', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      const signatureLines = medicalConfig.signature.split('\n');
      signatureLines.forEach((line) => {
        doc.text(line, 20, yPos);
        yPos += 8;
      });
      
      // Rodapé
      doc.setFontSize(8);
      doc.text(`Relatório gerado em ${new Date().toLocaleString('pt-BR')} - Sistema MedIA`, 20, 280);
      doc.text(`Confiabilidade: ${clinicalReport.confidence}% | Qualidade: ${clinicalReport.dataQuality}`, 20, 285);
      
      // Salvar PDF
      doc.save(`relatorio-medico-${medicalConfig.patientName}-${medicalConfig.patientId}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Fallback para JSON
      const dataStr = JSON.stringify({ clinicalReport, medicalConfig }, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-clinico-${medicalConfig.patientId}.json`;
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
            {showConfig ? (
              <div className="space-y-4">
                <MedicalConfiguration 
                  onConfigSave={(config) => {
                    setMedicalConfig(config);
                    setShowConfig(false);
                  }}
                  initialConfig={medicalConfig}
                />
                <Button onClick={() => setShowConfig(false)} variant="outline" className="w-full">
                  Cancelar
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Pré-visualização do Relatório Médico</h3>
                  <Button onClick={() => setShowConfig(true)} variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                </div>
                
                <ReportPreview 
                  clinicalReport={clinicalReport}
                  medicalConfig={medicalConfig}
                />

                <div className="flex gap-2">
                  <Button onClick={generatePDFReport} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Relatório PDF
                  </Button>
                  <Button onClick={() => setShowConfig(true)} variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Dados
                  </Button>
                  <Button onClick={onClose} className="flex-1">
                    Finalizar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};