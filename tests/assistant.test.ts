import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  createInitialConversationState,
  processAssistantMessage,
} from '../src/services/recruiterAssistant.ts';

test('answers with the verified professional career history', () => {
  const { reply } = processAssistantMessage(
    '¿Cuál es su experiencia laboral?',
    'es',
    createInitialConversationState()
  );

  assert.equal(reply.matchedTopic, 'general_experience');
  for (const company of [
    'FAC Seguridad',
    'Grupo Uno CTC',
    'Sanofi',
    'Fnac',
    'DIA',
    'Ramos Sierra',
  ]) {
    assert.ok(reply.text.includes(company), `Missing verified employer: ${company}`);
  }
});

test('answers common warehouse and stock-management questions', () => {
  const { reply } = processAssistantMessage(
    '¿Qué experiencia tiene en la gestión de almacenes y el control de stock?',
    'es',
    createInitialConversationState()
  );

  assert.equal(reply.matchedTopic, 'warehouse_management');
  assert.match(reply.text, /preparación y revisión de pedidos/);
  assert.match(reply.text, /control de stock/);
  assert.match(reply.text, /FAC Seguridad/);
});

test('answers questions about coordinating teams', () => {
  const { reply } = processAssistantMessage(
    '¿Qué experiencia tiene coordinando equipos?',
    'es',
    createInitialConversationState()
  );

  assert.equal(reply.matchedTopic, 'leadership_coordination');
  assert.match(reply.text, /coordinación de equipos/);
  assert.match(reply.text, /distribución de tareas/);
});

test('answers questions about training new employees', () => {
  const { reply } = processAssistantMessage(
    '¿Cómo capacita a empleados recién incorporados?',
    'es',
    createInitialConversationState()
  );

  assert.equal(reply.matchedTopic, 'staff_training');
  assert.match(reply.text, /formación práctica de personal/);
  assert.match(reply.text, /Sanofi/);
});

test('answers questions about verified artificial-intelligence training', () => {
  const { reply } = processAssistantMessage(
    '¿Qué curso de inteligencia artificial ha realizado?',
    'es',
    createInitialConversationState()
  );

  assert.equal(reply.matchedTopic, 'ai_training');
  assert.match(reply.text, /120 horas/);
  assert.match(reply.text, /Cámara de Comercio de Toledo/);
});

test('answers professional contact questions', () => {
  const { reply } = processAssistantMessage(
    '¿Cómo puedo contactar por correo electrónico?',
    'es',
    createInitialConversationState()
  );

  assert.equal(reply.matchedTopic, 'contact_pdf');
  assert.match(reply.text, /josemarotolazaro@hotmail\.com/);
});

test('honestly declines to invent unavailable details', () => {
  const { reply } = processAssistantMessage(
    '¿Cuál es su color favorito?',
    'es',
    createInitialConversationState()
  );

  assert.equal(reply.matchedTopic, 'honest_fallback');
  assert.match(reply.text, /no invento información/);
});

test('keeps Spanish responses when Spanish is selected', () => {
  const { reply } = processAssistantMessage(
    '¿Qué experiencia tiene en logística?',
    'es',
    createInitialConversationState()
  );

  assert.equal(reply.respectLevel, 1);
  assert.match(reply.text, /José María cuenta con experiencia práctica/);
  assert.match(reply.text, /gestión de almacenes/);
});

test('keeps English responses when English is selected', () => {
  const { reply } = processAssistantMessage(
    'What experience does he have in logistics?',
    'en',
    createInitialConversationState()
  );

  assert.equal(reply.respectLevel, 1);
  assert.match(reply.text, /José María has practical experience/);
  assert.match(reply.text, /warehouse operations/);
});

test('gives a polite first warning for disrespectful messages', () => {
  const { reply, nextState } = processAssistantMessage(
    'Eres un idiota',
    'es',
    createInitialConversationState()
  );

  assert.equal(reply.respectLevel, 2);
  assert.equal(reply.suggestEndSession, false);
  assert.equal(nextState.disrespectCount, 1);
  assert.match(reply.text, /conversación respetuosa y profesional/);
});

test('gives a firm final warning for a second consecutive offense', () => {
  const first = processAssistantMessage(
    'Eres un idiota',
    'es',
    createInitialConversationState()
  );
  const second = processAssistantMessage(
    'Eres un idiota',
    'es',
    first.nextState
  );

  assert.equal(second.reply.respectLevel, 3);
  assert.equal(second.reply.suggestEndSession, true);
  assert.equal(second.nextState.disrespectCount, 2);
  assert.match(second.reply.text, /daremos por finalizada esta conversación/);
});

test('ends the conversation after a third consecutive offense', () => {
  let state = createInitialConversationState();
  for (let offense = 0; offense < 2; offense += 1) {
    state = processAssistantMessage('Eres un idiota', 'es', state).nextState;
  }

  const third = processAssistantMessage('Eres un idiota', 'es', state);

  assert.equal(third.reply.matchedTopic, 'respect_session_closed');
  assert.equal(third.reply.shouldEndSessionNow, true);
  assert.equal(third.nextState.ended, true);
});

test('resets the consecutive-disrespect count after a respectful exchange', () => {
  const firstOffense = processAssistantMessage(
    'Eres un idiota',
    'es',
    createInitialConversationState()
  );
  const respectfulReply = processAssistantMessage(
    '¿Qué experiencia tiene en logística?',
    'es',
    firstOffense.nextState
  );
  const nextOffense = processAssistantMessage(
    'Eres un idiota',
    'es',
    respectfulReply.nextState
  );

  assert.equal(respectfulReply.nextState.disrespectCount, 0);
  assert.equal(respectfulReply.nextState.ended, false);
  assert.equal(nextOffense.reply.respectLevel, 2);
  assert.equal(nextOffense.nextState.disrespectCount, 1);
});

test('starts a new conversation after the prior session has ended', () => {
  let endedState = createInitialConversationState();
  for (let offense = 0; offense < 3; offense += 1) {
    endedState = processAssistantMessage(
      'Eres un idiota',
      'es',
      endedState
    ).nextState;
  }

  assert.equal(endedState.ended, true);
  const stillEnded = processAssistantMessage(
    '¿Qué experiencia tiene?',
    'es',
    endedState
  );
  assert.equal(stillEnded.reply.matchedTopic, 'session_ended');
  assert.equal(stillEnded.nextState.ended, true);

  const newConversation = processAssistantMessage(
    '¿Qué experiencia tiene?',
    'es',
    createInitialConversationState()
  );
  assert.equal(newConversation.reply.respectLevel, 1);
  assert.equal(newConversation.nextState.disrespectCount, 0);
  assert.equal(newConversation.nextState.ended, false);
});

test('uses no Gemini provider, serverless chat endpoint, or AI dependencies', async () => {
  const componentSource = await readFile(
    new URL('../src/components/VirtualAssistant.tsx', import.meta.url),
    'utf8'
  );
  const manifest = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8')
  ) as { dependencies: Record<string, string> };

  assert.doesNotMatch(componentSource, /\bfetch\s*\(/);
  assert.doesNotMatch(componentSource, /Gemini|@google\/genai|\/api\/assistant\/chat/i);
  for (const dependency of [
    '@google/genai',
    '@upstash/ratelimit',
    '@upstash/redis',
  ]) {
    assert.equal(manifest.dependencies[dependency], undefined);
  }
  await assert.rejects(
    access(new URL('../api/assistant/chat.ts', import.meta.url)),
    (error: NodeJS.ErrnoException) => error.code === 'ENOENT'
  );
});
