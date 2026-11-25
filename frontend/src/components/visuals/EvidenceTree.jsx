import { useState } from "react";
import { motion } from "framer-motion";
import { severityColor } from "@/lib/format";

// Explainable-AI evidence tree: root IOC -> evidence signals -> unified verdict.
export default function EvidenceTree({ ioc, providers = [], features = [], classification = "LOW" }) {
  const [open, setOpen] = useState(null);
  const branches = [
    ...providers.map((p) => ({
      key: p.id, label: p.name,
      value: p.status === "UNAVAILABLE" ? "UNAVAILABLE" : (p.detections != null ? `${p.detections}/${p.total}` : p.status),
      detail: p.evidence, unavailable: p.status === "UNAVAILABLE",
    })),
    ...features.slice(0, 4).map((f, i) => ({
      key: `f${i}`, label: f.name, value: `+${f.weight}`, detail: f.detail, unavailable: false,
    })),
  ];
  const c = severityColor(classification);

  return (
    <div className="w-full" data-testid="xai-evidence-tree">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <div className="flex items-center justify-center lg:w-56">
          <div className="rounded-2xl border border-tl-blue/40 bg-tl-blue/10 px-5 py-4 text-center">
            <div className="tl-eyebrow mb-1">Indicator</div>
            <div className="max-w-[180px] break-all font-mono text-xs text-white">{ioc}</div>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {branches.map((b, i) => (
            <motion.button
              key={b.key} type="button" onClick={() => setOpen(open === i ? null : i)}
              data-testid={`evidence-node-${i}`}
              initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex w-full items-center gap-3 rounded-xl border border-tl-gray/12 bg-tl-navy/30 px-4 py-3 text-left transition-colors hover:border-tl-blue/50">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: b.unavailable ? "#4E4B5C" : "#4DABF7" }} />
              <span className="flex-1 text-sm text-tl-gray">{b.label}</span>
              <span className={`font-mono text-xs ${b.unavailable ? "text-tl-purple" : "text-white"}`}>{b.value}</span>
            </motion.button>
          )).slice(0, 8)}
          {open != null && branches[open] && (
            <div className="rounded-xl border border-tl-blue/20 bg-tl-blue/5 px-4 py-3 text-xs text-tl-gray/80">
              {branches[open].detail}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center lg:w-56">
          <div className="rounded-2xl border px-5 py-4 text-center" style={{ borderColor: `${c}66`, background: `${c}12` }}>
            <div className="tl-eyebrow mb-1">Unified Verdict</div>
            <div className="font-display text-xl font-bold" style={{ color: c }}>{classification}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
