import Anthropic from '@anthropic-ai/sdk';

const VALID_FORMATS = new Set(['SOAP', 'DAP', 'BIRP', 'FAITH_INTEGRATED']);
const FAITH_ACTIVE_LEVELS = new Set(['preferred', 'actively_integrated']);

const FORMAT_STRUCTURE = {
  SOAP: 'Structure the note in four labeled sections: S (Subjective), O (Objective), A (Assessment), P (Plan).',
  DAP: 'Structure the note in three labeled sections: D (Data), A (Assessment), P (Plan).',
  BIRP: 'Structure the note in four labeled sections: B (Behavior), I (Intervention), R (Response), P (Plan).',
  FAITH_INTEGRATED:
    'Structure the note as a faith-integrated clinical note with sections: Presenting Concerns, Clinical Observations, Faith & Spiritual Dimensions, Assessment, Plan. Include a dedicated Faith & Spiritual Dimensions section covering scripture themes, prayer themes, spiritual strengths, and areas of growth.',
};

export function buildPrompt(format, faithIntegrationLevel) {
  if (!VALID_FORMATS.has(format)) {
    throw new Error(`Invalid format: ${format}. Must be one of SOAP, DAP, BIRP, FAITH_INTEGRATED.`);
  }

  const structure = FORMAT_STRUCTURE[format];
  const faithBlock = FAITH_ACTIVE_LEVELS.has(faithIntegrationLevel)
    ? '\n\nThis client has expressed an active faith integration preference. Where clinically appropriate, weave in references to scripture themes, spiritual practices (prayer, journaling, church community, etc.), and the client\'s expressed spiritual strengths or concerns. Do not force faith content where it is not clinically relevant.'
    : '';

  return (
    `You are a licensed clinical mental health counselor documentation assistant. Output only the note text, no preamble.\n\n` +
    `${structure}${faithBlock}`
  );
}

export async function draftSessionNote({ format, sessionContext, faithIntegrationLevel }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  if (!VALID_FORMATS.has(format)) {
    throw new Error(`Invalid format: ${format}. Must be one of SOAP, DAP, BIRP, FAITH_INTEGRATED.`);
  }

  const systemPrompt = buildPrompt(format, faithIntegrationLevel ?? 'none');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Draft a session note based on these session notes:\n\n${sessionContext}`,
      },
    ],
  });

  const draft = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return { draft, format, model: 'claude-sonnet-4-6' };
}
