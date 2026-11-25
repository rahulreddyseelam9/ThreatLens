import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import AppLayout, { PageHeader } from "@/components/layout/AppLayout";
import { reportsApi } from "@/api";
import { formatApiError } from "@/api/client";
import { Loader, ErrorState, EmptyState } from "@/components/common/primitives";
import { fmtDate } from "@/lib/format";

const SCOPES = [
  { id: "all", label: "All indicators" },
  { id: "high", label: "High only" },
  { id: "critical", label: "Critical only" },
  { id: "emerging", label: "Emerging only" },
];

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");
  const [scope, setScope] = useState("all");
  const [busy, setBusy] = useState("");

  const load = async () => {
    setError("");
    try { setReports(await reportsApi.list()); } catch (e) { setError(formatApiError(e)); }
  };
  useEffect(() => { load(); }, []);

  const generate = async (format) => {
    setBusy(format);
    try {
      const rec = await reportsApi.generate(format, scope);
      window.open(reportsApi.downloadUrl(rec.id), "_blank");
      await load();
    } catch (e) { setError(formatApiError(e)); }
    finally { setBusy(""); }
  };

  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;
  if (!reports) return <AppLayout><Loader label="Loading reports…" /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader eyebrow="Module 10 · Reports" title="Intelligence you can export."
        sub="Generate signed threat-intelligence reports in PDF or Excel. Files are produced by the backend — nothing is faked." />

      <div className="grid gap-6 lg:grid-cols-2">
        <PreviewCard icon={FileText} tint="#FF4D67" title="PDF Report"
          desc="Formatted intelligence report with indicator table, classification and risk." />
        <PreviewCard icon={FileSpreadsheet} tint="#39D98A" title="Excel Workbook"
          desc="Structured spreadsheet of every indicator for downstream analysis." />
      </div>

      <div className="mt-6 tl-glass rounded-2xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="tl-eyebrow mb-2">Scope</div>
            <div className="flex flex-wrap gap-2">
              {SCOPES.map((s) => (
                <button key={s.id} onClick={() => setScope(s.id)} data-testid={`report-scope-${s.id}`}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    scope === s.id ? "bg-tl-blue text-white" : "border border-tl-gray/15 text-tl-gray/60 hover:text-white"}`}>{s.label}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => generate("pdf")} disabled={busy} data-testid="generate-pdf"
              className="inline-flex items-center gap-2 rounded-full border border-tl-gray/20 px-5 py-3 text-sm text-white hover:border-tl-blue hover:bg-tl-blue/10 disabled:opacity-50">
              {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-tl-crit" />} Generate PDF
            </button>
            <button onClick={() => generate("excel")} disabled={busy} data-testid="generate-excel"
              className="tl-btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold disabled:opacity-50">
              {busy === "excel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Generate Excel
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 font-display text-lg font-semibold text-white">Generated reports</h3>
        {reports.length === 0 ? (
          <EmptyState title="NO REPORTS YET" message="Generate your first report above." />
        ) : (
          <div className="tl-glass divide-y divide-tl-gray/8 overflow-hidden rounded-2xl" data-testid="reports-list">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3.5" data-testid={`report-${r.id}`}>
                {r.format === "excel" ? <FileSpreadsheet className="h-5 w-5 text-tl-safe" /> : <FileText className="h-5 w-5 text-tl-crit" />}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{r.format.toUpperCase()} · {r.scope} · {r.count} indicators</div>
                  <div className="font-mono text-[11px] text-tl-gray/40">{fmtDate(r.created_at)}</div>
                </div>
                <a href={reportsApi.downloadUrl(r.id)} target="_blank" rel="noreferrer" data-testid={`download-${r.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-tl-gray/20 px-4 py-2 text-xs font-semibold text-white hover:border-tl-blue hover:bg-tl-blue/10">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function PreviewCard({ icon: Icon, tint, title, desc }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="tl-glass rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-16 w-14 place-items-center rounded-lg border" style={{ borderColor: `${tint}44`, background: `${tint}12` }}>
          <Icon className="h-7 w-7" style={{ color: tint }} />
        </div>
        <div>
          <h4 className="font-display text-lg font-semibold text-white">{title}</h4>
          <p className="mt-1 text-sm text-tl-gray/55">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}
