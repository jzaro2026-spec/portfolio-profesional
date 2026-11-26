import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { env } from 'node:process';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  buildAssistantSystemInstruction,
  type AssistantLanguage,
} from '../../src/data/assistantKnowledge.ts';

interface VercelRequest extends IncomingMessage {
  body?: unknown;
}

interface VercelResponse extends ServerResponse {
  status(statusCode: number): this;
  json(payload: unknown): this;
}

interface GeminiTurn {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const MAX_MESSAGE_LENGTH = 2000;
const MAX_TEXT_REQUEST_BYTES = 16_384;
const MAX_REQUEST_BYTES = 1_600_000;
const MAX_AUDIO_BASE64_LENGTH = 1_400_000;
const MAX_HISTORY_TURNS = 8;
const MAX_HISTORY_TEXT_LENGTH = 1000;
const DAILY_REQUEST_LIMIT = 250;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getHistory(value: unknown): GeminiTurn[] {
  if (!Array.isArray(value)) return [];

  return value.slice(-MAX_HISTORY_TURNS).flatMap((turn): GeminiTurn[] => {
    if (!isRecord(turn)) return [];

    const role = turn.role;
    const text = turn.text;
    if (
      (role !== 'user' && role !== 'model') ||
      typeof text !== 'string' ||
      !text.trim()
    ) {
      return [];
    }

    return [
      {
        role,
        parts: [{ text: text.trim().slice(0, MAX_HISTORY_TEXT_LENGTH) }],
      },
    ];
  });
}

function createRateLimiters(redis: Redis) {
  const environment = env.VERCEL_ENV || 'local';

  return {
    perIp: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(8, '1 m'),
      prefix: `portfolio:assistant:${environment}:ip`,
    }),
    daily: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(DAILY_REQUEST_LIMIT, '1 d'),
      prefix: `portfolio:assistant:${environment}:daily`,
    }),
  };
}

let rateLimiters: ReturnType<typeof createRateLimiters> | null = null;

function getRateLimiters() {
  const url = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  try {
    if (new URL(url).protocol !== 'https:') {
      throw new TypeError('Upstash REST URL must use HTTPS.');
    }

    if (!rateLimiters) {
      rateLimiters = createRateLimiters(new Redis({ url, token }));
    }
  } catch (error) {
    console.error(
      'Assistant rate limiter initialization failed.',
      error instanceof Error ? error.name : 'UnknownError'
    );
    return null;
  }

  return rateLimiters;
}

function getClientIp(req: VercelRequest): string | null {
  // Vercel overwrites this header to prevent caller-supplied IP spoofing.
  const forwarded = req.headers['x-forwarded-for'];
  const headerValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const forwardedIp = headerValue?.split(',')[0].trim();
  const candidate = forwardedIp || req.socket.remoteAddress;

  return candidate && isIP(candidate) ? candidate : null;
}

function setRetryAfter(res: VercelResponse, resetAt: number): void {
  const seconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  res.setHeader('Retry-After', String(seconds));
}

