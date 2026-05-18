import { NextResponse } from "next/server";
import pdf from "pdf-parse";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Envie um arquivo PDF." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "O arquivo precisa estar em PDF." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
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
