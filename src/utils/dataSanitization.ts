/**
 * Data Sanitization and Privacy Protection Utilities
 * Ensures sensitive medical data is properly handled according to LGPD/GDPR
 */

import DOMPurify from 'dompurify';

// Sensitive field patterns for medical data
const SENSITIVE_PATTERNS = {
  cpf: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
  phone: /\b(?:\+55\s?)?\(?[1-9]\d?\)?\s?\d{4,5}-?\d{4}\b/g,
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  medicalTerms: /\b(diabetes|hipertensão|câncer|HIV|AIDS|depressão|esquizofrenia)\b/gi,
  personalData: /\b(nome|endereço|rg|identidade)\s*:?\s*[^\s,.\n]+/gi
};

/**
 * Sanitizes text input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Use DOMPurify for XSS protection
  const cleanHtml = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
  
  // Remove any remaining HTML entities
  return cleanHtml
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
};

/**
 * Removes or masks sensitive information from text
 */
export const removeSensitiveData = (text: string): string => {
  if (!text || typeof text !== 'string') return text;
  
  let sanitized = text;
  
  // Mask CPF
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.cpf, '***.***.***-**');
  
  // Mask phone numbers
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.phone, '(**) *****-****');
  
  // Mask email addresses
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.email, '***@***.**');
  
  // Mask personal data mentions
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.personalData, '[DADOS_PESSOAIS_REMOVIDOS]');
  
  return sanitized;
};

/**
 * Creates a sanitized version of medical data for logging
 */
export const sanitizeForLogging = (data: any): any => {
  if (!data) return data;
  
  if (typeof data === 'string') {
    return removeSensitiveData(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive fields entirely
      if (isSensitiveField(key)) {
        sanitized[key] = '[DADOS_SENSÍVEIS_REMOVIDOS]';
        continue;
      }
      
      sanitized[key] = sanitizeForLogging(value);
    }
    
    return sanitized;
  }
  
  return data;
};

/**
 * Checks if a field name contains sensitive information
 */
export const isSensitiveField = (fieldName: string): boolean => {
  const sensitiveFields = [
    'cpf', 'rg', 'email', 'phone', 'telefone', 'endereco', 'address',
    'nome', 'name', 'password', 'senha', 'token', 'api_key',
    'transcription', 'transcricao', 'audio_data', 'image_data',
    'symptoms', 'sintomas', 'medical_history', 'historico_medico'
  ];
  
  return sensitiveFields.some(field => 
    fieldName.toLowerCase().includes(field.toLowerCase())
  );
};

/**
 * Validates medical input data
 */
export const validateMedicalInput = (input: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!input) {
    errors.push('Dados de entrada são obrigatórios');
    return { isValid: false, errors };
  }
  
  // Check for potential injection attempts
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i
  ];
  
  const inputString = JSON.stringify(input);
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(inputString)) {
      errors.push('Conteúdo potencialmente malicioso detectado');
      break;
    }
  }
  
  // Validate data size
  if (inputString.length > 50000) { // 50KB limit
    errors.push('Dados de entrada excedem o limite permitido');
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Prepares data for third-party API calls by removing sensitive information
 */
export const prepareForThirdPartyAPI = (data: any, apiProvider: string): any => {
  if (!data) return data;
  
  const sanitized = sanitizeForLogging(data);
  
  // Additional sanitization based on API provider
  switch (apiProvider.toLowerCase()) {
    case 'openai':
      // Remove audio data and personal identifiers
      if (sanitized.audioData) delete sanitized.audioData;
      if (sanitized.imageData) delete sanitized.imageData;
      if (sanitized.userId) sanitized.userId = '[USER_ID_REMOVED]';
      break;
      
    case 'google':
      // Remove metadata and personal info
      if (sanitized.metadata) delete sanitized.metadata;
      if (sanitized.userAgent) delete sanitized.userAgent;
      break;
  }
  
  return sanitized;
};

/**
 * Creates audit log entry with sanitized data
 */
export const createAuditLogEntry = (
  action: string,
  userId: string | null,
  originalData: any,
  sanitizedData?: any
): any => {
  return {
    action,
    userId: userId || 'anonymous',
    timestamp: new Date().toISOString(),
    dataSize: JSON.stringify(originalData).length,
    sanitizedData: sanitizedData || sanitizeForLogging(originalData),
    ipAddress: '[IP_REMOVED_FOR_PRIVACY]'
  };
};