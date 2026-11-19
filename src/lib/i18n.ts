export const LANGS = ["pt", "en", "es"] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as readonly string[]).includes(v);
export const langPath = (l: Lang) => (l === "pt" ? "/" : `/${l}`);
export const htmlLang: Record<Lang, string> = { pt: "pt-BR", en: "en", es: "es" };
export const langLabel: Record<Lang, string> = { pt: "Português", en: "English", es: "Español" };

const pt = {
  meta: { title: "a11y-lens — exame de vista para sites", description: "Cole uma URL e receba notas de acessibilidade, performance, SEO e segurança, com a explicação e a correção de cada problema. Relatório exportável." },
  skip: "Pular para o conteúdo",
  nav: { label: "Principal", code: "Código", language: "Idioma" },
  footer: "a11y-lens · vhcodestudio · análise estática do HTML e dos cabeçalhos, baseada nas regras do Front-End Checklist. Não substitui teste com pessoas e tecnologia assistiva.",
  cat: { acessibilidade: "Acessibilidade", performance: "Performance", seo: "SEO", seguranca: "Segurança" },
  sev: { critical: "crítico", high: "alto", medium: "médio", low: "baixo" },
  hero: {
    eyebrow: "Exame de vista para sites", h1: ["Quem consegue", "ler o seu site?"],
    lead: "Cole um endereço. Em alguns segundos você recebe notas de acessibilidade, performance, SEO e segurança, e para cada problema, por que ele importa e como corrigir.",
    urlLabel: "Endereço do site", placeholder: "exemplo.com.br", go: "Examinar", going: "Examinando…", tryWith: "Teste com:",
    empty: "Digite o endereço de um site.", failed: "A auditoria falhou.", loading: "Abrindo a página, lendo o HTML e os cabeçalhos…",
  },
  report: {
    eyebrow: (ms: number, kb: number) => `Relatório · ${ms} ms · ${kb} KB`, overall: "Nota geral",
    grade: (g: string, n: number): readonly [string, string, string] => [`Conceito `, g, ` · ${n} ${n === 1 ? "problema" : "problemas"}`],
    filter: "Filtrar por categoria", all: "Todas", showPassed: "Mostrar aprovados", passed: "(aprovado)", failed: "(problema)",
    why: "Por que importa", where: "Onde aparece", fix: "Como corrigir", rule: "Regra no Front-End Checklist ↗", none: "Nenhum problema nesta categoria. 👓",
  },
  explainer: {
    title: "O que o exame mede · 35 verificações",
    blurb: {
      acessibilidade: "Rótulos, textos alternativos, títulos, zoom e navegação por teclado.",
      performance: "Tempo de resposta, peso do HTML, compressão, scripts que travam a página.",
      seo: "Title, descrição, canonical, Open Graph, dados estruturados, robots.txt.",
      seguranca: "HTTPS, HSTS, CSP, clickjacking, cookies e conteúdo misto.",
    },
  },
  md: { title: "Relatório a11y-lens", made: "Gerado em", overall: "nota geral", category: "Categoria", score: "Nota", problems: "Problemas", why: "Por que importa", fix: "Como corrigir", rule: "Regra", passed: "Aprovados" },
};
export type Dict = typeof pt;

const en: Dict = {
  meta: { title: "a11y-lens — an eye exam for websites", description: "Paste a URL and get accessibility, performance, SEO and security scores, with the explanation and the fix for every problem. Exportable report." },
  skip: "Skip to content",
  nav: { label: "Main", code: "Code", language: "Language" },
  footer: "a11y-lens · vhcodestudio · static analysis of the HTML and headers, based on the Front-End Checklist rules. It does not replace testing with people and assistive technology.",
  cat: { acessibilidade: "Accessibility", performance: "Performance", seo: "SEO", seguranca: "Security" },
  sev: { critical: "critical", high: "high", medium: "medium", low: "low" },
  hero: {
    eyebrow: "An eye exam for websites", h1: ["Who can", "read your site?"],
    lead: "Paste an address. In a few seconds you get accessibility, performance, SEO and security scores, and for every problem, why it matters and how to fix it.",
    urlLabel: "Site address", placeholder: "example.com", go: "Examine", going: "Examining…", tryWith: "Try with:",
    empty: "Type a site address.", failed: "The audit failed.", loading: "Opening the page, reading the HTML and headers…",
  },
  report: {
    eyebrow: (ms, kb) => `Report · ${ms} ms · ${kb} KB`, overall: "Overall score",
    grade: (g, n) => [`Grade `, g, ` · ${n} ${n === 1 ? "problem" : "problems"}`],
    filter: "Filter by category", all: "All", showPassed: "Show passed", passed: "(passed)", failed: "(problem)",
    why: "Why it matters", where: "Where it shows up", fix: "How to fix", rule: "Rule on Front-End Checklist ↗", none: "No problems in this category. 👓",
  },
  explainer: {
    title: "What the exam measures · 35 checks",
    blurb: {
      acessibilidade: "Labels, alt text, headings, zoom and keyboard navigation.",
      performance: "Response time, HTML weight, compression, scripts that block the page.",
      seo: "Title, description, canonical, Open Graph, structured data, robots.txt.",
      seguranca: "HTTPS, HSTS, CSP, clickjacking, cookies and mixed content.",
    },
  },
  md: { title: "a11y-lens report", made: "Generated on", overall: "overall score", category: "Category", score: "Score", problems: "Problems", why: "Why it matters", fix: "How to fix", rule: "Rule", passed: "Passed" },
};

