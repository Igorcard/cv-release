import type { GeneratedResumeOutput, GenerateRequest } from "@/lib/types";

const technicalKeywords = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "C#",
  ".NET",
  "Delphi",
  "SQL",
  "SQL Server",
  "PostgreSQL",
  "MySQL",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "Git",
  "REST",
  "GraphQL",
  "ERP",
  "Scrum",
  "Kanban",
  "CI/CD"
];

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function firstMeaningfulLine(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 2 && !line.includes("@")) ?? "Nome não fornecido";
}

function extractEmail(input: string) {
  return input.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "E-mail não fornecido";
}

function extractPhone(input: string) {
  return (
    input.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-.\s]?\d{4}/)?.[0] ??
    "Telefone não fornecido"
  );
}

function extractLink(input: string, needle: string) {
  const match = input.match(new RegExp(`https?:\\/\\/[^\\s]*${needle}[^\\s]*`, "i"));
  return match?.[0] ?? "";
}

function detectKeywords(...inputs: string[]) {
  const joined = inputs.join("\n").toLowerCase();
  return technicalKeywords.filter((keyword) => joined.includes(keyword.toLowerCase()));
}

function detectTitle(input: string, jobDescription: string) {
  const text = `${input}\n${jobDescription}`.toLowerCase();
  if (text.includes("frontend") || text.includes("front-end")) return "Desenvolvedor Front-end";
  if (text.includes("backend") || text.includes("back-end")) return "Desenvolvedor Back-end";
  if (text.includes("full stack") || text.includes("fullstack")) return "Desenvolvedor Full Stack";
  if (text.includes("dados") || text.includes("data engineer")) return "Profissional de Dados";
  if (text.includes("qa") || text.includes("quality")) return "Analista de Qualidade de Software";
  if (text.includes("devops") || text.includes("sre")) return "Engenheiro DevOps";
  return "Profissional de Tecnologia";
}

export function buildFallbackResume(request: GenerateRequest): GeneratedResumeOutput {
  const keywords = unique(detectKeywords(request.linkedinData, request.jobDescription));
  const jobKeywords = unique(detectKeywords(request.jobDescription));
  const name = firstMeaningfulLine(request.linkedinData);
  const title = detectTitle(request.linkedinData, request.jobDescription);
  const linkedin = extractLink(request.linkedinData, "linkedin") || "LinkedIn não fornecido";
  const github = extractLink(request.linkedinData, "github") || "GitHub/Portfólio não fornecido";

  return {
    analysisSummary:
      "Perfil analisado a partir dos dados fornecidos. Como a geração automática avançada depende da chave de API configurada, esta versão usa uma estrutura conservadora sem inventar experiências ou resultados.",
    jobMatch: {
      strongFit: jobKeywords.length
        ? jobKeywords.map((keyword) => `Experiência ou exposição indicada com ${keyword}.`)
        : ["Aderência específica depende da descrição da vaga."],
      partialFit: request.jobDescription
        ? ["Há necessidade de revisar manualmente senioridade, escopo de atuação e resultados mensuráveis."]
        : ["Nenhuma vaga foi informada; currículo gerado como base profissional."],
      gaps: [
        "Resultados quantitativos não foram identificados de forma confiável.",
        "Períodos, empresas e responsabilidades precisam ser revisados antes do envio."
      ],
      deEmphasize: ["Informações genéricas que não estejam ligadas à vaga ou ao histórico comprovável."]
    },
    atsKeywords: unique([...keywords, ...jobKeywords]),
    finalResume: {
      contact: {
        name,
        title,
        location: "Cidade/Estado não fornecidos",
        email: extractEmail(request.linkedinData),
        phone: extractPhone(request.linkedinData),
        linkedin,
        github,
        portfolio: ""
      },
      summary: `Profissional de tecnologia com experiência descrita nos dados fornecidos, atuação relacionada a ${keywords.slice(0, 6).join(", ") || "desenvolvimento, manutenção e melhoria de sistemas"}. Perfil orientado a clareza técnica, colaboração com equipes e entrega de soluções compatíveis com as necessidades do negócio.`,
      skills: keywords.length ? keywords : ["Competências técnicas não fornecidas"],
      experiences: [
        {
          role: "Experiência profissional não estruturada",
          company: "Empresa não fornecida",
          period: "Período não fornecido",
          location: "",
          description: [
            "Atuação profissional descrita nos dados de entrada; revisar e substituir este item pelas empresas, cargos e responsabilidades reais.",
            "Desenvolvimento, manutenção, análise ou suporte de soluções técnicas conforme informações fornecidas pelo perfil."
          ],
          technologies: keywords
        }
      ],
      projects: [],
      education: [],
      certifications: [],
      languages: []
    },
    improvementsMade: [
      "Organização do conteúdo em seções reconhecíveis por ATS.",
      "Normalização de competências técnicas detectadas no texto.",
      "Uso de linguagem profissional sem criar experiências não comprovadas."
    ],
    missingInformation: [
      "Empresas, cargos, períodos e localização das experiências.",
      "Resultados mensuráveis, como volume, redução de tempo, impacto financeiro ou melhoria operacional.",
      "Formação, certificações, idiomas e links profissionais completos."
    ],
    linkedinImprovements: [
      "Adicionar um resumo com foco em área de atuação, tecnologias principais e tipo de problema resolvido.",
      "Detalhar experiências com responsabilidades, tecnologias e resultados verificáveis.",
      "Incluir projetos relevantes com contexto, stack e contribuição individual."
    ]
  };
}