function contentLengthExceedsLimit(req: VercelRequest, body: unknown): boolean {
  const header = req.headers['content-length'];
  const value = Array.isArray(header) ? header[0] : header;
  const isAudioRequest = isRecord(body) && body.action === 'transcribe';
  const limit = isAudioRequest ? MAX_REQUEST_BYTES : MAX_TEXT_REQUEST_BYTES;
  return (
    value !== undefined &&
    /^\d+$/.test(value) &&
    Number(value) > limit
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const contentType = req.headers['content-type'];
  if (
    typeof contentType !== 'string' ||
    !/^application\/json(?:\s*;|$)/i.test(contentType)
  ) {
    return res
      .status(415)
      .json({ error: 'Content-Type must be application/json.' });
  }

  let requestBody: unknown;
  try {
    requestBody = req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  if (contentLengthExceedsLimit(req, requestBody)) {
    return res.status(413).json({ error: 'The request is too large.' });
  }

  if (!isRecord(requestBody)) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  const body = requestBody;
  const lang: AssistantLanguage = body.lang === 'en' ? 'en' : 'es';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (body.action !== 'transcribe' && !message) {
    return res.status(400).json({
      error: lang === 'es' ? 'Escribe una pregunta.' : 'Enter a question.',
    });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      error:
        lang === 'es'
          ? 'La pregunta supera el límite de longitud.'
          : 'The question exceeds the maximum length.',
    });
  }

  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(503).json({
      error:
        lang === 'es'
          ? 'El asistente no está configurado. Añade GEMINI_API_KEY en las variables de entorno de Vercel.'
          : 'The assistant is not configured. Add GEMINI_API_KEY to the Vercel environment variables.',
    });
  }

  const limiters = getRateLimiters();
  if (!limiters) {
    return res.status(503).json({
      error:
        lang === 'es'
          ? 'El asistente no está disponible porque la protección de uso no está configurada correctamente.'
          : 'The assistant is unavailable because its usage protection is not configured correctly.',
    });
  }

  const ip = getClientIp(req);
  if (!ip) {
    return res.status(503).json({
      error:
        lang === 'es'
          ? 'No se pudo verificar el límite de uso. Inténtalo más tarde.'
          : 'The usage limit could not be verified. Please try again later.',
    });
  }

  try {
    const limiterSecret = env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!limiterSecret) {
      return res.status(503).json({
        error:
          lang === 'es'
            ? 'No se pudo verificar el límite de uso. Inténtalo más tarde.'
            : 'The usage limit could not be verified. Please try again later.',
      });
    }

    const identifier = createHmac('sha256', limiterSecret)
      .update(ip)
      .digest('hex');
    const ipLimit = await limiters.perIp.limit(identifier);
    if (!ipLimit.success) {
      setRetryAfter(res, ipLimit.reset);
      return res.status(429).json({
        error:
          lang === 'es'
            ? 'Has alcanzado el límite temporal de consultas. Inténtalo de nuevo más tarde.'
            : 'You have reached the temporary request limit. Please try again later.',
      });
    }

    const dailyLimit = await limiters.daily.limit('all');
    if (!dailyLimit.success) {
      setRetryAfter(res, dailyLimit.reset);
      return res.status(429).json({
        error:
          lang === 'es'
            ? 'El asistente ha alcanzado el límite diario de consultas. Inténtalo mañana.'
            : 'The assistant has reached its daily request limit. Please try again tomorrow.',
      });
    }
  } catch {
    console.error('Assistant usage limiter request failed.');
    return res.status(503).json({
      error:
        lang === 'es'
          ? 'No se pudo verificar el límite de uso. Inténtalo más tarde.'
          : 'The usage limit could not be verified. Please try again later.',
    });
  }

  if (body.action === 'transcribe') {
    const audio = body.audio;
    if (
      !isRecord(audio) ||
      typeof audio.mimeType !== 'string' ||
      typeof audio.data !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid audio data.' });
    }

    const mimeType = audio.mimeType;
    if (
      !/^audio\/(?:webm|ogg|mpeg|mp4|wav)/i.test(mimeType) ||
      audio.data.length === 0 ||
      audio.data.length > MAX_AUDIO_BASE64_LENGTH
    ) {
      return res.status(400).json({ error: 'Unsupported or oversized audio.' });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: audio.data } },
              {
                text:
                  lang === 'es'
                    ? 'Transcribe exactamente el contenido hablado en español. Devuelve solo el texto transcrito, sin explicaciones ni puntuación añadida.'
                    : 'Transcribe exactly the spoken content in English. Return only the transcript, with no explanations or added punctuation.',
              },
            ],
          },
        ],
        config: { maxOutputTokens: 300 },
      });

      const transcript = result.text?.trim();
      if (!transcript) {
        return res.status(502).json({
          error:
            lang === 'es'
              ? 'No se pudo transcribir el audio.'
              : 'The audio could not be transcribed.',
        });
      }
      return res.status(200).json({ transcript });
    } catch (error) {
      console.error(
        'Gemini transcription failed:',
        error instanceof Error ? error.message : 'Unknown transcription error'
      );
      return res.status(502).json({
        error:
          lang === 'es'
            ? 'No se pudo transcribir el audio. Inténtalo de nuevo.'
            : 'The audio could not be transcribed. Please try again.',
      });
    }
  }

  const history = getHistory(body.history);
  const contents: GeminiTurn[] = [
    ...history,
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction: buildAssistantSystemInstruction(lang),
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        maxOutputTokens: 700,
      },
    });

    const reply = result.text?.trim();
    if (!reply) {
      return res.status(502).json({
        error:
          lang === 'es'
            ? 'El asistente no generó una respuesta. Inténtalo de nuevo.'
            : 'The assistant did not return a response. Please try again.',
      });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error(
      'Gemini assistant request failed:',
      error instanceof Error ? error.message : 'Unknown Gemini error'
    );
    return res.status(502).json({
      error:
        lang === 'es'
          ? 'No se pudo obtener una respuesta de Gemini. Inténtalo de nuevo más tarde.'
          : 'Gemini could not provide a response. Please try again later.',
    });
  }
}
