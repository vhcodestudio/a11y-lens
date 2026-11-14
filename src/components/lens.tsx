"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CATEGORIES, grade, toMarkdown, type Category, type Report, type Severity } from "@/lib/report";

const LABEL: Record<Category, string> = { acessibilidade: "Acessibilidade", performance: "Performance", seo: "SEO", seguranca: "Segurança" };
const LETTERS: Record<Category, string> = { acessibilidade: "E F P T O Z", performance: "L P E D", seo: "F E L O", seguranca: "D E F P O T" };
const SEV: Record<Severity, { label: string; cls: string }> = {
  critical: { label: "crítico", cls: "bg-fail text-white" }, high: { label: "alto", cls: "border border-fail text-fail" },
  medium: { label: "médio", cls: "border border-warn text-warn" }, low: { label: "baixo", cls: "border border-rule text-muted" },
};
const ORDER: Severity[] = ["critical", "high", "medium", "low"];
const tone = (n: number) => (n >= 90 ? "text-pass" : n >= 65 ? "text-warn" : "text-fail");

/** A Snellen line: the lower the score, the blurrier and smaller it reads. */
function ChartLine({ cat, score, i }: { cat: Category; score: number; i: number }) {
  const blur = Math.max(0, (90 - score) / 18);
  return (
    <div className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 border-b border-rule py-3 sm:grid-cols-[9rem_1fr_4rem]">
      <span className="text-sm text-muted">{LABEL[cat]}</span>
      <motion.span initial={{ filter: "blur(10px)", opacity: 0 }} animate={{ filter: `blur(${blur}px)`, opacity: 1 }} transition={{ duration: 0.9, delay: 0.25 + i * 0.12 }}
        className="chart-letter truncate text-center" style={{ fontSize: `${1.1 + (score / 100) * 1.4}rem` }} aria-hidden="true">{LETTERS[cat]}</motion.span>
      <span className={`text-right font-mono text-xl font-medium tabular-nums ${tone(score)}`}>{score}</span>
    </div>
  );
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}

