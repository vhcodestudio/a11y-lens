import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isPrivateIp, normalizeUrl } from "./guard";
import type { PageInput } from "./rules";

export class FetchError extends Error {
  constructor(public code: "invalid_url" | "blocked" | "timeout" | "too_large" | "not_html" | "unreachable", message: string, public status: number) { super(message); }
}

const MAX_BYTES = 2_000_000;
const TIMEOUT = 8_000;
const UA = "a11y-lens/1.0 (+https://a11y-lens-vhcode.vercel.app)";

async function assertPublic(u: URL) {
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => { throw new FetchError("unreachable", "Não consegui encontrar esse endereço.", 422); })).map((a) => a.address);
  if (!ips.length || ips.some(isPrivateIp)) throw new FetchError("blocked", "Esse endereço aponta para uma rede privada e não pode ser auditado.", 422);
}

async function readCapped(res: Response) {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) { await reader.cancel(); throw new FetchError("too_large", "A página passa de 2 MB de HTML.", 413); }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** Fetch with manual redirects so every hop is re-checked against private ranges. */
async function safeFetch(start: URL, signal: AbortSignal) {
  let url = start;
  for (let hop = 0; hop < 5; hop++) {
    await assertPublic(url);
    const res = await fetch(url, { redirect: "manual", signal, headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" }, cache: "no-store" });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      const next = normalizeUrl(new URL(res.headers.get("location")!, url).href);
      if (!next) throw new FetchError("blocked", "A página redireciona para um endereço que não pode ser auditado.", 422);
      url = next;
      continue;
    }
    return { res, url };
  }
  throw new FetchError("unreachable", "Redirecionamentos demais.", 422);
}

export async function fetchPage(input: string): Promise<PageInput> {
  const start = normalizeUrl(input);
  if (!start) throw new FetchError("invalid_url", "Use um endereço público começando com http:// ou https://.", 400);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const t0 = performance.now();
    const { res, url } = await safeFetch(start, ctrl.signal);
    const type = res.headers.get("content-type") ?? "";
    if (!/html|xml/.test(type)) throw new FetchError("not_html", `O endereço respondeu ${type || "sem tipo"}, não uma página HTML.`, 422);
    const html = await readCapped(res);
    const ms = Math.round(performance.now() - t0);
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    const setCookie = res.headers.getSetCookie?.();
    if (setCookie?.length) headers["set-cookie"] = setCookie.join(", ");

    let robotsTxt = false;
    try {
      const r = await fetch(new URL("/robots.txt", url), { redirect: "manual", signal: ctrl.signal, headers: { "user-agent": UA }, cache: "no-store" });
      robotsTxt = r.ok && (r.headers.get("content-type") ?? "").includes("text/plain");
    } catch { /* optional */ }

    return { url: url.href, html, headers, status: res.status, ms, bytes: Buffer.byteLength(html), robotsTxt };
  } catch (e) {
    if (e instanceof FetchError) throw e;
    if (ctrl.signal.aborted) throw new FetchError("timeout", "A página demorou mais de 8 segundos para responder.", 504);
    throw new FetchError("unreachable", "Não consegui abrir essa página.", 502);
  } finally {
    clearTimeout(timer);
  }
}
