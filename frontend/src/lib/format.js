export const SEVERITY = {
  SAFE: { color: "#39D98A", label: "SAFE" },
  LOW: { color: "#4DABF7", label: "LOW" },
  MEDIUM: { color: "#F5C542", label: "MEDIUM" },
  HIGH: { color: "#FF9F43", label: "HIGH" },
  CRITICAL: { color: "#FF4D67", label: "CRITICAL" },
  UNKNOWN: { color: "#A78BFA", label: "UNKNOWN" },
  INSUFFICIENT_DATA: { color: "#A78BFA", label: "INSUFFICIENT DATA" },
  ERROR: { color: "#B16258", label: "ERROR" },
};

export function severityColor(level) {
  const normalized = String(level || "").toUpperCase();
  if (normalized === "INSUFFICIENT_DATA" || normalized === "UNKNOWN") return SEVERITY.UNKNOWN.color;
  return (SEVERITY[normalized] || SEVERITY.LOW).color;
}

export const IOC_TYPES = [
  { id: "ip", label: "IP", placeholder: "e.g. 45.133.1.101", hint: "IPv4 / IPv6 address" },
  { id: "url", label: "URL", placeholder: "e.g. http://secure-login-update.xyz/verify", hint: "Full URL incl. scheme" },
  { id: "domain", label: "DOMAIN", placeholder: "e.g. free-crypto-bonus.top", hint: "Fully-qualified domain" },
  { id: "md5", label: "MD5", placeholder: "32 hex characters", hint: "MD5 file hash" },
  { id: "sha1", label: "SHA1", placeholder: "40 hex characters", hint: "SHA1 file hash" },
  { id: "sha256", label: "SHA256", placeholder: "64 hex characters", hint: "SHA256 file hash" },
];

export function timeAgo(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
