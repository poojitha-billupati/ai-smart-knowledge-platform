# AI Smart Knowledge & Assistance Platform

React + Vite frontend, Express + MongoDB backend, chatbot grounded on the
knowledge base via retrieval and Qwen3-4B-Instruct (self-hosted through
Ollama).

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

Fill in `server/.env` with your MongoDB Atlas URI and JWT secret. Install
[Ollama](https://ollama.com) and run `ollama pull qwen3:4b-instruct` before
working on the chatbot (Phase 4) — the plain `qwen3:4b` tag has hybrid
"thinking" on by default, which is too slow for interactive use on CPU;
`-instruct` skips the reasoning chain entirely.

## Run

```bash
npm run dev:server   # from repo root
npm run dev:client   # from repo root, separate terminal
```
