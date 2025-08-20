// Utilitários para detectar capacidades de áudio do navegador/dispositivo

export interface AudioCapabilities {
  supportedMimeTypes: string[];
  preferredMimeType: string;
  isIOS: boolean;
  isSafari: boolean;
  isAndroid: boolean;
}

export const detectAudioCapabilities = (): AudioCapabilities => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  
  // Lista de MIME types para testar, em ordem de preferência
  const mimeTypesToTest = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/wav',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ];
  
  const supportedMimeTypes: string[] = [];
  
  // Testar suporte para cada MIME type
  for (const mimeType of mimeTypesToTest) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      supportedMimeTypes.push(mimeType);
    }
  }
  
  // Determinar o MIME type preferido baseado no dispositivo
  let preferredMimeType = '';
  
  if (isIOS || isSafari) {
    // Safari/iOS preferem mp4 ou wav
    preferredMimeType = supportedMimeTypes.find(type => 
      type.includes('mp4') || type.includes('wav')
    ) || supportedMimeTypes[0] || 'audio/wav';
  } else if (isAndroid) {
    // Android funciona bem com webm
    preferredMimeType = supportedMimeTypes.find(type => 
      type.includes('webm')
    ) || supportedMimeTypes[0] || 'audio/webm';
  } else {
    // Desktop - usar o primeiro suportado (geralmente webm)
    preferredMimeType = supportedMimeTypes[0] || 'audio/webm';
  }
  
  return {
    supportedMimeTypes,
    preferredMimeType,
    isIOS,
    isSafari,
    isAndroid
  };
};

export const getOptimalAudioConfig = () => {
  const capabilities = detectAudioCapabilities();
  
  // Configurações de áudio otimizadas por dispositivo
  const baseConfig = {
    sampleRate: 44100,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  };
  
  if (capabilities.isIOS) {
    // iOS tem limitações específicas
    return {
      ...baseConfig,
      sampleRate: 48000 // iOS prefere 48kHz
    };
  }
  
  if (capabilities.isAndroid) {
    // Android configurações
    return baseConfig;
  }
  
  // Desktop
  return baseConfig;
};