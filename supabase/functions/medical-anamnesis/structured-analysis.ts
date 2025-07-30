// Funções auxiliares para análise estruturada da anamnese

export function calculateStructuredUrgency(answers: Record<string, any>): string {
  let score = 0;
  
  // Sintomas críticos
  if (answers.breathing === 'sim') score += 30;
  if (answers.chest_pain === 'sim') score += 25;
  if (answers.urgency_feeling === 'sim') score += 20;
  if (answers.fever === 'sim') score += 15;
  
  // Intensidade da dor
  if (answers.pain_scale >= 8) score += 20;
  else if (answers.pain_scale >= 6) score += 10;
  
  // Duração crítica
  if (answers.symptom_duration === 'Menos de 1 dia' && score > 20) score += 10;
  
  if (score >= 70) return 'crítica';
  if (score >= 50) return 'alta';
  if (score >= 30) return 'média';
  return 'baixa';
}

export function extractStructuredSymptoms(answers: Record<string, any>): string[] {
  const symptoms = [];
  
  if (answers.main_symptom) symptoms.push(answers.main_symptom);
  if (answers.fever === 'sim') symptoms.push('Febre');
  if (answers.breathing === 'sim') symptoms.push('Dificuldade respiratória');
  if (answers.chest_pain === 'sim') symptoms.push('Dor no peito');
  if (answers.pain_scale > 0) symptoms.push(`Dor nível ${answers.pain_scale}/10`);
  
  return symptoms;
}

export function generateStructuredRecommendations(answers: Record<string, any>): string[] {
  const recommendations = [];
  const urgency = calculateStructuredUrgency(answers);
  
  if (urgency === 'crítica') {
    recommendations.push('Procure atendimento de emergência IMEDIATAMENTE');
    recommendations.push('Considere chamar ambulância');
  } else if (urgency === 'alta') {
    recommendations.push('Procure atendimento médico urgente nas próximas horas');
    recommendations.push('Monitore os sintomas de perto');
  } else if (urgency === 'média') {
    recommendations.push('Agende consulta médica em 24-48 horas');
  } else {
    recommendations.push('Considere consulta médica de rotina');
  }
  
  if (answers.medications === 'sim') {
    recommendations.push('Leve lista de medicamentos à consulta');
  }
  
  if (answers.chronic_conditions === 'sim') {
    recommendations.push('Relate histórico médico ao profissional');
  }
  
  return recommendations;
}

export function generateStructuredSummary(answers: Record<string, any>): string {
  const urgency = calculateStructuredUrgency(answers);
  const mainSymptom = answers.main_symptom || 'sintoma não especificado';
  const duration = answers.symptom_duration || 'duração não informada';
  
  return `Paciente apresenta ${mainSymptom} com duração de ${duration}. Nível de urgência: ${urgency}. ${
    urgency === 'crítica' ? 'ATENÇÃO: Busque atendimento imediato!' : 
    urgency === 'alta' ? 'Recomenda-se avaliação médica urgente.' :
    'Situação sob controle, acompanhamento recomendado.'
  }`;
}