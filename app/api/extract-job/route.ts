import { NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { lookup } from "node:dns/promises";
import net from "node:net";

export const runtime = "nodejs";

const MAX_JOB_FETCH_BYTES = 1024 * 1024;
const MAX_EXTRACT_BODY_CHARS = 4096;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 10000;

function isPrivateIPv4(address: string) {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateIPv6(address: string) {
  const normalized = address.toLowerCase();
  const mappedIPv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIPv4) return isPrivateIPv4(mappedIPv4);

  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function isBlockedAddress(address: string) {
  const family = net.isIP(address);
  if (family === 4) return isPrivateIPv4(address);
  if (family === 6) return isPrivateIPv6(address);
  return true;
}

async function assertPublicHttpUrl(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("A URL precisa usar HTTP ou HTTPS.");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("A URL informada não pode apontar para endereços internos.");
  }

  const directIpFamily = net.isIP(hostname);
  if (directIpFamily) {
    if (isBlockedAddress(hostname)) throw new Error("A URL informada não pode apontar para endereços internos.");
    return;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((address) => isBlockedAddress(address.address))) {
    throw new Error("A URL informada não pode apontar para endereços internos.");
  }
}

async function fetchPublicUrl(initialUrl: URL) {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertPublicHttpUrl(currentUrl);

    const response = await fetch(currentUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CVRelease/0.1; +https://localhost)"
      },
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) return response;
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    return response;
  }

  throw new Error("Redirecionamentos em excesso.");
}

async function readTextLimited(response: Response) {
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_JOB_FETCH_BYTES) {
    throw new Error("A página retornou conteúdo grande demais.");
  }

  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_JOB_FETCH_BYTES) {
      await reader.cancel();
      throw new Error("A página retornou conteúdo grande demais.");
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

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
    const rateLimit = checkRateLimit(`extract-job:${getClientKey(request)}`, 30, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Muitas solicitações. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_EXTRACT_BODY_CHARS) {
      return NextResponse.json({ error: "A solicitação é muito grande." }, { status: 413 });
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_EXTRACT_BODY_CHARS) {
      return NextResponse.json({ error: "A solicitação é muito grande." }, { status: 413 });
    }

    const { url } = JSON.parse(rawBody) as { url?: string };
    if (!url) {
      return NextResponse.json({ error: "Informe uma URL de vaga." }, { status: 400 });
    }

    const parsedUrl = new URL(url);
    const response = await fetchPublicUrl(parsedUrl);

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

    const raw = await readTextLimited(response);
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
