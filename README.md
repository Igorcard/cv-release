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
