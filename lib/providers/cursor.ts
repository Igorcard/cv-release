import type { GeneratedResumeOutput } from "@/lib/types";
import { normalizeGeneratedOutput } from "@/lib/validation";

const DEFAULT_BASE_URL = "https://api.cursor.com";
const DEFAULT_RUN_TIMEOUT_MS = 120000;
const DEFAULT_POLL_INTERVAL_MS = 2000;
const MIN_POLL_INTERVAL_MS = 500;

const TERMINAL_STATUSES = new Set(["FINISHED", "ERROR", "CANCELLED", "EXPIRED"]);

type CursorConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  runTimeoutMs: number;
  pollIntervalMs: number;
};

type CursorAgentRun = {
  id: string;
  agentId?: string;
  status: string;
  result?: string;
  durationMs?: number;
};

type CursorCreateAgentResponse = {
  agent?: { id?: string; latestRunId?: string };
  run?: CursorAgentRun;
};

type CursorErrorPayload = {
  error?: string;
  message?: string;
};

function parsePositiveInt(value: string | undefined, fallback: number, min = 1): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < min) return fallback;
  return parsed;
}

function readCursorConfig(): CursorConfig {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) throw new Error("AI_API_KEY não configurada.");

  const baseUrl = (process.env.AI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = process.env.AI_MODEL?.trim() || "";
  const runTimeoutMs = parsePositiveInt(process.env.AI_RUN_TIMEOUT_MS, DEFAULT_RUN_TIMEOUT_MS, 1000);
  const pollIntervalMs = Math.max(
    MIN_POLL_INTERVAL_MS,
    parsePositiveInt(process.env.AI_POLL_INTERVAL_MS, DEFAULT_POLL_INTERVAL_MS, MIN_POLL_INTERVAL_MS)
  );

  return { apiKey, baseUrl, model, runTimeoutMs, pollIntervalMs };
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as CursorErrorPayload;
    const message = payload.message || payload.error;
    return typeof message === "string" && message.trim() ? message : fallback;
  } catch {
    return fallback;
  }
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("A resposta do provedor de IA está vazia.");
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("A resposta do provedor de IA não contém JSON válido.");
    }
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

async function createAgentRun(
  config: CursorConfig,
  prompt: string,
  signal: AbortSignal
): Promise<{ agentId: string; runId: string; run?: CursorAgentRun }> {
  const body: Record<string, unknown> = {
    prompt: { text: prompt }
  };
  if (config.model) {
    body.model = { id: config.model };
  }

  const response = await fetch(`${config.baseUrl}/v1/agents`, {
    method: "POST",
    headers: authHeaders(config.apiKey),
    body: JSON.stringify(body),
    signal
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Falha ao criar agente na Cursor API (HTTP ${response.status}).`);
    throw new Error(message);
  }

  const payload = (await response.json()) as CursorCreateAgentResponse;
  const agentId = payload.agent?.id;
  const runId = payload.run?.id || payload.agent?.latestRunId;

  if (!agentId || !runId) {
    throw new Error("Resposta inválida da Cursor API: agentId ou runId ausente.");
  }

  return { agentId, runId, run: payload.run };
}

async function getRun(
  config: CursorConfig,
  agentId: string,
  runId: string,
  signal: AbortSignal
): Promise<CursorAgentRun> {
  const response = await fetch(`${config.baseUrl}/v1/agents/${agentId}/runs/${runId}`, {
    method: "GET",
    headers: authHeaders(config.apiKey),
    signal
  });

  if (!response.ok) {
    const message = await readErrorMessage(
      response,
      `Falha ao consultar status do run na Cursor API (HTTP ${response.status}).`
    );
    throw new Error(message);
  }

  return (await response.json()) as CursorAgentRun;
}

async function waitForTerminalRun(
  config: CursorConfig,
  agentId: string,
  runId: string,
  initialRun: CursorAgentRun | undefined,
  signal: AbortSignal
): Promise<CursorAgentRun> {
  if (initialRun && TERMINAL_STATUSES.has(initialRun.status)) {
    return initialRun;
  }

  while (!signal.aborted) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, config.pollIntervalMs);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new Error("Tempo limite excedido aguardando a Cursor API."));
      };
      signal.addEventListener("abort", onAbort, { once: true });
    });

    const run = await getRun(config, agentId, runId, signal);
    if (TERMINAL_STATUSES.has(run.status)) {
      return run;
    }
  }

  throw new Error("Tempo limite excedido aguardando a Cursor API.");
}

export async function generateResumeWithCursor(prompt: string): Promise<GeneratedResumeOutput> {
  const config = readCursorConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.runTimeoutMs);

  try {
    const { agentId, runId, run } = await createAgentRun(config, prompt, controller.signal);
    const terminalRun = await waitForTerminalRun(config, agentId, runId, run, controller.signal);

    if (terminalRun.status !== "FINISHED") {
      throw new Error(`Run da Cursor API terminou com status ${terminalRun.status}.`);
    }

    const result = terminalRun.result ?? "";
    const parsed = extractJsonObject(result);
    return normalizeGeneratedOutput(parsed);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Tempo limite excedido aguardando a Cursor API.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
