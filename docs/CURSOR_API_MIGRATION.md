# Migração de OpenAI para Cursor API

## Situação atual

Hoje o projeto está acoplado à OpenAI:

- `lib/openai.ts` lê `OPENAI_API_KEY`
- `lib/openai.ts` lê `OPENAI_MODEL`
- `lib/openai.ts` envia requisições para `https://api.openai.com/v1/responses`
- `app/api/generate/route.ts` trata a falha como falha do provedor OpenAI
- `.env.example` só expõe variáveis da OpenAI

Por isso, uma chave da Cursor não pode ser usada apenas trocando o valor de `OPENAI_API_KEY`.

## Alterações necessárias

### 1. Desacoplar o provedor no arquivo `lib/openai.ts`

Renomear o arquivo para algo neutro, por exemplo:

- `lib/ai.ts`

Trocar a implementação para:

- não depender de `OPENAI_API_KEY`
- não depender de endpoint fixo da OpenAI
- aceitar configuração por variáveis de ambiente

Estrutura mínima sugerida:

- `AI_PROVIDER=openai | cursor`
- `AI_API_KEY=...`
- `AI_MODEL=...`
- `AI_BASE_URL=...`

## 2. Trocar o endpoint fixo

Hoje o código usa:

```ts
https://api.openai.com/v1/responses
```

Isso precisa virar algo configurável, por exemplo:

```ts
const baseUrl = process.env.AI_BASE_URL;
const endpoint = `${baseUrl}/...`;
```

Observação:

- a API do Cursor não é drop-in compatible com `v1/responses` da OpenAI
- portanto não basta trocar o domínio
- o payload e a rota exata precisam seguir o contrato da Cursor API

## 3. Criar um cliente por provedor

O ideal é separar por adaptadores:

- `lib/providers/openai.ts`
- `lib/providers/cursor.ts`
- `lib/ai.ts` como camada de seleção

Responsabilidade esperada:

- `openai.ts`: mantém a chamada atual da OpenAI
- `cursor.ts`: implementa a chamada HTTP no formato aceito pela Cursor API
- `ai.ts`: escolhe o provider via `AI_PROVIDER`

## 4. Ajustar o parser de resposta

A função atual em `lib/openai.ts` tenta extrair texto do formato de resposta da OpenAI.

Será necessário:

- manter um parser para OpenAI
- criar um parser específico para Cursor
- normalizar ambos para `GeneratedResumeOutput`

Em especial, estas funções provavelmente precisarão mudar:

- `extractOutputText`
- `parseJsonObject`
- `generateWithOpenAI`

## 5. Renomear a função principal

Hoje a rota usa:

```ts
generateWithOpenAI(parsed)
```

Troca sugerida:

```ts
generateWithAI(parsed)
```

Arquivo impactado:

- `app/api/generate/route.ts`

## 6. Ajustar mensagens de erro e fallback

Hoje a rota expõe mensagens específicas da OpenAI:

- `"OPENAI_API_KEY não configurada..."`
- `"Falha na geração com IA: ..."`

Trocar para mensagens neutras:

- `"AI_API_KEY não configurada."`
- `"Falha na geração com o provedor de IA configurado."`

## 7. Atualizar variáveis de ambiente

### `.env.example`

Substituir:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Por algo como:

```env
AI_PROVIDER=openai
AI_API_KEY=
AI_MODEL=
AI_BASE_URL=
```

Se quiser manter compatibilidade retroativa:

- aceitar `OPENAI_API_KEY` quando `AI_PROVIDER=openai`
- priorizar `AI_API_KEY`

## 8. Atualizar a documentação

Arquivos a atualizar:

- `README.md`
- possivelmente `docs/ARCHITECTURE.md`

Pontos a documentar:

- quais provedores são suportados
- quais variáveis de ambiente são obrigatórias
- qual endpoint cada provider usa
- limitações de compatibilidade entre OpenAI e Cursor

## 9. Validar o contrato da Cursor API antes da implementação

Antes de codificar, é necessário confirmar na documentação oficial da Cursor:

- endpoint correto
- método HTTP
- headers de autenticação
- formato de input
- formato de output
- limites de modelo
- nomes válidos de modelos

Sem isso, a troca vai falhar mesmo com a chave correta.

## Alterações recomendadas

Além do mínimo necessário, vale fazer estes ajustes:

### 1. Introduzir tipagem de provider

Adicionar um tipo central, por exemplo em `lib/types.ts`:

```ts
export type AIProvider = "openai" | "cursor";
```

### 2. Validar configuração no bootstrap

Criar uma função para validar:

- provider presente
- chave presente
- modelo presente quando necessário
- base URL presente quando necessário

Isso evita erro tardio só no momento da requisição.

### 3. Criar testes para seleção de provider

Cobrir pelo menos:

- seleção de OpenAI
- seleção de Cursor
- erro quando provider é inválido
- erro quando falta chave
- parser de resposta inválida

## Arquivos que devem mudar

Mínimo:

- `lib/openai.ts` -> renomear ou substituir por `lib/ai.ts`
- `app/api/generate/route.ts`
- `.env.example`
- `README.md`

Provável expansão:

- `lib/types.ts`
- pasta nova `lib/providers/`

## Risco atual encontrado

Existe uma chave real exposta em `.env`.

Ações necessárias:

- rotacionar a chave imediatamente
- remover a chave comprometida
- manter `.env` fora de commits

## Proposta de implementação

Ordem recomendada:

1. Criar interface comum de provider
2. Extrair provider atual da OpenAI para adaptador próprio
3. Adicionar adaptador Cursor
4. Trocar a rota para chamar `generateWithAI`
5. Atualizar `.env.example`
6. Atualizar documentação
7. Testar ambos os fluxos

## Resumo objetivo

Para usar Cursor no lugar da OpenAI neste projeto, é necessário:

- remover o endpoint fixo da OpenAI
- tornar provider, chave, modelo e base URL configuráveis
- criar um adaptador específico para a Cursor API
- ajustar parser de resposta
- atualizar rota, `.env` e documentação

Trocar apenas a chave não resolve.
