import { Language } from '../data/portfolioData';

export type MaleVoiceAvailability =
  | 'male_found'
  | 'no_male_voice'
  | 'unsupported';

export interface VoiceResolution {
  availability: MaleVoiceAvailability;
  voice: SpeechSynthesisVoice | null;
  voiceName: string | null;
}

export type MicPermissionResult =
  | { granted: true }
  | {
      granted: false;
      reason: 'denied' | 'no_device' | 'in_use' | 'unsupported' | 'unknown';
    };

const KNOWN_FEMALE_HINTS = [
  'female',
  'woman',
  'mujer',
  'femenina',
  'femenino',
  'helena',
  'laura',
  'monica',
  'paulina',
  'lucia',
  'elena',
  'conchita',
  'sabina',
  'paloma',
  'elvira',
  'dalia',
  'salome',
  'ximena',
  'camila',
  'valentina',
  'sofia',
  'carmen',
  'zira',
  'hazel',
  'susan',
  'samantha',
  'victoria',
  'karen',
  'moira',
  'tessa',
  'serena',
  'veena',
  'kate',
  'libby',
  'sonia',
  'mia',
  'aria',
  'jenny',
  'eva',
  'emma',
  'claire',
  'fiona',
  'marisol',
  'francisca',
  'catalina',
  'isabela',
  'elvira',
  'diana',
  'estrella',
  'marta',
  'ines',
  'carolina',
];

const KNOWN_MALE_HINTS_ES = [
  'male',
  'hombre',
  'masculin',
  'pablo',
  'alvaro',
  'jorge',
  'diego',
  'raul',
  'enrique',
  'juan',
  'carlos',
  'antonio',
  'mateo',
  'manuel',
  'alfonso',
  'sergio',
  'david',
  'alberto',
  'andres',
  'miguel',
  'fernando',
  'alonso',
  'tomas',
  'rodrigo',
  'sebastian',
  'emilio',
  'luis',
  'arnau',
  'gerardo',
  'salomon',
  'dario',
  'gonzalo',
  'luciano',
  'santiago',
  'ignacio',
  'hector',
];

const KNOWN_MALE_HINTS_EN = [
  'male',
  'man',
  'masculin',
  'daniel',
  'david',
  'mark',
  'george',
  'oliver',
  'arthur',
  'ryan',
  'guy',
  'christopher',
  'aaron',
  'thomas',
  'alex',
  'fred',
  'james',
  'william',
  'liam',
  'eric',
  'andrew',
  'brian',
  'christophe',
  'rishi',
  'reed',
  'rocko',
  'grandpa',
  'eddy',
  'ralph',
  'bruce',
  'albert',
  'davis',
  'tony',
  'jason',
  'mitchell',
  'connor',
];

function normalizeVoiceText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

/**
 * Explicitly checks and requests microphone permission using standard browser MediaDevices API
 * before initializing free browser SpeechRecognition. Immediately releases the audio track
 * so SpeechRecognition can capture the microphone cleanly.
 */
export async function requestMicrophonePermission(): Promise<MicPermissionResult> {
  if (!isSpeechRecognitionSupported()) {
    return { granted: false, reason: 'unsupported' };
  }

  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    // Some browsers expose SpeechRecognition without getUserMedia in insecure contexts;
    // allow SpeechRecognition.start() to handle permission directly.
    return { granted: true };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err) {
    const name =
      err instanceof DOMException
        ? err.name
        : typeof err === 'object' && err !== null && 'name' in err
        ? String((err as { name: unknown }).name)
        : '';

    if (
      name === 'NotAllowedError' ||
      name === 'PermissionDeniedError' ||
      name === 'SecurityError'
    ) {
      return { granted: false, reason: 'denied' };
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return { granted: false, reason: 'no_device' };
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return { granted: false, reason: 'in_use' };
    }
    return { granted: false, reason: 'unknown' };
  }
}

/**
 * Selects a male system voice for the active language ('es' or 'en') using
 * browser-native SpeechSynthesis API at zero cost.
 */
