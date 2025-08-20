/**
 * Input Validation Schemas and Utilities
 * Provides comprehensive validation for medical data inputs
 */

import { z } from 'zod';

// Base validation schemas
export const baseValidation = {
  // UUID validation
  uuid: z.string().uuid('ID inválido'),
  
  // Text validation with sanitization
  safeText: z.string()
    .min(1, 'Campo obrigatório')
    .max(1000, 'Texto muito longo')
    .refine(
      (text) => !/<script|javascript:|on\w+\s*=/i.test(text),
      'Conteúdo não permitido detectado'
    ),
  
  // Medical text (longer allowed)
  medicalText: z.string()
    .min(1, 'Campo obrigatório')
    .max(5000, 'Texto muito longo')
    .refine(
      (text) => !/<script|javascript:|on\w+\s*=/i.test(text),
      'Conteúdo não permitido detectado'
    ),
  
  // Score validation
  score: z.number()
    .min(0, 'Pontuação inválida')
    .max(10, 'Pontuação inválida'),
  
  // Age validation
  age: z.number()
    .min(0, 'Idade inválida')
    .max(150, 'Idade inválida'),
  
  // Base64 data validation
  base64Data: z.string()
    .min(100, 'Dados insuficientes')
    .max(10 * 1024 * 1024, 'Arquivo muito grande') // 10MB limit
    .refine(
      (data) => {
        try {
          // Check if it's valid base64
          atob(data.replace(/^data:[^;]+;base64,/, ''));
          return true;
        } catch {
          return false;
        }
      },
      'Dados em formato inválido'
    )
};

// Medical consultation validation
export const medicalConsultationSchema = z.object({
  userId: baseValidation.uuid,
  consultationId: baseValidation.uuid.optional(),
  message: baseValidation.medicalText,
  conversationHistory: z.array(z.object({
    type: z.enum(['user', 'assistant']),
    content: baseValidation.medicalText,
    timestamp: z.string().datetime()
  })).optional().default([]),
  isStructuredAnalysis: z.boolean().optional().default(false)
});

// Voice analysis validation
export const voiceAnalysisSchema = z.object({
  userId: baseValidation.uuid,
  consultationId: baseValidation.uuid.optional(),
  audioData: baseValidation.base64Data,
  analysisType: z.enum(['emotion', 'speech', 'health_indicators', 'complete']).optional().default('complete')
});

// Facial analysis validation
export const facialAnalysisSchema = z.object({
  userId: baseValidation.uuid,
  consultationId: baseValidation.uuid.optional(),
  imageData: baseValidation.base64Data,
  analysisType: z.enum(['facial', 'skin', 'vitals', 'comprehensive']).optional().default('comprehensive')
});

// User profile validation
export const userProfileSchema = z.object({
  name: baseValidation.safeText,
  email: z.string().email('Email inválido').optional(),
  phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de telefone inválido')
    .optional(),
  dateOfBirth: z.string().datetime().optional(),
  medicalHistory: baseValidation.medicalText.optional(),
  emergencyContact: z.object({
    name: baseValidation.safeText,
    phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de telefone inválido'),
    relationship: baseValidation.safeText
  }).optional()
});

// Anamnesis validation
export const anamnesisSchema = z.object({
  userId: baseValidation.uuid,
  chiefComplaint: baseValidation.medicalText,
  symptoms: z.array(baseValidation.safeText).min(1, 'Pelo menos um sintoma é obrigatório'),
  symptomDuration: z.string(),
  severity: baseValidation.score,
  previousConditions: z.array(baseValidation.safeText).optional().default([]),
  medications: z.array(baseValidation.safeText).optional().default([]),
  allergies: z.array(baseValidation.safeText).optional().default([]),
  vitalSigns: z.object({
    heartRate: z.number().min(30).max(220).optional(),
    bloodPressure: z.string().optional(),
    temperature: z.number().min(35).max(42).optional(),
    oxygenSaturation: z.number().min(70).max(100).optional()
  }).optional()
});

// Rate limiting validation
export const rateLimitSchema = z.object({
  userId: baseValidation.uuid,
  action: z.string(),
  timestamp: z.number(),
  ipAddress: z.string().ip().optional()
});

/**
 * Validates input data against a schema
 */
export const validateInput = <T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      success: false,
      errors: ['Erro de validação desconhecido']
    };
  }
};

/**
 * Sanitizes and validates medical text input
 */
export const validateMedicalText = (text: string): { isValid: boolean; sanitized: string; errors: string[] } => {
  const errors: string[] = [];
  
  if (!text || typeof text !== 'string') {
    return { isValid: false, sanitized: '', errors: ['Texto é obrigatório'] };
  }
  
  // Check length
  if (text.length > 5000) {
    errors.push('Texto muito longo (máximo 5000 caracteres)');
  }
  
  if (text.length < 1) {
    errors.push('Texto não pode estar vazio');
  }
  
  // Check for malicious content
  const maliciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["\'][^"\']*["\']/gi,
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(text)) {
      errors.push('Conteúdo potencialmente malicioso detectado');
      break;
    }
  }
  
  // Sanitize the text
  let sanitized = text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
};

/**
 * Validates file upload data
 */
export const validateFileUpload = (
  data: string, 
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'audio/webm', 'audio/wav'],
  maxSize: number = 10 * 1024 * 1024 // 10MB
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'string') {
    return { isValid: false, errors: ['Dados do arquivo são obrigatórios'] };
  }
  
  // Check if it's a data URL
  const dataUrlMatch = data.match(/^data:([^;]+);base64,(.+)$/);
  if (!dataUrlMatch) {
    errors.push('Formato de arquivo inválido');
    return { isValid: false, errors };
  }
  
  const [, mimeType, base64Data] = dataUrlMatch;
  
  // Check MIME type
  if (!allowedTypes.includes(mimeType)) {
    errors.push(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`);
  }
  
  // Check file size
  try {
    const decodedSize = atob(base64Data).length;
    if (decodedSize > maxSize) {
      errors.push(`Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
  } catch {
    errors.push('Dados do arquivo corrompidos');
  }
  
  return { isValid: errors.length === 0, errors };
};