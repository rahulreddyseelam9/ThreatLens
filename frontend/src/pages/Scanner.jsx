import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import AppLayout, { PageHeader } from "@/components/layout/AppLayout";
import { scanApi } from "@/api";
import { formatApiError } from "@/api/client";
import { IOC_TYPES } from "@/lib/format";

const STAGES = ["VALIDATING", "COLLECTING", "CORRELATING", "ANALYZING", "GENERATING RISK"];

export function ScanStages({ active }) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="scan-stages">
      {STAGES.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span className={`rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-wider transition-colors ${
            i < active ? "border-tl-safe/40 bg-tl-safe/10 text-tl-safe"
            : i === active ? "border-tl-blue/50 bg-tl-blue/10 text-tl-blue2 tl-pulse"
            : "border-tl-gray/12 bg-tl-navy/20 text-tl-gray/40"}`}>{s}</span>
          {i < STAGES.length - 1 && <span className="h-px w-3 bg-tl-gray/15" />}
        </div>
      ))}
    </div>
  );
}

export default function Scanner() {
  const navigate = useNavigate();
  const [type, setType] = useState("ip");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const timer = useRef(null);

  const current = IOC_TYPES.find((t) => t.id === type);

  useEffect(() => () => clearInterval(timer.current), []);

  const runScan = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    setError(""); setLoading(true); setStage(0);
    timer.current = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 550);
    try {
      const result = await scanApi.scan(value.trim(), type);
      clearInterval(timer.current);
      setStage(STAGES.length);
      setTimeout(() => navigate("/scan-result", { state: { result } }), 300);
    } catch (err) {
      clearInterval(timer.current);
      setError(formatApiError(err));
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader eyebrow="Module 02 · IOC Scanner" title="Scan the signal."
        sub="Submit an indicator and collect available threat intelligence from multiple sources." />

      <div className="mx-auto max-w-3xl" data-testid="ioc-scanner-container">
        <div className="tl-glass rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Indicator type">
            {IOC_TYPES.map((t) => (
              <button key={t.id} role="tab" aria-selected={type === t.id} data-testid={`scan-tab-${t.id}`}
                onClick={() => { setType(t.id); setError(""); }}
                className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wider transition-colors ${
                  type === t.id ? "bg-tl-blue text-white" : "border border-tl-gray/15 text-tl-gray/70 hover:text-white"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={runScan} className="mt-6">
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-tl-gray/60">ENTER INDICATOR</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <ScanLine className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-tl-gray/40" />
                <input value={value} onChange={(e) => setValue(e.target.value)} disabled={loading}
                  data-testid="scan-input" placeholder={current?.placeholder}
                  className="w-full rounded-xl border border-tl-gray/15 bg-tl-bg/60 py-3.5 pl-11 pr-4 font-mono text-sm text-white placeholder-tl-gray/30 outline-none transition-colors focus:border-tl-blue focus:ring-2 focus:ring-tl-blue/25" />
              </div>
              <button type="submit" disabled={loading || !value.trim()} data-testid="scan-submit"
                className="tl-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold tracking-wide disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>SCAN IOC <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
            <p className="mt-2 text-xs text-tl-gray/40">{current?.hint}</p>
          </form>

          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden border-t border-tl-gray/10 pt-6">
                <ScanStages active={stage} />
                <p className="mt-3 font-mono text-xs text-tl-gray/50">Collecting intelligence for <span className="text-white">{value}</span>…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div data-testid="scan-error" className="mt-6 flex items-start gap-2 rounded-lg border border-tl-crit/30 bg-tl-crit/10 px-4 py-3 text-sm text-tl-crit">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[["6", "IOC types"], ["5", "Providers"], ["0–100", "Risk score"]].map(([n, l]) => (
            <div key={l} className="rounded-xl border border-tl-gray/10 bg-tl-navy/20 px-4 py-4 text-center">
              <div className="font-display text-xl font-bold text-white">{n}</div>
              <div className="text-xs text-tl-gray/50">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
