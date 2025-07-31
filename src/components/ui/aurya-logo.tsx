import React from 'react';

interface AuryaLogoProps {
  variant?: 'full' | 'horizontal' | 'symbol';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AuryaLogo: React.FC<AuryaLogoProps> = ({ 
  variant = 'horizontal', 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8', 
    lg: 'h-12',
    xl: 'h-16'
  };

  const LogoSymbol = ({ className: symbolClass = '' }) => (
    <svg 
      viewBox="0 0 48 48" 
      className={`${symbolClass}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Coração com pulso cardíaco */}
      <path
        d="M24 42C24 42 40 30 40 18C40 14 37 10 33 10C29 10 26 12 24 16C22 12 19 10 15 10C11 10 8 14 8 18C8 30 24 42 24 42Z"
        fill="url(#heartGradient)"
      />
      
      {/* Linha de pulso atravessando o coração */}
      <path
        d="M6 24L12 24L15 18L18 30L21 12L24 36L27 6L30 30L33 18L36 24L42 24"
        stroke="hsl(var(--primary-light))"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Elementos de IA - pontos conectados */}
      <circle cx="12" cy="12" r="2" fill="hsl(var(--accent))" opacity="0.8" />
      <circle cx="36" cy="12" r="2" fill="hsl(var(--accent))" opacity="0.8" />
      <circle cx="12" cy="36" r="2" fill="hsl(var(--accent))" opacity="0.8" />
      <circle cx="36" cy="36" r="2" fill="hsl(var(--accent))" opacity="0.8" />
      
      {/* Conexões dos pontos IA */}
      <path
        d="M12 12L36 12M12 12L12 36M36 12L36 36M12 36L36 36"
        stroke="hsl(var(--accent))"
        strokeWidth="1"
        opacity="0.4"
        strokeDasharray="2,2"
      />
      
      <defs>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
        </linearGradient>
      </defs>
    </svg>
  );

  if (variant === 'symbol') {
    return <LogoSymbol className={`${sizeClasses[size]} ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoSymbol className={sizeClasses[size]} />
      
      <div className="flex flex-col">
        <span className="font-bold text-2xl text-primary-foreground tracking-tight">
          Aurya
        </span>
        {variant === 'full' && (
          <span className="text-sm text-primary-light/90 -mt-1">
            Triagem Médica Inteligente com IA
          </span>
        )}
      </div>
    </div>
  );
};

export default AuryaLogo;