import test from 'node:test';
import assert from 'node:assert/strict';

// We test the prompt-building logic in isolation — no real Anthropic API calls.
// draftSessionNote is tested by verifying the ANTHROPIC_API_KEY guard only,
// since the rest of that function requires a live network call.

let buildPrompt;
let draftSessionNote;

// Load the module once before all tests.
// We import here rather than at the top level so we can control env vars first.
await (async () => {
  const mod = await import('../src/lib/ai-notes.js');
  buildPrompt = mod.buildPrompt;
  draftSessionNote = mod.draftSessionNote;
})();

test('throws when ANTHROPIC_API_KEY is not set', async () => {
  const saved = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    await assert.rejects(
      () => draftSessionNote({ format: 'SOAP', sessionContext: 'test', faithIntegrationLevel: 'none' }),
      /ANTHROPIC_API_KEY not configured/,
    );
  } finally {
    if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
  }
});

test('SOAP prompt for faith level none contains no faith language', () => {
  const prompt = buildPrompt('SOAP', 'none');
  assert.ok(prompt.includes('S (Subjective)'), 'SOAP structure present');
  assert.ok(!prompt.includes('scripture'), 'no scripture reference for none level');
  assert.ok(!prompt.includes('prayer'), 'no prayer reference for none level');
  assert.ok(!prompt.includes('spiritual practices'), 'no spiritual practices for none level');
});

test('prompt for actively_integrated level includes faith language', () => {
  const prompt = buildPrompt('SOAP', 'actively_integrated');
  assert.ok(prompt.includes('scripture'), 'scripture referenced for actively_integrated');
  assert.ok(prompt.includes('prayer'), 'prayer referenced for actively_integrated');
  assert.ok(prompt.includes('spiritual'), 'spiritual referenced for actively_integrated');
});

test('preferred level also includes faith language', () => {
  const prompt = buildPrompt('DAP', 'preferred');
  assert.ok(prompt.includes('spiritual'), 'spiritual referenced for preferred level');
});

test('FAITH_INTEGRATED format has dedicated faith section in structure', () => {
  const prompt = buildPrompt('FAITH_INTEGRATED', 'none');
  assert.ok(prompt.includes('Faith & Spiritual Dimensions'), 'faith section in FAITH_INTEGRATED format');
});

test('open level produces no faith language', () => {
  const prompt = buildPrompt('BIRP', 'open');
  assert.ok(!prompt.includes('scripture'), 'no scripture for open level');
});

test('unknown format throws', () => {
  assert.throws(
    () => buildPrompt('UNKNOWN_FORMAT', 'none'),
    /Invalid format/,
  );
});

test('system prompt always starts with counselor documentation assistant instruction', () => {
  for (const format of ['SOAP', 'DAP', 'BIRP', 'FAITH_INTEGRATED']) {
    const prompt = buildPrompt(format, 'none');
    assert.ok(
      prompt.startsWith('You are a licensed clinical mental health counselor documentation assistant.'),
      `${format} prompt starts with required instruction`,
    );
  }
});
