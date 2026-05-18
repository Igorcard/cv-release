"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  FinalResume,
  GeneratedResumeOutput,
  ResumeExperience,
  ResumeTemplate
} from "@/lib/types";

const emptyResume: FinalResume = {
  contact: {
    name: "",
    title: "",
    location: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    portfolio: ""
  },
  summary: "",
  skills: [],
  experiences: [],
  projects: [],
  education: [],
  certifications: [],
  languages: []
};

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitComma(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    const preview = text.replace(/\s+/g, " ").slice(0, 180);
    throw new Error(
      `A API retornou uma resposta inválida em vez de JSON. Status ${response.status}. ${preview}`
    );
  }
}

function joinContact(contact: FinalResume["contact"]) {
  return [
    contact.location,
    contact.email,
    contact.phone,
    contact.linkedin,
    contact.github,
    contact.portfolio
  ]
    .filter(Boolean)
    .join(" | ");
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="muted">Informação não fornecida.</p>;
  return (
    <ul>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function ResumePreview({ resume, template }: { resume: FinalResume; template: ResumeTemplate }) {
  const hasProjects = resume.projects.length > 0;
  const hasEducation = resume.education.length > 0;
  const hasCertifications = resume.certifications.length > 0;
  const hasLanguages = resume.languages.length > 0;

  return (
    <article className={`resume-page ${template}`} id="resume-preview">
      <header className="resume-header">
        <h1>{resume.contact.name || "Nome Completo"}</h1>
        <p className="resume-title">{resume.contact.title || "Cargo-alvo ou título profissional"}</p>
        <p className="resume-contact">{joinContact(resume.contact) || "Cidade/Estado | E-mail | Telefone | LinkedIn | GitHub/Portfólio"}</p>
      </header>

      <section>
        <h2>RESUMO PROFISSIONAL</h2>
        <p>{resume.summary || "Resumo profissional não fornecido."}</p>
      </section>

      <section>
        <h2>COMPETÊNCIAS TÉCNICAS</h2>
        <p>{resume.skills.length ? resume.skills.join(" | ") : "Competências técnicas não fornecidas."}</p>
      </section>

      <section>
        <h2>EXPERIÊNCIA PROFISSIONAL</h2>
        {resume.experiences.length ? (
          resume.experiences.map((experience, index) => (
            <div className="resume-item" key={`${experience.company}-${experience.role}-${index}`}>
              <div className="item-heading">
                <strong>{experience.role || "Cargo não fornecido"}</strong>
                <span>{experience.period || "Período não fornecido"}</span>
              </div>
              <p className="item-meta">
                {[experience.company, experience.location].filter(Boolean).join(" | ") || "Empresa não fornecida"}
              </p>
              <BulletList items={experience.description} />
              {experience.technologies.length > 0 && (
                <p className="stack">Tecnologias: {experience.technologies.join(", ")}</p>
              )}
            </div>
          ))
        ) : (
          <p className="muted">Experiências não fornecidas.</p>
        )}
      </section>

      {hasProjects && (
        <section>
          <h2>PROJETOS RELEVANTES</h2>
          {resume.projects.map((project, index) => (
            <div className="resume-item" key={`${project.name}-${index}`}>
              <div className="item-heading">
                <strong>{project.name}</strong>
                {project.link && <span>{project.link}</span>}
              </div>
              <p>{project.description}</p>
              {project.technologies.length > 0 && <p className="stack">Tecnologias: {project.technologies.join(", ")}</p>}
            </div>
          ))}
        </section>
      )}

      {hasEducation && (
        <section>
          <h2>FORMAÇÃO ACADÊMICA</h2>
          {resume.education.map((education, index) => (
            <div className="resume-item" key={`${education.institution}-${index}`}>
              <div className="item-heading">
                <strong>{education.degree}</strong>
                <span>{education.period}</span>
              </div>
              <p className="item-meta">{education.institution}</p>
            </div>
          ))}
        </section>
      )}

      {hasCertifications && (
        <section>
          <h2>CERTIFICAÇÕES</h2>
          {resume.certifications.map((certification, index) => (
            <p key={`${certification.name}-${index}`}>
              <strong>{certification.name}</strong>
              {[certification.issuer, certification.year].filter(Boolean).join(" | ") && (
                <> - {[certification.issuer, certification.year].filter(Boolean).join(" | ")}</>
              )}
            </p>
          ))}
        </section>
      )}

      {hasLanguages && (
        <section>
          <h2>IDIOMAS</h2>
          <p>{resume.languages.map((language) => `${language.name}: ${language.level}`).join(" | ")}</p>
        </section>
      )}
    </article>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 5,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AnalysisPanel({ output }: { output: GeneratedResumeOutput }) {
  return (
    <div className="analysis-grid">
      <section className="panel">
        <h3>Resumo do Perfil</h3>
        <p>{output.analysisSummary}</p>
      </section>
      <section className="panel">
        <h3>Palavras-chave ATS</h3>
        <div className="chips">
          {output.atsKeywords.length ? output.atsKeywords.map((keyword) => <span key={keyword}>{keyword}</span>) : <span>Sem palavras-chave detectadas</span>}
        </div>
      </section>
      <section className="panel">
        <h3>Aderência com a Vaga</h3>
        <h4>Forte aderência</h4>
        <BulletList items={output.jobMatch.strongFit} />
        <h4>Aderência parcial</h4>
        <BulletList items={output.jobMatch.partialFit} />
        <h4>Pontos ausentes</h4>
        <BulletList items={output.jobMatch.gaps} />
      </section>
      <section className="panel">
        <h3>Melhorias e Próximos Dados</h3>
        <h4>Melhorias aplicadas</h4>
        <BulletList items={output.improvementsMade} />
        <h4>Informações que faltam</h4>
        <BulletList items={output.missingInformation} />
        <h4>LinkedIn</h4>
        <BulletList items={output.linkedinImprovements} />
      </section>
    </div>
  );
}

export default function Home() {
  const [linkedinData, setLinkedinData] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [language, setLanguage] = useState<"pt-BR" | "en">("pt-BR");
  const [template, setTemplate] = useState<ResumeTemplate>("ats");
  const [output, setOutput] = useState<GeneratedResumeOutput | null>(null);
  const [resume, setResume] = useState<FinalResume>(emptyResume);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const draft = window.localStorage.getItem("cv-release-draft");
    if (!draft) return;
    try {
      const parsed = JSON.parse(draft) as {
        linkedinData?: string;
        jobUrl?: string;
        jobDescription?: string;
      };
      setLinkedinData(parsed.linkedinData ?? "");
      setJobUrl(parsed.jobUrl ?? "");
      setJobDescription(parsed.jobDescription ?? "");
    } catch {
      window.localStorage.removeItem("cv-release-draft");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "cv-release-draft",
      JSON.stringify({ linkedinData, jobUrl, jobDescription })
    );
  }, [linkedinData, jobUrl, jobDescription]);

  const canGenerate = useMemo(() => linkedinData.trim().length >= 20 && !isGenerating, [linkedinData, isGenerating]);

  function updateResume(next: Partial<FinalResume>) {
    setResume((current) => ({ ...current, ...next }));
  }

  function updateContact(key: keyof FinalResume["contact"], value: string) {
    setResume((current) => ({
      ...current,
      contact: { ...current.contact, [key]: value }
    }));
  }

  function updateExperience(index: number, next: Partial<ResumeExperience>) {
    setResume((current) => ({
      ...current,
      experiences: current.experiences.map((experience, itemIndex) =>
        itemIndex === index ? { ...experience, ...next } : experience
      )
    }));
  }

  async function parsePdf(file: File) {
    setError("");
    setStatus("Extraindo texto do PDF...");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/parse-pdf", { method: "POST", body: formData });
    const data = await readJsonResponse(response);
    if (!response.ok) throw new Error(data.error ?? "Falha ao extrair PDF.");

    setLinkedinData((current) => [current, data.text].filter(Boolean).join("\n\n"));
    setStatus("Texto do PDF adicionado aos dados do perfil.");
  }

  async function extractJobUrl() {
    if (!jobUrl.trim()) {
      setError("Informe uma URL de vaga antes de buscar.");
      return;
    }

    setError("");
    setStatus("Buscando descrição da vaga pela URL...");
    const response = await fetch("/api/extract-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: jobUrl })
    });
    const data = await readJsonResponse(response);
    if (!response.ok) {
      setStatus("");
      setError(data.error ?? "Não foi possível ler a URL.");
      return;
    }

    setJobDescription(data.text);
    setStatus("Descrição da vaga extraída. Revise o texto antes de gerar.");
  }

  async function generateResume() {
    setIsGenerating(true);
    setError("");
    setStatus("Gerando currículo e análise...");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinData, jobDescription, jobUrl, language })
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(data.error ?? "Falha ao gerar currículo.");

      setOutput(data.output);
      setResume(data.output.finalResume);
      setStatus(data.warning ?? "Currículo gerado. Revise o conteúdo antes de exportar.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao gerar currículo.");
      setStatus("");
    } finally {
      setIsGenerating(false);
    }
  }

  function printResume() {
    window.print();
  }

  return (
    <main>
      <section className="workspace">
        <aside className="left-pane">
          <div className="brand-row">
            <div>
              <p className="eyebrow">CV Release</p>
              <h1>Gerador de currículo ATS</h1>
            </div>
            <select value={language} onChange={(event) => setLanguage(event.target.value as "pt-BR" | "en")}>
              <option value="pt-BR">Português</option>
              <option value="en">English</option>
            </select>
          </div>

          <section className="panel">
            <h2>Perfil do LinkedIn</h2>
            <TextAreaField
              label="Cole texto ou JSON do LinkedIn"
              value={linkedinData}
              rows={10}
              onChange={setLinkedinData}
              placeholder="Nome, título, resumo, experiências, formação, certificações, competências, projetos, idiomas e links..."
            />
            <label className="upload">
              <span>Upload de PDF do perfil/currículo</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  parsePdf(file).catch((caught) => {
                    setStatus("");
                    setError(caught instanceof Error ? caught.message : "Falha ao ler PDF.");
                  });
                }}
              />
            </label>
          </section>

          <section className="panel">
            <h2>Vaga</h2>
            <div className="inline-action">
              <TextField label="URL da vaga" value={jobUrl} onChange={setJobUrl} placeholder="https://..." />
              <button className="secondary" type="button" onClick={extractJobUrl}>Buscar</button>
            </div>
            <TextAreaField
              label="Descrição da vaga"
              value={jobDescription}
              rows={8}
              onChange={setJobDescription}
              placeholder="Cole requisitos, responsabilidades, tecnologias, senioridade e nome da empresa..."
            />
          </section>

          <div className="action-bar">
            <button type="button" disabled={!canGenerate} onClick={generateResume}>
              {isGenerating ? "Gerando..." : "Gerar currículo"}
            </button>
            <button type="button" className="secondary" onClick={() => setTemplate(template === "ats" ? "modern" : "ats")}>
              Modelo: {template === "ats" ? "ATS" : "Moderno"}
            </button>
          </div>

          {status && <p className="status">{status}</p>}
          {error && <p className="error">{error}</p>}
        </aside>

        <section className="right-pane">
          {output ? (
            <>
              <div className="toolbar">
                <div>
                  <p className="eyebrow">Pré-visualização</p>
                  <h2>Currículo final</h2>
                </div>
                <div className="segmented">
                  <button type="button" className={template === "ats" ? "active" : ""} onClick={() => setTemplate("ats")}>ATS</button>
                  <button type="button" className={template === "modern" ? "active" : ""} onClick={() => setTemplate("modern")}>Moderno</button>
                  <button type="button" onClick={printResume}>Exportar PDF</button>
                </div>
              </div>

              <section className="editor panel">
                <h3>Editar dados principais</h3>
                <div className="field-grid">
                  <TextField label="Nome" value={resume.contact.name} onChange={(value) => updateContact("name", value)} />
                  <TextField label="Título" value={resume.contact.title} onChange={(value) => updateContact("title", value)} />
                  <TextField label="Cidade/Estado" value={resume.contact.location} onChange={(value) => updateContact("location", value)} />
                  <TextField label="E-mail" value={resume.contact.email} onChange={(value) => updateContact("email", value)} />
                  <TextField label="Telefone" value={resume.contact.phone} onChange={(value) => updateContact("phone", value)} />
                  <TextField label="LinkedIn" value={resume.contact.linkedin} onChange={(value) => updateContact("linkedin", value)} />
                  <TextField label="GitHub" value={resume.contact.github} onChange={(value) => updateContact("github", value)} />
                  <TextField label="Portfólio" value={resume.contact.portfolio} onChange={(value) => updateContact("portfolio", value)} />
                </div>
                <TextAreaField label="Resumo profissional" value={resume.summary} rows={4} onChange={(value) => updateResume({ summary: value })} />
                <TextAreaField
                  label="Competências técnicas"
                  value={resume.skills.join(", ")}
                  rows={3}
                  onChange={(value) => updateResume({ skills: splitComma(value) })}
                />
              </section>

              <section className="editor panel">
                <div className="section-title-row">
                  <h3>Experiências</h3>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      updateResume({
                        experiences: [
                          ...resume.experiences,
                          { role: "", company: "", period: "", location: "", description: [], technologies: [] }
                        ]
                      })
                    }
                  >
                    Adicionar
                  </button>
                </div>
                {resume.experiences.map((experience, index) => (
                  <div className="experience-editor" key={`editor-${index}`}>
                    <div className="field-grid">
                      <TextField label="Cargo" value={experience.role} onChange={(value) => updateExperience(index, { role: value })} />
                      <TextField label="Empresa" value={experience.company} onChange={(value) => updateExperience(index, { company: value })} />
                      <TextField label="Período" value={experience.period} onChange={(value) => updateExperience(index, { period: value })} />
                      <TextField label="Local" value={experience.location} onChange={(value) => updateExperience(index, { location: value })} />
                    </div>
                    <TextAreaField
                      label="Descrições, uma por linha"
                      value={experience.description.join("\n")}
                      rows={4}
                      onChange={(value) => updateExperience(index, { description: splitLines(value) })}
                    />
                    <TextAreaField
                      label="Tecnologias"
                      value={experience.technologies.join(", ")}
                      rows={2}
                      onChange={(value) => updateExperience(index, { technologies: splitComma(value) })}
                    />
                  </div>
                ))}
              </section>

              <ResumePreview resume={resume} template={template} />
              <AnalysisPanel output={output} />
            </>
          ) : (
            <div className="empty-state">
              <p className="eyebrow">Primeiro passo</p>
              <h2>Insira o perfil e gere a primeira versão</h2>
              <p>
                O resultado aparecerá aqui com editor, análise de aderência, palavras-chave ATS e prévia para exportação em PDF.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
