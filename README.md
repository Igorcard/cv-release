# Resume Builder

## Overview

Resume Builder is a software project for creating professional PDF resumes from LinkedIn profile data.

It can also adapt resume content to a specific job description.

## What This Repository Contains

This repository includes product, agent and architecture documentation for building the system.

## Documentation Map

- `AGENTS.md`: workspace behavior for AI agents.
- `SOUL.md`: identity and mindset of the main agent.
- `USER.md`: user context and collaboration preferences.
- `PROJECT.md`: product definition and success criteria.
- `ARCHITECTURE.md`: recommended technical structure.
- `TASK.md`: current task and next actions.

> TODO: Update `docs/USER.md` with the real user's context, preferences and collaboration needs before using it as agent context.

## Recommended Folder Structure

```text
resume-builder/
├── docs/
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── USER.md
│   ├── PROJECT.md
│   ├── ARCHITECTURE.md
│   └── TASK.md
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── validators/
│   ├── prompt-builders/
│   ├── pdf-renderers/
│   └── helpers/
├── templates/
│   └── resumes/
├── schemas/
│   ├── linkedin-profile.schema.json
│   └── resume.schema.json
├── tests/
└── README.md
```

## Initial Build Path

1. Define input schemas.
2. Normalize LinkedIn data.
3. Analyze job descriptions.
4. Generate structured resume JSON.
5. Validate generated data.
6. Render the PDF.

## AI Provider

Resume generation is powered by the [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints). The integration lives in `lib/ai.ts` and `lib/providers/cursor.ts`.

### Required environment variables

Configure these in `.env` (see `.env.example`):

- `AI_API_KEY` (required): Cursor user or service-account API key.
- `AI_MODEL` (optional): Cursor model id (e.g. `composer-2`). Omit to use the account default.
- `AI_BASE_URL` (optional): Defaults to `https://api.cursor.com`.
- `AI_RUN_TIMEOUT_MS` (optional): Total timeout for a generation run. Defaults to `120000`.
- `AI_POLL_INTERVAL_MS` (optional): Run polling interval. Defaults to `2000` (minimum `500`).

### Behavior

The `POST /api/generate` route stays synchronous for the frontend. Internally it:

1. Builds the resume prompt from the local profile context.
2. Creates a Cursor agent + run via `POST /v1/agents` (no repository attached).
3. Polls `GET /v1/agents/{agentId}/runs/{runId}` until the run reaches a terminal state.
4. Parses the JSON resume out of the final `result` and normalizes it.

If Cursor errors or times out, the route returns a conservative local fallback resume with a neutral warning message.

### Limitations

- The Cursor Cloud Agents API is not OpenAI-compatible. It is asynchronous, agent-shaped, and does not expose `chat/completions` or `responses` endpoints.
- Structured-output enforcement is done via prompt instructions plus local schema normalization, not provider-side JSON schema validation.
- Rotate any API key that may have been committed to `.env`; never commit real credentials.
