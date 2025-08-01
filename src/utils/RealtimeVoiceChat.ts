import { supabase } from '@/integrations/supabase/client';

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      console.log('Starting audio recorder...');
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      console.log('Audio recorder started successfully');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    console.log('Stopping audio recorder...');
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    console.log('Adding audio to queue, length:', audioData.length);
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = this.createWavFromPCM(audioData);
      const audioBuffer = await this.audioContext.decodeAudioData(wavData.buffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
      console.log('Playing audio chunk');
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext(); // Continue with next segment even if current fails
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    // Convert bytes to 16-bit samples
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    // Create WAV header
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // WAV header parameters
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    // Combine header and data
    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  }
}

export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

export class RealtimeVoiceChat {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioQueue | null = null;
  private recorder: AudioRecorder | null = null;
  private sessionEstablished = false;

  constructor(
    private onMessage: (message: any) => void,
    private onSpeakingChange: (speaking: boolean) => void
  ) {}

  async connect() {
    try {
      console.log('Connecting to realtime voice chat...');
      
      // Get ephemeral token from our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('realtime-voice-chat');
      
      if (error || !data?.client_secret?.value) {
        throw new Error(error?.message || 'Failed to get ephemeral token');
      }

      const ephemeralToken = data.client_secret.value;
      console.log('Got ephemeral token, connecting to OpenAI...');

      // Initialize audio context and queue
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.audioQueue = new AudioQueue(this.audioContext);

      // Connect to OpenAI Realtime API via WebSocket
      this.ws = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', [
        'realtime',
        `authorization.bearer.${ephemeralToken}`
      ]);

      this.ws.onopen = () => {
        console.log('WebSocket connected to OpenAI Realtime API');
      };

      this.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log('Received message:', message.type, message);
        
        await this.handleMessage(message);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.cleanup();
      };

    } catch (error) {
      console.error('Error connecting to realtime voice chat:', error);
      throw error;
    }
  }

  private async handleMessage(message: any) {
    this.onMessage(message);

    switch (message.type) {
      case 'session.created':
        console.log('Session created, sending configuration...');
        await this.configureSession();
        break;

      case 'session.updated':
        console.log('Session updated, starting audio recording and initial greeting...');
        await this.startAudioRecording();
        this.sessionEstablished = true;
        // Send initial greeting to start conversation
        setTimeout(() => {
          this.sendInitialGreeting();
        }, 1000);
        break;

      case 'response.audio.delta':
        if (message.delta && this.audioQueue) {
          const binaryString = atob(message.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await this.audioQueue.addToQueue(bytes);
          this.onSpeakingChange(true);
        }
        break;

      case 'response.audio.done':
        console.log('Audio response completed');
        this.onSpeakingChange(false);
        break;

      case 'input_audio_buffer.speech_started':
        console.log('User started speaking');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('User stopped speaking, generating response...');
        break;

      case 'error':
        console.error('OpenAI API error:', message);
        break;
    }
  }

  private async configureSession() {
    if (!this.ws) return;

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: `Você é um assistente médico especializado em triagem e análise de saúde. 

Sua função é:
- Conduzir entrevistas médicas de forma empática e profissional
- Fazer perguntas direcionadas sobre sintomas e histórico médico
- Avaliar urgência médica baseada nas respostas
- Fornecer orientações gerais (sem diagnósticos específicos)
- Recomendar busca por atendimento médico quando necessário

Diretrizes importantes:
- Use linguagem acessível e empática
- Seja objetivo mas cuidadoso
- Sempre reforce que não substitui consulta médica presencial
- Em casos de emergência, oriente imediatamente para serviços de urgência

Responda sempre em português brasileiro e mantenha um tom profissional e acolhedor.`,
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.3,
          prefix_padding_ms: 300,
          silence_duration_ms: 800,
          create_response: true
        },
        temperature: 0.8,
        max_response_output_tokens: 'inf'
      }
    };

    this.ws.send(JSON.stringify(sessionConfig));
    console.log('Session configuration sent');
  }

  private async startAudioRecording() {
    if (!this.ws) return;

    try {
      this.recorder = new AudioRecorder((audioData) => {
        if (this.ws?.readyState === WebSocket.OPEN && this.sessionEstablished) {
          const encodedAudio = encodeAudioForAPI(audioData);
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });

      await this.recorder.start();
      console.log('Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw error;
    }
  }

  private sendInitialGreeting() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.sessionEstablished) {
      console.warn('Cannot send initial greeting - not ready');
      return;
    }

    console.log('Sending initial greeting to start conversation...');
    
    // Force the assistant to start speaking by creating a response
    this.ws.send(JSON.stringify({
      type: 'response.create',
      response: {
        modalities: ['audio', 'text'],
        instructions: 'Inicie imediatamente a conversa cumprimentando o paciente e faça a primeira pergunta sobre como ele está se sentindo. Fale de forma natural e empática.'
      }
    }));
  }

  sendTextMessage(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(event));
    this.ws.send(JSON.stringify({ type: 'response.create' }));
    console.log('Text message sent:', text);
  }

  disconnect() {
    console.log('Disconnecting realtime voice chat...');
    this.cleanup();
  }

  private cleanup() {
    this.recorder?.stop();
    this.ws?.close();
    this.audioContext?.close();
    this.sessionEstablished = false;
    this.onSpeakingChange(false);
  }
}