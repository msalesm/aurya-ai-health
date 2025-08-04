-- Criar tabela de perfis de usuário se não existir
-- Esta tabela já existe mas vamos garantir que tenha os campos necessários
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS emergency_contact jsonb,
ADD COLUMN IF NOT EXISTS medical_preferences jsonb,
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"shareData": false, "emailNotifications": true}'::jsonb;

-- Atualizar RLS policies para perfis se necessário
-- Já existem policies adequadas

-- Adicionar índices para melhor performance nas consultas médicas
CREATE INDEX IF NOT EXISTS idx_medical_consultations_user_created 
ON public.medical_consultations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_medical_consultations_status 
ON public.medical_consultations(status, created_at DESC);

-- Criar função para buscar histórico de consultas do usuário
CREATE OR REPLACE FUNCTION public.get_user_consultation_history(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  chief_complaint text,
  symptoms text[],
  urgency_level text,
  ai_diagnosis text,
  status text,
  assessment_score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    mc.id,
    mc.created_at,
    mc.chief_complaint,
    mc.symptoms,
    mc.urgency_level,
    mc.ai_diagnosis,
    mc.status,
    mc.assessment_score
  FROM public.medical_consultations mc
  WHERE mc.user_id = user_uuid
  ORDER BY mc.created_at DESC
  LIMIT 50;
$$;