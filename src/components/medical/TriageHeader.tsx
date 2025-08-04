import { Heart, Shield, Activity } from "lucide-react";

const TriageHeader = () => {
  return (
    <header className="bg-gradient-medical text-primary-foreground py-12 px-6 rounded-2xl shadow-medical mb-8" role="banner">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-white/10 rounded-full" aria-hidden="true">
            <Heart className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Triia</h1>
          <div className="p-3 bg-white/10 rounded-full" aria-hidden="true">
            <Activity className="h-8 w-8" />
          </div>
        </div>
        
        <p className="text-xl md:text-2xl mb-4 text-primary-light" aria-describedby="triia-description">
          Triagem Médica Inteligente com IA
        </p>
        
        <p id="triia-description" className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
          Análise multimodal de saúde com inteligência artificial. 
          Avaliação completa de voz, sinais vitais e sintomas em tempo real.
        </p>
        
        <div className="flex items-center justify-center gap-6 text-sm" role="list" aria-label="Recursos principais">
          <div className="flex items-center gap-2" role="listitem">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <span>Seguro e Confidencial</span>
          </div>
          <div className="flex items-center gap-2" role="listitem">
            <Activity className="h-5 w-5" aria-hidden="true" />
            <span>Análise em Tempo Real</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TriageHeader;