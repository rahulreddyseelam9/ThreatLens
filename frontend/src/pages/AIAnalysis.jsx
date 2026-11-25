import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import AppLayout, { PageHeader } from "@/components/layout/AppLayout";
import { scanApi } from "@/api";
import { formatApiError } from "@/api/client";
import { Loader, ErrorState, EmptyState, RiskGauge } from "@/components/common/primitives";
import { AIPanel } from "@/components/product/blocks";

const CLASSES = [
  { k: "SAFE", c: "#39D98A" },
  { k: "SUSPICIOUS", c: "#F5C542" },
  { k: "MALICIOUS", c: "#FF4D67" },
];

export default function AIAnalysis() {
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
  if (loading) return <AppLayout><Loader label="Running AI threat prediction…" /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader eyebrow="Module 06 · AI Threat Prediction" title="AI that explains its decision."
        sub="A heuristic classifier predicts SAFE, SUSPICIOUS or MALICIOUS and exposes the features behind it. Predictions are signals to investigate — never guaranteed verdicts." />

      <div className="mb-6 grid gap-3 sm:grid-cols-3" data-testid="ai-classes">
        {CLASSES.map((cl) => {
          const active = scan && scan.ai?.label === cl.k;
          return (
            <div key={cl.k} className="tl-glass rounded-2xl p-5 text-center transition-colors"
              style={active ? { borderColor: `${cl.c}66`, background: `${cl.c}10` } : undefined}>
              <Brain className="mx-auto h-5 w-5" style={{ color: cl.c }} />
              <div className="mt-2 font-display text-lg font-bold" style={{ color: cl.c }}>{cl.k}</div>
              {active && <div className="mt-1 text-[10px] font-semibold tracking-wider text-white">CURRENT VERDICT</div>}
            </div>
          );
        })}
      </div>

      {scan ? (
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <div className="tl-glass flex flex-col items-center rounded-2xl p-6">
            <div className="mb-2 break-all text-center font-mono text-xs text-tl-blue2">{scan.ioc}</div>
            <RiskGauge score={scan.risk_score} level={scan.classification} />
            <div className="mt-2 text-xs text-tl-gray/50">Confidence {scan.confidence}%</div>
          </div>
          <div className="tl-glass rounded-2xl p-6"><AIPanel ai={scan.ai} /></div>
        </div>
      ) : (
        <EmptyState title="NO AI ANALYSIS YET" message="Run a scan to generate an AI threat prediction."
          action={<button onClick={() => navigate("/scanner")} className="tl-btn-primary mt-2 px-5 py-2.5 text-xs font-semibold">Scan an indicator</button>} />
      )}
    </AppLayout>
  );
}