const es: Dict = {
  meta: { title: "a11y-lens — examen de la vista para sitios", description: "Pega una URL y recibe notas de accesibilidad, rendimiento, SEO y seguridad, con la explicación y la corrección de cada problema. Informe exportable." },
  skip: "Saltar al contenido",
  nav: { label: "Principal", code: "Código", language: "Idioma" },
  footer: "a11y-lens · vhcodestudio · análisis estático del HTML y los encabezados, basado en las reglas del Front-End Checklist. No reemplaza las pruebas con personas y tecnología de asistencia.",
  cat: { acessibilidade: "Accesibilidad", performance: "Rendimiento", seo: "SEO", seguranca: "Seguridad" },
  sev: { critical: "crítico", high: "alto", medium: "medio", low: "bajo" },
  hero: {
    eyebrow: "Examen de la vista para sitios", h1: ["¿Quién puede", "leer tu sitio?"],
    lead: "Pega una dirección. En unos segundos recibes notas de accesibilidad, rendimiento, SEO y seguridad, y para cada problema, por qué importa y cómo corregirlo.",
    urlLabel: "Dirección del sitio", placeholder: "ejemplo.com", go: "Examinar", going: "Examinando…", tryWith: "Prueba con:",
    empty: "Escribe la dirección de un sitio.", failed: "La auditoría falló.", loading: "Abriendo la página, leyendo el HTML y los encabezados…",
  },
  report: {
    eyebrow: (ms, kb) => `Informe · ${ms} ms · ${kb} KB`, overall: "Nota general",
    grade: (g, n) => [`Calificación `, g, ` · ${n} ${n === 1 ? "problema" : "problemas"}`],
    filter: "Filtrar por categoría", all: "Todas", showPassed: "Mostrar aprobados", passed: "(aprobado)", failed: "(problema)",
    why: "Por qué importa", where: "Dónde aparece", fix: "Cómo corregir", rule: "Regla en el Front-End Checklist ↗", none: "Ningún problema en esta categoría. 👓",
  },
  explainer: {
    title: "Qué mide el examen · 35 verificaciones",
    blurb: {
      acessibilidade: "Etiquetas, textos alternativos, títulos, zoom y navegación con teclado.",
      performance: "Tiempo de respuesta, peso del HTML, compresión, scripts que traban la página.",
      seo: "Title, descripción, canonical, Open Graph, datos estructurados, robots.txt.",
      seguranca: "HTTPS, HSTS, CSP, clickjacking, cookies y contenido mixto.",
    },
  },
  md: { title: "Informe a11y-lens", made: "Generado el", overall: "nota general", category: "Categoría", score: "Nota", problems: "Problemas", why: "Por qué importa", fix: "Cómo corregir", rule: "Regla", passed: "Aprobados" },
};

export const dicts: Record<Lang, Dict> = { pt, en, es };

/** API error messages by code. */
export const API_ERRORS: Record<Lang, Record<string, string>> = {
  pt: {},
  en: {
    rate_limit_exceeded: "Too many audits in a row. Wait a minute.", payload_too_large: "Request too large.", invalid_json: "Send JSON like {\"url\": \"https://example.com\"}.",
    validation_error: "Enter the page URL.", internal_error: "Something went wrong during the audit.",
    invalid_url: "Use a public address starting with http:// or https://.", blocked: "That address points to a private network and cannot be audited.",
    timeout: "The page took more than 8 seconds to respond.", too_large: "The page has more than 2 MB of HTML.", not_html: "That address does not return an HTML page.", unreachable: "Could not open that page.",
  },
  es: {
    rate_limit_exceeded: "Demasiadas auditorías seguidas. Espera un minuto.", payload_too_large: "Pedido demasiado grande.", invalid_json: "Envía un JSON como {\"url\": \"https://ejemplo.com\"}.",
    validation_error: "Indica la URL de la página.", internal_error: "Algo salió mal durante la auditoría.",
    invalid_url: "Usa una dirección pública que empiece con http:// o https://.", blocked: "Esa dirección apunta a una red privada y no se puede auditar.",
    timeout: "La página tardó más de 8 segundos en responder.", too_large: "La página tiene más de 2 MB de HTML.", not_html: "Esa dirección no devuelve una página HTML.", unreachable: "No pude abrir esa página.",
  },
};
