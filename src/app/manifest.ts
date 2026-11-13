import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "a11y-lens", short_name: "a11y-lens", start_url: "/", display: "standalone", background_color: "#f7f6f2", theme_color: "#f7f6f2", icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }] };
}
