import { NextResponse } from "next/server";

export const runtime = "nodejs";

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url) {
      return NextResponse.json({ error: "Informe uma URL de vaga." }, { status: 400 });
    }

    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "A URL precisa usar HTTP ou HTTPS." }, { status: 400 });
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CVRelease/0.1; +https://localhost)"
      },
      redirect: "follow"
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Não foi possível acessar a URL. Cole a descrição da vaga manualmente." },
        { status: 422 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return NextResponse.json(
        { error: "A URL não retornou texto legível. Cole a descrição da vaga manualmente." },
        { status: 422 }
      );
    }

    const raw = await response.text();
    const text = htmlToText(raw).slice(0, 20000);

    if (text.length < 100) {
      return NextResponse.json(
        { error: "Texto insuficiente na página. Cole a descrição da vaga manualmente." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "URL inválida ou inacessível. Cole a descrição da vaga manualmente." },
      { status: 400 }
    );
  }
}
