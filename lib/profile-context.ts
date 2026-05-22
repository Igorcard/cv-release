import { readFile } from "node:fs/promises";
import path from "node:path";

const CONTEXT_FILES = [
  "context/canonical/candidate-profile.canonical.json",
  "context/canonical/career-timeline.canonical.json",
  "context/canonical/evidence-index.json",
  "context/indexes/source-map.json",
  "context/retrieval/job-to-context-ranking.json",
  "context/chunks/career_summary.chunk.md",
  "context/chunks/exp_accesys_backend.chunk.md",
  "context/chunks/exp_accesys_delphi.chunk.md",
  "context/chunks/project_weatherapi.chunk.md",
  "context/chunks/project_toughts.chunk.md",
  "context/chunks/project_ponto_de_venda.chunk.md",
  "context/chunks/skills_backend_node_sql.chunk.md",
  "data/profile/skills/skill-evidence-map.json",
  "data/profile/constraints/truth-policy.yaml"
] as const;

async function readWorkspaceFile(relativePath: string) {
  const absolutePath = path.join(process.cwd(), relativePath);
  return readFile(absolutePath, "utf8");
}

export async function buildProfileContextForPrompt() {
  const sections = await Promise.all(
    CONTEXT_FILES.map(async (filePath) => {
      const content = await readWorkspaceFile(filePath);
      return `## ${filePath}\n\n${content.trim()}`;
    })
  );

  return [
    "# Contexto estruturado do perfil",
    "",
    "Candidate context id: igor-cardoso-francolin",
    "",
    "Use este contexto como fonte prioritaria para gerar curriculos direcionados a uma vaga.",
    "Nao invente metricas, senioridade, certificacoes, idiomas, empresas, cargos ou tecnologias.",
    "Use apenas claims sustentadas pelo source-map, evidence-index, chunks e skill-evidence-map.",
    "Se a vaga pedir algo sem evidencia, registre como gap ou missingInformation.",
    "Atividades sociais do LinkedIn sao interest_only e nao podem virar experiencia ou conquista.",
    "",
    ...sections
  ].join("\n");
}
