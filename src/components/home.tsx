import { Lens } from "@/components/lens";
import type { Lang } from "@/lib/i18n";

export function Home({ lang }: { lang: Lang }) {
  return <Lens lang={lang} />;
}
