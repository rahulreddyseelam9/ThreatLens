import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AppLayout, { PageHeader } from "@/components/layout/AppLayout";
import { intelApi } from "@/api";
import { formatApiError } from "@/api/client";
import { Loader, ErrorState } from "@/components/common/primitives";
import { ProviderStatusCard } from "@/components/product/blocks";
import ThreatCore from "@/components/visuals/ThreatCore";
import { timeAgo } from "@/lib/format";

export default function Intelligence() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = async () => {
    setError("");
    try { setData(await intelApi.get()); } catch (e) { setError(formatApiError(e)); }
  };
  useEffect(() => { load(); }, []);

  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;
  if (!data) return <AppLayout><Loader label="Collecting intelligence sources…" /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader eyebrow="Module 04 · Threat Intelligence" title="Threat intelligence"
        sub="Every provider's live availability — availability, clean, positive, error and unavailable states are kept distinct." />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-3 sm:grid-cols-2" data-testid="intel-provider-grid">
          {data.providers.map((p, i) => (
            <div key={p.id} className="tl-glass tl-card-hover rounded-xl p-5" data-testid={`intel-provider-${p.id}`}>
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-semibold text-white">{p.name}</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider"
                  style={p.status === "AVAILABLE"
                    ? { color: "#39D98A", background: "#39D98A18", border: "1px solid #39D98A44" }
                    : { color: "#4E4B5C", background: "#4E4B5C22", border: "1px solid #4E4B5C55" }}>
                  {p.status}
                </span>
              </div>
              <p className="mt-3 text-xs text-tl-gray/55">{p.evidence}</p>
              <div className="mt-4 space-y-1.5 border-t border-tl-gray/10 pt-3 text-xs">
                <Row k="Signal" v={p.status === "AVAILABLE" ? "Live" : "None"} />
                <Row k="Last result" v={p.last_result ? `${p.last_result.status} · ${timeAgo(p.last_result.at)}` : "—"} />
                <Row k="Last IOC" v={p.last_result?.ioc || "—"} mono />
              </div>
            </div>
          ))}
        </div>

        <div className="tl-glass rounded-2xl p-6" data-testid="intel-core">
          <h3 className="mb-1 font-display text-lg font-semibold text-white">Intelligence core</h3>
          <p className="text-xs text-tl-gray/50">Providers stream signals into the ThreatLens correlation core.</p>
          <ThreatCore height={300} />
          <div className="mt-2 rounded-lg border border-tl-gray/10 bg-tl-navy/20 px-4 py-3 text-center">
            <div className="font-display text-2xl font-bold text-white">{data.queries}</div>
            <div className="text-xs text-tl-gray/50">Queries processed</div>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-[11px] text-tl-gray/40">
            Provider availability reflects real backend configuration. An unavailable source is never reported as clean.
          </motion.p>
        </div>
      </div>
    </AppLayout>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-tl-gray/45">{k}</span>
      <span className={`truncate ${mono ? "font-mono" : ""} text-tl-gray/80`}>{v}</span>
    </div>
  );
}
