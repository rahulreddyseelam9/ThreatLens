import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Layers, Loader2, FileText } from "lucide-react";
import AppLayout, { PageHeader } from "@/components/layout/AppLayout";
import { scanApi } from "@/api";
import { formatApiError } from "@/api/client";
import { SeverityBadge, StatCounter } from "@/components/common/primitives";
import { severityColor } from "@/lib/format";

export default function BatchScanner() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const runText = async () => {
    const iocs = text.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (!iocs.length) return;
    setLoading(true); setError(""); setResult(null);
    try { setResult(await scanApi.batch(iocs)); }
    catch (e) { setError(formatApiError(e)); }
    finally { setLoading(false); }
  };

  const runFile = async (file) => {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    try { setResult(await scanApi.upload(file)); }
    catch (e) { setError(formatApiError(e)); }
    finally { setLoading(false); }
  };

  const summary = result?.summary;
  const CARDS = summary ? [
    ["Total indicators", summary.total, "#4D5DB3"],
    ["Scanned", summary.scanned, "#4DABF7"],
    ["High risk", summary.high, "#FF9F43"],
    ["Critical", summary.critical, "#FF4D67"],
    ["Emerging", summary.emerging, "#39D98A"],
  ] : [];

  return (
    <AppLayout>
      <PageHeader eyebrow="Module 03 · Batch Scanner" title="Scan at scale."
        sub="Upload a CSV / Excel file or paste a list of indicators to analyze them in bulk." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="tl-glass rounded-2xl p-6" data-testid="batch-upload">
          <button onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-tl-gray/20 bg-tl-navy/20 py-10 transition-colors hover:border-tl-blue/50">
            <Upload className="h-8 w-8 text-tl-blue2" />
            <span className="text-sm font-semibold text-white">Upload CSV or Excel</span>
            <span className="text-xs text-tl-gray/45">IP · URL · Domain · MD5 · SHA1 · SHA256</span>
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" data-testid="batch-file-input"
            onChange={(e) => runFile(e.target.files?.[0])} />
        </div>

        <div className="tl-glass rounded-2xl p-6" data-testid="batch-paste">
          <label className="mb-2 block text-xs font-semibold tracking-wider text-tl-gray/60">PASTE INDICATORS (one per line)</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} data-testid="batch-textarea"
            placeholder={"8.8.8.8\nfree-crypto-bonus.top\nhttp://secure-login.xyz/verify"}
            className="w-full rounded-xl border border-tl-gray/15 bg-tl-bg/60 p-3 font-mono text-sm text-white placeholder-tl-gray/30 outline-none focus:border-tl-blue" />
          <button onClick={runText} disabled={loading || !text.trim()} data-testid="batch-scan-btn"
            className="tl-btn-primary mt-3 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />} Scan batch
          </button>
        </div>
      </div>

      {error && <div data-testid="batch-error" className="mt-6 rounded-lg border border-tl-crit/30 bg-tl-crit/10 px-4 py-3 text-sm text-tl-crit">{error}</div>}

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-8 flex flex-col items-center gap-3 py-8">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-2 border-tl-blue/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-tl-blue2" />
              <Layers className="absolute inset-0 m-auto h-6 w-6 text-tl-blue2" />
            </div>
            <span className="font-mono text-sm text-tl-gray/60">Processing indicators…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {summary && (
        <div className="mt-8" data-testid="batch-results">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {CARDS.map(([label, val, color]) => (
              <div key={label} className="tl-glass rounded-2xl p-5 text-center">
                <div className="font-display text-3xl font-bold" style={{ color }}><StatCounter value={val} /></div>
                <div className="mt-1 text-xs text-tl-gray/50">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 tl-glass overflow-hidden rounded-2xl">
            <div className="divide-y divide-tl-gray/8">
              {result.results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <FileText className="h-4 w-4 text-tl-gray/30" />
                  <span className="flex-1 truncate font-mono text-sm text-white">{r.ioc}</span>
                  {r.classification === "ERROR" ? (
                    <span className="text-xs text-tl-warm">{r.error}</span>
                  ) : (
                    <>
                      <span className="font-display text-sm font-bold" style={{ color: severityColor(r.classification) }}>{r.risk_score}</span>
                      <SeverityBadge level={r.classification} size="sm" />
                      <button onClick={() => navigate("/scan-result", { state: { result: r } })}
                        className="text-xs font-semibold text-tl-blue2 hover:text-white">View</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