export function resolveMaleVoice(lang: Language): VoiceResolution {
  if (!isSpeechSynthesisSupported()) {
    return { availability: 'unsupported', voice: null, voiceName: null };
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
    return { availability: 'no_male_voice', voice: null, voiceName: null };
  }

  const targetPrefix = lang === 'es' ? 'es' : 'en';
  const maleHints = lang === 'es' ? KNOWN_MALE_HINTS_ES : KNOWN_MALE_HINTS_EN;

  const langVoices = voices.filter((v) =>
    v.lang.toLowerCase().startsWith(targetPrefix)
  );

  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = -1;

  for (const voice of langVoices) {
    const normalizedName = normalizeVoiceText(`${voice.name} ${voice.voiceURI}`);
    const isFemale = KNOWN_FEMALE_HINTS.some((hint) =>
      normalizedName.includes(hint)
    );
    if (isFemale) continue;

    const isMale = maleHints.some((hint) => normalizedName.includes(hint));
    if (!isMale) continue;

    let score = 10;
    if (lang === 'es' && voice.lang.toLowerCase() === 'es-es') score += 5;
    if (
      lang === 'en' &&
      (voice.lang.toLowerCase() === 'en-gb' ||
        voice.lang.toLowerCase() === 'en-us')
    ) {
      score += 5;
    }
    if (normalizedName.includes('natural') || normalizedName.includes('online')) {
      score += 3;
    }
    if (voice.localService) score += 2;
    if (normalizedName.includes('male') || normalizedName.includes('hombre')) {
      score += 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  if (bestVoice) {
    return {
      availability: 'male_found',
      voice: bestVoice,
      voiceName: bestVoice.name,
    };
  }

  return { availability: 'no_male_voice', voice: null, voiceName: null };
}

export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
}

export function speakWithMaleVoice(
  text: string,
  lang: Language,
  onStart?: () => void,
  onEnd?: () => void,
  onNoMaleVoice?: () => void
): boolean {
  if (!isSpeechSynthesisSupported()) {
    onNoMaleVoice?.();
    return false;
  }

  const resolution = resolveMaleVoice(lang);
  if (resolution.availability !== 'male_found' || !resolution.voice) {
    onNoMaleVoice?.();
    return false;
  }

  window.speechSynthesis.cancel();
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  const cleanText = text.replace(/\n+/g, '. ').trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.voice = resolution.voice;
  utterance.lang = resolution.voice.lang || (lang === 'es' ? 'es-ES' : 'en-US');
  utterance.rate = 0.95;
  utterance.pitch = 0.92;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
  return true;
}

export interface RecognitionController {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionResultAlternativeLike {
  transcript?: string;
}

interface SpeechRecognitionResultLike {
  isFinal?: boolean;
  length: number;
  [index: number]: SpeechRecognitionResultAlternativeLike | undefined;
}

interface SpeechRecognitionEventLike {
  results?: ArrayLike<SpeechRecognitionResultLike>;
}

interface BrowserSpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}

export function createBrowserSpeechRecognizer(
  lang: Language,
  callbacks: {
    onInterim?: (transcript: string) => void;
    onResult: (transcript: string) => void;
    onError: (errorCode: string) => void;
    onEnd: () => void;
  }
): RecognitionController | null {
  if (!isSpeechRecognitionSupported()) return null;

  const win = window as unknown as {
    SpeechRecognition?: new () => BrowserSpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognitionInstance;
  };

  const RecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
  if (!RecognitionCtor) return null;

  const recognition = new RecognitionCtor();
  recognition.lang = lang === 'es' ? 'es-ES' : 'en-US';
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  let finalizedText = '';
  let interimText = '';
  let submitted = false;
  let abortedByUser = false;

  const flushTranscript = () => {
    if (submitted) return;
    const combined = (finalizedText || interimText).trim();
    if (combined) {
      submitted = true;
      callbacks.onResult(combined);
    }
  };

  recognition.onresult = (event: SpeechRecognitionEventLike) => {
    const results = event.results;
    if (!results) return;

    let finals = '';
    let interims = '';

    for (let i = 0; i < results.length; i += 1) {
      const result = results[i];
      const text = result?.[0]?.transcript || '';
      if (!text) continue;
      if (result.isFinal) {
        finals += `${text} `;
      } else {
        interims += `${text} `;
      }
    }

    finalizedText = finals.trim();
    interimText = interims.trim();

    const preview = `${finalizedText} ${interimText}`.trim();
    if (preview) {
      callbacks.onInterim?.(preview);
    }

    if (finalizedText && !interimText) {
      flushTranscript();
    }
  };

  recognition.onerror = (event: { error?: string }) => {
    const code = event.error || 'unknown';
    if (code === 'aborted' && abortedByUser) {
      return;
    }
    callbacks.onError(code);
  };

  recognition.onend = () => {
    if (!abortedByUser) {
      flushTranscript();
    }
    callbacks.onEnd();
  };

  return {
    start: () => {
      finalizedText = '';
      interimText = '';
      submitted = false;
      abortedByUser = false;
      recognition.start();
    },
    stop: () => {
      recognition.stop();
    },
    abort: () => {
      abortedByUser = true;
      if (typeof recognition.abort === 'function') {
        recognition.abort();
      } else {
        recognition.stop();
      }
    },
  };
}
