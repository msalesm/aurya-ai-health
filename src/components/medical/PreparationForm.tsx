import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Video, 
  CheckCircle, 
  AlertTriangle, 
  User,
  Calendar,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PreparationFormProps {
  onComplete: (userData: any) => void;
}

interface UserData {
  name: string;
  age: string;
  microphoneStatus: 'checking' | 'working' | 'error';
  cameraStatus: 'checking' | 'working' | 'error';
}

const PreparationForm = ({ onComplete }: PreparationFormProps) => {
  const [userData, setUserData] = useState<UserData>({
    name: '',
    age: '',
    microphoneStatus: 'checking',
    cameraStatus: 'checking'
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [isTestingDevices, setIsTestingDevices] = useState(false);

  useEffect(() => {
    // Executar teste automático na montagem
    testDevices();
  }, []);

  useEffect(() => {
    // Verificar se o formulário está válido
    const isValid = userData.name.trim().length > 0 && 
                   userData.age.trim().length > 0 && 
                   Number(userData.age) > 0 && 
                   Number(userData.age) < 120 &&
                   userData.microphoneStatus === 'working' &&
                   userData.cameraStatus === 'working';
    setIsFormValid(isValid);
  }, [userData]);

  const testDevices = async () => {
    setIsTestingDevices(true);
    
    // Testar microfone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setUserData(prev => ({ ...prev, microphoneStatus: 'working' }));
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      setUserData(prev => ({ ...prev, microphoneStatus: 'error' }));
    }

    // Testar câmera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setUserData(prev => ({ ...prev, cameraStatus: 'working' }));
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setUserData(prev => ({ ...prev, cameraStatus: 'error' }));
    }

    setIsTestingDevices(false);
  };

  const handleSubmit = () => {
    if (isFormValid) {
      onComplete({
        name: userData.name,
        age: Number(userData.age),
        deviceTests: {
          microphone: userData.microphoneStatus === 'working',
          camera: userData.cameraStatus === 'working'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <Badge variant="default" className="bg-green-500">Funcionando</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Testando...</Badge>;
    }
  };

  return (
    <Card className="shadow-card max-w-2xl mx-auto animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Shield className="h-6 w-6 text-primary" />
          Preparação para Triagem
        </CardTitle>
        <p className="text-muted-foreground">
          Antes de começarmos, precisamos de algumas informações e verificar seus equipamentos.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do Usuário */}
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                type="text"
                value={userData.name}
                onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite seu nome completo"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age">Idade *</Label>
              <Input
                id="age"
                type="number"
                value={userData.age}
                onChange={(e) => setUserData(prev => ({ ...prev, age: e.target.value }))}
                placeholder="Digite sua idade"
                min="1"
                max="120"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Teste de Equipamentos */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Verificação de Equipamentos
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mic className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">Microfone</p>
                  <p className="text-sm text-muted-foreground">Necessário para análise de voz</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(userData.microphoneStatus)}
                {getStatusBadge(userData.microphoneStatus)}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Video className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">Câmera</p>
                  <p className="text-sm text-muted-foreground">Necessária para análise facial</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(userData.cameraStatus)}
                {getStatusBadge(userData.cameraStatus)}
              </div>
            </div>
          </div>

          {(userData.microphoneStatus === 'checking' || userData.cameraStatus === 'checking') && (
            <Button 
              onClick={testDevices} 
              disabled={isTestingDevices}
              variant="outline"
              className="w-full"
            >
              {isTestingDevices ? 'Testando Equipamentos...' : 'Testar Equipamentos'}
            </Button>
          )}

          {(userData.microphoneStatus === 'error' || userData.cameraStatus === 'error') && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                ⚠️ Alguns equipamentos não funcionaram corretamente. 
                Verifique as permissões do navegador e tente novamente.
              </p>
              <Button 
                onClick={testDevices} 
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Testar Novamente
              </Button>
            </div>
          )}
        </div>

        {/* Aviso de Privacidade */}
        <div className="p-4 bg-muted/50 border border-muted rounded-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Privacidade e Segurança</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os dados coletados são processados localmente e de forma segura. 
                Suas informações pessoais e análises são mantidas confidenciais.
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Conclusão */}
        <Button 
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={cn(
            "w-full animate-slide-up transition-all duration-300",
            isFormValid && "animate-pulse-glow"
          )}
          size="lg"
          style={{ animationDelay: '0.3s' }}
        >
          {isFormValid ? 'Iniciar Triagem Médica' : 'Complete as informações acima'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PreparationForm;