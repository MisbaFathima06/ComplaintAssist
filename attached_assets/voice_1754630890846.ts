// Voice recognition and processing

export interface VoiceRecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

// Check if speech recognition is supported
export function isSpeechRecognitionSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

// Create speech recognition instance
export function createSpeechRecognition(
  config: VoiceRecognitionConfig = {}
): any {
  if (!isSpeechRecognitionSupported()) {
    throw new Error('Speech recognition not supported in this browser');
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  // Configure recognition
  recognition.lang = config.language || 'en-US';
  recognition.continuous = config.continuous ?? true;
  recognition.interimResults = config.interimResults ?? true;
  recognition.maxAlternatives = config.maxAlternatives || 1;

  return recognition;
}

// Convert speech to text
export async function speechToText(
  config: VoiceRecognitionConfig = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const recognition = createSpeechRecognition(config);
      let finalTranscript = '';

      recognition.onstart = () => {
        console.log('Speech recognition started');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognition.onend = () => {
        resolve(finalTranscript.trim());
      };

      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
}

// Multi-language support
export const supportedLanguages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'ta-IN', name: 'Tamil (India)' },
  { code: 'kn-IN', name: 'Kannada (India)' },
  { code: 'ur-PK', name: 'Urdu (Pakistan)' },
];

// Get language from locale
export function getLanguageFromLocale(locale: string): string {
  const languageMap: Record<string, string> = {
    'en': 'en-US',
    'hi': 'hi-IN',
    'ta': 'ta-IN',
    'kn': 'kn-IN',
    'ur': 'ur-PK',
  };
  
  return languageMap[locale] || 'en-US';
}

// Text-to-speech for accessibility
export function textToSpeech(text: string, language: string = 'en-US'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Text-to-speech not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);

    speechSynthesis.speak(utterance);
  });
}
