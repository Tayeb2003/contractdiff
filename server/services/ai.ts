import { logger } from './logger.js';

export type Provider = 'gemini' | 'openai' | 'anthropic' | 'nvidia';

export interface AIConfig {
  provider: Provider;
  key: string;
}

export interface ClauseAnalysis {
  plain_english_summary: string;
  favors: 'party_a' | 'party_b' | 'neutral' | 'ambiguous';
  severity: 'minor' | 'moderate' | 'major';
}

export interface SummaryResult {
  summary: string;
}

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';

const FETCH_TIMEOUT_MS = 15_000;

export const PROVIDERS: Provider[] = ['gemini', 'openai', 'anthropic', 'nvidia'];

async function geminiFetch(prompt: string, temperature: number, maxTokens: number, apiKey: string): Promise<string | null> {
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown');
      logger.warn('Gemini API returned non-OK status', { status: response.status, body: errorBody.slice(0, 200) });
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text || null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('Gemini API call failed', { error: msg });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function chatCompletionsFetch(
  prompt: string,
  temperature: number,
  maxTokens: number,
  apiKey: string,
  url: string,
  model: string
): Promise<string | null> {
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown');
      logger.warn('Chat completions API returned non-OK status', { status: response.status, body: errorBody.slice(0, 200) });
      return null;
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return text || null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('Chat completions API call failed', { error: msg });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function anthropicFetch(
  prompt: string,
  temperature: number,
  maxTokens: number,
  apiKey: string,
  model: string
): Promise<string | null> {
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown');
      logger.warn('Anthropic API returned non-OK status', { status: response.status, body: errorBody.slice(0, 200) });
      return null;
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || '';
    return text || null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('Anthropic API call failed', { error: msg });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function callAI(prompt: string, temperature: number, maxTokens: number, config: AIConfig): Promise<string | null> {
  switch (config.provider) {
    case 'gemini':
      return geminiFetch(prompt, temperature, maxTokens, config.key);
    case 'openai':
      return chatCompletionsFetch(prompt, temperature, maxTokens, config.key, OPENAI_API_URL, OPENAI_MODEL);
    case 'nvidia':
      return chatCompletionsFetch(prompt, temperature, maxTokens, config.key, NVIDIA_API_URL, NVIDIA_MODEL);
    case 'anthropic':
      return anthropicFetch(prompt, temperature, maxTokens, config.key, ANTHROPIC_MODEL);
    default:
      return null;
  }
}

function extractJson<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

export async function analyzeClause(
  before: string,
  after: string,
  config?: AIConfig
): Promise<ClauseAnalysis> {
  const prompt = `You are a legal document analyst. Compare these two contract clauses and explain what changed.

Original clause:
"""
${before}
"""

New clause:
"""
${after}
"""

Respond in JSON format:
{
  "plain_english_summary": "brief explanation of what changed in plain English",
  "favors": "party_a" | "party_b" | "neutral" | "ambiguous",
  "severity": "minor" | "moderate" | "major"
}`;

  const raw = config ? await callAI(prompt, 0.2, 512, config) : null;
  if (raw) {
    const parsed = extractJson<ClauseAnalysis>(raw);
    if (parsed && parsed.plain_english_summary && parsed.favors && parsed.severity) {
      return parsed;
    }
  }

  return generateLocalAnalysis(before, after);
}

export async function generateSummary(clauses: ClauseAnalysis[], config?: AIConfig): Promise<SummaryResult> {
  if (clauses.length === 0) {
    return { summary: 'No clause changes were detected.' };
  }

  const changeCount = clauses.filter((c) => c.favors !== 'neutral').length;
  const fallback = {
    summary: `${clauses.length} clause change${clauses.length !== 1 ? 's' : ''} detected. ${changeCount} change${changeCount !== 1 ? 's' : ''} may favor one party over the other. Review each clause carefully.`,
  };

  if (clauses.length <= 1) return fallback;

  const prompt = `Summarize the following contract analysis into 3-5 bullet points:

${JSON.stringify(clauses, null, 2)}

Respond in JSON format:
{
  "summary": "3-5 bullet point executive summary"
}`;

  const raw = config ? await callAI(prompt, 0.3, 512, config) : null;
  if (raw) {
    const parsed = extractJson<SummaryResult>(raw);
    if (parsed && parsed.summary) {
      return parsed;
    }
  }

  return fallback;
}

function generateLocalAnalysis(before: string, after: string): ClauseAnalysis {
  const beforeLen = before.length;
  const afterLen = after.length;
  const diff = beforeLen - afterLen;

  let severity: ClauseAnalysis['severity'] = 'minor';
  const absDiff = Math.abs(diff);
  if (absDiff > 200) severity = 'major';
  else if (absDiff > 50) severity = 'moderate';

  let summary: string;
  if (beforeLen === 0 && afterLen > 0) {
    summary = `A new clause was added (${afterLen} characters).`;
  } else if (beforeLen > 0 && afterLen === 0) {
    summary = `An existing clause was removed (${beforeLen} characters).`;
  } else if (before === after) {
    summary = `No material change detected between these clauses.`;
  } else if (diff < -200) {
    summary = `The clause was significantly expanded (from ${beforeLen} to ${afterLen} characters).`;
  } else if (diff > 200) {
    summary = `The clause was significantly shortened (from ${beforeLen} to ${afterLen} characters).`;
  } else {
    summary = `The clause was modified. Review the changes carefully.`;
  }

  const favoredTermsBefore = (before.match(/(indemnify|hold harmless|waive|liability|shall not)/gi) || []).length;
  const favoredTermsAfter = (after.match(/(indemnify|hold harmless|waive|liability|shall not)/gi) || []).length;

  let favors: ClauseAnalysis['favors'] = 'neutral';
  if (favoredTermsAfter > favoredTermsBefore + 1) favors = 'party_a';
  else if (favoredTermsBefore > favoredTermsAfter + 1) favors = 'party_b';
  else if (absDiff > 100) favors = 'ambiguous';

  return { plain_english_summary: summary, favors, severity };
}
