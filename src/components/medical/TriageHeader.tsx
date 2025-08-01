import { Heart, Shield, Activity } from "lucide-react";

const TriageHeader = () => {
  return (
    <div className="bg-gradient-medical text-primary-foreground py-12 px-6 rounded-2xl shadow-medical mb-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-white/10 rounded-full">
            <Heart className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Aurya</h1>
          <div className="p-3 bg-white/10 rounded-full">
            <Activity className="h-8 w-8" />
          </div>
        </div>
        
        <p className="text-xl md:text-2xl mb-4 text-primary-light">
          Triagem Médica Inteligente com IA
        </p>
        
        <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
          Análise multimodal de saúde com inteligência artificial. 
          Avaliação completa de voz, sinais vitais e sintomas em tempo real.
        </p>
        
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span>Seguro e Confidencial</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <span>Análise em Tempo Real</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriageHeader;