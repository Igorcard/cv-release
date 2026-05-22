import assert from "node:assert/strict";
import test from "node:test";

import { buildProfileContextForPrompt } from "../lib/profile-context.ts";

test("buildProfileContextForPrompt loads the structured Igor profile context", async () => {
  const context = await buildProfileContextForPrompt();

  assert.match(context, /Contexto estruturado do perfil/);
  assert.match(context, /igor-cardoso-francolin/);
  assert.match(context, /exp_accesys_backend/);
  assert.match(context, /project_weatherapi/);
  assert.match(context, /source-map/);
  assert.match(context, /truth-policy/);
  assert.match(context, /Nao invente metricas/);
});