export function Lens() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cat, setCat] = useState<Category | "todas">("todas");
  const [showPassed, setShowPassed] = useState(false);
  const reduce = useReducedMotion();

  async function run(e?: React.FormEvent, target = url) {
    e?.preventDefault();
    if (!target.trim()) return setError("Digite o endereço de um site.");
    setLoading(true); setError(""); setReport(null);
    try {
      const r = await fetch("/api/v1/audits", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: target }) });
      const body = (await r.json()) as { data?: Report; error?: { message: string } };
      if (!r.ok || !body.data) throw new Error(body.error?.message ?? "A auditoria falhou.");
      setReport(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "A auditoria falhou.");
    } finally {
      setLoading(false);
    }
  }

  const visible = useMemo(() => {
    if (!report) return [];
    return report.findings
      .filter((f) => (cat === "todas" || f.category === cat) && (showPassed || !f.passed))
      .sort((a, b) => Number(a.passed) - Number(b.passed) || ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));
  }, [report, cat, showPassed]);
  const failCount = report?.findings.filter((f) => !f.passed).length ?? 0;
  const host = report ? new URL(report.url).hostname : "";

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Exame de vista para sites</p>
            <h1 className="mt-4 text-[clamp(2.6rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tight">Quem consegue<br />ler o seu site?</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Cole um endereço. Em alguns segundos você recebe notas de acessibilidade, performance, SEO e segurança, e para cada
              problema, por que ele importa e como corrigir.
            </p>
          </div>
          <div className="hidden select-none text-center lg:block" aria-hidden="true">
            {["E", "F P", "T O Z", "L P E D", "P E C F D", "E D F C Z P"].map((row, i) => (
              <p key={row} className="chart-letter leading-tight" style={{ fontSize: `${3.2 - i * 0.48}rem`, filter: `blur(${Math.max(0, i - 3) * 0.6}px)` }}>{row}</p>
            ))}
          </div>
        </div>

        <form onSubmit={run} method="post" className="mt-10 flex flex-col gap-3 sm:flex-row" noValidate>
          <label htmlFor="url" className="sr-only">Endereço do site</label>
          <input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="exemplo.com.br" inputMode="url" autoComplete="url" spellCheck={false}
            aria-invalid={!!error} aria-describedby={error ? "url-err" : undefined}
            className="min-w-0 flex-1 rounded-full border-2 border-ink bg-card px-6 py-4 font-mono text-base outline-none placeholder:text-muted/60 focus:ring-4 focus:ring-ink/15" />
          <button disabled={loading} className="rounded-full bg-ink px-8 py-4 font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-60">
            {loading ? "Examinando…" : "Examinar"}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          Teste com:
          {["gov.br", "wikipedia.org", "echo-vhcode.vercel.app"].map((s) => (
            <button key={s} type="button" onClick={() => { setUrl(s); run(undefined, s); }} className="rounded-full border border-rule px-3 py-1 font-mono text-xs hover:border-ink">{s}</button>
          ))}
        </div>
        <p id="url-err" role="alert" aria-live="assertive" className="mt-3 min-h-6 font-medium text-fail">{error}</p>
      </section>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto flex max-w-6xl items-center gap-4 px-4 pb-16 sm:px-6" role="status">
            <motion.span className="grid size-14 place-items-center rounded-full border-4 border-ink" animate={reduce ? undefined : { rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
              <span className="h-full w-1 bg-ink" />
            </motion.span>
            <p className="text-muted">Abrindo a página, lendo o HTML e os cabeçalhos…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!report && !loading && <Explainer />}

      {report && (
        <motion.section initial={{ filter: reduce ? "none" : "blur(14px)", opacity: 0 }} animate={{ filter: "blur(0px)", opacity: 1 }} transition={{ duration: 0.8 }}
          aria-labelledby="rel-h" className="border-t border-rule bg-card">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Relatório · {report.ms} ms · {Math.round(report.bytes / 1024)} KB</p>
                <h2 id="rel-h" className="mt-1 break-all text-3xl font-bold sm:text-4xl">{host}</h2>
              </div>
              <div className="no-print flex flex-wrap gap-2">
                <button onClick={() => download(`a11y-lens-${host}.md`, toMarkdown(report), "text/markdown")} className="rounded-full border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper">Markdown</button>
                <button onClick={() => download(`a11y-lens-${host}.json`, JSON.stringify(report, null, 2), "application/json")} className="rounded-full border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper">JSON</button>
                <button onClick={() => window.print()} className="rounded-full bg-ink px-4 py-2 text-sm text-paper">PDF</button>
              </div>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr]">
              <div className="text-center lg:text-left">
                <p className="text-sm text-muted">Nota geral</p>
                <p className={`font-mono text-8xl font-medium leading-none tabular-nums ${tone(report.overall)}`}><CountUp to={report.overall} /></p>
                <p className="mt-2 text-lg">Conceito <b>{grade(report.overall)}</b> · {failCount} {failCount === 1 ? "problema" : "problemas"}</p>
              </div>
              <div>{CATEGORIES.map((c, i) => <ChartLine key={c} cat={c} score={report.scores[c]} i={i} />)}</div>
            </div>

            <div className="no-print mt-14 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por categoria">
              {(["todas", ...CATEGORIES] as const).map((c) => (
                <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
                  className={`rounded-full px-4 py-2 text-sm ${cat === c ? "bg-ink text-paper" : "border border-rule hover:border-ink"}`}>
                  {c === "todas" ? "Todas" : LABEL[c]}
                </button>
              ))}
              <label className="ml-auto flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showPassed} onChange={(e) => setShowPassed(e.target.checked)} className="size-4 accent-[var(--color-ink)]" />
                Mostrar aprovados
              </label>
            </div>

            <ul className="mt-6 space-y-3">
              {visible.map((f) => (
                <li key={f.id}>
                  <details className="group rounded-2xl border border-rule bg-paper open:bg-card">
                    <summary className="flex cursor-pointer list-none items-start gap-3 p-4 sm:items-center">
                      <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold sm:mt-0 ${f.passed ? "bg-pass text-white" : "bg-fail text-white"}`} aria-hidden="true">{f.passed ? "✓" : "!"}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{f.title} <span className="sr-only">{f.passed ? "(aprovado)" : "(problema)"}</span></span>
                        <span className="block truncate text-sm text-muted">{f.detail}</span>
                      </span>
                      <span className="hidden shrink-0 font-mono text-[10px] uppercase text-muted sm:inline">{LABEL[f.category]}</span>
                      {!f.passed && <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${SEV[f.severity].cls}`}>{SEV[f.severity].label}</span>}
                    </summary>
                    <div className="grid gap-5 border-t border-rule p-4 sm:p-5 md:grid-cols-2">
                      <div>
                        <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted">Por que importa</h3>
                        <p className="mt-1 leading-relaxed">{f.why}</p>
                        {!!f.examples?.length && (
                          <>
                            <h3 className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted">Onde aparece</h3>
                            <ul className="mt-1 space-y-1">{f.examples.map((ex) => <li key={ex}><code className="block overflow-x-auto rounded bg-paper px-2 py-1 font-mono text-[11px]">{ex}</code></li>)}</ul>
                          </>
                        )}
                      </div>
                      <div>
                        <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted">Como corrigir</h3>
                        <p className="mt-1 leading-relaxed">{f.fix}</p>
                        {f.snippet && <pre className="mt-3 overflow-x-auto rounded-xl bg-ink p-3 font-mono text-[11px] leading-relaxed text-paper"><code>{f.snippet}</code></pre>}
                        <a href={f.ref} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm underline">Regra no Front-End Checklist ↗</a>
                      </div>
                    </div>
                  </details>
                </li>
              ))}
              {!visible.length && <li className="rounded-2xl border border-dashed border-rule p-10 text-center text-muted">Nenhum problema nesta categoria. 👓</li>}
            </ul>
          </div>
        </motion.section>
      )}
    </div>
  );
}

