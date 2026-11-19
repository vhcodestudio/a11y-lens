import { FetchError, fetchPage } from "@/lib/fetch-page";
import { audit } from "@/lib/rules";
import { API_ERRORS, isLang, type Lang } from "@/lib/i18n";

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 10;
}

let reqLang: Lang = "pt";
const err = (status: number, code: string, message: string, headers?: HeadersInit) => Response.json({ error: { code, message: API_ERRORS[reqLang][code] ?? message } }, { status, headers });

export async function POST(req: Request) {
  const qLang = new URL(req.url).searchParams.get("lang");
  reqLang = isLang(qLang) ? qLang : "pt";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anon";
  if (limited(ip)) return err(429, "rate_limit_exceeded", "Muitas auditorias seguidas. Espere um minuto.", { "Retry-After": "60" });
  let url: unknown;
  try {
    const text = await req.text();
    if (text.length > 4096) return err(413, "payload_too_large", "Pedido grande demais.");
    url = (JSON.parse(text) as { url?: unknown }).url;
  } catch {
    return err(400, "invalid_json", "Envie um JSON como {\"url\": \"https://exemplo.com\"}.");
  }
  if (typeof url !== "string" || !url.trim()) return err(422, "validation_error", "Informe a URL da página.");
  try {
    const page = await fetchPage(url);
    return Response.json({ data: audit(page, reqLang) }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof FetchError) return err(e.status, e.code, e.message);
    return err(500, "internal_error", "Algo deu errado durante a auditoria.");
  }
}
