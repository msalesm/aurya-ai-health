import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MedicalReportTemplate } from "./MedicalReportTemplate";
import { Download, Edit, Eye, Save } from "lucide-react";
import { format } from "date-fns";

interface ReportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  clinicalReport: any;
  onGeneratePDF: (doctorData: any, patientData: any) => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  isOpen,
  onClose,
  clinicalReport,
  onGeneratePDF
}) => {
  const [isEditing, setIsEditing] = useState(true);
  const [doctorData, setDoctorData] = useState({
    name: "Dr. João Silva",
    crm: "12345SP",
    specialty: "Clínica Médica",
    clinic: "Clínica Medical AI"
  });

  const [patientData, setPatientData] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    phone: "",
    email: ""
  });

  const handleDoctorChange = (field: string, value: string) => {
    setDoctorData(prev => ({ ...prev, [field]: value }));
  };

  const handlePatientChange = (field: string, value: string) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return doctorData.name && doctorData.crm && doctorData.specialty && 
           patientData.name && patientData.cpf && patientData.birthDate;
  };

  const handleSaveAndPreview = () => {
    if (isFormValid()) {
      setIsEditing(false);
    }
  };

  const handleGeneratePDF = () => {
    onGeneratePDF(doctorData, patientData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit className="h-5 w-5" />
                Dados do Relatório Médico
              </>
            ) : (
              <>
                <Eye className="h-5 w-5" />
                Preview do Relatório
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-6">
            {/* Dados do Médico */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Médico Responsável</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="doctor-name">Nome Completo *</Label>
                    <Input
                      id="doctor-name"
                      value={doctorData.name}
                      onChange={(e) => handleDoctorChange("name", e.target.value)}
                      placeholder="Dr. João Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-crm">CRM *</Label>
                    <Input
                      id="doctor-crm"
                      value={doctorData.crm}
                      onChange={(e) => handleDoctorChange("crm", e.target.value)}
                      placeholder="12345SP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-specialty">Especialidade *</Label>
                    <Input
                      id="doctor-specialty"
                      value={doctorData.specialty}
                      onChange={(e) => handleDoctorChange("specialty", e.target.value)}
                      placeholder="Clínica Médica"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-clinic">Clínica/Hospital</Label>
                    <Input
                      id="doctor-clinic"
                      value={doctorData.clinic}
                      onChange={(e) => handleDoctorChange("clinic", e.target.value)}
                      placeholder="Hospital São Francisco"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados do Paciente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Paciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient-name">Nome Completo *</Label>
                    <Input
                      id="patient-name"
                      value={patientData.name}
                      onChange={(e) => handlePatientChange("name", e.target.value)}
                      placeholder="Maria Santos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient-cpf">CPF *</Label>
                    <Input
                      id="patient-cpf"
                      value={patientData.cpf}
                      onChange={(e) => {
                        // Format CPF as user types
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 11) {
                          value = value.replace(/(\d{3})(\d)/, '$1.$2');
                          value = value.replace(/(\d{3})(\d)/, '$1.$2');
                          value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                        }
                        handlePatientChange("cpf", value);
                      }}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient-birth">Data de Nascimento *</Label>
                    <Input
                      id="patient-birth"
                      type="date"
                      value={patientData.birthDate}
                      onChange={(e) => handlePatientChange("birthDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient-phone">Telefone</Label>
                    <Input
                      id="patient-phone"
                      value={patientData.phone}
                      onChange={(e) => {
                        // Format phone as user types
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 11) {
                          value = value.replace(/(\d{2})(\d)/, '($1) $2');
                          value = value.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
                        }
                        handlePatientChange("phone", value);
                      }}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="patient-email">E-mail</Label>
                    <Input
                      id="patient-email"
                      type="email"
                      value={patientData.email}
                      onChange={(e) => handlePatientChange("email", e.target.value)}
                      placeholder="maria@email.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Importante:</strong> Todos os campos marcados com * são obrigatórios para gerar o relatório médico.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveAndPreview} 
                disabled={!isFormValid()}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Visualizar Relatório
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview do Relatório */}
            <div className="border rounded-lg bg-white">
              <MedicalReportTemplate
                doctorData={doctorData}
                patientData={patientData}
                clinicalReport={clinicalReport}
                timestamp={clinicalReport.timestamp}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Editar Dados
              </Button>
              <Button onClick={handleGeneratePDF} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};