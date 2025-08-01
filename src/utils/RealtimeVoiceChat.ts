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
  private currentTranscript = '';

  constructor(
    private onMessage: (message: any) => void,
    private onSpeakingChange: (speaking: boolean) => void,
    private onTranscriptionChange?: (transcript: string) => void
  ) {}

  async connect() {
    try {
      console.log('Connecting to realtime voice chat via WebSocket proxy...');
      
      // Initialize audio context and queue
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.audioQueue = new AudioQueue(this.audioContext);

      // Connect directly to our Supabase WebSocket proxy
      const wsUrl = `wss://skwpuolpkgntqdmgzwlr.functions.supabase.co/realtime-voice-chat`;
      console.log('Connecting to WebSocket proxy:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected to Supabase proxy');
      };

      this.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log('Received message:', message.type, message);
        
        await this.handleMessage(message);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
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
        console.log('Session created - proxy will handle configuration');
        break;

      case 'session.updated':
        console.log('[RealtimeVoiceChat] Session updated, starting audio recording...');
        await this.startAudioRecording();
        this.sessionEstablished = true;
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

      case 'response.audio_transcript.delta':
        // Real-time transcription of assistant speech
        if (message.delta) {
          this.currentTranscript += message.delta;
          this.onTranscriptionChange?.(this.currentTranscript);
          console.log('Assistant transcript delta:', message.delta);
        }
        break;

      case 'response.audio_transcript.done':
        // Final transcription of assistant speech
        if (this.currentTranscript.trim()) {
          console.log('Assistant transcript complete:', this.currentTranscript);
          // Send complete transcript to UI
          this.onMessage({
            type: 'transcript_complete',
            content: this.currentTranscript.trim(),
            role: 'assistant'
          });
          this.currentTranscript = '';
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User speech transcription completed
        if (message.transcript) {
          console.log('User speech transcribed:', message.transcript);
          this.onMessage({
            type: 'user_transcript',
            content: message.transcript,
            role: 'user'
          });
        }
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

      default:
        // Log all other events for debugging
        console.log('Unhandled event type:', message.type);
        break;
    }
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

  forceStartConversation() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.sessionEstablished) {
      console.warn('[RealtimeVoiceChat] Cannot force start - not ready');
      return;
    }

    console.log('[RealtimeVoiceChat] Forcing conversation start...');
    
    // Force the assistant to start speaking
    this.ws.send(JSON.stringify({
      type: 'response.create',
      response: {
        modalities: ['audio', 'text'],
        instructions: 'Cumprimente o paciente agora e pergunte como ele está se sentindo.'
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