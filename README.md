# VITS Space

React + Vite frontend, Express + MongoDB backend, chatbot grounded on the
knowledge base via retrieval and any OpenAI-compatible model endpoint —
a hosted provider in production, or a self-hosted Ollama locally.

See [AI_Smart_Knowledge_Platform_Plan_v3.md](../AI_Smart_Knowledge_Platform_Plan_v3.md)
for the full plan, timeline, and architecture.

## Structure

- `client/` — React + Vite frontend
- `server/` — Express API + MongoDB (Mongoose) + retrieval/chat logic

## Setup

```bash
cd server && npm install && cp .env.example .env
cd ../client && npm install
```

Fill in `server/.env` with your MongoDB Atlas URI and JWT secret.

For the chatbot, point `LLM_BASE_URL` / `LLM_MODEL` / `LLM_API_KEY` at any
OpenAI-compatible endpoint. A hosted provider is what the deployed app uses,
since a local model isn't reachable from the server host.

To run the model locally instead, install [Ollama](https://ollama.com), run
`ollama pull qwen3:4b-instruct`, set `LLM_BASE_URL=http://localhost:11434/v1`
and leave `LLM_API_KEY` empty. Use the `-instruct` tag: the plain `qwen3:4b`
has hybrid "thinking" on by default, which is too slow for interactive use
on CPU.

## Run

```bash
npm run dev:server   # from repo root
npm run dev:client   # from repo root, separate terminal
```
