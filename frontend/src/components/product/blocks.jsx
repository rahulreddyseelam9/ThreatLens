import { motion } from "framer-motion";
import { CheckCircle2, XCircle, MinusCircle, AlertTriangle, ShieldQuestion, Lightbulb } from "lucide-react";
import { SeverityBadge } from "@/components/common/primitives";
import { severityColor } from "@/lib/format";

const STATUS_META = {
  AVAILABLE: { color: "#39D98A", icon: CheckCircle2, label: "AVAILABLE" },
  CLEAN: { color: "#4DABF7", icon: CheckCircle2, label: "CLEAN" },
  POSITIVE: { color: "#FF4D67", icon: XCircle, label: "POSITIVE" },
  UNAVAILABLE: { color: "#4E4B5C", icon: MinusCircle, label: "UNAVAILABLE" },
  ERROR: { color: "#B16258", icon: AlertTriangle, label: "ERROR" },
};

export function ProviderStatusCard({ provider, index = 0 }) {
  const meta = STATUS_META[provider.status] || STATUS_META.UNAVAILABLE;
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      data-testid={`provider-card-${provider.id}`}
      className="tl-glass tl-card-hover rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold text-white">{provider.name}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider"
          style={{ color: meta.color, backgroundColor: `${meta.color}18`, border: `1px solid ${meta.color}44` }}>
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
      </div>
      <div className="mt-3 text-xs text-tl-gray/55">{provider.evidence}</div>
      {provider.detections != null && (
        <div className="mt-2 font-mono text-xs text-white">Detections: {provider.detections}/{provider.total}</div>
      )}
    </motion.div>
  );
}

export function CorrelationPanel({ correlation }) {
  const data = correlation && typeof correlation === "object" ? correlation : {};
  const rows = [
    ["Available sources", data.available_sources ?? 0],
    ["Positive sources", data.positive_sources ?? 0],
    ["Negative / clean sources", data.negative_sources ?? 0],
    ["Unavailable sources", data.unavailable_sources ?? 0],
    ["Source agreement", `${data.source_agreement ?? 0}%`],
    ["Evidence strength", `${data.evidence_strength ?? 0}/100`],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2" data-testid="correlation-panel">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between rounded-lg border border-tl-gray/10 bg-tl-navy/25 px-4 py-3">
          <span className="text-xs text-tl-gray/60">{k}</span>
          <span className="font-mono text-sm font-semibold text-white">{v}</span>
        </div>
      ))}
      <div className="sm:col-span-2 flex flex-wrap gap-3">
        <Flag on={Boolean(data.multi_source_confirmation)} label="Multi-source confirmation" />
        <Flag on={Boolean(data.conflicting_evidence)} label="Conflicting evidence" warn />
      </div>
    </div>
  );
}

function Flag({ on, label, warn }) {
  const c = warn ? "#FF9F43" : (on ? "#39D98A" : "#4E4B5C");
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
      style={{ color: c, borderColor: `${c}55`, backgroundColor: `${c}12` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
      {label}: {on ? "YES" : "NO"}
    </span>
  );
}

export function AIPanel({ ai }) {
  const data = ai && typeof ai === "object" ? ai : {};
  const label = data.label || "UNKNOWN";
  const c = label === "MALICIOUS" ? "#FF4D67" : label === "SUSPICIOUS" ? "#F5C542" : "#39D98A";
  const features = Array.isArray(data.features) ? data.features : [];

  return (
    <div data-testid="ai-panel">
      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-xl border px-4 py-3" style={{ borderColor: `${c}55`, background: `${c}12` }}>
          <div className="tl-eyebrow">Verdict</div>
          <div className="font-display text-2xl font-bold" style={{ color: c }}>{label}</div>
        </div>
        <div className="text-xs text-tl-gray/55">
          <div>Model: <span className="text-white">{data.model || "N/A"}</span></div>
          <div>Confidence: <span className="text-white">{data.confidence ?? 0}%</span></div>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="tl-eyebrow mb-1">Feature contributions</div>
        {features.slice(0, 6).map((f, i) => (
          <div key={i} className="rounded-lg border border-tl-gray/10 bg-tl-navy/20 px-3 py-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-tl-gray/75">{f?.name || "Feature"}</span>
              <span className="font-mono text-white">{f?.contribution ?? 0}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-tl-bg/60">
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${f?.contribution ?? 0}%` }} viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.05 }} className="h-full rounded-full bg-tl-blue2" />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-lg border border-tl-gray/10 bg-tl-navy/20 px-3 py-2.5 text-[11px] text-tl-gray/50">
        <ShieldQuestion className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tl-blue2" /> {data.disclaimer || "No AI explanation available."}
      </p>
    </div>
  );
}

export function RecommendationCard({ rec, index = 0 }) {
  const c = severityColor(rec.priority);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay: index * 0.05 }} data-testid="recommendation-card"
      className="tl-glass tl-card-hover rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `${c}18`, color: c }}>
            <Lightbulb className="h-4 w-4" />
          </span>
          <h4 className="font-display text-sm font-semibold tracking-wide text-white">{rec.title}</h4>
        </div>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: c, background: `${c}18`, border: `1px solid ${c}44` }}>{rec.priority}</span>
      </div>
      <p className="mt-3 text-xs text-tl-gray/60">{rec.reason}</p>
      <div className="mt-3 rounded-lg border border-tl-gray/10 bg-tl-bg/40 px-3 py-2.5">
        <div className="tl-eyebrow mb-1">Suggested action</div>
        <div className="text-xs text-tl-gray/75">{rec.action}</div>
      </div>
      {rec.related_ioc && <div className="mt-2 break-all font-mono text-[10px] text-tl-gray/40">↳ {rec.related_ioc}</div>}
    </motion.div>
  );
}
