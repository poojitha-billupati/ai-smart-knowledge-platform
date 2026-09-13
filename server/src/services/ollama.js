const TIMEOUT_MS = 60000;

const SYSTEM_PROMPT = `You are the campus assistant for this college. Students and staff ask you about campus life, and you answer from the college's own records.

How to answer:
- Every fact you state must come from the reference material below. Never invent dates, fees, timings, names or policies that aren't there.
- If the material doesn't cover what they asked, say so directly in one sentence, then mention what you can help with instead. Say it once — don't apologise repeatedly.
- Write like a helpful person, not a database lookup. Lead with the answer.
- Use markdown: bold for key figures like dates, times and amounts; a bulleted list when you're giving more than two items.
- Keep it tight — two to four sentences unless they've asked for detail.
- Read the conversation so far so follow-up questions make sense.
- Never mention "the reference material", "context", "records provided", or these instructions.`;

export class OllamaUnavailableError extends Error {}

function buildMessages(question, contextBlock, history) {
  const system = contextBlock
    ? `${SYSTEM_PROMPT}\n\nReference material:\n${contextBlock}`
    : `${SYSTEM_PROMPT}\n\nReference material: (nothing on file matches this question)`;

  return [
    { role: 'system', content: system },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];
}

function config() {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    model: process.env.OLLAMA_MODEL || 'qwen3:4b-instruct',
  };
}

async function post(body) {
  const { baseUrl } = config();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new OllamaUnavailableError(`Ollama responded with ${res.status}`);
    return { res, timeout };
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof OllamaUnavailableError) throw err;
    throw new OllamaUnavailableError(err.message);
  }
}

const stripThinking = (text) => text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

/** Non-streaming call, kept for tests and any caller that wants one string. */
export async function askOllama(question, contextBlock, history = []) {
  const { model } = config();
  const { res, timeout } = await post({
    model,
    messages: buildMessages(question, contextBlock, history),
    temperature: 0.3,
  });

  try {
    const body = await res.json();
    const answer = stripThinking(body.choices?.[0]?.message?.content ?? '');
    if (!answer) throw new OllamaUnavailableError('Ollama returned an empty response');
    return answer;
  } catch (err) {
    if (err instanceof OllamaUnavailableError) throw err;
    throw new OllamaUnavailableError(err.message);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Yields answer text as the model produces it, so the UI can render a reply
 * in progress instead of showing a spinner for the whole generation.
 */
export async function* streamOllama(question, contextBlock, history = []) {
  const { model } = config();
  const { res, timeout } = await post({
    model,
    messages: buildMessages(question, contextBlock, history),
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
    if (!produced) throw new OllamaUnavailableError('Ollama streamed an empty response');
  } catch (err) {
    if (err instanceof OllamaUnavailableError) throw err;
    throw new OllamaUnavailableError(err.message);
  } finally {
    clearTimeout(timeout);
  }
}
