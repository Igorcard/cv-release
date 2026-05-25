import { buildProfileContextForPrompt } from "@/lib/profile-context";
import { generateResumeWithCursor } from "@/lib/providers/cursor";
import { resumeJsonSchema } from "@/lib/validation";
import type { GeneratedResumeOutput, GenerateRequest } from "@/lib/types";

async function buildPrompt(request: GenerateRequest): Promise<string> {
  const languageRule =
    request.language === "en"
      ? "Write the resume in English because the job or user preference requires English."
      : "Escreva em português do Brasil.";
  const profileContext = await buildProfileContextForPrompt();
  const schemaJson = JSON.stringify(resumeJsonSchema);

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

Restrições importantes:
- Não edite arquivos, não crie pull requests e não execute comandos.
- Não chame ferramentas além das estritamente necessárias para raciocinar sobre o texto recebido.
- Responda apenas com um objeto JSON válido aderente ao schema indicado, sem markdown, sem comentários e sem texto adicional.

Schema JSON esperado (use exatamente estes campos):
${schemaJson}

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

export async function generateWithAI(request: GenerateRequest): Promise<GeneratedResumeOutput> {
  const prompt = await buildPrompt(request);
  return generateResumeWithCursor(prompt);
}
