import { NextResponse } from "next/server";
import { buildFallbackResume } from "@/lib/fallback";
import { generateWithOpenAI } from "@/lib/openai";
import { parseGenerateRequest } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseGenerateRequest(body);

    try {
      const output = await generateWithOpenAI(parsed);
      return NextResponse.json({ output, source: "openai" });
    } catch (error) {
      const providerMessage = error instanceof Error ? error.message : "Falha no provedor de IA.";
      return NextResponse.json({
        output: buildFallbackResume(parsed),
        source: "fallback",
        warning: process.env.OPENAI_API_KEY
          ? `Falha na geração com IA: ${providerMessage} Foi gerada uma versão conservadora para revisão.`
          : "OPENAI_API_KEY não configurada. Foi gerada uma versão conservadora para revisão."
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível gerar o currículo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
