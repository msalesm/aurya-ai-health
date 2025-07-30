import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import medicalLogo from "@/assets/medical-logo.png";
import { MedicalConfig } from './MedicalConfiguration';

interface ReportPreviewProps {
  clinicalReport: any;
  medicalConfig: MedicalConfig;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  clinicalReport,
  medicalConfig
}) => {
  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'Crítica': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'Alta': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'Média': return <Clock className="h-5 w-5 text-yellow-500" />;
      default: return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white text-black print:shadow-none">
      <CardContent className="p-8 space-y-6">
        {/* Cabeçalho Profissional */}
        <div className="flex items-start justify-between border-b-2 border-primary pb-6">
          <div className="flex items-center gap-4">
            <img 
              src={medicalLogo} 
              alt="Logo da Clínica" 
              className="h-16 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {medicalConfig.clinic}
              </h1>
              <p className="text-sm text-muted-foreground">
                Sistema de Triagem com Inteligência Artificial
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Data do Relatório</p>
            <p>{formatDate(clinicalReport.timestamp)}</p>
          </div>
        </div>

        {/* Identificação do Paciente */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-primary">
              Dados do Paciente
            </h2>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Nome:</span> {medicalConfig.patientName}</p>
              <p><span className="font-medium">Idade:</span> {medicalConfig.patientAge} anos</p>
              <p><span className="font-medium">ID:</span> {medicalConfig.patientId}</p>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-primary">
              Médico Responsável
            </h2>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Nome:</span> {medicalConfig.doctorName}</p>
              <p><span className="font-medium">CRM:</span> {medicalConfig.crm}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Análise de Urgência */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            {getUrgencyIcon(clinicalReport.overallUrgency?.level)}
            Classificação de Urgência
          </h2>
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold">
                Nível: {clinicalReport.overallUrgency?.level}
              </span>
              <Badge variant={clinicalReport.overallUrgency?.color as any}>
                {clinicalReport.overallUrgency?.level}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Ação recomendada:</span> {clinicalReport.overallUrgency?.action}
            </p>
          </div>
        </div>

        {/* Sintomas Identificados */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-primary">
            Sintomas e Sinais Identificados
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {clinicalReport.consolidatedSymptoms?.map((symptom: string, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted/20 rounded">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{symptom}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fatores de Risco */}
        {clinicalReport.riskFactors?.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-primary">
              Fatores de Risco Identificados
            </h2>
            <div className="space-y-2">
              {clinicalReport.riskFactors.map((risk: string, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recomendações Médicas */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-primary">
            Recomendações Médicas
          </h2>
          <div className="space-y-2">
            {clinicalReport.recommendations?.map((rec: string, index: number) => (
              <div key={index} className="flex items-start gap-2 text-sm p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Informações Técnicas */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
          <div>
            <p className="text-sm font-medium">Confiabilidade da Análise</p>
            <p className="text-lg font-bold text-primary">{clinicalReport.confidence}%</p>
          </div>
          <div>
            <p className="text-sm font-medium">Qualidade dos Dados</p>
            <p className="text-lg font-bold text-primary">{clinicalReport.dataQuality}</p>
          </div>
        </div>

        <Separator />

        {/* Assinatura Digital */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-primary">
            Assinatura Digital
          </h2>
          <div className="bg-muted/20 p-4 rounded-lg border border-dashed border-primary/30">
            <div className="whitespace-pre-line text-sm">
              {medicalConfig.signature}
            </div>
            <div className="mt-4 pt-4 border-t border-primary/20 text-xs text-muted-foreground">
              <p>Documento gerado eletronicamente em {formatDate(clinicalReport.timestamp)}</p>
              <p>Sistema MedIA - Relatório ID: {clinicalReport.patientId}</p>
            </div>
          </div>
        </div>

        {/* Rodapé Legal */}
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          <p>
            Este relatório foi gerado por sistema de inteligência artificial e deve ser validado por profissional médico.
            Para uso exclusivamente médico. Documento protegido por direitos autorais.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};