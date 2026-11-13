import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk, Martian_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = Familjen_Grotesk({ variable: "--font-familjen", subsets: ["latin"] });
const mono = Martian_Mono({ variable: "--font-martian", subsets: ["latin"] });

const description = "Cole uma URL e receba notas de acessibilidade, performance, SEO e segurança, com a explicação e a correção de cada problema. Relatório exportável.";

export const metadata: Metadata = {
  title: "a11y-lens — exame de vista para sites",
  description,
  metadataBase: new URL("https://a11y-lens-vhcode.vercel.app"),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  referrer: "strict-origin-when-cross-origin",
  openGraph: { title: "a11y-lens", description, type: "website" },
  twitter: { card: "summary", title: "a11y-lens", description },
};

export const viewport: Viewport = { themeColor: "#f7f6f2" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} antialiased`}>
      <body>
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">Pular para o conteúdo</a>
        <header className="border-b border-rule">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <span className="grid size-7 place-items-center rounded-full border-2 border-ink" aria-hidden="true"><span className="size-2.5 rounded-full bg-ink" /></span>
              a11y-lens
            </Link>
            <nav aria-label="Principal" className="font-mono text-[11px] uppercase tracking-wider">
              <a href="https://github.com/vhcodestudio/a11y-lens" className="hover:underline">Código</a>
            </nav>
          </div>
        </header>
        <main id="conteudo">{children}</main>
        <footer className="border-t border-rule">
          <p className="mx-auto max-w-6xl px-4 py-6 font-mono text-[11px] text-muted sm:px-6">
            a11y-lens · vhcodestudio · análise estática do HTML e dos cabeçalhos, baseada nas regras do Front-End Checklist. Não substitui teste com pessoas e tecnologia assistiva.
          </p>
        </footer>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "WebApplication", name: "a11y-lens", url: "https://a11y-lens-vhcode.vercel.app",
          applicationCategory: "DeveloperApplication", description, author: { "@type": "Organization", name: "vhcodestudio" },
        }) }} />
      </body>
    </html>
  );
}
