import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { Radar, Clock, Link2, ShieldCheck } from "lucide-react";
import AppLayout, { PageHeader } from "@/components/layout/AppLayout";
import { emergingApi } from "@/api";
import { formatApiError } from "@/api/client";
import { Loader, ErrorState, EmptyState } from "@/components/common/primitives";
import { severityColor } from "@/lib/format";

function ThreatCard({ item, onOpen }) {
  const emerging = item.status === "EMERGING";
  const c = severityColor(item.classification);
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="tl-glass tl-card-hover rounded-2xl p-5" data-testid="emerging-card">
      <div className="flex items-start justify-between">
        <div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider ${
            emerging ? "bg-tl-crit/15 text-tl-crit" : "bg-tl-med/15 text-tl-med"}`}>
            <Radar className="h-3 w-3" /> {item.status}
          </span>
          <div className="mt-2 break-all font-mono text-sm text-white">{item.ioc}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold" style={{ color: c }}>{item.risk_score}</div>
          <div className="text-[10px] text-tl-gray/40">/ 100</div>
        </div>
      </div>

      <div className="mt-3 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={item.timeline}>
            <defs><linearGradient id={`em${item.scan_id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity={0.5} /><stop offset="100%" stopColor={c} stopOpacity={0} />
            </linearGradient></defs>
            <XAxis dataKey="t" hide />
            <Tooltip contentStyle={{ background: "#05060f", border: "1px solid #1A1C52", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#B9C3D6" }} />
            <Area type="monotone" dataKey="observations" stroke={c} strokeWidth={2} fill={`url(#em${item.scan_id})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Mini icon={Clock} label="First seen" value={`${item.first_seen_days_ago}d`} />
        <Mini icon={Link2} label="Related" value={item.related_ioc_count} />
        <Mini icon={ShieldCheck} label="Confidence" value={`${item.confidence}%`} />
      </div>
      <button onClick={() => onOpen(item)} data-testid={`emerging-open-${item.scan_id}`}
        className="mt-4 w-full rounded-lg border border-tl-gray/15 py-2 text-xs font-semibold text-white transition-colors hover:border-tl-blue hover:bg-tl-blue/10">
        View analysis
      </button>
    </motion.div>
  );
}

function Mini({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-tl-gray/10 bg-tl-navy/20 px-2 py-2">
      <Icon className="mx-auto h-3.5 w-3.5 text-tl-blue2" />
      <div className="mt-1 font-display text-sm font-bold text-white">{value}</div>
      <div className="text-[9px] text-tl-gray/40">{label}</div>
    </div>
  );
}

export default function EmergingThreats() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = async () => {
    setError("");
    try { setData(await emergingApi.list()); } catch (e) { setError(formatApiError(e)); }
  };
  useEffect(() => { load(); }, []);

  const open = async (item) => {
    navigate("/scan-result", { state: {} });
    // fetch full scan then route with state
    try {
      const full = await (await import("@/api")).scanApi.get(item.scan_id);
      navigate("/scan-result", { state: { result: full } });
    } catch { /* falls back to latest */ }
  };

  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;
  if (!data) return <AppLayout><Loader label="Analyzing emerging signals…" /></AppLayout>;

  const all = [...data.emerging, ...data.potential];

  return (
    <AppLayout>
      <PageHeader eyebrow="Module 08 · Emerging Threats" title="See the signal before it spreads."
        sub="Indicators surfacing as high-risk based on recency, related-indicator counts and provider confirmation. Signals are early indications — not guaranteed future attacks." />

      {all.length === 0 ? (
        <EmptyState icon={Radar} title="NO EMERGING THREATS DETECTED"
          message="No indicators currently meet the configured emerging-threat criteria. Run more scans to populate this view."
          action={<button onClick={() => navigate("/scanner")} className="tl-btn-primary mt-2 px-5 py-2.5 text-xs font-semibold">Scan an indicator</button>} />
      ) : (
        <div className="space-y-8">
          {data.emerging.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-white"><span className="h-2 w-2 rounded-full bg-tl-crit tl-pulse" /> Emerging ({data.emerging.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.emerging.map((it) => <ThreatCard key={it.scan_id} item={it} onOpen={open} />)}
              </div>
            </div>
          )}
          {data.potential.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-white"><span className="h-2 w-2 rounded-full bg-tl-med" /> Potential ({data.potential.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.potential.map((it) => <ThreatCard key={it.scan_id} item={it} onOpen={open} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
