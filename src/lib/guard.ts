import { isIP } from "node:net";

/** True for loopback, private, link-local, CGNAT, multicast and other non-public ranges (IPv4 and IPv6). */
export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
  }
  if (v === 6) {
    const s = ip.toLowerCase();
    const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return s === "::" || s === "::1" || /^f[cd]/.test(s) || /^fe[89ab]/.test(s) || s.startsWith("ff");
  }
  return true;
}

/** Normalizes user input into a public http(s) URL or returns null. */
export function normalizeUrl(input: string): URL | null {
  let s = input.trim();
  if (!s || s.length > 2048) return null;
  if (!/^[a-z]+:\/\//i.test(s)) s = `https://${s}`;
  let u: URL;
  try { u = new URL(s); } catch { return null; }
  if (!["http:", "https:"].includes(u.protocol)) return null;
  if (u.username || u.password) return null;
  if (u.port && !["80", "443"].includes(u.port)) return null;
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) ? isPrivateIp(host) : !host.includes(".") || /\.(local|internal|localhost)$/i.test(host) || host === "localhost") return null;
  u.hash = "";
  return u;
}
