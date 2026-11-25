import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Inbox, Loader2 } from "lucide-react";
import { severityColor } from "@/lib/format";

export function Eyebrow({ children, className = "" }) {
  return <div className={`tl-eyebrow ${className}`}>{children}</div>;
}

export function GlassCard({ children, className = "", hover = true, ...props }) {
  return (
    <div
      className={`tl-glass rounded-2xl ${hover ? "tl-card-hover" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SeverityBadge({ level, size = "md", className = "" }) {
  const c = severityColor(level);
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";
  return (
    <span
      data-testid={`severity-badge-${(level || "").toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 rounded-full font-display font-semibold tracking-wider ${pad} ${className}`}
      style={{ color: c, backgroundColor: `${c}1a`, border: `1px solid ${c}55` }}
    >
      <span className="h-1.5 w-1.5 rounded-full tl-pulse" style={{ backgroundColor: c }} />
      {level}
    </span>
  );
}

export function StatCounter({ value = 0, duration = 1200 }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = 0;
    const animate = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span ref={ref}>{n}</span>;
}

export function Loader({ label = "Loading…", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-tl-gray/70 ${className}`} data-testid="tl-loader">
      <Loader2 className="h-7 w-7 animate-spin text-tl-blue2" />
      <span className="font-mono text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ title, message, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-tl-gray/15 bg-tl-navy/20 py-16 px-6 text-center" data-testid="tl-empty-state">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-tl-navy/50 text-tl-blue2">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      {message && <p className="max-w-md text-sm text-tl-gray/60">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = "INTELLIGENCE TEMPORARILY UNAVAILABLE", message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-tl-crit/25 bg-tl-crit/5 py-16 px-6 text-center" data-testid="tl-error-state">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-tl-crit/10 text-tl-crit">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      {message && <p className="max-w-md text-sm text-tl-gray/60">{message}</p>}
      {onRetry && (
        <button data-testid="error-retry-btn" onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full border border-tl-gray/20 px-4 py-2 text-sm text-white transition-colors hover:border-tl-blue hover:bg-tl-blue/10">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      )}
    </div>
  );
}

export function RiskGauge({ score = 0, level = "LOW", size = 200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf; const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / 1400);
      setVal(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  const r = size / 2 - 14;
  const circ = Math.PI * r; // half circle
  const c = severityColor(level);
  const offset = circ - (val / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size / 1.7 }} data-testid="risk-gauge">
      <svg width={size} height={size / 1.7} viewBox={`0 0 ${size} ${size / 1.7}`}>
        <path d={`M14 ${size / 1.7 - 6} A ${r} ${r} 0 0 1 ${size - 14} ${size / 1.7 - 6}`}
          fill="none" stroke="rgba(185,195,214,0.12)" strokeWidth="12" strokeLinecap="round" />
        <motion.path d={`M14 ${size / 1.7 - 6} A ${r} ${r} 0 0 1 ${size - 14} ${size / 1.7 - 6}`}
          fill="none" stroke={c} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.1s linear", filter: `drop-shadow(0 0 8px ${c}88)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <span className="font-display text-4xl font-bold" style={{ color: c }}>{val}</span>
        <span className="font-mono text-[10px] text-tl-gray/50">/ 100 RISK</span>
      </div>
    </div>
  );
}
