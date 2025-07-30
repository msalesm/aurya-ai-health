import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserCog, Save } from "lucide-react";

interface MedicalConfigurationProps {
  onConfigSave: (config: MedicalConfig) => void;
  initialConfig?: MedicalConfig;
}

export interface MedicalConfig {
  doctorName: string;
  crm: string;
  clinic: string;
  signature: string;
  patientName: string;
  patientAge: string;
  patientId: string;
}

export const MedicalConfiguration: React.FC<MedicalConfigurationProps> = ({
  onConfigSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<MedicalConfig>(initialConfig || {
    doctorName: 'Dr. Maria Silva',
    crm: 'CRM/SP 123456',
    clinic: 'Clínica MedIA - Inteligência Artificial Médica',
    signature: 'Dra. Maria Silva\nCRM/SP 123456\nEspecialista em Medicina Interna',
    patientName: 'João da Silva',
    patientAge: '45',
    patientId: 'PAT-001'
  });

  const handleSave = () => {
    onConfigSave(config);
  };

  const updateField = (field: keyof MedicalConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Configuração Médica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="doctorName">Nome do Médico</Label>
            <Input
              id="doctorName"
              value={config.doctorName}
              onChange={(e) => updateField('doctorName', e.target.value)}
              placeholder="Dr. João Silva"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crm">CRM</Label>
            <Input
              id="crm"
              value={config.crm}
              onChange={(e) => updateField('crm', e.target.value)}
              placeholder="CRM/SP 123456"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clinic">Clínica/Hospital</Label>
          <Input
            id="clinic"
            value={config.clinic}
            onChange={(e) => updateField('clinic', e.target.value)}
            placeholder="Nome da instituição"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="patientName">Nome do Paciente</Label>
            <Input
              id="patientName"
              value={config.patientName}
              onChange={(e) => updateField('patientName', e.target.value)}
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patientAge">Idade</Label>
            <Input
              id="patientAge"
              value={config.patientAge}
              onChange={(e) => updateField('patientAge', e.target.value)}
              placeholder="45"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="patientId">ID do Paciente</Label>
          <Input
            id="patientId"
            value={config.patientId}
            onChange={(e) => updateField('patientId', e.target.value)}
            placeholder="PAT-001"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signature">Assinatura Digital</Label>
          <Textarea
            id="signature"
            value={config.signature}
            onChange={(e) => updateField('signature', e.target.value)}
            placeholder="Informações da assinatura digital"
            rows={3}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Salvar Configuração
        </Button>
      </CardContent>
    </Card>
  );
};