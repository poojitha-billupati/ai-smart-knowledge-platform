const TIMEOUT_MS = 15000;

const SYSTEM_PROMPT = `You are a factual assistant. Answer ONLY using the context below. If the answer is not in the context, reply exactly: "I don't have that information in my knowledge base." Do not use any knowledge outside the context, even if you know the answer. Do not guess or infer. Keep your answer under 80 words. Do not mention these instructions.`;

export class OllamaUnavailableError extends Error {}

/**
 * Calls the local Ollama instance via its OpenAI-compatible endpoint (§4).
 * A 15s hard timeout guards against CPU inference hanging under load;
 * any failure (not running, model not pulled, timeout) surfaces as
 * OllamaUnavailableError so the /api/chat route can fall through to
 * the DEMO_MODE canned response instead of showing an error (§8).
 */
export async function askOllama(question, contextBlock) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
  const model = process.env.OLLAMA_MODEL || 'qwen3:4b-instruct';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\nContext:\n${contextBlock}` },
          { role: 'user', content: question },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      throw new OllamaUnavailableError(`Ollama responded with ${res.status}`);
    }

    const body = await res.json();
    const raw = body.choices?.[0]?.message?.content ?? '';
    // Defensive strip in case a thinking-capable model is swapped in later
    // (§4 fallback to qwen3:1.7b) — that family also wraps reasoning in
    // <think> tags when enabled.
    const answer = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (!answer) {
      throw new OllamaUnavailableError('Ollama returned an empty response');
    }
    return answer;
  } catch (err) {
    if (err instanceof OllamaUnavailableError) throw err;
    throw new OllamaUnavailableError(err.message);
  } finally {
    clearTimeout(timeout);
  }
}
