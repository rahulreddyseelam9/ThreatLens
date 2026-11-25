import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip, AreaChart, Area, CartesianGrid,
} from "recharts";
import { ScanLine, ShieldAlert, Flame, Radar, Activity, ArrowUpRight } from "lucide-react";
import AppLayout, { PageHeader } from "@/components/layout/AppLayout";
import { dashboardApi } from "@/api";
import { formatApiError } from "@/api/client";
import { StatCounter, SeverityBadge, Loader, ErrorState } from "@/components/common/primitives";
import { ProviderStatusCard } from "@/components/product/blocks";
import { severityColor, timeAgo } from "@/lib/format";

const METRICS = [
  { key: "total_scans", label: "Total Scans", icon: ScanLine, color: "#4D5DB3" },
  { key: "threats_detected", label: "Threats Detected", icon: ShieldAlert, color: "#F5C542" },
  { key: "high", label: "High Risk", icon: Flame, color: "#FF9F43" },
  { key: "critical", label: "Critical", icon: Flame, color: "#FF4D67" },
  { key: "emerging", label: "Emerging", icon: Radar, color: "#4DABF7" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try { setData(await dashboardApi.get()); }
    catch (err) { setError(formatApiError(err)); }
  };
  useEffect(() => { load(); }, []);

  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;
  if (!data) return <AppLayout><Loader label="Loading command center…" /></AppLayout>;

  const { metrics, risk_distribution, activity, recent_scans, providers, emerging_threats, recommendations } = data;

  return (
    <AppLayout>
      <PageHeader eyebrow="Module 10 · Command Center" title="Intelligence command center"
        sub="Live posture across your scanned indicators, emerging signals and provider health."
        action={<button onClick={() => navigate("/scanner")} data-testid="dash-new-scan" className="tl-btn-primary px-5 py-2.5 text-xs font-semibold tracking-wide">NEW SCAN</button>} />

      <div data-testid="dashboard-command-center" className="space-y-6">
        {/* metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {METRICS.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div key={m.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="tl-glass tl-card-hover rounded-2xl p-5" data-testid={`metric-${m.key}`}>
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4" style={{ color: m.color }} />
                  <ArrowUpRight className="h-3.5 w-3.5 text-tl-gray/30" />
                </div>
                <div className="mt-4 font-display text-3xl font-bold text-white"><StatCounter value={metrics[m.key] || 0} /></div>
                <div className="mt-1 text-xs text-tl-gray/50">{m.label}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* risk distribution */}
          <div className="tl-glass rounded-2xl p-6" data-testid="risk-distribution">
            <h3 className="mb-4 font-display text-lg font-semibold text-white">Risk distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={risk_distribution}>
                <XAxis dataKey="level" tick={{ fill: "#B9C3D6", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#B9C3D6", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(77,93,179,0.08)" }} contentStyle={{ background: "#05060f", border: "1px solid #1A1C52", borderRadius: 8, color: "#fff" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {risk_distribution.map((e) => <Cell key={e.level} fill={severityColor(e.level)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* activity */}
          <div className="tl-glass rounded-2xl p-6" data-testid="threat-activity">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-white"><Activity className="h-4 w-4 text-tl-blue2" /> Scan activity</h3>
            {activity.length === 0 ? (
              <div className="grid h-[220px] place-items-center text-sm text-tl-gray/40">No activity yet — run your first scan.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={activity}>
                  <defs>
                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#141BD4" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#141BD4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(185,195,214,0.08)" />
                  <XAxis dataKey="day" tick={{ fill: "#B9C3D6", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fill: "#B9C3D6", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#05060f", border: "1px solid #1A1C52", borderRadius: 8, color: "#fff" }} />
                  <Area type="monotone" dataKey="count" stroke="#4D5DB3" strokeWidth={2} fill="url(#actGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* recent scans */}
          <div className="tl-glass rounded-2xl p-6 lg:col-span-2" data-testid="recent-scans">
            <h3 className="mb-4 font-display text-lg font-semibold text-white">Recent scans</h3>
            {recent_scans.length === 0 ? (
              <div className="py-10 text-center text-sm text-tl-gray/40">No scans yet.</div>
            ) : (
              <div className="space-y-2">
                {recent_scans.map((s) => (
                  <button key={s.id} onClick={() => navigate("/scan-result", { state: { result: s } })}
                    data-testid={`recent-scan-${s.id}`}
                    className="flex w-full items-center gap-3 rounded-lg border border-tl-gray/10 bg-tl-navy/20 px-4 py-3 text-left transition-colors hover:border-tl-blue/40">
                    <span className="w-16 shrink-0 font-mono text-[10px] uppercase text-tl-gray/40">{s.ioc_type}</span>
                    <span className="flex-1 truncate font-mono text-sm text-white">{s.ioc}</span>
                    <span className="hidden font-mono text-xs text-tl-gray/40 sm:block">{timeAgo(s.created_at)}</span>
                    <span className="w-10 text-right font-display text-sm font-bold" style={{ color: severityColor(s.classification) }}>{s.risk_score}</span>
                    <SeverityBadge level={s.classification} size="sm" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* provider status */}
          <div className="space-y-3" data-testid="dash-providers">
            <h3 className="font-display text-lg font-semibold text-white">Provider status</h3>
            {providers.map((p, i) => (
              <ProviderStatusCard key={p.id} provider={{ ...p, evidence: p.configured ? "Live telemetry enabled." : "API key not configured." }} index={i} />
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="tl-glass rounded-2xl p-6" data-testid="dash-emerging">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-white"><Radar className="h-4 w-4 text-tl-low" /> Emerging threats</h3>
            {emerging_threats.length === 0 ? <div className="py-6 text-sm text-tl-gray/40">No emerging threats detected.</div> : (
              <div className="space-y-2">
                {emerging_threats.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg border border-tl-low/20 bg-tl-low/5 px-4 py-2.5">
                    <span className="flex-1 truncate font-mono text-xs text-white">{s.ioc}</span>
                    <span className="font-display text-sm font-bold" style={{ color: severityColor(s.classification) }}>{s.risk_score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="tl-glass rounded-2xl p-6" data-testid="dash-recs">
            <h3 className="mb-4 font-display text-lg font-semibold text-white">Latest recommendations</h3>
            {recommendations.length === 0 ? <div className="py-6 text-sm text-tl-gray/40">No recommendations yet.</div> : (
              <div className="space-y-2">
                {recommendations.map((r, i) => (
                  <div key={i} className="rounded-lg border border-tl-gray/10 bg-tl-navy/20 px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{r.title}</span>
                      <span className="text-[10px] font-semibold" style={{ color: severityColor(r.priority) }}>{r.priority}</span>
                    </div>
                    <div className="mt-1 truncate text-[11px] text-tl-gray/50">{r.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
