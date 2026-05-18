import { NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import pdf from "pdf-parse";

export const runtime = "nodejs";

const MAX_PDF_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(`parse-pdf:${getClientKey(request)}`, 30, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Muitas solicitações. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_PDF_BYTES + 1024 * 1024) {
      return NextResponse.json({ error: "O PDF deve ter no máximo 5 MB." }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Envie um arquivo PDF." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "O arquivo precisa estar em PDF." }, { status: 400 });
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "O PDF deve ter no máximo 5 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdf(buffer);
    const text = parsed.text.replace(/\n{3,}/g, "\n\n").trim();

    if (!text || text.length < 20) {
      return NextResponse.json(
        { error: "Não foi possível extrair texto suficiente do PDF. Cole os dados manualmente." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "Falha ao ler o PDF. Tente outro arquivo ou cole o conteúdo manualmente." },
      { status: 400 }
    );
  }
}
