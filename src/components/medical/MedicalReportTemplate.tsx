import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DoctorData {
  name: string;
  crm: string;
  specialty: string;
  clinic: string;
}

interface PatientData {
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
}

interface MedicalReportTemplateProps {
  doctorData: DoctorData;
  patientData: PatientData;
  clinicalReport: any;
  timestamp: string;
}

export const MedicalReportTemplate: React.FC<MedicalReportTemplateProps> = ({
  doctorData,
  patientData,
  clinicalReport,
  timestamp
}) => {
  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCRM = (crm: string) => {
    return crm.replace(/(\d+)([A-Z]{2})/, '$1/$2');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white text-black p-8 space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Cabeçalho */}
      <div className="border-b-2 border-blue-600 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-blue-600 mb-1">
              RELATÓRIO DE TRIAGEM MÉDICA
            </h1>
            <p className="text-sm text-gray-600">Sistema de Análise Médica com IA</p>
          </div>
          <div className="text-right text-sm">
            <p><strong>Data do Exame:</strong></p>
            <p>{format(new Date(timestamp), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            <p>{format(new Date(timestamp), "HH:mm", { locale: ptBR })}h</p>
          </div>
        </div>
      </div>

      {/* Dados do Médico Responsável */}
      <div className="bg-blue-50 p-4 rounded border">
        <h2 className="text-lg font-semibold text-blue-700 mb-3">MÉDICO RESPONSÁVEL</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Nome:</strong> {doctorData.name}</p>
            <p><strong>CRM:</strong> {formatCRM(doctorData.crm)}</p>
          </div>
          <div>
            <p><strong>Especialidade:</strong> {doctorData.specialty}</p>
            <p><strong>Clínica:</strong> {doctorData.clinic}</p>
          </div>
        </div>
      </div>

      {/* Dados do Paciente */}
      <div className="bg-gray-50 p-4 rounded border">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">DADOS DO PACIENTE</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Nome:</strong> {patientData.name}</p>
            <p><strong>CPF:</strong> {formatCPF(patientData.cpf)}</p>
            <p><strong>Data de Nascimento:</strong> {format(new Date(patientData.birthDate), "dd/MM/yyyy")}</p>
          </div>
          <div>
            <p><strong>Telefone:</strong> {patientData.phone}</p>
            <p><strong>E-mail:</strong> {patientData.email}</p>
            <p><strong>Código do Paciente:</strong> {clinicalReport.patientId}</p>
          </div>
        </div>
      </div>

      {/* Resultados da Triagem */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-300 pb-2">RESULTADOS DA TRIAGEM</h2>
        
        {/* Nível de Urgência */}
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <h3 className="font-semibold text-red-700 mb-2">CLASSIFICAÇÃO DE URGÊNCIA</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-red-600">{clinicalReport.overallUrgency.level}</p>
              <p className="text-sm text-red-700">{clinicalReport.overallUrgency.action}</p>
            </div>
            <div className="text-right">
              <p className="text-sm"><strong>Confiabilidade:</strong> {clinicalReport.confidence}%</p>
              <p className="text-sm"><strong>Qualidade dos Dados:</strong> {clinicalReport.dataQuality}</p>
            </div>
          </div>
        </div>

        {/* Sintomas Identificados */}
        <div>
          <h3 className="font-semibold mb-2">SINTOMAS E SINAIS IDENTIFICADOS</h3>
          <div className="bg-gray-50 p-3 rounded border">
            {clinicalReport.consolidatedSymptoms?.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {clinicalReport.consolidatedSymptoms.map((symptom: string, index: number) => (
                  <li key={index} className="text-sm">{symptom}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">Nenhum sintoma específico identificado</p>
            )}
          </div>
        </div>

        {/* Fatores de Risco */}
        {clinicalReport.riskFactors?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">FATORES DE RISCO</h3>
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <ul className="list-disc list-inside space-y-1">
                {clinicalReport.riskFactors.map((risk: string, index: number) => (
                  <li key={index} className="text-sm text-yellow-800">{risk}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Recomendações */}
        <div>
          <h3 className="font-semibold mb-2">RECOMENDAÇÕES MÉDICAS</h3>
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <ol className="list-decimal list-inside space-y-1">
              {clinicalReport.recommendations?.map((rec: string, index: number) => (
                <li key={index} className="text-sm text-green-800">{rec}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Metodologia */}
      <div className="bg-blue-50 p-4 rounded border">
        <h3 className="font-semibold text-blue-700 mb-2">METODOLOGIA DE ANÁLISE</h3>
        <p className="text-sm text-blue-800">
          Este relatório foi gerado através de análise multimodal com inteligência artificial, 
          incluindo análise de voz, telemetria facial e anamnese estruturada. Os resultados 
          devem ser interpretados por profissional médico qualificado e não substituem 
          consulta médica presencial.
        </p>
      </div>

      {/* Rodapé com Assinatura */}
      <div className="border-t pt-6 mt-8">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-gray-600">
              Relatório gerado automaticamente pelo Sistema de Triagem Médica com IA
            </p>
            <p className="text-xs text-gray-600">
              Data de geração: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 w-48 mb-2"></div>
            <p className="text-sm font-semibold">{doctorData.name}</p>
            <p className="text-xs">CRM: {formatCRM(doctorData.crm)}</p>
            <p className="text-xs">{doctorData.specialty}</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-100 p-3 rounded text-xs text-gray-600 text-center">
        <strong>IMPORTANTE:</strong> Este relatório é baseado em análise automatizada e deve ser 
        validado por profissional médico. Em caso de emergência, procure atendimento médico imediato.
      </div>
    </div>
  );
};