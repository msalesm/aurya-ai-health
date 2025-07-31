import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  text: string;
  type: 'yes_no' | 'multiple' | 'scale' | 'text';
  options?: string[];
  category: string;
  priority: number;
  contextual?: boolean;
}

interface QuestioningState {
  currentQuestion: Question | null;
  answers: Record<string, any>;
  isGeneratingQuestion: boolean;
  isComplete: boolean;
  urgencyScore: number;
  sessionId: string;
  error: string | null;
}

interface IntelligentQuestioningProps {
  facialData?: any;
  voiceData?: any;
  patientData?: any;
}

export const useIntelligentQuestioning = ({ 
  facialData, 
  voiceData, 
  patientData 
}: IntelligentQuestioningProps = {}) => {
  const [state, setState] = useState<QuestioningState>({
    currentQuestion: null,
    answers: {},
    isGeneratingQuestion: false,
    isComplete: false,
    urgencyScore: 0,
    sessionId: `session_${Date.now()}`,
    error: null
  });

  const [questionHistory, setQuestionHistory] = useState<Question[]>([]);

  // Base questions for initial assessment
  const baseQuestions: Question[] = [
    {
      id: 'chief_complaint',
      text: 'Qual é o principal motivo que o trouxe aqui hoje?',
      type: 'text',
      category: 'sintoma_principal',
      priority: 10
    },
    {
      id: 'pain_presence',
      text: 'Você está sentindo alguma dor no momento?',
      type: 'yes_no',
      category: 'dor',
      priority: 9
    },
    {
      id: 'breathing_difficulty',
      text: 'Você está com dificuldade para respirar?',
      type: 'yes_no',
      category: 'respiratorio',
      priority: 9
    },
    {
      id: 'chest_pain',
      text: 'Você sente dor ou desconforto no peito?',
      type: 'yes_no',
      category: 'cardiovascular',
      priority: 8
    }
  ];

  const generateNextQuestion = useCallback(async () => {
    setState(prev => ({ ...prev, isGeneratingQuestion: true, error: null }));

    try {
      // Analyze current context to generate intelligent next question
      const context = {
        answers: state.answers,
        facialData: facialData ? {
          heartRate: facialData.heartRate,
          stressLevel: facialData.stressLevel,
          thermalState: facialData.thermalState
        } : null,
        voiceData: voiceData ? {
          emotionalState: voiceData.emotionalState || voiceData.emotional_tone?.primary_emotion,
          stressLevel: voiceData.stressLevel
        } : null,
        questionHistory: questionHistory.map(q => q.id),
        urgencyScore: state.urgencyScore
      };

      // Call AI service to generate contextual question
      const { data, error } = await supabase.functions.invoke('intelligent-anamnesis', {
        body: {
          context,
          sessionId: state.sessionId,
          requestType: 'generate_question',
          patientAge: patientData?.age
        }
      });

      if (error) throw error;

      if (data.isComplete) {
        setState(prev => ({ 
          ...prev, 
          isComplete: true, 
          isGeneratingQuestion: false,
          urgencyScore: data.finalUrgencyScore || prev.urgencyScore
        }));
        return;
      }

      const nextQuestion: Question = data.question || getNextBaseQuestion();
      
      setState(prev => ({ 
        ...prev, 
        currentQuestion: nextQuestion,
        isGeneratingQuestion: false,
        urgencyScore: data.currentUrgencyScore || prev.urgencyScore
      }));

      setQuestionHistory(prev => [...prev, nextQuestion]);

    } catch (error) {
      console.error('Error generating question:', error);
      
      // Fallback to base questions
      const nextQuestion = getNextBaseQuestion();
      setState(prev => ({ 
        ...prev, 
        currentQuestion: nextQuestion,
        isGeneratingQuestion: false,
        error: 'Usando perguntas padrão devido a erro na IA'
      }));
      
      if (nextQuestion) {
        setQuestionHistory(prev => [...prev, nextQuestion]);
      }
    }
  }, [state.answers, facialData, voiceData, state.sessionId, state.urgencyScore, questionHistory, patientData]);

  const getNextBaseQuestion = (): Question | null => {
    const answeredIds = Object.keys(state.answers);
    const unansweredQuestions = baseQuestions.filter(q => !answeredIds.includes(q.id));
    
    if (unansweredQuestions.length === 0) {
      setState(prev => ({ ...prev, isComplete: true }));
      return null;
    }
    
    return unansweredQuestions.sort((a, b) => b.priority - a.priority)[0];
  };

  const answerQuestion = useCallback(async (answer: any) => {
    if (!state.currentQuestion) return;

    const newAnswers = { 
      ...state.answers, 
      [state.currentQuestion.id]: answer 
    };

    setState(prev => ({ 
      ...prev, 
      answers: newAnswers,
      currentQuestion: null
    }));

    // Calculate preliminary urgency score
    const preliminaryUrgency = calculatePreliminaryUrgency(newAnswers, facialData, voiceData);
    setState(prev => ({ ...prev, urgencyScore: preliminaryUrgency }));

    // Check if we need to ask more questions based on urgency
    if (preliminaryUrgency >= 70 && Object.keys(newAnswers).length >= 3) {
      setState(prev => ({ ...prev, isComplete: true }));
      return;
    }

    // Generate next question
    setTimeout(() => generateNextQuestion(), 500);
  }, [state.currentQuestion, state.answers, facialData, voiceData, generateNextQuestion]);

  const calculatePreliminaryUrgency = (
    answers: Record<string, any>,
    facial?: any,
    voice?: any
  ): number => {
    let score = 0;
    
    // Critical symptoms
    if (answers.breathing_difficulty === 'sim') score += 30;
    if (answers.chest_pain === 'sim') score += 25;
    if (answers.pain_presence === 'sim') score += 15;
    
    // Biometric data influence
    if (facial?.heartRate > 100) score += 10;
    if (facial?.stressLevel > 7) score += 8;
    if (voice?.stressLevel > 7) score += 7;
    if (facial?.thermalState === 'possible_fever') score += 10;
    
    // Text analysis of chief complaint
    const complaint = answers.chief_complaint?.toLowerCase() || '';
    if (complaint.includes('dor forte') || complaint.includes('dor intensa')) score += 15;
    if (complaint.includes('febre') || complaint.includes('fiebre')) score += 10;
    if (complaint.includes('tontura') || complaint.includes('desmaio')) score += 12;
    
    return Math.min(score, 100);
  };

  // Initialize first question
  useEffect(() => {
    if (!state.currentQuestion && !state.isComplete && questionHistory.length === 0) {
      generateNextQuestion();
    }
  }, [generateNextQuestion, state.currentQuestion, state.isComplete, questionHistory.length]);

  const resetQuestioning = useCallback(() => {
    setState({
      currentQuestion: null,
      answers: {},
      isGeneratingQuestion: false,
      isComplete: false,
      urgencyScore: 0,
      sessionId: `session_${Date.now()}`,
      error: null
    });
    setQuestionHistory([]);
  }, []);

  const skipQuestion = useCallback(() => {
    generateNextQuestion();
  }, [generateNextQuestion]);

  const getFinalAnalysis = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-anamnesis', {
        body: {
          context: {
            answers: state.answers,
            facialData,
            voiceData,
            urgencyScore: state.urgencyScore
          },
          sessionId: state.sessionId,
          requestType: 'final_analysis'
        }
      });

      if (error) throw error;

      return {
        answers: state.answers,
        urgencyScore: state.urgencyScore,
        urgencyLevel: getUrgencyLevel(state.urgencyScore),
        analysis: data.analysis,
        recommendations: data.recommendations,
        symptoms: data.symptoms,
        questionCount: questionHistory.length
      };
    } catch (error) {
      console.error('Error getting final analysis:', error);
      
      // Fallback analysis
      return {
        answers: state.answers,
        urgencyScore: state.urgencyScore,
        urgencyLevel: getUrgencyLevel(state.urgencyScore),
        analysis: 'Análise baseada em respostas estruturadas',
        recommendations: generateBasicRecommendations(state.urgencyScore),
        symptoms: extractSymptomsFromAnswers(state.answers),
        questionCount: questionHistory.length
      };
    }
  }, [state.answers, state.urgencyScore, state.sessionId, facialData, voiceData, questionHistory.length]);

  const getUrgencyLevel = (score: number): string => {
    if (score >= 70) return 'crítica';
    if (score >= 50) return 'alta';
    if (score >= 30) return 'média';
    return 'baixa';
  };

  const generateBasicRecommendations = (score: number): string[] => {
    if (score >= 70) return ['Procurar atendimento médico de emergência imediatamente'];
    if (score >= 50) return ['Procurar atendimento médico urgente nas próximas horas'];
    if (score >= 30) return ['Agendar consulta médica em 24-48 horas'];
    return ['Monitoramento e autocuidado'];
  };

  const extractSymptomsFromAnswers = (answers: Record<string, any>): string[] => {
    const symptoms: string[] = [];
    
    if (answers.pain_presence === 'sim') symptoms.push('Dor');
    if (answers.breathing_difficulty === 'sim') symptoms.push('Dificuldade respiratória');
    if (answers.chest_pain === 'sim') symptoms.push('Dor no peito');
    if (answers.chief_complaint) symptoms.push(answers.chief_complaint);
    
    return symptoms.filter(Boolean);
  };

  return {
    currentQuestion: state.currentQuestion,
    answers: state.answers,
    isGeneratingQuestion: state.isGeneratingQuestion,
    isComplete: state.isComplete,
    urgencyScore: state.urgencyScore,
    error: state.error,
    questionCount: questionHistory.length,
    answerQuestion,
    skipQuestion,
    resetQuestioning,
    getFinalAnalysis
  };
};