/** Counts from 0 to the score; jumps straight there for reduced motion. */
function CountUp({ to }: { to: number }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 1100);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, reduce]);
  return <>{n}</>;
}

const ICONS: Record<Category, string> = {
  acessibilidade: "M12 4a2 2 0 1 0 0 .01M5 9l7 1 7-1M12 10v5l-3 6M12 15l3 6",
  performance: "M3 13a9 9 0 0 1 18 0M12 13l5-5M7 13h.01M17 13h.01",
  seo: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 1 0 0-13M15.5 15.5 21 21",
  seguranca: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9 12l2 2 4-4",
};
const BLURB: Record<Category, string> = {
  acessibilidade: "Rótulos, textos alternativos, títulos, zoom e navegação por teclado.",
  performance: "Tempo de resposta, peso do HTML, compressão, scripts que travam a página.",
  seo: "Title, descrição, canonical, Open Graph, dados estruturados, robots.txt.",
  seguranca: "HTTPS, HSTS, CSP, clickjacking, cookies e conteúdo misto.",
};

/** Empty-state section: what the exam measures, with icons traced in as they scroll in. */
function Explainer() {
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="ex-h" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <h2 id="ex-h" className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">O que o exame mede · 35 verificações</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c, i) => (
          <motion.li key={c} initial={{ opacity: 0, y: reduce ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }} whileHover={reduce ? undefined : { y: -6 }}
            className="group rounded-3xl border border-rule bg-card p-6 transition-shadow hover:shadow-[0_18px_40px_-20px_rgba(13,43,42,.35)]">
            <svg viewBox="0 0 24 24" className="size-10" aria-hidden="true">
              <motion.path d={ICONS[c]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: reduce ? 1 : 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.2 + i * 0.1 }} />
            </svg>
            <h3 className="mt-6 text-xl font-bold">{LABEL[c]}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{BLURB[c]}</p>
            <p className="chart-letter mt-6 text-sm text-muted/60 transition-[filter] duration-500 group-hover:blur-0" style={{ filter: `blur(${1.5 - i * 0.3}px)` }} aria-hidden="true">{LETTERS[c]}</p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
