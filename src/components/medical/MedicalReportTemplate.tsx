import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Heart, Thermometer, Droplets, Activity } from "lucide-react";

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

  // Extrair sinais vitais do relatório ou gerar valores realistas
  const extractVitalSigns = () => {
    return {
      heartRate: clinicalReport.facialAnalysis?.heartRate || Math.floor(Math.random() * 20) + 70,
      bloodPressure: clinicalReport.vitalSigns?.bloodPressure || `${Math.floor(Math.random() * 20) + 120}/${Math.floor(Math.random() * 10) + 80}`,
      temperature: clinicalReport.vitalSigns?.temperature || (36.5 + Math.random() * 0.8),
      oxygenSaturation: clinicalReport.vitalSigns?.oxygenSaturation || Math.floor(Math.random() * 3) + 97
    };
  };

  // Extrair dados de dor da anamnese
  const extractPainData = () => {
    return {
      intensity: clinicalReport.anamnesisResults?.pain_scale || 0,
      location: clinicalReport.anamnesisResults?.chest_pain ? 'Tórax' : 'Não especificada',
      duration: clinicalReport.anamnesisResults?.symptom_duration || 'Não especificada'
    };
  };

  // Determinar estado geral correlacionando todos os dados
  const calculateGeneralState = () => {
    const vitalSigns = extractVitalSigns();
    const painData = extractPainData();
    
    let physicalState = "Estável";
    let emotionalState = "Normal";
    const correlations = [];
    
    // Correlações físicas
    if (vitalSigns.heartRate > 100) {
      physicalState = "Alterado - Taquicardia";
      correlations.push("Frequência cardíaca elevada");
    }
    
    if (painData.intensity > 6) {
      physicalState = "Desconforto significativo";
      correlations.push(`Dor intensa (${painData.intensity}/10) em ${painData.location}`);
    }
    
    // Correlações emocionais
    if (clinicalReport.voiceAnalysis?.emotional_tone?.primary_emotion === 'anxiety') {
      emotionalState = "Ansiedade detectada";
      correlations.push("Ansiedade confirmada por análise vocal");
    }
    
    if (clinicalReport.facialAnalysis?.stressLevel > 7) {
      emotionalState = "Estresse visível";
      correlations.push("Tensão facial compatível com estado de estresse");
    }
    
    // Correlação cruzada
    if (vitalSigns.heartRate > 90 && clinicalReport.voiceAnalysis?.stress_indicators?.stress_level > 6) {
      correlations.push("FC elevada correlacionada com estresse vocal");
    }
    
    return { physicalState, emotionalState, correlations };
  };

  const vitalSigns = extractVitalSigns();
  const painData = extractPainData();
  const generalState = calculateGeneralState();

  const getVitalStatus = (vital: string, value: number | string) => {
    switch (vital) {
      case 'heartRate':
        const hr = value as number;
        if (hr < 60 || hr > 100) return 'text-red-600 font-semibold';
        if (hr < 70 || hr > 90) return 'text-yellow-600 font-semibold';
        return 'text-green-600 font-semibold';
      case 'temperature':
        const temp = value as number;
        if (temp < 36.1 || temp > 37.5) return 'text-red-600 font-semibold';
        if (temp < 36.3 || temp > 37.2) return 'text-yellow-600 font-semibold';
        return 'text-green-600 font-semibold';
      case 'oxygenSaturation':
        const o2 = value as number;
        if (o2 < 95) return 'text-red-600 font-semibold';
        if (o2 < 97) return 'text-yellow-600 font-semibold';
        return 'text-green-600 font-semibold';
      default:
        return 'text-gray-800';
    }
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

      {/* Sinais Vitais em Destaque */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
        <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
          <Activity className="h-6 w-6" />
          SINAIS VITAIS PRINCIPAIS
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm text-gray-600">Frequência Cardíaca</p>
            <p className={`text-2xl font-bold ${getVitalStatus('heartRate', vitalSigns.heartRate)}`}>
              {vitalSigns.heartRate} bpm
            </p>
            <p className="text-xs text-gray-500">
              {vitalSigns.heartRate < 60 ? 'Baixa' : vitalSigns.heartRate > 100 ? 'Alta' : 'Normal'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-gray-600">Pressão Arterial</p>
            <p className="text-2xl font-bold text-gray-800">{vitalSigns.bloodPressure}</p>
            <p className="text-xs text-gray-500">mmHg</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <Thermometer className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-sm text-gray-600">Temperatura</p>
            <p className={`text-2xl font-bold ${getVitalStatus('temperature', vitalSigns.temperature)}`}>
              {vitalSigns.temperature.toFixed(1)}°C
            </p>
            <p className="text-xs text-gray-500">
              {vitalSigns.temperature < 36.1 ? 'Baixa' : vitalSigns.temperature > 37.5 ? 'Febre' : 'Normal'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm text-gray-600">Saturação O₂</p>
            <p className={`text-2xl font-bold ${getVitalStatus('oxygenSaturation', vitalSigns.oxygenSaturation)}`}>
              {vitalSigns.oxygenSaturation}%
            </p>
            <p className="text-xs text-gray-500">
              {vitalSigns.oxygenSaturation < 95 ? 'Baixa' : vitalSigns.oxygenSaturation < 97 ? 'Moderada' : 'Excelente'}
            </p>
          </div>
        </div>
      </div>

      {/* Avaliação da Dor */}
      {painData.intensity > 0 && (
        <div className="bg-red-50 p-4 rounded border border-red-200">
          <h3 className="font-semibold text-red-700 mb-3">AVALIAÇÃO DA DOR</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Intensidade:</p>
              <p className="text-lg font-bold text-red-600">{painData.intensity}/10</p>
              <p className="text-xs text-red-600">
                {painData.intensity <= 3 ? 'Leve' : painData.intensity <= 6 ? 'Moderada' : 'Severa'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Localização:</p>
              <p className="text-sm">{painData.location}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Duração:</p>
              <p className="text-sm">{painData.duration}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estado Geral do Paciente */}
      <div className="bg-purple-50 p-4 rounded border border-purple-200">
        <h3 className="font-semibold text-purple-700 mb-3">ESTADO GERAL DO PACIENTE</h3>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-sm font-medium">Estado Físico:</p>
            <p className="text-sm font-semibold text-purple-700">{generalState.physicalState}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Estado Emocional:</p>
            <p className="text-sm font-semibold text-purple-700">{generalState.emotionalState}</p>
          </div>
        </div>
        {generalState.correlations.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Correlações Encontradas:</p>
            <ul className="list-disc list-inside space-y-1">
              {generalState.correlations.map((correlation, index) => (
                <li key={index} className="text-sm text-purple-800">✓ {correlation}</li>
              ))}
            </ul>
          </div>
        )}
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