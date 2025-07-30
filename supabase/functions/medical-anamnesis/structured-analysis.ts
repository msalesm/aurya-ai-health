// Funções utilitárias para análise estruturada de anamnese médica

export function calculateStructuredUrgency(answers: Record<string, any>): string {
  let urgencyScore = 0;

  // Sintomas críticos (peso 4)
  if (answers.chest_pain === 'sim') urgencyScore += 4;
  if (answers.breathing_difficulty === 'sim') urgencyScore += 4;
  if (answers.consciousness_loss === 'sim') urgencyScore += 4;
  if (answers.severe_bleeding === 'sim') urgencyScore += 4;

  // Sintomas graves (peso 3)
  if (answers.intense_pain && answers.intense_pain >= 8) urgencyScore += 3;
  if (answers.fever && answers.fever >= 39) urgencyScore += 3;
  if (answers.vomiting === 'sim') urgencyScore += 2;

  // Duração dos sintomas (peso 2)
  if (answers.symptom_duration === 'menos_2_horas') urgencyScore += 2;
  if (answers.symptom_duration === '2_6_horas') urgencyScore += 1;

  // Classificar urgência
  if (urgencyScore >= 8) return 'crítica';
  if (urgencyScore >= 5) return 'alta';
  if (urgencyScore >= 2) return 'média';
  return 'baixa';
}

export function extractStructuredSymptoms(answers: Record<string, any>): string[] {
  const symptoms = [];
  
  if (answers.main_symptom) symptoms.push(answers.main_symptom);
  if (answers.fever === 'sim') symptoms.push('Febre');
  if (answers.breathing_difficulty === 'sim') symptoms.push('Dificuldade respiratória');
  if (answers.chest_pain === 'sim') symptoms.push('Dor no peito');
  if (answers.intense_pain) symptoms.push(`Dor intensa (escala ${answers.intense_pain})`);
  
  return symptoms;
}

export function generateStructuredRecommendations(answers: Record<string, any>): string[] {
  const urgency = calculateStructuredUrgency(answers);
  const recommendations = [];

  switch (urgency) {
    case 'crítica':
      recommendations.push('EMERGÊNCIA: Procure atendimento médico imediatamente');
      recommendations.push('Ligue para o SAMU (192) se necessário');
      break;
    case 'alta':
      recommendations.push('Busque atendimento médico urgente nas próximas 2-4 horas');
      recommendations.push('Vá ao pronto-socorro se os sintomas piorarem');
      break;
    case 'média':
      recommendations.push('Agende consulta médica nas próximas 24-48 horas');
      recommendations.push('Monitore os sintomas');
      break;
    default:
      recommendations.push('Monitore os sintomas e considere teleconsulta');
      recommendations.push('Procure atendimento se houver piora');
  }

  if (answers.medications === 'sim') {
    recommendations.push('Informe ao médico sobre medicamentos em uso');
  }
  
  if (answers.chronic_conditions === 'sim') {
    recommendations.push('Relate condições crônicas existentes');
  }

  return recommendations;
}

export function generateStructuredSummary(answers: Record<string, any>): string {
  const urgency = calculateStructuredUrgency(answers);
  const mainSymptom = answers.main_symptom || 'sintoma relatado';
  const duration = answers.symptom_duration || 'duração não especificada';
  
  return `Paciente relata ${mainSymptom} com ${duration}. Classificação de urgência: ${urgency}. ${
    urgency === 'crítica' ? 'ATENÇÃO MÉDICA IMEDIATA NECESSÁRIA.' : 
    urgency === 'alta' ? 'Requer avaliação médica urgente.' :
    'Acompanhamento médico recomendado.'
  }`;
}