import type { FinalResume, GenerateRequest, GeneratedResumeOutput } from "@/lib/types";

const emptyContact = {
  name: "Nome não fornecido",
  title: "Título profissional não fornecido",
  location: "Cidade/Estado não fornecidos",
  email: "E-mail não fornecido",
  phone: "Telefone não fornecido",
  linkedin: "LinkedIn não fornecido",
  github: "GitHub/Portfólio não fornecido",
  portfolio: ""
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => asString(item).trim()).filter(Boolean) : [];
}

export function parseGenerateRequest(value: unknown): GenerateRequest {
  const body = asRecord(value);
  const linkedinData = asString(body.linkedinData).trim();
  if (linkedinData.length < 20) {
    throw new Error("Informe dados do LinkedIn com pelo menos 20 caracteres.");
  }

  const language = body.language === "en" ? "en" : "pt-BR";

  return {
    linkedinData,
    jobDescription: asString(body.jobDescription).trim(),
    jobUrl: asString(body.jobUrl).trim(),
    language
  };
}

export const resumeJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "analysisSummary",
    "jobMatch",
    "atsKeywords",
    "finalResume",
    "improvementsMade",
    "missingInformation",
    "linkedinImprovements"
  ],
  properties: {
    analysisSummary: { type: "string" },
    jobMatch: {
      type: "object",
      additionalProperties: false,
      required: ["strongFit", "partialFit", "gaps", "deEmphasize"],
      properties: {
        strongFit: { type: "array", items: { type: "string" } },
        partialFit: { type: "array", items: { type: "string" } },
        gaps: { type: "array", items: { type: "string" } },
        deEmphasize: { type: "array", items: { type: "string" } }
      }
    },
    atsKeywords: { type: "array", items: { type: "string" } },
    finalResume: {
      type: "object",
      additionalProperties: false,
      required: ["contact", "summary", "skills", "experiences", "projects", "education", "certifications", "languages"],
      properties: {
        contact: {
          type: "object",
          additionalProperties: false,
          required: ["name", "title", "location", "email", "phone", "linkedin", "github", "portfolio"],
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            location: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            linkedin: { type: "string" },
            github: { type: "string" },
            portfolio: { type: "string" }
          }
        },
        summary: { type: "string" },
        skills: { type: "array", items: { type: "string" } },
        experiences: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["role", "company", "period", "location", "description", "technologies"],
            properties: {
              role: { type: "string" },
              company: { type: "string" },
              period: { type: "string" },
              location: { type: "string" },
              description: { type: "array", items: { type: "string" } },
              technologies: { type: "array", items: { type: "string" } }
            }
          }
        },
        projects: { type: "array", items: { type: "object" } },
        education: { type: "array", items: { type: "object" } },
        certifications: { type: "array", items: { type: "object" } },
        languages: { type: "array", items: { type: "object" } }
      }
    },
    improvementsMade: { type: "array", items: { type: "string" } },
    missingInformation: { type: "array", items: { type: "string" } },
    linkedinImprovements: { type: "array", items: { type: "string" } }
  }
} as const;

export function normalizeGeneratedOutput(value: unknown): GeneratedResumeOutput {
  const root = asRecord(value);
  const finalResume = asRecord(root.finalResume);
  const contact = { ...emptyContact, ...asRecord(finalResume.contact) };

  const resume: FinalResume = {
    contact: {
      name: asString(contact.name, emptyContact.name),
      title: asString(contact.title, emptyContact.title),
      location: asString(contact.location, emptyContact.location),
      email: asString(contact.email, emptyContact.email),
      phone: asString(contact.phone, emptyContact.phone),
      linkedin: asString(contact.linkedin, emptyContact.linkedin),
      github: asString(contact.github, emptyContact.github),
      portfolio: asString(contact.portfolio)
    },
    summary: asString(finalResume.summary, "Resumo profissional não fornecido."),
    skills: asStringArray(finalResume.skills),
    experiences: Array.isArray(finalResume.experiences)
      ? finalResume.experiences.map((item) => {
          const experience = asRecord(item);
          return {
            role: asString(experience.role, "Cargo não fornecido"),
            company: asString(experience.company, "Empresa não fornecida"),
            period: asString(experience.period, "Período não fornecido"),
            location: asString(experience.location),
            description: asStringArray(experience.description),
            technologies: asStringArray(experience.technologies)
          };
        })
      : [],
    projects: Array.isArray(finalResume.projects)
      ? finalResume.projects.map((item) => {
          const project = asRecord(item);
          return {
            name: asString(project.name, "Projeto não fornecido"),
            description: asString(project.description, "Descrição não fornecida"),
            technologies: asStringArray(project.technologies),
            link: asString(project.link)
          };
        })
      : [],
    education: Array.isArray(finalResume.education)
      ? finalResume.education.map((item) => {
          const education = asRecord(item);
          return {
            degree: asString(education.degree, "Formação não fornecida"),
            institution: asString(education.institution, "Instituição não fornecida"),
            period: asString(education.period)
          };
        })
      : [],
    certifications: Array.isArray(finalResume.certifications)
      ? finalResume.certifications.map((item) => {
          const certification = asRecord(item);
          return {
            name: asString(certification.name, "Certificação não fornecida"),
            issuer: asString(certification.issuer),
            year: asString(certification.year)
          };
        })
      : [],
    languages: Array.isArray(finalResume.languages)
      ? finalResume.languages.map((item) => {
          const language = asRecord(item);
          return {
            name: asString(language.name, "Idioma não fornecido"),
            level: asString(language.level, "Nível não fornecido")
          };
        })
      : []
  };

  const jobMatch = asRecord(root.jobMatch);

  return {
    analysisSummary: asString(root.analysisSummary, "Análise não fornecida."),
    jobMatch: {
      strongFit: asStringArray(jobMatch.strongFit),
      partialFit: asStringArray(jobMatch.partialFit),
      gaps: asStringArray(jobMatch.gaps),
      deEmphasize: asStringArray(jobMatch.deEmphasize)
    },
    atsKeywords: asStringArray(root.atsKeywords),
    finalResume: resume,
    improvementsMade: asStringArray(root.improvementsMade),
    missingInformation: asStringArray(root.missingInformation),
    linkedinImprovements: asStringArray(root.linkedinImprovements)
  };
}
