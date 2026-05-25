import { NextResponse } from "next/server";
import { generateWithAI } from "@/lib/ai";
import { buildFallbackResume } from "@/lib/fallback";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { MAX_GENERATE_BODY_CHARS, parseGenerateRequest } from "@/lib/validation";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const token = process.env.APP_ACCESS_TOKEN;
  if (!token) return true;

  return request.headers.get("authorization") === `Bearer ${token}` || request.headers.get("x-app-token") === token;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`generate:${getClientKey(request)}`, 12, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Muitas solicitações. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_GENERATE_BODY_CHARS) {
      return NextResponse.json({ error: "A solicitação é muito grande." }, { status: 413 });
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_GENERATE_BODY_CHARS) {
      return NextResponse.json({ error: "A solicitação é muito grande." }, { status: 413 });
    }

    const body = JSON.parse(rawBody);
    const parsed = parseGenerateRequest(body);

    try {
      const output = await generateWithAI(parsed);
      return NextResponse.json({ output, source: "cursor" });
    } catch (error) {
      const providerMessage = error instanceof Error ? error.message : "Falha no provedor de IA.";
      return NextResponse.json({
        output: buildFallbackResume(parsed),
        source: "fallback",
        warning: process.env.AI_API_KEY
          ? `Falha na geração com o provedor de IA configurado: ${providerMessage} Foi gerada uma versão conservadora para revisão.`
          : "AI_API_KEY não configurada. Foi gerada uma versão conservadora para revisão."
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível gerar o currículo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
