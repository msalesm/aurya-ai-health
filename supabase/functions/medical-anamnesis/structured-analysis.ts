// Funções utilitárias para análise estruturada de anamnese médica

export function calculateStructuredUrgency(answers: Record<string, any>): string {
  // SEMPRE verificar combinação crítica primeiro (alinhado com frontend)
  if ((answers.chest_pain === 'Sim' || answers.chest_pain === 'sim') && 
      (answers.breathing === 'Sim' || answers.breathing_difficulty === 'sim' || answers.breathing === 'Sim')) {
    return 'crítica'; // Manchester Vermelho - Emergência imediata
  }

  let score = 0;

  // Sintomas críticos individuais que levam à emergência (alinhado com frontend)
  if (answers.breathing === 'Sim' || answers.breathing_difficulty === 'sim') score = 90;
  else if (answers.chest_pain === 'Sim' || answers.chest_pain === 'sim') score = 70;
  
  // Sintomas extremamente graves
  if (answers.consciousness_loss === 'sim') score = 95;
  if (answers.severe_bleeding === 'sim') score = 95;

  // Intensidade da dor pode elevar o nível
  const painIntensity = Number(answers.pain_intensity || answers.intense_pain);
  if (painIntensity >= 9) score = Math.max(score, 85);
  else if (painIntensity >= 7) score = Math.max(score, 60);
  else if (painIntensity >= 5) score = Math.max(score, 40);

  // Outros sintomas graves
  if (answers.fever && answers.fever >= 39) score = Math.max(score, 50);
  if (answers.fever_check === 'Sim') score = Math.max(score, 30);
  if (answers.vomiting === 'sim') score = Math.max(score, 25);

  // Sintomas agudos elevam urgência se já há outros sintomas
  if ((answers.symptom_duration === 'Menos de 1 dia' || answers.symptom_duration === 'menos_2_horas') && score > 40) {
    score = Math.min(score + 15, 100);
  }

  // Classificação alinhada com Manchester e frontend
  if (score >= 80) return 'crítica';    // Manchester Vermelho
  if (score >= 60) return 'alta';       // Manchester Laranja
  if (score >= 40) return 'média';      // Manchester Amarelo
  return 'baixa';                       // Manchester Verde/Azul
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

  // Recomendações alinhadas com frontend
  switch (urgency) {
    case 'crítica':
      recommendations.push('🚨 EMERGÊNCIA: Procurar atendimento médico IMEDIATAMENTE');
      recommendations.push('Ligar para 192 (SAMU) ou dirigir-se ao pronto-socorro AGORA');
      recommendations.push('NÃO aguardar - risco iminente à vida');
      if ((answers.chest_pain === 'Sim' || answers.chest_pain === 'sim') && 
          (answers.breathing === 'Sim' || answers.breathing_difficulty === 'sim' || answers.breathing === 'Sim')) {
        recommendations.push('⚠️ Possível emergência cardiorrespiratória - ação imediata necessária');
      }
      break;
    case 'alta':
      recommendations.push('⚠️ MUITO URGENTE: Procurar atendimento em até 10 minutos');
      recommendations.push('Dirigir-se ao pronto-socorro sem demora');
      recommendations.push('Condição pode deteriorar rapidamente');
      break;
    case 'média':
      recommendations.push('⏰ URGENTE: Procurar atendimento em até 60 minutos');
      recommendations.push('Dirigir-se à UPA ou pronto-socorro');
      recommendations.push('Monitorar sintomas continuamente');
      break;
    case 'baixa':
      recommendations.push('Procurar atendimento médico em algumas horas');
      recommendations.push('Pode aguardar em UPA ou agendar consulta');
      recommendations.push('Observar evolução dos sintomas');
      break;
  }

  if (answers.medications === 'sim') {
    recommendations.push('💊 Levar lista completa de medicamentos atuais');
  }
  
  if (answers.chronic_conditions === 'sim') {
    recommendations.push('📋 Informar sobre condições crônicas pré-existentes');
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