# ARCHITECTURE.md

## Recommended Flow

```text
LinkedIn input
→ profile normalization
→ job description analysis
→ resume generation
→ resume validation
→ PDF rendering
→ final document
```

## Suggested Layers

```text
routes
controllers
services
repositories
validators
prompt-builders
pdf-renderers
helpers
```

## Responsibilities

### routes

Define HTTP endpoints and connect them to controllers.

### controllers

Handle requests, basic input checks and responses.

### services

Apply product rules and coordinate the resume workflow.

### repositories

Access persistent storage only.

### validators

Validate profile data, job data, resume JSON and generation options.

### prompt-builders

Build versioned prompts for AI operations.

### pdf-renderers

Transform validated resume data into PDF files.

### helpers

Provide shared utilities without business ownership.

## Data Boundary

Do not generate PDFs directly from raw AI text.

Always convert AI output into a structured object, validate it and only then render the PDF.

## Suggested Modules

```text
linkedin-parser
profile-normalizer
job-analyzer
resume-generator
resume-validator
ats-keyword-extractor
pdf-generator
resume-template-registry
```
