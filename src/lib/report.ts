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

type MdText = { title: string; made: string; overall: string; category: string; score: string; problems: string; why: string; fix: string; rule: string; passed: string };
const MD_PT: MdText = { title: "Relatório a11y-lens", made: "Gerado em", overall: "nota geral", category: "Categoria", score: "Nota", problems: "Problemas", why: "Por que importa", fix: "Como corrigir", rule: "Regra", passed: "Aprovados" };

export function toMarkdown(r: Report, h: MdText = MD_PT, cat: Record<Category, string> = { acessibilidade: "acessibilidade", performance: "performance", seo: "seo", seguranca: "seguranca" }) {
  const fails = r.findings.filter((f) => !f.passed);
  return [
    `# ${h.title} · ${r.url}`, "", `${h.made} ${r.fetchedAt.slice(0, 16).replace("T", " ")} UTC · ${h.overall} **${r.overall} (${grade(r.overall)})**`, "",
    `| ${h.category} | ${h.score} |`, "|---|---|", ...CATEGORIES.map((c) => `| ${cat[c]} | ${r.scores[c]} |`), "",
    `## ${h.problems} (${fails.length})`, "",
    ...fails.flatMap((f) => [`### [${f.severity}] ${f.title} · ${cat[f.category]}`, "", f.detail, "", `**${h.why}:** ${f.why}`, "", `**${h.fix}:** ${f.fix}`, ...(f.snippet ? ["", "```html", f.snippet, "```"] : []), "", `${h.rule}: ${f.ref}`, ""]),
    `## ${h.passed} (${r.findings.length - fails.length})`, "", ...r.findings.filter((f) => f.passed).map((f) => `- ${f.title}`),
  ].join("\n");
}
