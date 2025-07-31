import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Calendar, 
  Camera, 
  Mic, 
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react";

interface PatientData {
  fullName: string;
  birthDate: string;
  age?: number;
}

interface PreparationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (patientData: PatientData) => void;
}

const PreparationModal: React.FC<PreparationModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [patientData, setPatientData] = useState<PatientData>({
    fullName: '',
    birthDate: ''
  });
  const [equipmentChecks, setEquipmentChecks] = useState({
    camera: false,
    microphone: false
  });
  const [step, setStep] = useState<'info' | 'equipment' | 'ready'>('info');
  const [isCheckingEquipment, setIsCheckingEquipment] = useState(false);

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleBirthDateChange = (value: string) => {
    const age = value ? calculateAge(value) : undefined;
    setPatientData(prev => ({
      ...prev,
      birthDate: value,
      age
    }));
  };

  const checkEquipment = async () => {
    setIsCheckingEquipment(true);
    
    try {
      // Verificar câmera
      const videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }
      });
      setEquipmentChecks(prev => ({ ...prev, camera: true }));
      videoStream.getTracks().forEach(track => track.stop());
      
      // Verificar microfone
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setEquipmentChecks(prev => ({ ...prev, microphone: true }));
      audioStream.getTracks().forEach(track => track.stop());
      
      setStep('ready');
    } catch (error) {
      console.error('Erro ao verificar equipamentos:', error);
      setEquipmentChecks({
        camera: false,
        microphone: false
      });
    } finally {
      setIsCheckingEquipment(false);
    }
  };

  const handleComplete = () => {
    onComplete(patientData);
    onClose();
  };

  const canProceedToEquipment = patientData.fullName.trim() && patientData.birthDate;
  const canCompletePreparation = equipmentChecks.camera && equipmentChecks.microphone;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Preparação para Triagem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'info' && (
            <div className="space-y-4">
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Dados do Paciente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      placeholder="Digite seu nome completo"
                      value={patientData.fullName}
                      onChange={(e) => setPatientData(prev => ({ 
                        ...prev, 
                        fullName: e.target.value 
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={patientData.birthDate}
                      onChange={(e) => handleBirthDateChange(e.target.value)}
                    />
                    {patientData.age && (
                      <p className="text-sm text-muted-foreground">
                        Idade: {patientData.age} anos
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-muted">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Sobre o Processo de Triagem:</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        Análise facial para sinais vitais (frequência cardíaca, estado térmico)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        Análise de voz para indicadores emocionais e respiratórios
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        Questionário médico inteligente para avaliação de sintomas
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        Relatório consolidado com recomendações personalizadas
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={() => setStep('equipment')}
                disabled={!canProceedToEquipment}
                className="w-full"
              >
                Continuar para Verificação de Equipamentos
              </Button>
            </div>
          )}

          {step === 'equipment' && (
            <div className="space-y-4">
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Verificação de Equipamentos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Precisamos verificar se sua câmera e microfone estão funcionando 
                    corretamente para realizar a triagem médica.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Camera className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Câmera</span>
                      </div>
                      {equipmentChecks.camera ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Mic className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Microfone</span>
                      </div>
                      {equipmentChecks.microphone ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('info')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button 
                  onClick={checkEquipment}
                  disabled={isCheckingEquipment}
                  className="flex-1"
                >
                  {isCheckingEquipment ? 'Verificando...' : 'Verificar Equipamentos'}
                </Button>
              </div>
            </div>
          )}

          {step === 'ready' && (
            <div className="space-y-4">
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="pt-4">
                  <div className="text-center space-y-3">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <h3 className="font-semibold text-green-700">
                      Preparação Concluída!
                    </h3>
                    <p className="text-sm text-green-600">
                      Todos os equipamentos estão funcionando e os dados foram coletados.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Paciente:</span>
                    <span className="text-sm font-medium">{patientData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Idade:</span>
                    <span className="text-sm font-medium">{patientData.age} anos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Equipamentos:</span>
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      Verificados
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('equipment')}
                  className="flex-1"
                >
                  Reverificar
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={!canCompletePreparation}
                  className="flex-1"
                >
                  Iniciar Triagem
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreparationModal;