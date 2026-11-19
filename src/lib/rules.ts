import { parse, type HTMLElement } from "node-html-parser";

import { CATEGORIES, type Category, type Finding, type PageInput, type Report, type Severity } from "./report";
import { localizeFinding } from "./rules-i18n";
export * from "./report";

const W: Record<Severity, number> = { critical: 15, high: 10, medium: 5, low: 2 };
const ref = (cat: string, slug: string) => `https://frontendchecklist.io/rules/${cat}/${slug}`;
const snip = (el: HTMLElement) => el.outerHTML.replace(/\s+/g, " ").slice(0, 140);

type Ctx = { root: HTMLElement; page: PageInput; h: (k: string) => string | undefined; isHttps: boolean };
type Rule = {
  id: string; category: Category; severity: Severity; title: string; why: string; fix: string; snippet?: string; ref: string;
  run: (c: Ctx) => { passed: boolean; detail: string; examples?: string[] };
};

const RULES: Rule[] = [
  // ── Acessibilidade ──────────────────────────────────────────────
  { id: "html-lang", category: "acessibilidade", severity: "high", title: "Idioma da página declarado", ref: ref("accessibility", "html-has-lang"),
    why: "Leitores de tela usam o atributo lang para escolher a pronúncia. Sem ele, um texto em português pode ser lido com sotaque inglês.",
    fix: "Declare o idioma principal no elemento html.", snippet: `<html lang="pt-BR">`,
    run: ({ root }) => { const l = root.querySelector("html")?.getAttribute("lang"); return { passed: !!l?.trim(), detail: l ? `lang="${l}"` : "O elemento html não tem lang." }; } },
  { id: "image-alt", category: "acessibilidade", severity: "critical", title: "Imagens com texto alternativo", ref: ref("accessibility", "image-alt"),
    why: "Quem usa leitor de tela só sabe o que a imagem mostra pelo alt. Imagens decorativas devem ter alt vazio para serem ignoradas.",
    fix: "Descreva a função da imagem no alt, ou use alt=\"\" se ela for só decoração.", snippet: `<img src="equipe.jpg" alt="Equipe reunida no escritório de Recife">\n<img src="ornamento.svg" alt="">`,
    run: ({ root }) => { const bad = root.querySelectorAll("img").filter((i) => i.getAttribute("alt") === undefined && i.getAttribute("role") !== "presentation" && i.getAttribute("aria-hidden") !== "true");
      return { passed: !bad.length, detail: bad.length ? `${bad.length} imagem(ns) sem alt.` : "Todas as imagens têm alt.", examples: bad.slice(0, 3).map(snip) }; } },
  { id: "form-labels", category: "acessibilidade", severity: "critical", title: "Campos de formulário com rótulo", ref: ref("accessibility", "form-labels"),
    why: "Sem rótulo associado, o leitor de tela anuncia só “campo de edição”, e a pessoa não sabe o que digitar. Placeholder não substitui label.",
    fix: "Associe um label ao campo com for/id, ou use aria-label quando não houver texto visível.", snippet: `<label for="email">E-mail</label>\n<input id="email" type="email" autocomplete="email">`,
    run: ({ root }) => {
      const labelled = new Set(root.querySelectorAll("label[for]").map((l) => l.getAttribute("for")));
      const bad = root.querySelectorAll("input, select, textarea").filter((i) => {
        const t = i.getAttribute("type") ?? "";
        if (["hidden", "submit", "button", "reset", "image"].includes(t)) return false;
        if (i.getAttribute("aria-label") || i.getAttribute("aria-labelledby") || i.getAttribute("title")) return false;
        if (i.id && labelled.has(i.id)) return false;
        let p = i.parentNode as HTMLElement | null;
        while (p) { if (p.tagName === "LABEL") return false; p = p.parentNode as HTMLElement | null; }
        return true;
      });
      return { passed: !bad.length, detail: bad.length ? `${bad.length} campo(s) sem rótulo acessível.` : "Todos os campos têm rótulo.", examples: bad.slice(0, 3).map(snip) };
    } },
  { id: "button-name", category: "acessibilidade", severity: "high", title: "Botões e links com nome acessível", ref: ref("accessibility", "aria-labels"),
    why: "Botões só com ícone viram “botão” para o leitor de tela. A pessoa não sabe se ele fecha, envia ou apaga.",
    fix: "Dê texto ao botão ou adicione aria-label descrevendo a ação.", snippet: `<button aria-label="Fechar menu"><svg aria-hidden="true">…</svg></button>`,
    run: ({ root }) => {
      const named = (e: HTMLElement) => !!(e.text.trim() || e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || e.getAttribute("title") || e.querySelector("img[alt]:not([alt=''])"));
      const bad = root.querySelectorAll("button, a[href], [role=button]").filter((e) => !named(e));
      return { passed: !bad.length, detail: bad.length ? `${bad.length} elemento(s) clicável(is) sem nome.` : "Todos têm nome.", examples: bad.slice(0, 3).map(snip) };
    } },
  { id: "heading-order", category: "acessibilidade", severity: "medium", title: "Hierarquia de títulos sem saltos", ref: ref("accessibility", "heading-order"),
    why: "Muita gente que usa leitor de tela navega pela lista de títulos. Pular de h2 para h4 dá a impressão de que falta conteúdo.",
    fix: "Use um h1 por página e desça um nível por vez (h2, depois h3).",
    run: ({ root }) => {
      const hs = root.querySelectorAll("h1, h2, h3, h4, h5, h6").map((h) => Number(h.tagName[1]));
      const h1 = hs.filter((n) => n === 1).length;
      const jumps = hs.filter((n, i) => i && n - hs[i - 1] > 1).length;
      const passed = h1 === 1 && !jumps;
      return { passed, detail: passed ? `${hs.length} títulos em ordem.` : `${h1} h1 na página${jumps ? `, ${jumps} salto(s) de nível` : ""}.` };
    } },
  { id: "landmark-main", category: "acessibilidade", severity: "medium", title: "Região principal (main) marcada", ref: ref("accessibility", "landmark-one-main"),
    why: "O elemento main permite pular direto para o conteúdo, sem passar pelo menu toda vez.", fix: "Envolva o conteúdo principal em um único <main>.",
    run: ({ root }) => { const n = root.querySelectorAll("main, [role=main]").length; return { passed: n === 1, detail: n === 1 ? "Um main encontrado." : `${n} regiões main.` }; } },
  { id: "skip-link", category: "acessibilidade", severity: "medium", title: "Link “pular para o conteúdo”", ref: ref("accessibility", "skip-link"),
    why: "Quem navega por teclado precisa passar por todos os links do menu em cada página. O skip link resolve isso com uma tecla.",
    fix: "Coloque como primeiro elemento focável um link para o main, visível ao receber foco.", snippet: `<a href="#conteudo" class="skip">Pular para o conteúdo</a>\n…\n<main id="conteudo">`,
    run: ({ root }) => { const a = root.querySelectorAll("a[href^='#']").slice(0, 3).find((x) => /pular|skip|conte[uú]do|main/i.test(x.text + (x.getAttribute("href") ?? ""))); return { passed: !!a, detail: a ? `Encontrado: “${a.text.trim()}”.` : "Nenhum skip link no início da página." }; } },
  { id: "zoom", category: "acessibilidade", severity: "critical", title: "Zoom do navegador permitido", ref: ref("accessibility", "meta-viewport"),
    why: "Pessoas com baixa visão ampliam a tela com pinça. user-scalable=no ou maximum-scale baixo bloqueia isso no celular.",
    fix: "Remova user-scalable=no e maximum-scale do meta viewport.", snippet: `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    run: ({ root }) => { const c = root.querySelector("meta[name=viewport]")?.getAttribute("content") ?? ""; const max = Number(c.match(/maximum-scale\s*=\s*([\d.]+)/)?.[1] ?? 5);
      const bad = /user-scalable\s*=\s*(no|0)/i.test(c) || max < 2; return { passed: !bad, detail: bad ? `viewport bloqueia zoom: “${c}”.` : "Zoom liberado." }; } },
  { id: "duplicate-id", category: "acessibilidade", severity: "medium", title: "IDs únicos", ref: ref("html", "duplicate-id"),
    why: "Rótulos e aria-labelledby apontam para IDs. Com IDs repetidos, o navegador escolhe o primeiro e o rótulo pode ir para o campo errado.",
    fix: "Garanta que cada id aparece uma vez por página.",
    run: ({ root }) => { const seen = new Map<string, number>(); root.querySelectorAll("[id]").forEach((e) => seen.set(e.id, (seen.get(e.id) ?? 0) + 1));
      const dup = [...seen].filter(([, n]) => n > 1).map(([k]) => k); return { passed: !dup.length, detail: dup.length ? `IDs repetidos: ${dup.slice(0, 5).join(", ")}.` : "Nenhum id repetido." }; } },
  { id: "tabindex", category: "acessibilidade", severity: "low", title: "Sem tabindex positivo", ref: ref("accessibility", "focus-order"),
    why: "tabindex maior que zero muda a ordem do Tab e quase sempre deixa a navegação por teclado confusa.", fix: "Use tabindex=\"0\" ou \"-1\", e organize a ordem pelo HTML.",
    run: ({ root }) => { const bad = root.querySelectorAll("[tabindex]").filter((e) => Number(e.getAttribute("tabindex")) > 0); return { passed: !bad.length, detail: bad.length ? `${bad.length} elemento(s) com tabindex positivo.` : "Ordem de foco natural.", examples: bad.slice(0, 3).map(snip) }; } },
  { id: "iframe-title", category: "acessibilidade", severity: "medium", title: "Iframes com título", ref: ref("accessibility", "frame-title"),
    why: "O título do iframe é o que o leitor de tela anuncia ao entrar nele, por exemplo “mapa da loja” ou “vídeo de apresentação”.", fix: "Adicione title descritivo a cada iframe.", snippet: `<iframe src="…" title="Mapa com o endereço da loja"></iframe>`,
    run: ({ root }) => { const bad = root.querySelectorAll("iframe").filter((f) => !f.getAttribute("title")?.trim()); return { passed: !bad.length, detail: bad.length ? `${bad.length} iframe(s) sem title.` : "Iframes ok (ou nenhum)." }; } },
  { id: "video-captions", category: "acessibilidade", severity: "high", title: "Vídeos com legenda", ref: ref("accessibility", "video-captions"),
    why: "Pessoas surdas ou em ambiente silencioso dependem de legendas sincronizadas.", fix: "Inclua uma faixa de legendas WebVTT no vídeo.", snippet: `<video controls>\n  <source src="demo.mp4">\n  <track kind="captions" srclang="pt" label="Português" src="demo.vtt" default>\n</video>`,
    run: ({ root }) => { const bad = root.querySelectorAll("video").filter((v) => !v.querySelector("track[kind=captions], track[kind=subtitles]")); return { passed: !bad.length, detail: bad.length ? `${bad.length} vídeo(s) sem faixa de legenda.` : "Sem vídeos sem legenda." }; } },

  // ── Performance ─────────────────────────────────────────────────
  { id: "ttfb", category: "performance", severity: "high", title: "Resposta do servidor rápida", ref: ref("performance", "ttfb"),
    why: "Tudo na página espera o primeiro byte do HTML. Acima de ~800 ms o resto do carregamento já começa atrasado.", fix: "Sirva o HTML de cache/CDN, gere páginas estáticas quando possível e reduza consultas no servidor.",
    run: ({ page }) => ({ passed: page.ms < 800, detail: `${page.ms} ms até o HTML completo (medido do nosso servidor).` }) },
  { id: "html-size", category: "performance", severity: "medium", title: "HTML enxuto", ref: ref("performance", "page-weight"),
    why: "HTML muito grande atrasa a primeira pintura, principalmente em 4G instável.", fix: "Mova dados grandes embutidos para requisições sob demanda e pagine listas longas.",
    run: ({ page }) => ({ passed: page.bytes < 150_000, detail: `${Math.round(page.bytes / 1024)} KB de HTML.` }) },
  { id: "compression", category: "performance", severity: "medium", title: "Compressão ativada", ref: ref("performance", "text-compression"),
    why: "Gzip ou Brotli reduzem o HTML em 70–80%.", fix: "Ative Brotli ou gzip no servidor ou CDN.",
    run: ({ h }) => { const e = h("content-encoding"); return { passed: !!e && /br|gzip|zstd|deflate/.test(e), detail: e ? `content-encoding: ${e}` : "Resposta sem compressão." }; } },
  { id: "render-blocking", category: "performance", severity: "high", title: "Scripts não bloqueiam a renderização", ref: ref("performance", "defer-async"),
    why: "Um <script src> no head sem defer/async para a leitura do HTML até baixar e executar.", fix: "Use defer (ou type=module) em scripts no head.", snippet: `<script src="app.js" defer></script>`,
    run: ({ root }) => { const bad = root.querySelectorAll("head script[src]").filter((s) => s.getAttribute("defer") === undefined && s.getAttribute("async") === undefined && s.getAttribute("type") !== "module");
      return { passed: !bad.length, detail: bad.length ? `${bad.length} script(s) bloqueante(s) no head.` : "Nenhum script bloqueante no head.", examples: bad.slice(0, 3).map(snip) }; } },
  { id: "img-dimensions", category: "performance", severity: "medium", title: "Imagens com largura e altura", ref: ref("images", "image-dimensions"),
    why: "Sem dimensões, o layout pula quando a imagem carrega (CLS), e a pessoa clica no lugar errado.", fix: "Informe width e height (ou aspect-ratio no CSS).", snippet: `<img src="capa.jpg" width="1200" height="630" alt="…">`,
    run: ({ root }) => { const imgs = root.querySelectorAll("img"); const bad = imgs.filter((i) => !i.getAttribute("width") || !i.getAttribute("height"));
      return { passed: bad.length <= Math.max(1, imgs.length * 0.1), detail: `${bad.length} de ${imgs.length} imagens sem width/height.`, examples: bad.slice(0, 3).map(snip) }; } },
  { id: "lazy-images", category: "performance", severity: "low", title: "Imagens abaixo da dobra com lazy loading", ref: ref("images", "lazy-loading"),
    why: "Carregar todas as imagens de uma vez disputa banda com o que aparece primeiro.", fix: "Adicione loading=\"lazy\" nas imagens que não aparecem na primeira tela.",
    run: ({ root }) => { const imgs = root.querySelectorAll("img").slice(3); const lazy = imgs.filter((i) => i.getAttribute("loading") === "lazy").length;
      return { passed: imgs.length < 4 || lazy / imgs.length > 0.5, detail: imgs.length ? `${lazy} de ${imgs.length} imagens depois das 3 primeiras usam lazy.` : "Poucas imagens." }; } },
  { id: "third-party", category: "performance", severity: "low", title: "Poucos domínios de terceiros", ref: ref("performance", "third-party-scripts"),
    why: "Cada domínio novo custa DNS, TLS e conexão. Scripts de terceiros também disputam a thread principal.", fix: "Corte scripts que não se pagam e carregue o resto depois da interação.",
    run: ({ root, page }) => { const host = new URL(page.url).hostname.split(".").slice(-2).join("."); const hosts = new Set(root.querySelectorAll("script[src]").map((s) => { try { return new URL(s.getAttribute("src")!, page.url).hostname; } catch { return ""; } }).filter((x) => x && !x.endsWith(host)));
      return { passed: hosts.size <= 3, detail: hosts.size ? `${hosts.size} domínio(s) de script de terceiros: ${[...hosts].slice(0, 4).join(", ")}.` : "Nenhum script de terceiros." }; } },

  // ── SEO ─────────────────────────────────────────────────────────
  { id: "title", category: "seo", severity: "critical", title: "Título da página", ref: ref("seo", "title"),
    why: "O title é o link azul no Google e o nome da aba. Entre 15 e 65 caracteres costuma aparecer inteiro.", fix: "Escreva um title único e descritivo por página.", snippet: `<title>Conserto de bicicletas em Curitiba · Pedal Bom</title>`,
    run: ({ root }) => { const t = root.querySelector("title")?.text.trim() ?? ""; return { passed: t.length >= 15 && t.length <= 65, detail: t ? `“${t}” (${t.length} caracteres)` : "Sem title." }; } },
  { id: "meta-description", category: "seo", severity: "high", title: "Meta description", ref: ref("seo", "meta-description"),
    why: "É o texto que costuma aparecer abaixo do título no resultado de busca. Bem escrita, aumenta os cliques.", fix: "Descreva a página em 70–160 caracteres.", snippet: `<meta name="description" content="Revisão completa em 24 h, com retirada em casa em toda Curitiba.">`,
    run: ({ root }) => { const d = root.querySelector("meta[name=description]")?.getAttribute("content")?.trim() ?? ""; return { passed: d.length >= 70 && d.length <= 160, detail: d ? `${d.length} caracteres.` : "Sem meta description." }; } },
  { id: "canonical", category: "seo", severity: "medium", title: "URL canônica", ref: ref("seo", "canonical-url"),
    why: "Evita que versões da mesma página (com ?utm, com barra no fim) dividam a relevância no Google.", fix: "Aponte a versão oficial com link rel=canonical.", snippet: `<link rel="canonical" href="https://exemplo.com/servicos">`,
    run: ({ root }) => { const c = root.querySelector("link[rel=canonical]")?.getAttribute("href"); return { passed: !!c, detail: c ? c : "Sem canonical." }; } },
  { id: "indexable", category: "seo", severity: "critical", title: "Página indexável", ref: ref("seo", "robots-meta"),
    why: "Um noindex esquecido tira a página inteira do Google.", fix: "Remova noindex das páginas que devem aparecer em buscas.",
    run: ({ root, h }) => { const m = (root.querySelector("meta[name=robots]")?.getAttribute("content") ?? "") + " " + (h("x-robots-tag") ?? ""); return { passed: !/noindex/i.test(m), detail: /noindex/i.test(m) ? "A página pede para não ser indexada." : "Indexável." }; } },
  { id: "open-graph", category: "seo", severity: "low", title: "Tags Open Graph", ref: ref("seo", "open-graph"),
    why: "Definem título, descrição e imagem quando o link é compartilhado no WhatsApp, LinkedIn e outros.", fix: "Adicione og:title, og:description e og:image.",
    run: ({ root }) => { const has = ["og:title", "og:description", "og:image"].filter((p) => root.querySelector(`meta[property='${p}']`)); return { passed: has.length === 3, detail: `${has.length} de 3 tags principais.` }; } },
  { id: "structured-data", category: "seo", severity: "low", title: "Dados estruturados", ref: ref("seo", "structured-data"),
    why: "JSON-LD ajuda o buscador a entender o que é a página (empresa, produto, artigo) e habilita resultados enriquecidos.", fix: "Inclua um bloco JSON-LD com o tipo schema.org adequado.",
    run: ({ root }) => { const n = root.querySelectorAll("script[type='application/ld+json']").length; return { passed: n > 0, detail: n ? `${n} bloco(s) JSON-LD.` : "Nenhum JSON-LD." }; } },
  { id: "robots-txt", category: "seo", severity: "low", title: "robots.txt publicado", ref: ref("seo", "robots-txt"),
    why: "Orienta os robôs de busca e costuma indicar onde está o sitemap.", fix: "Publique /robots.txt com a linha Sitemap.",
    run: ({ page }) => ({ passed: !!page.robotsTxt, detail: page.robotsTxt ? "Encontrado." : "Não encontrado (ou não respondeu)." }) },

  // ── Segurança ───────────────────────────────────────────────────
  { id: "https", category: "seguranca", severity: "critical", title: "Servido por HTTPS", ref: ref("security", "https"),
    why: "Sem HTTPS, qualquer rede no caminho pode ler ou alterar a página e os dados enviados.", fix: "Ative TLS e redirecione todo HTTP para HTTPS.",
    run: ({ isHttps }) => ({ passed: isHttps, detail: isHttps ? "HTTPS ativo." : "A página final está em HTTP." }) },
  { id: "hsts", category: "seguranca", severity: "high", title: "HSTS", ref: ref("security", "hsts"),
    why: "Faz o navegador nunca mais tentar HTTP nesse domínio, evitando ataques de downgrade.", fix: "Envie Strict-Transport-Security com max-age de pelo menos 6 meses.", snippet: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`,
    run: ({ h }) => { const v = h("strict-transport-security"); const age = Number(v?.match(/max-age=(\d+)/)?.[1] ?? 0); return { passed: age >= 15_552_000, detail: v ? v : "Cabeçalho ausente." }; } },
  { id: "csp", category: "seguranca", severity: "high", title: "Content-Security-Policy", ref: ref("security", "content-security-policy"),
    why: "Limita de onde scripts e recursos podem vir. É a principal defesa extra contra XSS.", fix: "Defina uma CSP começando por default-src 'self' e libere só o necessário.", snippet: `Content-Security-Policy: default-src 'self'; img-src 'self' data:; frame-ancestors 'none'`,
    run: ({ h, root }) => { const v = h("content-security-policy") ?? root.querySelector("meta[http-equiv='Content-Security-Policy']")?.getAttribute("content"); return { passed: !!v, detail: v ? v.slice(0, 140) : "Nenhuma CSP." }; } },
  { id: "nosniff", category: "seguranca", severity: "medium", title: "X-Content-Type-Options", ref: ref("security", "x-content-type-options"),
    why: "Impede o navegador de “adivinhar” o tipo de um arquivo e executar como script o que era para ser texto.", fix: "Envie X-Content-Type-Options: nosniff.",
    run: ({ h }) => ({ passed: h("x-content-type-options")?.toLowerCase() === "nosniff", detail: h("x-content-type-options") ?? "Ausente." }) },
  { id: "framing", category: "seguranca", severity: "medium", title: "Proteção contra clickjacking", ref: ref("security", "x-frame-options"),
    why: "Sem isso, outro site pode carregar o seu num iframe invisível e induzir cliques.", fix: "Use frame-ancestors na CSP ou X-Frame-Options: DENY.",
    run: ({ h }) => { const ok = !!h("x-frame-options") || /frame-ancestors/.test(h("content-security-policy") ?? ""); return { passed: ok, detail: ok ? "Protegido." : "Nem X-Frame-Options nem frame-ancestors." }; } },
  { id: "referrer", category: "seguranca", severity: "low", title: "Referrer-Policy", ref: ref("security", "referrer-policy"),
    why: "Controla quanto da URL é enviado para outros sites ao clicar num link.", fix: "Envie Referrer-Policy: strict-origin-when-cross-origin.",
    run: ({ h, root }) => { const v = h("referrer-policy") ?? root.querySelector("meta[name=referrer]")?.getAttribute("content"); return { passed: !!v, detail: v ?? "Ausente." }; } },
  { id: "mixed-content", category: "seguranca", severity: "high", title: "Sem conteúdo misto", ref: ref("security", "mixed-content"),
    why: "Recursos http:// numa página https são bloqueados ou deixam brechas para alteração no caminho.", fix: "Troque todos os recursos para https://.",
    run: ({ root, isHttps }) => { if (!isHttps) return { passed: true, detail: "Não se aplica (página em HTTP)." }; const bad = root.querySelectorAll("script[src^='http:'], link[href^='http:'][rel=stylesheet], img[src^='http:'], iframe[src^='http:']");
      return { passed: !bad.length, detail: bad.length ? `${bad.length} recurso(s) via http://.` : "Tudo em https.", examples: bad.slice(0, 3).map(snip) }; } },
  { id: "server-disclosure", category: "seguranca", severity: "low", title: "Versão do servidor oculta", ref: ref("security", "server-header"),
    why: "Anunciar versão exata do servidor ou framework facilita procurar falhas conhecidas.", fix: "Remova X-Powered-By e números de versão do cabeçalho Server.",
    run: ({ h }) => { const v = [h("x-powered-by"), h("server")].filter((x) => x && /\d/.test(x)); return { passed: !v.length, detail: v.length ? `Exposto: ${v.join(" · ")}` : "Nenhuma versão exposta." }; } },
  { id: "cookies", category: "seguranca", severity: "medium", title: "Cookies com Secure e HttpOnly", ref: ref("security", "cookie-security"),
    why: "Sem Secure o cookie pode vazar em HTTP; sem HttpOnly ele fica acessível a scripts injetados.", fix: "Marque cookies de sessão com Secure; HttpOnly; SameSite=Lax.",
    run: ({ h }) => { const c = h("set-cookie"); if (!c) return { passed: true, detail: "Nenhum cookie definido na resposta." }; const parts = c.split(/,(?=\s*[^;=\s]+=)/); const bad = parts.filter((p) => !/;\s*secure/i.test(p) || !/;\s*httponly/i.test(p));
      return { passed: !bad.length, detail: bad.length ? `${bad.length} de ${parts.length} cookie(s) sem Secure/HttpOnly.` : "Cookies protegidos." }; } },
];

export const RULE_COUNT = RULES.length;

export function audit(page: PageInput, lang: "pt" | "en" | "es" = "pt"): Report {
  const root = parse(page.html, { lowerCaseTagName: false, comment: false });
  const headers = Object.fromEntries(Object.entries(page.headers).map(([k, v]) => [k.toLowerCase(), v]));
  const ctx: Ctx = { root, page, h: (k) => headers[k], isHttps: page.url.startsWith("https://") };
  const findings: Finding[] = RULES.map((r) => {
    let res: { passed: boolean; detail: string; examples?: string[] };
    try { res = r.run(ctx); } catch { res = { passed: true, detail: "Não foi possível verificar." }; }
    return localizeFinding({ id: r.id, category: r.category, severity: r.severity, title: r.title, why: r.why, fix: r.fix, snippet: r.snippet, ref: r.ref, ...res }, lang);
  });
  const scores = Object.fromEntries(CATEGORIES.map((c) => {
    const fs = findings.filter((f) => f.category === c);
    const total = fs.reduce((a, f) => a + W[f.severity], 0);
    const got = fs.filter((f) => f.passed).reduce((a, f) => a + W[f.severity], 0);
    return [c, total ? Math.round((got / total) * 100) : 100];
  })) as Record<Category, number>;
  const overall = Math.round(CATEGORIES.reduce((a, c) => a + scores[c], 0) / CATEGORIES.length);
  return { url: page.url, fetchedAt: new Date().toISOString(), ms: page.ms, bytes: page.bytes, findings, scores, overall };
}

