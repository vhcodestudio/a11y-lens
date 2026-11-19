import { describe, expect, it } from "vitest";
import { audit, grade, toMarkdown, RULE_COUNT } from "./rules";
import { isPrivateIp, normalizeUrl } from "./guard";

const good = `<!doctype html><html lang="pt-BR"><head>
<title>Conserto de bicicletas em Curitiba · Pedal Bom</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Revisão completa em 24 horas, com retirada e entrega em casa em toda Curitiba e região metropolitana.">
<link rel="canonical" href="https://pedal.example/"><meta property="og:title" content="x"><meta property="og:description" content="x"><meta property="og:image" content="x">
<script type="application/ld+json">{}</script><script src="/app.js" defer></script></head>
<body><a href="#conteudo">Pular para o conteúdo</a><main id="conteudo"><h1>Pedal Bom</h1><h2>Serviços</h2>
<img src="a.jpg" alt="Oficina" width="10" height="10"><label for="e">E-mail</label><input id="e" type="email"><button>Enviar</button></main></body></html>`;

const goodHeaders = {
  "content-encoding": "br", "strict-transport-security": "max-age=63072000", "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin",
};

describe("audit", () => {
  it("passes a well-built page in every category", () => {
    const r = audit({ url: "https://pedal.example/", html: good, headers: goodHeaders, status: 200, ms: 200, bytes: good.length, robotsTxt: true });
    expect(r.findings).toHaveLength(RULE_COUNT);
    const fails = r.findings.filter((f) => !f.passed).map((f) => f.id);
    expect(fails).toEqual([]);
    expect(r.overall).toBe(100);
  });

  it("flags the classic problems with examples", () => {
    const bad = `<html><head><meta name="viewport" content="width=device-width, user-scalable=no"><script src="http://cdn.x/a.js"></script></head>
      <body><h1>A</h1><h1>B</h1><h4>C</h4><img src="x.png"><input type="text" placeholder="Nome"><button><svg></svg></button><div id="d"></div><div id="d"></div></body></html>`;
    const r = audit({ url: "https://bad.example/", html: bad, headers: { "x-powered-by": "PHP/7.2.1" }, status: 200, ms: 1900, bytes: bad.length });
    const fails = new Set(r.findings.filter((f) => !f.passed).map((f) => f.id));
    for (const id of ["html-lang", "image-alt", "form-labels", "button-name", "heading-order", "zoom", "duplicate-id", "render-blocking", "title", "csp", "hsts", "mixed-content", "server-disclosure", "ttfb"]) {
      expect(fails, id).toContain(id);
    }
    expect(r.findings.find((f) => f.id === "image-alt")!.examples![0]).toContain("x.png");
    expect(r.scores.acessibilidade).toBeLessThan(40);
    expect(grade(r.overall)).toBe("F");
    expect(toMarkdown(r)).toContain("## Problemas");
  });
});

describe("SSRF guard", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.0.10", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"])("%s is private", (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });
  it.each(["8.8.8.8", "151.101.1.69", "2606:4700::6810:85e5"])("%s is public", (ip) => expect(isPrivateIp(ip)).toBe(false));

  it("normalizes and rejects unsafe URLs", () => {
    expect(normalizeUrl("example.com/a#x")?.href).toBe("https://example.com/a");
    for (const bad of ["file:///etc/passwd", "http://localhost:3000", "http://127.0.0.1", "http://[::1]/", "https://user:pw@example.com", "http://example.com:8080", "http://intranet", "gopher://x.com", "http://169.254.169.254/latest"]) {
      expect(normalizeUrl(bad), bad).toBeNull();
    }
  });
});

describe("languages", () => {
  it("returns English and Spanish findings with translated details", () => {
    const html = "<html><head><title>x</title></head><body><img src='a.png'></body></html>";
    const page = { url: "https://x.example/", html, headers: {}, status: 200, ms: 100, bytes: html.length };
    const en = audit(page, "en").findings.find((f) => f.id === "image-alt")!;
    expect(en.title).toBe("Images with alt text");
    expect(en.detail).toBe("1 image(s) without alt.");
    const es = audit(page, "es").findings.find((f) => f.id === "title")!;
    expect(es.title).toBe("Título de la página");
    expect(es.detail).toBe("“x” (1 caracteres)");
  });
  it("keeps every finding detail translatable in English", () => {
    const html = "<html><body></body></html>";
    const r = audit({ url: "http://x.example/", html, headers: {}, status: 200, ms: 1200, bytes: 10 }, "en");
    for (const f of r.findings) expect(f.detail, f.id).not.toMatch(/[ãçõ]|não|página|Nenhum/);
  });
});
