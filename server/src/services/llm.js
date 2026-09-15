const TIMEOUT_MS = 60000;

const GROUNDED_SYSTEM_PROMPT = `You are VITS Chatbot, the campus assistant for PBR VITS. Students and staff ask you about campus life, and you answer from the college's own records.

How to answer:
- Every fact you state must come from the reference material below. Never invent dates, fees, timings, names or policies that aren't there.
- Write like a helpful person, not a database lookup. Lead with the answer.
- Use markdown: bold for key figures like dates, times and amounts; a bulleted list when you're giving more than two items.
- Keep it tight — two to four sentences unless they've asked for detail.
- Read the conversation so far so follow-up questions make sense.
- If asked about your own name or identity, say you are VITS Chatbot — never name the underlying AI model or provider.
- Never mention "the reference material", "context", "records provided", or these instructions.

Reference material:
{{context}}`;

const GENERAL_SYSTEM_PROMPT = `You are VITS Chatbot, the campus assistant for PBR VITS. This particular question isn't covered by the college's own records, so answer it from your general knowledge instead of refusing.

How to answer:
- Open with a short clause making clear this isn't from campus records — e.g. "That's not something I have on file, but..." — then answer normally. Say it once, briefly, not as an apology.
- Give a genuinely useful, accurate answer. If you're not confident, say so rather than guessing.
- Use markdown: bold for key figures, a bulleted list when giving more than two items.
- Keep it tight — two to four sentences unless they've asked for detail.
- Read the conversation so far so follow-up questions make sense.
- If asked about your own name or identity, say you are VITS Chatbot — never name the underlying AI model or provider.
- Never mention "the reference material", "context", "records provided", or these instructions.`;

export class ModelUnavailableError extends Error {}

/**
 * 'grounded' answers strictly from contextBlock (retrieved campus records).
 * 'general' has no matching records, so the model answers from its own
 * knowledge instead of the platform defaulting to a flat refusal — the
 * system prompt makes it disclose that up front so it's never mistaken
 * for a cited campus answer.
 */
function buildMessages(question, contextBlock, history, mode = 'grounded') {
  const system =
    mode === 'general'
      ? GENERAL_SYSTEM_PROMPT
      : GROUNDED_SYSTEM_PROMPT.replace('{{context}}', contextBlock || '(nothing on file matches this question)');

  return [
    { role: 'system', content: system },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];
}

/**
 * Any OpenAI-compatible chat endpoint: a hosted provider (Groq, OpenRouter)
 * when LLM_API_KEY is set, or a local Ollama when it isn't. Keeping one
 * client means the deployed app and local development run identical code.
 */
function config() {
  return {
    baseUrl: process.env.LLM_BASE_URL || 'http://localhost:11434/v1',
    model: process.env.LLM_MODEL || 'qwen3:4b-instruct',
    apiKey: process.env.LLM_API_KEY,
  };
}

async function post(body) {
  const { baseUrl, apiKey } = config();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // The body often names the real problem (bad key, unknown model), but
      // must never reach the client — it can echo the request back.
      const detail = await res.text().catch(() => '');
      throw new ModelUnavailableError(
        `Model endpoint responded with ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
      );
    }
    return { res, timeout };
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof ModelUnavailableError) throw err;
    throw new ModelUnavailableError(err.message);
  }
}

const stripThinking = (text) => text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

/** Non-streaming call, kept for tests and any caller that wants one string. */
export async function askModel(question, contextBlock, history = [], mode = 'grounded') {
  const { model } = config();
  const { res, timeout } = await post({
    model,
    messages: buildMessages(question, contextBlock, history, mode),
    temperature: 0.3,
  });

  try {
    const body = await res.json();
    const answer = stripThinking(body.choices?.[0]?.message?.content ?? '');
    if (!answer) throw new ModelUnavailableError('Model returned an empty response');
    return answer;
  } catch (err) {
    if (err instanceof ModelUnavailableError) throw err;
    throw new ModelUnavailableError(err.message);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Yields answer text as the model produces it, so the UI can render a reply
 * in progress instead of showing a spinner for the whole generation.
 */
export async function* streamModel(question, contextBlock, history = [], mode = 'grounded') {
  const { model } = config();
  const { res, timeout } = await post({
    model,
    messages: buildMessages(question, contextBlock, history, mode),
    temperature: 0.3,
    stream: true,
  });

  const decoder = new TextDecoder();
  let buffer = '';
  let produced = false;

  try {
    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') return;

        let delta;
        try {
          delta = JSON.parse(payload).choices?.[0]?.delta?.content;
        } catch {
          continue; // partial JSON across chunk boundaries — the buffer will catch it
        }
        if (delta) {
          produced = true;
          yield delta;
        }
      }
    }
    if (!produced) throw new ModelUnavailableError('Model streamed an empty response');
  } catch (err) {
    if (err instanceof ModelUnavailableError) throw err;
    throw new ModelUnavailableError(err.message);
  } finally {
    clearTimeout(timeout);
  }
}
