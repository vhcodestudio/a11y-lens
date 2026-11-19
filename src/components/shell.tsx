import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Familjen_Grotesk, Martian_Mono } from "next/font/google";
import Link from "next/link";
import { dicts, htmlLang, langLabel, langPath, LANGS, type Lang } from "@/lib/i18n";

const sans = Familjen_Grotesk({ variable: "--font-familjen", subsets: ["latin"] });
const mono = Martian_Mono({ variable: "--font-martian", subsets: ["latin"] });

export function metadataFor(lang: Lang): Metadata {
  const { title, description } = dicts[lang].meta;
  return {
    title, description,
    metadataBase: new URL("https://a11y-lens-vhcode.vercel.app"),
    alternates: { canonical: langPath(lang), languages: { ...Object.fromEntries(LANGS.map((l) => [htmlLang[l], langPath(l)])), "x-default": "/" } },
    robots: { index: true, follow: true },
    referrer: "strict-origin-when-cross-origin",
    openGraph: { title: "a11y-lens", description, type: "website" },
    twitter: { card: "summary", title: "a11y-lens", description },
  };
}

export function Shell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const d = dicts[lang];
  const description = d.meta.description;
  return (
    <html lang={htmlLang[lang]} className={`${sans.variable} ${mono.variable} antialiased`}>
      <body>
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">{d.skip}</a>
        <header className="border-b border-rule">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href={langPath(lang)} className="flex items-center gap-2 font-bold tracking-tight">
              <span className="grid size-7 place-items-center rounded-full border-2 border-ink" aria-hidden="true"><span className="size-2.5 rounded-full bg-ink" /></span>
              a11y-lens
            </Link>
            <nav aria-label={d.nav.label} className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider">
              <a href="https://github.com/vhcodestudio/a11y-lens" className="hover:underline">{d.nav.code}</a>
              <ul aria-label={d.nav.language} className="flex items-center">
                {LANGS.map((l) => (
                  <li key={l}>
                    <a href={langPath(l)} hrefLang={htmlLang[l]} lang={htmlLang[l]} title={langLabel[l]} aria-current={l === lang ? "page" : undefined}
                      className={`inline-grid min-h-8 min-w-8 place-items-center rounded-full px-1 ${l === lang ? "bg-ink text-paper" : "hover:underline"}`}>
                      <span aria-hidden="true">{l}</span><span className="sr-only">{langLabel[l]}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <main id="conteudo">{children}</main>
        <footer className="border-t border-rule">
          <p className="mx-auto max-w-6xl px-4 py-6 font-mono text-[11px] text-muted sm:px-6">{d.footer}</p>
        </footer>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "WebApplication", name: "a11y-lens", url: "https://a11y-lens-vhcode.vercel.app",
          applicationCategory: "DeveloperApplication", description, author: { "@type": "Organization", name: "vhcodestudio" },
        }) }} />
      </body>
    </html>
  );
}
