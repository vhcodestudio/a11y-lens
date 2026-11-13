// Client-safe report types and helpers (no HTML parser here).
export type Category = "acessibilidade" | "performance" | "seo" | "seguranca";
export type Severity = "critical" | "high" | "medium" | "low";
export type Finding = {
  id: string; category: Category; severity: Severity; title: string; passed: boolean;
  detail: string; why: string; fix: string; snippet?: string; examples?: string[]; ref: string;
};
export type PageInput = { url: string; html: string; headers: Record<string, string>; status: number; ms: number; bytes: number; robotsTxt?: boolean };
export type Report = { url: string; fetchedAt: string; ms: number; bytes: number; findings: Finding[]; scores: Record<Category, number>; overall: number };

export const CATEGORIES: Category[] = ["acessibilidade", "performance", "seo", "seguranca"];

export const grade = (n: number) => (n >= 90 ? "A" : n >= 80 ? "B" : n >= 65 ? "C" : n >= 50 ? "D" : "F");

export function toMarkdown(r: Report) {
  const fails = r.findings.filter((f) => !f.passed);
  return [
    `# Relatório a11y-lens · ${r.url}`, "", `Gerado em ${r.fetchedAt.slice(0, 16).replace("T", " ")} UTC · nota geral **${r.overall} (${grade(r.overall)})**`, "",
    "| Categoria | Nota |", "|---|---|", ...CATEGORIES.map((c) => `| ${c} | ${r.scores[c]} |`), "",
    `## Problemas (${fails.length})`, "",
    ...fails.flatMap((f) => [`### [${f.severity}] ${f.title} · ${f.category}`, "", f.detail, "", `**Por que importa:** ${f.why}`, "", `**Como corrigir:** ${f.fix}`, ...(f.snippet ? ["", "```html", f.snippet, "```"] : []), "", `Regra: ${f.ref}`, ""]),
    `## Aprovados (${r.findings.length - fails.length})`, "", ...r.findings.filter((f) => f.passed).map((f) => `- ${f.title}`),
  ].join("\n");
}
