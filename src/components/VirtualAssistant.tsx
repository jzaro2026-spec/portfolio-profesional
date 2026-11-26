import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Briefcase,
  MessageSquare,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Volume2,
  VolumeX,
  X,
  AlertCircle,
  Power,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../data/portfolioData';
import {
  ConversationState,
  RespectLevel,
  processAssistantMessage,
  SESSION_ENDED_NOTICE,
} from '../services/recruiterAssistant';
import {
  MaleVoiceAvailability,
  AudioRecorderController,
  RecognitionController,
  createBrowserAudioRecorder,
  createBrowserSpeechRecognizer,
  isBrowserAudioRecordingSupported,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  requestMicrophonePermission,
  resolveMaleVoice,
  speakWithMaleVoice,
  stopSpeaking,
} from '../services/browserSpeech';

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  respectLevel?: RespectLevel;
  suggestEndSession?: boolean;
}

interface VirtualAssistantProps {
  lang: Language;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const UI_COPY: Record<
  Language,
  {
    launcherLabel: string;
    eyebrowLabel: string;
    title: string;
    subtitle: string;
    welcomeMessage: string;
    voiceAutoOn: string;
    voiceAutoOff: string;
    maleVoiceReady: (name: string) => string;
    noMaleVoiceNotice: string;
    synthesisUnsupportedNotice: string;
    recognitionUnsupportedNotice: string;
    requestingMicLabel: string;
    micDeniedNotice: string;
    micNoDeviceNotice: string;
    micBusyNotice: string;
    micNoSpeechNotice: string;
    micNetworkNotice: string;
    listeningLabel: string;
    transcribingLabel: string;
    startMicLabel: string;
    stopMicLabel: string;
    speakMessageLabel: string;
    stopAudioLabel: string;
    inputPlaceholder: string;
    inputEndedPlaceholder: string;
    sendLabel: string;
    assistantRequestError: string;
    assistantRequestingLabel: string;
    endSessionLabel: string;
    newSessionLabel: string;
    closeLabel: string;
    suggestedLabel: string;
    suggestions: string[];
    level2Tag: string;
    level3Tag: string;
  }
> = {
  es: {
    launcherLabel: 'Asistente profesional',
    eyebrowLabel: 'ASISTENTE PROFESIONAL',
    title: 'Conoce la trayectoria profesional de José María Maroto',
    subtitle: 'Consultas de selección sobre José María Maroto',
    welcomeMessage:
      'Pregúntame lo que quieras sobre mi experiencia, formación, competencias y responsabilidades profesionales. Estoy aquí para ayudarte a conocer mejor el perfil profesional de José María Maroto.',
    voiceAutoOn: 'Voz masculina activa',
    voiceAutoOff: 'Solo texto',
    maleVoiceReady: (name: string) => `Voz del navegador: ${name}`,
    noMaleVoiceNotice:
      'Tu navegador no dispone actualmente de una voz masculina en español compatible. Puedes continuar con total normalidad mediante el chat escrito.',
    synthesisUnsupportedNotice:
      'Este navegador no admite síntesis de voz (SpeechSynthesis). El chat escrito está completamente disponible.',
    recognitionUnsupportedNotice:
      'El reconocimiento de voz gratuito del navegador (Web Speech API) no está disponible en este navegador o dispositivo (por ejemplo, Firefox o modos restringidos). El chat escrito sigue disponible.',
    requestingMicLabel: 'Solicitando permiso de micrófono...',
    micDeniedNotice:
      'Permiso de micrófono denegado o bloqueado en el navegador. Habilítalo en la barra de dirección si deseas dictar por voz, o continúa mediante el chat escrito.',
    micNoDeviceNotice:
      'No se ha detectado ningún micrófono conectado en este dispositivo. Puedes continuar utilizando el chat escrito.',
    micBusyNotice:
      'El micrófono está siendo utilizado por otra aplicación. Libéralo o continúa utilizando el chat escrito.',
    micNoSpeechNotice:
      'No se detectó voz suficiente durante la grabación. Pulsa el micrófono de nuevo para hablar o escribe tu consulta.',
    micNetworkNotice:
      'El servicio gratuito de reconocimiento de voz del navegador no pudo conectar en este momento. Puedes continuar mediante el chat escrito.',
    listeningLabel:
      'Escuchando... habla con claridad y pulsa detener o haz una pausa para enviar.',
    transcribingLabel: 'Transcribiendo el audio...',
    startMicLabel: 'Hablar por micrófono',
    stopMicLabel: 'Detener y enviar voz',
    speakMessageLabel: 'Escuchar con voz masculina',
    stopAudioLabel: 'Detener audio',
    inputPlaceholder: 'Escribe o dicta tu pregunta profesional...',
    inputEndedPlaceholder:
      'Conversación finalizada. Inicia una nueva sesión para consultar.',
    sendLabel: 'Enviar',
    assistantRequestError:
      'No se pudo consultar al asistente. Comprueba la conexión e inténtalo de nuevo.',
    assistantRequestingLabel: 'Consultando el perfil profesional...',
    endSessionLabel: 'Finalizar conversación',
    newSessionLabel: 'Iniciar nueva conversación',
    closeLabel: 'Cerrar asistente',
    suggestedLabel: 'Consultas sugeridas',
    suggestions: [
      '¿Qué experiencia tiene en logística y gestión de almacenes?',
      '¿Qué experiencia tiene coordinando equipos?',
      '¿Qué formación tiene en inteligencia artificial?',
    ],
    level2Tag: 'Recordatorio de trato profesional',
    level3Tag: 'Último aviso de respeto',
  },
  en: {
    launcherLabel: 'Career Assistant',
    eyebrowLabel: 'PROFESSIONAL ASSISTANT',
    title: 'Explore José María Maroto’s professional career',
    subtitle: 'Recruitment inquiries about José María Maroto',
    welcomeMessage:
      'Ask me anything about my experience, training, competencies, and professional responsibilities. I am here to help you get to know José María Maroto’s professional profile better.',
    voiceAutoOn: 'Male voice active',
    voiceAutoOff: 'Text only',
    maleVoiceReady: (name: string) => `Browser voice: ${name}`,
    noMaleVoiceNotice:
      'Your browser does not currently provide a compatible English male voice. You can continue seamlessly using the written chat.',
    synthesisUnsupportedNotice:
      'Speech synthesis is not supported by this browser. Written chat remains fully available.',
    recognitionUnsupportedNotice:
      'Free browser speech recognition (Web Speech API) is not supported in this browser or device (for instance Firefox or restricted privacy modes). Written chat remains fully available.',
    requestingMicLabel: 'Requesting microphone permission...',
    micDeniedNotice:
      'Microphone permission was denied or blocked by the browser. Enable microphone access in your address bar to speak, or continue using written chat.',
    micNoDeviceNotice:
      'No microphone device was detected on this device. You can continue using the written chat.',
    micBusyNotice:
      'The microphone is currently in use by another application. Free it or continue using the written chat.',
    micNoSpeechNotice:
      'No speech was detected while listening. Click the microphone to try again or type your question.',
    micNetworkNotice:
      'The browser’s free speech recognition service could not connect right now. Please continue using the written chat.',
    listeningLabel:
      'Listening... speak clearly and pause or press stop to send.',
    transcribingLabel: 'Transcribing audio...',
    startMicLabel: 'Speak with microphone',
    stopMicLabel: 'Stop and send voice',
    speakMessageLabel: 'Listen with male voice',
    stopAudioLabel: 'Stop audio',
    inputPlaceholder: 'Type or dictate your professional question...',
    inputEndedPlaceholder:
      'Conversation ended. Start a new session to ask questions.',
    sendLabel: 'Send',
    assistantRequestError:
      'The assistant could not be reached. Check your connection and try again.',
    assistantRequestingLabel: 'Checking the professional profile...',
    endSessionLabel: 'End conversation',
    newSessionLabel: 'Start new conversation',
    closeLabel: 'Close assistant',
    suggestedLabel: 'Suggested questions',
    suggestions: [
      'What experience does he have in logistics and warehousing?',
      'What experience does he have coordinating teams?',
      'What training does he have in artificial intelligence?',
    ],
    level2Tag: 'Professional conduct reminder',
    level3Tag: 'Final respect notice',
  },
};

export default function VirtualAssistant({
  lang,
  isOpen,
  onOpenChange,
}: VirtualAssistantProps) {
  const copy = UI_COPY[lang];

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-0',
      sender: 'assistant',
      text: UI_COPY[lang].welcomeMessage,
      respectLevel: 1,
    },
  ]);
  const [conversationState, setConversationState] = useState<ConversationState>(
    {
      disrespectCount: 0,
      ended: false,
    }
  );
  const [inputValue, setInputValue] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null
  );
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [isRequestingAnswer, setIsRequestingAnswer] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<{
    availability: MaleVoiceAvailability;
    voiceName: string | null;
  }>({
    availability: isSpeechSynthesisSupported()
      ? 'no_male_voice'
      : 'unsupported',
    voiceName: null,
  });

  const recognitionSupported = isSpeechRecognitionSupported();
  const recognizerRef = useRef<RecognitionController | null>(null);
  const audioRecorderRef = useRef<AudioRecorderController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const userToggledAutoSpeakRef = useRef(false);
  const requestInProgressRef = useRef(false);

  // Sync welcome message if conversation hasn't started yet and language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-0') {
        return [
          {
            id: 'welcome-0',
            sender: 'assistant',
            text: UI_COPY[lang].welcomeMessage,
            respectLevel: 1,
          },
        ];
      }
      return prev;
    });
  }, [lang]);

  // Detect browser male voices for active language
  useEffect(() => {
    const updateVoices = () => {
      const resolved = resolveMaleVoice(lang);
      setVoiceStatus({
        availability: resolved.availability,
        voiceName: resolved.voiceName,
      });
      if (!userToggledAutoSpeakRef.current) {
        setAutoSpeak(resolved.availability === 'male_found');
      } else if (resolved.availability !== 'male_found') {
        setAutoSpeak(false);
      }
    };

    updateVoices();
    const timer = window.setTimeout(updateVoices, 300);

    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.addEventListener?.('voiceschanged', updateVoices);
      return () => {
        window.clearTimeout(timer);
        window.speechSynthesis.removeEventListener?.(
          'voiceschanged',
          updateVoices
        );
      };
    }

    return () => {
      window.clearTimeout(timer);
    };
  }, [lang]);

  // Stop speech/mic when closing or unmounting
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      setSpeakingMessageId(null);
      recognizerRef.current?.abort();
      audioRecorderRef.current?.abort();
      audioRecorderRef.current = null;
      setIsTranscribing(false);
      setIsListening(false);
      setIsRequestingMic(false);
      setInterimTranscript('');
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      recognizerRef.current?.abort();
      audioRecorderRef.current?.abort();
      audioRecorderRef.current = null;
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSpeak = (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }
    const started = speakWithMaleVoice(
      text,
      lang,
      () => setSpeakingMessageId(messageId),
      () => setSpeakingMessageId(null),
      () => setSpeakingMessageId(null)
    );
    if (!started) {
      setSpeakingMessageId(null);
    }
  };

  const submitQuery = async (rawText: string, forceVoiceReply = false) => {
    const trimmed = rawText.trim();
    if (!trimmed || conversationState.ended || requestInProgressRef.current) {
      return;
    }

    requestInProgressRef.current = true;
    setIsRequestingAnswer(true);
    setMicError(null);
    setAssistantError(null);
    setInterimTranscript('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'user',
      text: trimmed,
    };

    try {
      const { reply, nextState } = processAssistantMessage(
        trimmed,
        lang,
        conversationState
      );
      setConversationState(nextState);
      setInputValue('');
      setMessages((prev) => [...prev, userMsg]);

      const assistantMsgId = `assistant-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;

      if (reply.respectLevel > 1 || reply.matchedTopic === 'session_ended') {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            sender: 'assistant',
            text: reply.text,
            respectLevel: reply.respectLevel,
            suggestEndSession: reply.suggestEndSession,
          },
        ]);
        if (
          (autoSpeak || forceVoiceReply) &&
          voiceStatus.availability === 'male_found'
        ) {
          speakWithMaleVoice(
            reply.text,
            lang,
            () => setSpeakingMessageId(assistantMsgId),
            () => setSpeakingMessageId(null),
            () => setSpeakingMessageId(null)
          );
        }
        return;
      }

      const history = messages
        .filter((message) => message.id !== 'welcome-0')
        .slice(-12)
        .map((message) => ({
          role: message.sender === 'assistant' ? 'model' : 'user',
          text: message.text,
        }));

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history, lang }),
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error(copy.assistantRequestError);
      }

      if (!response.ok) {
        const errorMessage =
          isRecord(payload) && typeof payload.error === 'string'
            ? payload.error
            : copy.assistantRequestError;
        throw new Error(errorMessage);
      }

      if (!isRecord(payload) || typeof payload.reply !== 'string') {
        throw new Error(copy.assistantRequestError);
      }

      const answer = payload.reply.trim();
      if (!answer) {
        throw new Error(copy.assistantRequestError);
      }

      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, sender: 'assistant', text: answer },
      ]);

      if (
        (autoSpeak || forceVoiceReply) &&
        voiceStatus.availability === 'male_found'
      ) {
        speakWithMaleVoice(
          answer,
          lang,
          () => setSpeakingMessageId(assistantMsgId),
          () => setSpeakingMessageId(null),
          () => setSpeakingMessageId(null)
        );
      }
    } catch (error) {
      setInputValue(trimmed);
      setAssistantError(
        error instanceof Error ? error.message : copy.assistantRequestError
      );
    } finally {
      requestInProgressRef.current = false;
      setIsRequestingAnswer(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitQuery(inputValue);
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        resolve(
          typeof result === 'string' ? result.split(',')[1] || '' : ''
        );
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  const startAudioRecorderFallback = async () => {
    const recorder = await createBrowserAudioRecorder((errorCode) => {
      setIsListening(false);
      setMicError(mapRecognitionError(errorCode));
    });
    if (!recorder) return;

    audioRecorderRef.current = recorder;
    setIsListening(true);
    recorder.start();
  };

  const stopAudioRecorderFallback = async () => {
    const recorder = audioRecorderRef.current;
    if (!recorder) return;
    audioRecorderRef.current = null;
    setIsListening(false);
    setIsTranscribing(true);

    try {
      const blob = await recorder.stop();
      if (blob.size < 1000) {
        setMicError(copy.micNoSpeechNotice);
        return;
      }
      const data = await blobToBase64(blob);
      if (!data) {
        setMicError(copy.micNoSpeechNotice);
        return;
      }

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transcribe',
          audio: { mimeType: blob.type || 'audio/webm', data },
          lang,
        }),
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error(copy.assistantRequestError);
      }
      if (!response.ok) {
        throw new Error(
          isRecord(payload) && typeof payload.error === 'string'
            ? payload.error
            : copy.assistantRequestError
        );
      }
      if (!isRecord(payload) || typeof payload.transcript !== 'string') {
        throw new Error(copy.assistantRequestError);
      }

      const transcript = payload.transcript.trim();
      if (!transcript) {
        setMicError(copy.micNoSpeechNotice);
        return;
      }
      setInterimTranscript('');
      await submitQuery(transcript, true);
    } catch (error) {
      setMicError(
        error instanceof Error ? error.message : copy.assistantRequestError
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const mapRecognitionError = (code: string): string => {
    switch (code) {
      case 'not-allowed':
      case 'service-not-allowed':
        return copy.micDeniedNotice;
      case 'audio-capture':
        return copy.micNoDeviceNotice;
      case 'no-speech':
        return copy.micNoSpeechNotice;
      case 'network':
        return copy.micNetworkNotice;
      default:
        return copy.micDeniedNotice;
    }
  };

  const handleToggleMic = async () => {
    if (conversationState.ended || isRequestingMic || isTranscribing) return;
    setMicError(null);

    if (isListening) {
      if (audioRecorderRef.current) {
        await stopAudioRecorderFallback();
      } else {
        recognizerRef.current?.stop();
      }
      return;
    }

    stopSpeaking();
    setSpeakingMessageId(null);
    setInterimTranscript('');
    setIsRequestingMic(true);

    const permission = await requestMicrophonePermission();
    setIsRequestingMic(false);

    if (!permission.granted) {
      if (permission.reason === 'unsupported') {
        setMicError(copy.recognitionUnsupportedNotice);
      } else if (permission.reason === 'no_device') {
        setMicError(copy.micNoDeviceNotice);
      } else if (permission.reason === 'in_use') {
        setMicError(copy.micBusyNotice);
      } else {
        setMicError(copy.micDeniedNotice);
      }
      return;
    }

    if (!recognitionSupported) {
      if (!isBrowserAudioRecordingSupported()) {
        setMicError(copy.recognitionUnsupportedNotice);
        return;
      }
      await startAudioRecorderFallback();
      return;
    }

    const controller = createBrowserSpeechRecognizer(lang, {
      onInterim: (transcript) => {
        setInterimTranscript(transcript);
      },
      onResult: (transcript) => {
        setIsListening(false);
        setInterimTranscript('');
        void submitQuery(transcript, true);
      },
      onError: (errorCode) => {
        setIsListening(false);
        setInterimTranscript('');
        if (errorCode === 'network' && isBrowserAudioRecordingSupported()) {
          void startAudioRecorderFallback();
        } else {
          setMicError(mapRecognitionError(errorCode));
        }
      },
      onEnd: () => {
        setIsListening(false);
        setInterimTranscript('');
      },
    });

    if (!controller) {
      setMicError(copy.recognitionUnsupportedNotice);
      return;
    }

    recognizerRef.current = controller;
    try {
      setIsListening(true);
      controller.start();
    } catch {
      setIsListening(false);
      setInterimTranscript('');
      setMicError(copy.micDeniedNotice);
    }
  };

  const handleEndSession = () => {
    stopSpeaking();
    setSpeakingMessageId(null);
    recognizerRef.current?.abort();
    audioRecorderRef.current?.abort();
    audioRecorderRef.current = null;
    setIsTranscribing(false);
    setIsListening(false);
    setIsRequestingMic(false);
    setInterimTranscript('');
    setConversationState((prev) => ({ ...prev, ended: true }));
    setMessages((prev) => [
      ...prev,
      {
        id: `ended-${Date.now()}`,
        sender: 'assistant',
        text: SESSION_ENDED_NOTICE[lang],
        respectLevel: 3,
      },
    ]);
  };

  const handleResetSession = () => {
    stopSpeaking();
    setSpeakingMessageId(null);
    recognizerRef.current?.abort();
    audioRecorderRef.current?.abort();
    audioRecorderRef.current = null;
    setIsTranscribing(false);
    setIsListening(false);
    setIsRequestingMic(false);
    setInterimTranscript('');
    setMicError(null);
    setInputValue('');
    setConversationState({ disrespectCount: 0, ended: false });
    setMessages([
      {
        id: 'welcome-0',
        sender: 'assistant',
        text: copy.welcomeMessage,
        respectLevel: 1,
      },
    ]);
  };

  const handleToggleAutoSpeak = () => {
    if (voiceStatus.availability !== 'male_found') {
      setAutoSpeak(false);
      return;
    }
    userToggledAutoSpeakRef.current = true;
    const next = !autoSpeak;
    setAutoSpeak(next);
    if (!next) {
      stopSpeaking();
      setSpeakingMessageId(null);
    }
  };

  return (
    <>
      {/* Compact Floating Launcher (<= 15% mobile viewport cap) */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
          <button
            type="button"
            onClick={() => onOpenChange(true)}
            aria-label={copy.launcherLabel}
            className="inline-flex items-center gap-2.5 h-11 px-4 rounded-xl bg-zinc-950 text-white text-xs sm:text-sm font-semibold border border-zinc-800 shadow-lg hover:bg-zinc-800 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
          >
            <Briefcase className="w-4 h-4 text-zinc-300 shrink-0" />
            <span>{copy.launcherLabel}</span>
          </button>
        </div>
      )}

      {/* Assistant Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistant-drawer-title"
            className="fixed inset-0 z-50 flex justify-end bg-zinc-950/45 backdrop-blur-[2px]"
          >
            <div
              className="hidden sm:block flex-1"
              onClick={() => onOpenChange(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:max-w-[490px] h-[100dvh] bg-white border-l border-zinc-200 flex flex-col shadow-2xl"
            >
              {/* Editorial Executive Header */}
              <header className="px-5 sm:px-6 pt-5 pb-4 border-b border-zinc-200 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      aria-hidden="true"
                      className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shrink-0 border border-zinc-800"
                    >
                      <Briefcase className="w-4 h-4 text-zinc-100" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-[0.12em] text-zinc-500 leading-none">
                        {copy.eyebrowLabel}
                      </p>
                      <h2
                        id="assistant-drawer-title"
                        className="mt-1.5 text-lg sm:text-[19px] font-bold text-zinc-950 tracking-tight leading-snug"
                      >
                        {copy.title}
                      </h2>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {copy.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetSession}
                      disabled={isRequestingAnswer}
                      title={copy.newSessionLabel}
                      aria-label={copy.newSessionLabel}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-950 hover:border-zinc-300 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-zinc-950"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      title={copy.closeLabel}
                      aria-label={copy.closeLabel}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-950 hover:border-zinc-300 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-zinc-950"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </header>

              {/* Browser Voice & Recognition Bar */}
              <div className="px-5 sm:px-6 py-2.5 border-b border-zinc-200/80 bg-[#FAFAFA] space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    {voiceStatus.availability === 'male_found' &&
                    voiceStatus.voiceName ? (
                      <span className="text-[11px] font-medium text-zinc-600 truncate">
                        {copy.maleVoiceReady(voiceStatus.voiceName)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-zinc-600">
                        {copy.voiceAutoOff}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAutoSpeak}
                    disabled={voiceStatus.availability !== 'male_found'}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-zinc-950 ${
                      voiceStatus.availability !== 'male_found'
                        ? 'border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                        : autoSpeak
                        ? 'border-zinc-900 bg-zinc-950 text-white cursor-pointer'
                        : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 cursor-pointer'
                    }`}
                  >
                    {autoSpeak ? (
                      <Volume2 className="w-3.5 h-3.5" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {autoSpeak ? copy.voiceAutoOn : copy.voiceAutoOff}
                    </span>
                  </button>
                </div>

                {/* Honest compatibility diagnostics */}
                {voiceStatus.availability === 'no_male_voice' && (
                  <p className="text-[11px] text-zinc-600 leading-relaxed bg-white border border-zinc-200/80 rounded-lg px-3 py-2">
                    {copy.noMaleVoiceNotice}
                  </p>
                )}
                {voiceStatus.availability === 'unsupported' && (
                  <p className="text-[11px] text-zinc-600 leading-relaxed bg-white border border-zinc-200/80 rounded-lg px-3 py-2">
                    {copy.synthesisUnsupportedNotice}
                  </p>
                )}
                {!recognitionSupported && !isBrowserAudioRecordingSupported() && (
                  <p className="text-[11px] text-zinc-600 leading-relaxed bg-white border border-zinc-200/80 rounded-lg px-3 py-2">
                    {copy.recognitionUnsupportedNotice}
                  </p>
                )}
              </div>

              {/* Conversation Thread */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 bg-[#FAFAFA]">
                {messages.map((msg) => {
                  const isAssistant = msg.sender === 'assistant';
                  const isWelcome = msg.id === 'welcome-0';
                  const isWarning =
                    isAssistant &&
                    (msg.respectLevel === 2 || msg.respectLevel === 3);
                  const isThisMsgSpeaking = speakingMessageId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isAssistant ? 'items-start' : 'items-end'
                      }`}
                    >
                      <div
                        className={`${
                          isWelcome ? 'w-full' : 'max-w-[90%]'
                        } rounded-xl px-4 py-3.5 text-sm leading-relaxed whitespace-pre-line ${
                          isAssistant
                            ? isWarning
                              ? 'bg-white border border-zinc-900 text-zinc-950'
                              : isWelcome
                              ? 'bg-white border border-zinc-200/90 text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                              : 'bg-white border border-zinc-200 text-zinc-800'
                            : 'bg-zinc-950 text-white'
                        }`}
                      >
                        {isWarning && (
                          <p className="text-[11px] font-semibold text-zinc-500 mb-1.5">
                            {msg.respectLevel === 2
                              ? copy.level2Tag
                              : copy.level3Tag}
                          </p>
                        )}
                        <p className={isWelcome ? 'text-[14.5px] text-zinc-800 leading-[1.65]' : ''}>
                          {msg.text}
                        </p>

                        {/* Speak message with male voice button */}
                        {isAssistant &&
                          voiceStatus.availability === 'male_found' && (
                            <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleSpeak(msg.id, msg.text)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-zinc-950 rounded"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>
                                  {isThisMsgSpeaking
                                    ? copy.stopAudioLabel
                                    : copy.speakMessageLabel}
                                </span>
                              </button>
                            </div>
                          )}

                        {/* Level 3 Option to End Session */}
                        {isAssistant &&
                          msg.suggestEndSession &&
                          !conversationState.ended && (
                            <div className="mt-3 pt-2.5 border-t border-zinc-200 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleEndSession}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-[#FAFAFA] text-zinc-800 hover:bg-zinc-100 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{copy.endSessionLabel}</span>
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}

                {/* Suggested Recruiter Questions (discrete, modern, functional) */}
                {!conversationState.ended && messages.length === 1 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-semibold tracking-wide text-zinc-500 mb-2.5">
                      {copy.suggestedLabel}
                    </p>
                    <div className="flex flex-col gap-2">
                      {copy.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => void submitQuery(suggestion)}
                          className="group w-full flex items-center justify-between gap-3 text-left px-4 py-3 rounded-xl border border-zinc-200/90 bg-white hover:border-zinc-900 hover:bg-white text-[13px] font-medium text-zinc-800 hover:text-zinc-950 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-zinc-950"
                        >
                          <span className="leading-snug">{suggestion}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {conversationState.ended && (
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={handleResetSession}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{copy.newSessionLabel}</span>
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
                {isRequestingAnswer && (
                  <p
                    role="status"
                    className="text-xs text-zinc-500"
                  >
                    {copy.assistantRequestingLabel}
                  </p>
                )}
              </div>

              {/* Input Footer */}
              <div className="p-4 sm:px-6 border-t border-zinc-200 bg-white space-y-2">
                {micError && (
                  <p
                    role="alert"
                    className="flex items-start gap-1.5 text-xs text-red-700 leading-relaxed"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{micError}</span>
                  </p>
                )}

                {assistantError && (
                  <p
                    role="alert"
                    className="flex items-start gap-1.5 text-xs text-red-700 leading-relaxed"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{assistantError}</span>
                  </p>
                )}

                {isRequestingMic && (
                  <p className="text-[11px] font-medium text-zinc-600">
                    {copy.requestingMicLabel}
                  </p>
                )}

                {isListening && (
                  <div className="rounded-lg border border-zinc-300 bg-[#FAFAFA] px-3 py-2 space-y-1">
                    <p className="text-[11px] font-semibold text-zinc-900">
                      {copy.listeningLabel}
                    </p>
                    {interimTranscript && (
                      <p className="text-xs text-zinc-700 italic">
                        «{interimTranscript}»
                      </p>
                    )}
                  </div>
                )}

                {isTranscribing && (
                  <p className="text-[11px] font-medium text-zinc-600">
                    {copy.transcribingLabel}
                  </p>
                )}

                <form
                  onSubmit={handleFormSubmit}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={
                      isListening && interimTranscript
                        ? interimTranscript
                        : inputValue
                    }
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={
                      conversationState.ended ||
                      isListening ||
                      isTranscribing ||
                      isRequestingAnswer
                    }
                    placeholder={
                      conversationState.ended
                        ? copy.inputEndedPlaceholder
                        : copy.inputPlaceholder
                    }
                    className="flex-1 min-w-0 h-11 px-3.5 text-sm rounded-lg border border-zinc-300 bg-[#FAFAFA] text-zinc-950 placeholder:text-zinc-400 focus:bg-white focus:outline-2 focus:outline-zinc-950 disabled:bg-zinc-100 disabled:text-zinc-500"
                  />

                  <button
                    type="button"
                    onClick={handleToggleMic}
                    disabled={
                      conversationState.ended ||
                      isRequestingMic ||
                      isTranscribing ||
                      isRequestingAnswer
                    }
                    title={
                      !recognitionSupported && !isBrowserAudioRecordingSupported()
                        ? copy.recognitionUnsupportedNotice
                        : isListening
                        ? copy.stopMicLabel
                        : copy.startMicLabel
                    }
                    aria-label={
                      !recognitionSupported && !isBrowserAudioRecordingSupported()
                        ? copy.recognitionUnsupportedNotice
                        : isListening
                        ? copy.stopMicLabel
                        : copy.startMicLabel
                    }
                    className={`inline-flex items-center justify-center w-11 h-11 rounded-lg border transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-zinc-950 ${
                      conversationState.ended ||
                      isRequestingMic ||
                      isTranscribing ||
                      isRequestingAnswer
                        ? 'border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                        : !recognitionSupported && !isBrowserAudioRecordingSupported()
                        ? 'border-zinc-200 bg-[#FAFAFA] text-zinc-400 hover:text-zinc-700 hover:border-zinc-300 cursor-pointer'
                        : isListening
                        ? 'border-zinc-950 bg-zinc-950 text-white cursor-pointer'
                        : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 cursor-pointer'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={
                      conversationState.ended ||
                      isRequestingAnswer ||
                      !inputValue.trim()
                    }
                    aria-label={copy.sendLabel}
                    className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-zinc-950"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
