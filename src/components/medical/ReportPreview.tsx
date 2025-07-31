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
  // Dados fixos do sistema - não editáveis
  const doctorData = {
    name: "Dr. Sistema IA Médica",
    crm: "123456SP",
    specialty: "Medicina Digital",
    clinic: "Centro de Triagem Inteligente"
  };

  const patientData = {
    name: "Paciente Sistema",
    cpf: "000.000.000-00",
    birthDate: "1990-01-01",
    phone: "(11) 99999-9999",
    email: "paciente@sistema.com"
  };

  const handleGeneratePDF = () => {
    onGeneratePDF(doctorData, patientData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Relatório Médico
          </DialogTitle>
        </DialogHeader>

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
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fechar
            </Button>
            <Button onClick={handleGeneratePDF} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};