import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import AppLayout, { PageHeader } from "@/components/layout/AppLayout";
import { scanApi } from "@/api";
import { formatApiError } from "@/api/client";
import { Loader, ErrorState, EmptyState, SeverityBadge } from "@/components/common/primitives";
import { severityColor, fmtDate } from "@/lib/format";

const FILTERS = ["All", "SAFE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function History() {
  const navigate = useNavigate();
  const [scans, setScans] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");

  const load = async () => {
    setError("");
    try { setScans(await scanApi.list()); } catch (e) { setError(formatApiError(e)); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!scans) return [];
    return scans.filter((s) =>
      (filter === "All" || s.classification === filter) &&
      (!q || s.ioc.toLowerCase().includes(q.toLowerCase())));
  }, [scans, filter, q]);

  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;
  if (!scans) return <AppLayout><Loader label="Loading scan history…" /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader eyebrow="Module 10 · History" title="Scan history"
        sub="Every indicator you have analyzed, with classification and risk." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} data-testid={`history-filter-${f.toLowerCase()}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wider transition-colors ${
                filter === f ? "bg-tl-blue text-white" : "border border-tl-gray/15 text-tl-gray/60 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tl-gray/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search IOC…" data-testid="history-search"
            className="w-full rounded-full border border-tl-gray/15 bg-tl-navy/30 py-2 pl-9 pr-4 text-sm text-white placeholder-tl-gray/35 outline-none focus:border-tl-blue" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="NO SCANS FOUND" message="No indicators match the current filter."
          action={<button onClick={() => navigate("/scanner")} className="tl-btn-primary mt-2 px-5 py-2.5 text-xs font-semibold">Run a scan</button>} />
      ) : (
        <div className="tl-glass overflow-hidden rounded-2xl" data-testid="history-table">
          <div className="hidden grid-cols-[1fr_90px_120px_70px_130px_90px] gap-3 border-b border-tl-gray/10 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-tl-gray/40 lg:grid">
            <span>IOC</span><span>Type</span><span>Classification</span><span>Risk</span><span>Date</span><span>Action</span>
          </div>
          <div className="divide-y divide-tl-gray/8">
            {filtered.map((s) => (
              <div key={s.id} data-testid={`history-row-${s.id}`}
                className="grid grid-cols-2 items-center gap-3 px-5 py-3.5 transition-colors hover:bg-tl-navy/20 lg:grid-cols-[1fr_90px_120px_70px_130px_90px]">
                <span className="col-span-2 truncate font-mono text-sm text-white lg:col-span-1">{s.ioc}</span>
                <span className="font-mono text-[10px] uppercase text-tl-gray/50">{s.ioc_type}</span>
                <span className="hidden lg:block"><SeverityBadge level={s.classification} size="sm" /></span>
                <span className="font-display text-sm font-bold" style={{ color: severityColor(s.classification) }}>{s.risk_score}</span>
                <span className="hidden font-mono text-xs text-tl-gray/40 lg:block">{fmtDate(s.created_at)}</span>
                <button onClick={() => navigate("/scan-result", { state: { result: s } })} data-testid={`history-view-${s.id}`}
                  className="text-xs font-semibold text-tl-blue2 hover:text-white">View</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
