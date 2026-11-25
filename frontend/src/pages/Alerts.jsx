import { useEffect, useState } from "react";
import { BellRing, Mail } from "lucide-react";
import AppLayout, { PageHeader } from "@/components/layout/AppLayout";
import { alertsApi } from "@/api";
import { formatApiError } from "@/api/client";
import { Loader, ErrorState, EmptyState, SeverityBadge } from "@/components/common/primitives";
import { severityColor, fmtDate } from "@/lib/format";

export default function Alerts() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = async () => {
    setError("");
    try { setData(await alertsApi.list()); } catch (e) { setError(formatApiError(e)); }
  };
  useEffect(() => { load(); }, []);

  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;
  if (!data) return <AppLayout><Loader label="Loading alerts…" /></AppLayout>;

  const groups = ["CRITICAL", "HIGH", "MEDIUM"].map((lvl) => ({
    lvl, items: data.alerts.filter((a) => a.classification === lvl),
  }));

  return (
    <AppLayout>
      <PageHeader eyebrow="Module 10 · Alerts" title="When risk rises, know immediately."
        sub="High and Critical findings can trigger configured email alerts." />

      <div className="mb-6 flex items-center gap-2 rounded-xl border border-tl-gray/10 bg-tl-navy/25 px-4 py-3 text-sm" data-testid="email-status">
        <Mail className="h-4 w-4 text-tl-blue2" />
        <span className="text-tl-gray/70">Email alerting:</span>
        <span className={data.email_configured ? "text-tl-safe" : "text-tl-purple"}>
          {data.email_configured ? "CONFIGURED" : "NOT CONFIGURED"}
        </span>
        {!data.email_configured && <span className="text-xs text-tl-gray/40">— delivery is not claimed until the backend confirms SMTP.</span>}
      </div>

      {data.alerts.length === 0 ? (
        <EmptyState icon={BellRing} title="NO ACTIVE ALERTS" message="No medium, high or critical findings yet." />
      ) : (
        <div className="space-y-8">
          {groups.map((g) => g.items.length > 0 && (
            <div key={g.lvl}>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-white">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: severityColor(g.lvl) }} /> {g.lvl} ({g.items.length})
              </h2>
              <div className="space-y-2">
                {g.items.map((a) => (
                  <div key={a.scan_id} data-testid={`alert-${a.scan_id}`}
                    className="tl-glass tl-card-hover flex flex-col gap-2 rounded-xl px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <SeverityBadge level={a.classification} size="sm" />
                        <span className="break-all font-mono text-sm text-white">{a.ioc}</span>
                      </div>
                      <div className="mt-1 text-xs text-tl-gray/55">{a.reason}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      {a.email_alert && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-tl-blue2"><Mail className="h-3 w-3" /> EMAIL TRIGGER</span>}
                      <span className="font-mono text-xs text-tl-gray/40">{fmtDate(a.timestamp)}</span>
                      <span className="rounded-full border border-tl-gray/15 px-2.5 py-0.5 text-[10px] font-semibold text-tl-gray/60">{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
