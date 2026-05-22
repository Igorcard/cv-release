import { normalizeGeneratedOutput, resumeJsonSchema } from "@/lib/validation";
import { buildProfileContextForPrompt } from "@/lib/profile-context";
import type { GeneratedResumeOutput, GenerateRequest } from "@/lib/types";

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };

  if (typeof data.output_text === "string") return data.output_text;

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("A resposta do modelo não contém JSON.");
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  }
}

async function buildPrompt(request: GenerateRequest) {
  const languageRule =
    request.language === "en"
      ? "Write the resume in English because the job or user preference requires English."
      : "Escreva em português do Brasil.";
  const profileContext = await buildProfileContextForPrompt();

  return `
${languageRule}

Você é especialista sênior em currículos, ATS, LinkedIn, recrutamento técnico e posicionamento de carreira.

Tarefa:
1. Analise os dados do LinkedIn/perfil.
2. Se houver vaga, analise requisitos, responsabilidades e palavras-chave.
3. Compare perfil e vaga.
4. Gere currículo profissional, direto, moderno e compatível com ATS.
5. Não invente empresas, cargos, certificações, tecnologias ou resultados.
6. Quando algo estiver ausente, use "não fornecido" ou inclua em missingInformation.
7. Use verbos de ação e transforme responsabilidades em realizações apenas quando houver base textual suficiente.
8. Evite exageros e keyword stuffing.
9. Use o contexto estruturado abaixo como fonte prioritária para selecionar experiências, projetos, skills e gaps.
10. Todo conteúdo final deve respeitar source_ids, evidence-index e truth-policy.

Contexto estruturado disponível:
${profileContext}

Dados do LinkedIn/perfil:
${request.linkedinData}

URL da vaga:
${request.jobUrl || "não fornecida"}

Descrição da vaga:
${request.jobDescription || "não fornecida"}

Retorne apenas JSON válido no schema solicitado.
`.trim();
}

export async function generateWithOpenAI(request: GenerateRequest): Promise<GeneratedResumeOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada.");

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const prompt = await buildPrompt(request);
  const signal = AbortSignal.timeout(20000);

  const body = {
    model,
    input: [
      {
        role: "system",
        content:
          "Você gera currículos profissionais e responde apenas com JSON estruturado, sem markdown."
      },
      { role: "user", content: prompt }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "resume_generation",
        schema: resumeJsonSchema,
        strict: true
      }
    }
  };

  let response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    signal
  });

  if (!response.ok && response.status === 400) {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: `${prompt}\n\nRetorne somente JSON válido, sem comentários ou markdown.`
      }),
      signal
    });
  }

  const payload = await response.json();
  if (!response.ok) {
    const message =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : "Falha ao gerar currículo com OpenAI.";
    throw new Error(message);
  }

  const parsed = parseJsonObject(extractOutputText(payload));
  return normalizeGeneratedOutput(parsed);
}
