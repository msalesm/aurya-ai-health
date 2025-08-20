import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { ManchesterLevel, getManchesterLevelByScore, getManchesterLevelByName } from '@/utils/manchesterColors';

interface ManchesterBadgeProps {
  level?: ManchesterLevel;
  score?: number;
  urgencyName?: string;
  showTimeLimit?: boolean;
  className?: string;
}

export const ManchesterBadge: React.FC<ManchesterBadgeProps> = ({
  level,
  score,
  urgencyName,
  showTimeLimit = false,
  className = ''
}) => {
  // Determinar o nível com base nos props fornecidos
  let manchesterLevel: ManchesterLevel;
  
  if (level) {
    manchesterLevel = level;
  } else if (typeof score === 'number') {
    manchesterLevel = getManchesterLevelByScore(score);
  } else if (urgencyName) {
    manchesterLevel = getManchesterLevelByName(urgencyName);
  } else {
    // Default para não urgente
    manchesterLevel = getManchesterLevelByName('blue');
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Badge
        style={{
          backgroundColor: manchesterLevel.color,
          color: manchesterLevel.textColor,
          border: `1px solid ${manchesterLevel.color}`
        }}
        className="font-semibold"
      >
        {manchesterLevel.name}
      </Badge>
      
      {showTimeLimit && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{manchesterLevel.timeLimit}</span>
        </div>
      )}
    </div>
  );
};

interface ManchesterIndicatorProps {
  level: ManchesterLevel;
  showDescription?: boolean;
  className?: string;
}

export const ManchesterIndicator: React.FC<ManchesterIndicatorProps> = ({
  level,
  showDescription = false,
  className = ''
}) => {
  return (
    <div 
      className={`p-4 rounded-lg border-l-4 ${className}`}
      style={{
        backgroundColor: level.bgColor,
        borderLeftColor: level.color
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <ManchesterBadge level={level} />
        <div className="flex items-center gap-1 text-sm font-medium">
          <Clock className="h-4 w-4" />
          <span>{level.timeLimit}</span>
        </div>
      </div>
      
      {showDescription && (
        <p className="text-sm text-muted-foreground mt-2">
          {level.description}
        </p>
      )}
    </div>
  );
};