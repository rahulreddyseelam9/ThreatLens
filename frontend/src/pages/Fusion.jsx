import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GitBranch, ArrowRight } from "lucide-react";
import AppLayout, { PageHeader } from "@/components/layout/AppLayout";
import { scanApi } from "@/api";
import { formatApiError } from "@/api/client";
import { Loader, ErrorState, EmptyState } from "@/components/common/primitives";
import { CorrelationPanel } from "@/components/product/blocks";

const PROVIDERS = ["VirusTotal", "AbuseIPDB", "AlienVault OTX", "URLHaus", "Cisco Talos"];

export default function Fusion() {
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError(""); setLoading(true);
    try { const list = await scanApi.list(); setScan(list[0] || false); }
    catch (e) { setError(formatApiError(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;
  if (loading) return <AppLayout><Loader label="Fusing intelligence sources…" /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader eyebrow="Module 05 · Intelligence Fusion" title="From signals to one threat profile."
        sub="Multiple providers enter the system; ThreatLens normalizes and correlates them into a single threat profile. Unavailable providers are never counted as negative evidence." />

      <div className="tl-glass rounded-2xl p-6 sm:p-10" data-testid="fusion-diagram">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-2">
            {PROVIDERS.map((p, i) => (
              <motion.div key={p} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 rounded-lg border border-tl-gray/12 bg-tl-navy/25 px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-tl-blue2" />
                <span className="text-sm text-tl-gray/75">{p}</span>
              </motion.div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-3">
            <ArrowRight className="hidden h-6 w-6 text-tl-blue2 lg:block" />
            <div className="grid h-24 w-24 place-items-center rounded-full border border-tl-blue/40 bg-tl-blue/10">
              <GitBranch className="h-8 w-8 text-tl-blue2 tl-pulse" />
            </div>
            <span className="tl-eyebrow">Correlation</span>
          </div>
          <div className="rounded-2xl border border-tl-blue/30 bg-tl-blue/8 p-6 text-center">
            <div className="tl-eyebrow mb-1">Output</div>
            <div className="font-display text-xl font-bold text-white">Unified Threat Profile</div>
            <p className="mt-2 text-xs text-tl-gray/55">Evidence strength · source agreement · multi-source confirmation</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 font-display text-lg font-semibold text-white">Latest correlation</h3>
        {scan ? (
          <div className="tl-glass rounded-2xl p-6">
            <div className="mb-4 break-all font-mono text-sm text-tl-blue2">{scan.ioc}</div>
            <CorrelationPanel correlation={scan.correlation} />
          </div>
        ) : (
          <EmptyState title="NO PROFILE YET" message="Run a scan to see live fusion output."
            action={<button onClick={() => navigate("/scanner")} className="tl-btn-primary mt-2 px-5 py-2.5 text-xs font-semibold">Scan an indicator</button>} />
        )}
      </div>
    </AppLayout>
  );
}
