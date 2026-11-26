import assert from 'node:assert/strict';
import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import test from 'node:test';
import handler from '../api/assistant/chat.ts';
import { buildAssistantSystemInstruction } from '../src/data/assistantKnowledge.ts';

type HandlerRequest = Parameters<typeof handler>[0];
type HandlerResponse = Parameters<typeof handler>[1];

function createRequest(
  method: string,
  body?: unknown,
  contentLength?: string
): HandlerRequest {
  const request = new IncomingMessage(new Socket()) as HandlerRequest;
  request.method = method;
  request.headers['content-type'] = 'application/json';
  request.headers['x-forwarded-for'] = '203.0.113.1';
  if (contentLength) request.headers['content-length'] = contentLength;
  request.body = body;
  return request;
}

function createResponse() {
  const state = {
    statusCode: 200,
    headers: new Map<string, string>(),
    body: undefined as unknown,
  };
  const response = {
    setHeader(name: string, value: string | number) {
      state.headers.set(name.toLowerCase(), String(value));
      return this;
    },
    status(statusCode: number) {
      state.statusCode = statusCode;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      return this;
    },
  };

  return { response: response as unknown as HandlerResponse, state };
}

test('assistant context includes verified Spanish and English profile data', () => {
  const spanish = buildAssistantSystemInstruction('es');
  const english = buildAssistantSystemInstruction('en');

  assert.match(spanish, /Segundo encargado de almacén/);
  assert.match(spanish, /Liderar en la era de la IA/);
  assert.match(spanish, /20 de noviembre de 2026/);
  assert.match(spanish, /josemarotolazaro@hotmail\.com/);
  assert.match(english, /Assistant Warehouse Manager/);
  assert.match(english, /Leading in the Age of AI/);
  assert.match(english, /November 20, 2026/);
  assert.match(english, /josemarotolazaro@hotmail\.com/);
});

test('assistant endpoint rejects methods other than POST', async () => {
  const { response, state } = createResponse();

  await handler(createRequest('GET'), response);

  assert.equal(state.statusCode, 405);
  assert.equal(state.headers.get('allow'), 'POST');
  assert.equal(state.headers.get('cache-control'), 'no-store');
});

test('assistant endpoint rejects oversized request bodies before provider use', async () => {
  const { response, state } = createResponse();

  await handler(createRequest('POST', { message: 'Hello' }, '20000'), response);

  assert.equal(state.statusCode, 413);
});

test('assistant endpoint returns a setup error when Gemini is not configured', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const { response, state } = createResponse();

  try {
    await handler(createRequest('POST', { lang: 'en', message: 'Hello' }), response);
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }

  assert.equal(state.statusCode, 503);
  assert.match(String((state.body as { error?: unknown })?.error), /GEMINI_API_KEY/);
});

test('assistant endpoint fails closed when shared rate limiting is not configured', async () => {
  const previous = {
    apiKey: process.env.GEMINI_API_KEY,
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
  process.env.GEMINI_API_KEY = 'test-only-not-a-real-key';
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  const { response, state } = createResponse();

  try {
    await handler(
      createRequest('POST', { lang: 'en', message: 'Hello' }),
      response
    );
  } finally {
    if (previous.apiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous.apiKey;
    if (previous.url === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previous.url;
    if (previous.token === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previous.token;
  }

  assert.equal(state.statusCode, 503);
  assert.match(String((state.body as { error?: unknown })?.error), /usage protection/i);
});

test('assistant endpoint does not trust spoofable IP headers for rate limiting', async () => {
  const previous = {
    apiKey: process.env.GEMINI_API_KEY,
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
  process.env.GEMINI_API_KEY = 'test-only-not-a-real-key';
  process.env.UPSTASH_REDIS_REST_URL = 'https://example.com';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-only-not-a-real-token';
  const request = createRequest('POST', { lang: 'en', message: 'Hello' });
  delete request.headers['x-forwarded-for'];
  request.headers['x-real-ip'] = '203.0.113.2';
  request.headers['x-vercel-forwarded-for'] = '203.0.113.3';
  const { response, state } = createResponse();

  try {
    await handler(request, response);
  } finally {
    if (previous.apiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous.apiKey;
    if (previous.url === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previous.url;
    if (previous.token === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previous.token;
  }

  assert.equal(state.statusCode, 503);
  assert.match(
    String((state.body as { error?: unknown })?.error),
    /usage limit could not be verified/i
  );
});
