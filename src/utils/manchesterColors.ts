// Protocolo de Manchester - Sistema de Triagem
export interface ManchesterLevel {
  code: number;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  timeLimit: string;
  description: string;
  scoreRange: [number, number];
}

export const MANCHESTER_LEVELS: Record<string, ManchesterLevel> = {
  red: {
    code: 1,
    name: 'Emergência',
    color: '#DC2626', // red-600
    bgColor: '#FEE2E2', // red-50
    textColor: '#FFFFFF',
    timeLimit: 'Imediato',
    description: 'Risco iminente de vida',
    scoreRange: [9, 10]
  },
  orange: {
    code: 2,
    name: 'Muito Urgente',
    color: '#EA580C', // orange-600  
    bgColor: '#FED7AA', // orange-100
    textColor: '#FFFFFF',
    timeLimit: '10 minutos',
    description: 'Condições que podem deteriorar rapidamente',
    scoreRange: [7, 8]
  },
  yellow: {
    code: 3,
    name: 'Urgente',
    color: '#CA8A04', // yellow-600
    bgColor: '#FEF3C7', // yellow-100
    textColor: '#000000',
    timeLimit: '60 minutos',
    description: 'Condições que precisam de atenção médica',
    scoreRange: [5, 6]
  },
  green: {
    code: 4,
    name: 'Pouco Urgente',
    color: '#16A34A', // green-600
    bgColor: '#DCFCE7', // green-100
    textColor: '#FFFFFF',
    timeLimit: '120 minutos',
    description: 'Condições menos urgentes',
    scoreRange: [3, 4]
  },
  blue: {
    code: 5,
    name: 'Não Urgente',
    color: '#2563EB', // blue-600
    bgColor: '#DBEAFE', // blue-100
    textColor: '#FFFFFF',
    timeLimit: '240 minutos',
    description: 'Condições não urgentes',
    scoreRange: [1, 2]
  }
};

export const getManchesterLevelByScore = (score: number): ManchesterLevel => {
  for (const level of Object.values(MANCHESTER_LEVELS)) {
    if (score >= level.scoreRange[0] && score <= level.scoreRange[1]) {
      return level;
    }
  }
  // Default para não urgente se score for 0 ou inválido
  return MANCHESTER_LEVELS.blue;
};

export const getManchesterLevelByName = (name: string): ManchesterLevel => {
  const normalizedName = name.toLowerCase();
  return MANCHESTER_LEVELS[normalizedName] || MANCHESTER_LEVELS.blue;
};

export const calculateUrgencyScore = (factors: {
  heartRate?: number;
  stressLevel?: number;
  painLevel?: number;
  breathingDifficulty?: boolean;
  severeSymptoms?: string[];
  mentalState?: 'normal' | 'confused' | 'agitated';
}): number => {
  let score = 0;
  
  // Frequência cardíaca
  if (factors.heartRate) {
    if (factors.heartRate > 120) score += 3;
    else if (factors.heartRate > 100) score += 2;
    else if (factors.heartRate < 50) score += 2;
  }
  
  // Nível de estresse
  if (factors.stressLevel) {
    if (factors.stressLevel > 8) score += 2;
    else if (factors.stressLevel > 6) score += 1;
  }
  
  // Dor
  if (factors.painLevel) {
    if (factors.painLevel > 8) score += 3;
    else if (factors.painLevel > 6) score += 2;
    else if (factors.painLevel > 4) score += 1;
  }
  
  // Dificuldade respiratória
  if (factors.breathingDifficulty) score += 3;
  
  // Sintomas severos
  if (factors.severeSymptoms && factors.severeSymptoms.length > 0) {
    score += Math.min(factors.severeSymptoms.length, 3);
  }
  
  // Estado mental
  if (factors.mentalState === 'confused') score += 2;
  else if (factors.mentalState === 'agitated') score += 1;
  
  return Math.min(score, 10); // Cap at 10
};