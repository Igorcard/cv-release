export type ContactInfo = {
  name: string;
  title: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
};

export type ResumeExperience = {
  role: string;
  company: string;
  period: string;
  location: string;
  description: string[];
  technologies: string[];
};

export type ResumeProject = {
  name: string;
  description: string;
  technologies: string[];
  link: string;
};

export type ResumeEducation = {
  degree: string;
  institution: string;
  period: string;
};

export type ResumeCertification = {
  name: string;
  issuer: string;
  year: string;
};

export type ResumeLanguage = {
  name: string;
  level: string;
};

export type FinalResume = {
  contact: ContactInfo;
  summary: string;
  skills: string[];
  experiences: ResumeExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  languages: ResumeLanguage[];
};

export type JobMatch = {
  strongFit: string[];
  partialFit: string[];
  gaps: string[];
  deEmphasize: string[];
};

export type GeneratedResumeOutput = {
  analysisSummary: string;
  jobMatch: JobMatch;
  atsKeywords: string[];
  finalResume: FinalResume;
  improvementsMade: string[];
  missingInformation: string[];
  linkedinImprovements: string[];
};

export type GenerateRequest = {
  linkedinData: string;
  jobDescription: string;
  jobUrl?: string;
  language: "pt-BR" | "en";
};

export type ResumeTemplate = "ats" | "modern";
