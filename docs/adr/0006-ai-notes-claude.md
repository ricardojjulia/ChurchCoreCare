# ADR-0006 — Use Claude for AI Session Note Drafting

**Date:** 2026-05-26  
**Status:** Accepted  
**Deciders:** Engineering

---

## Context

ChurchCore Care counselors spend significant time on clinical documentation. The platform should offer an AI-assisted draft generation feature for SOAP, DAP, and BIRP session notes to reduce documentation burden. The feature must:

- Produce clinically appropriate draft language from a structured brief (not free-form conversation)
- Support faith-integrated note language when the client's faith profile indicates it
- Never auto-save; counselor must explicitly accept any AI-generated content
- Produce no PHI in the audit trail for AI calls
- Work via an existing API key without adding a new vendor relationship

## Decision

Use **Anthropic Claude** (`claude-sonnet-4-6` model) for AI session note draft generation via the `@anthropic-ai/sdk` package.

The feature is implemented in `apps/api/src/lib/ai-notes.js`:

- A structured system prompt defines clinical documentation roles and format rules
- Faith integration level from the client's faith profile is passed to the prompt to conditionally include spiritual language
- ICD-10 diagnosis codes (not descriptions) and session metadata are passed — no client name or identifying information
- Draft generation is gated by `AI_NOTES_ENABLED=true` env var so it can be disabled without a deploy
- All AI calls are server-side; no client-side API key exposure

## Consequences

**Positive:**
- Claude is already integrated for Audit Intelligence — no new vendor relationship or BAA required
- Structured prompt with explicit rules reduces hallucination risk for clinical content
- Faith-integrated prompt path is implemented cleanly by passing `faithIntegrationLevel` without embedding PHI
- `AI_NOTES_ENABLED` gate allows rolling out to specific tenants before general availability

**Negative:**
- Anthropic API latency adds ~2–8 seconds to the draft request; UI must show a clear loading state
- API costs scale with usage; high-volume practices could increase billing materially
- Model responses must be reviewed by counselors — no guarantee of clinical accuracy

**Mitigations:**
- Draft panel makes clear the content is AI-generated and requires counselor review before saving
- Audit event `ai.note_draft.generated` is logged with session ID but no client name or note content
- 10-second timeout on Anthropic calls; graceful error returned if exceeded

## Alternatives Considered

| Alternative | Why Not Chosen |
|---|---|
| OpenAI GPT-4o | Different vendor; requires new BAA; adds API key management overhead |
| On-device / local LLM | Insufficient quality for clinical documentation at current hardware constraints |
| Template-based auto-fill | Too rigid; does not handle the variety of presenting concerns and interventions |
| No AI drafting | Competitive disadvantage; major EHR vendors (SimplePractice, TherapyNotes) already offer this |
