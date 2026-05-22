# ARCHITECTURE.md

This project is a context-driven resume generation system. It should not behave like a single chatbot prompt that receives a profile and returns free-form text.

The core architecture separates raw profile inputs, canonical facts, retrievable context, prompts, schemas, generated outputs and rendering artifacts.

## Recommended Flow

```text
LinkedIn profile input
-> raw profile capture
-> canonical profile normalization
-> evidence and chunk indexing
-> job description analysis
-> profile-to-job matching
-> structured resume generation
-> factual and ATS validation
-> Markdown/HTML rendering
-> PDF rendering
-> versioned output package
```

## Folder Structure

```text
cv-release/
  app/
  lib/
  docs/
    ARCHITECTURE.md
    PLANEJAMENTO_ARQUITETURA_CONTEXTO.md

  data/
    profile/
      base/
      experiences/
      projects/
      skills/
      certifications/
      education/
      languages/
      achievements/
      constraints/
    jobs/
      incoming/
      normalized/
      analyses/
    generated/
      versions/
      comparisons/

  context/
    canonical/
    chunks/
    indexes/
    retrieval/
    memory/
    embeddings/

  prompts/
    system/
    ingestion/
    job-analysis/
    matching/
    generation/
    validation/
    rendering/
    schemas/

  schemas/
  templates/
    resume/
    markdown/
    pdf/
  outputs/
    pdf/
    markdown/
    html/
    json/
  logs/
    runs/
    errors/
  config/
```

## Folder Responsibilities

### `data/profile`

Stores candidate-owned source data and normalized profile facts.

- `base/`: raw LinkedIn/profile capture, normalized profile JSON, personal info and canonical summary.
- `experiences/`: one professional experience per JSON file.
- `projects/`: one relevant project per JSON file.
- `skills/`: technical skills, soft skills and skill-to-evidence mapping.
- `certifications/`, `education/`, `languages/`, `achievements/`: structured candidate facts by domain.
- `constraints/`: truth policy and redaction preferences.

### `data/jobs`

Stores job descriptions and derived job analysis artifacts.

- `incoming/`: raw job descriptions.
- `normalized/`: normalized job JSON.
- `analyses/`: requirements, keyword maps and risk analysis.

### `data/generated`

Stores auditable generated resume packages.

Each version should contain the manifest, match analysis, structured resume JSON, Markdown, HTML, ATS score, validation report and rendering options.

### `context`

Stores derived context optimized for retrieval.

- `canonical/`: candidate profile, career timeline and evidence index.
- `chunks/`: compact context units selected for prompts.
- `indexes/`: registry, chunk manifest and source map.
- `retrieval/`: last retrieval plan and job-to-context rankings.
- `memory/`: persistent preferences and feedback history.
- `embeddings/`: vector metadata and future embedding files.

### `prompts`

Stores versioned prompts by responsibility.

Prompts must have a defined input, output and validation expectation. They should not mix ingestion, matching, generation and validation concerns in the same file.

### `schemas`

Stores JSON schemas for profile, experience, project, skill, job, match analysis, generated resume, ATS score and validation report.

All AI-generated structured outputs must be validated against schemas before rendering.

### `templates`

Stores rendering templates.

- `resume/`: HTML/CSS resume templates.
- `markdown/`: Markdown/Handlebars templates.
- `pdf/`: PDF page and font settings.

### `outputs`

Stores final exported artifacts only.

Intermediate generation artifacts belong in `data/generated/versions/`, not here.

### `logs`

Stores run logs, LLM call logs, token usage, validation logs and rendering/schema errors.

### `config`

Stores operational configuration for app defaults, models, ATS rules, retrieval, generation and privacy.

## Application Layers

```text
routes
controllers
services
repositories
validators
prompt-builders
retrievers
renderers
helpers
```

### `routes`

Define HTTP endpoints and connect them to controllers.

### `controllers`

Handle request/response boundaries and basic input checks.

### `services`

Coordinate product workflows and business rules.

Services must not execute database queries directly and must not import database models or database clients. Use repositories for persistence access.

### `repositories`

Access persistent storage and filesystem-backed artifacts.

### `validators`

Validate profile data, job data, generated resume JSON, ATS scores, validation reports and rendering options.

### `prompt-builders`

Build prompts from versioned prompt files and explicit input contracts.

### `retrievers`

Select relevant context chunks from canonical profile data, indexes and job requirements.

### `renderers`

Transform validated resume data into Markdown, HTML and PDF outputs.

### `helpers`

Provide shared utilities without business ownership.

## Data Boundary

Raw profile text is never a final resume source.

AI output must become a structured object, include `source_ids`, pass schema validation, pass factual validation and only then be rendered.

PDF files must never be generated directly from raw AI text.

## Suggested Modules

```text
linkedin-profile-ingestor
profile-normalizer
evidence-indexer
context-chunker
job-analyzer
context-retriever
profile-job-matcher
resume-json-generator
resume-validator
ats-keyword-extractor
markdown-renderer
html-renderer
pdf-generator
resume-template-registry
version-package-writer
```
