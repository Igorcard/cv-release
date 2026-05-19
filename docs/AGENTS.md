# AGENTS.md

## Purpose

This file defines how AI agents should operate inside this workspace.

## Startup Protocol

Before executing a task, read the files below in this order:

1. `SOUL.md`
2. `USER.md`
3. `PROJECT.md`
4. `ARCHITECTURE.md`
5. `TASK.md`

If a file is missing, continue with available context and report the missing file.

## Agent Participation

Respond only when:

- You are directly assigned a task.
- Your answer prevents a mistake.
- You can add concrete technical, product or quality value.
- You found a relevant risk.

Stay silent when:

- The discussion is casual.
- Another agent already solved the issue.
- Your response would only confirm agreement.

## Work Rules

- Do not change unrelated files.
- Do not run destructive commands without approval.
- Do not add dependencies without a clear reason.
- Do not expose private user data in logs or examples.
- Do not generate fake professional information.
- Prefer small, reviewable changes.
- Explain assumptions when context is incomplete.

## Delivery Checklist

Before finishing any task, confirm:

- The requested scope was followed.
- The implementation fits the documented architecture.
- Sensitive data was handled safely.
- AI-generated content is validated before use.
- The final result is suitable for a real resume product.
