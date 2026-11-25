import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, FileSpreadsheet, ArrowLeft, Copy } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { scanApi, reportsApi } from "@/api";
import { formatApiError } from "@/api/client";
import { RiskGauge, SeverityBadge, Loader, ErrorState, EmptyState, Eyebrow } from "@/components/common/primitives";
import { ProviderStatusCard, CorrelationPanel, AIPanel, RecommendationCard } from "@/components/product/blocks";
import EvidenceTree from "@/components/visuals/EvidenceTree";
import NetworkGraph from "@/components/visuals/NetworkGraph";
import { fmtDate } from "@/lib/format";

function Section({ title, kicker, children, testid }) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }} className="tl-glass rounded-2xl p-6" data-testid={testid}>
      {kicker && <Eyebrow className="mb-1">{kicker}</Eyebrow>}
      <h2 className="mb-5 font-display text-xl font-semibold text-white">{title}</h2>
      {children}
    </motion.section>
  );
}

export default function ScanResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (result) return;
    (async () => {
      try {
        const list = await scanApi.list();
        setResult(list[0] || null);
      } catch (err) { setError(formatApiError(err)); }
      finally { setLoading(false); }
    })();
  }, [result]);

  const genReport = async (format) => {
    setBusy(format);
    try {
      const rec = await reportsApi.generate(format, "all");
      window.open(reportsApi.downloadUrl(rec.id), "_blank");
    } catch (err) { setError(formatApiError(err)); }
    finally { setBusy(""); }
  };

  if (loading) return <AppLayout><Loader label="Loading threat analysis…" /></AppLayout>;
  if (error) return <AppLayout><ErrorState message={error} onRetry={() => window.location.reload()} /></AppLayout>;
  if (!result) return (
    <AppLayout>
      <EmptyState title="NO SCAN RESULT" message="Run a scan to view a full threat analysis."
        action={<button onClick={() => navigate("/scanner")} className="tl-btn-primary mt-2 px-5 py-2.5 text-xs font-semibold">Open scanner</button>} />
    </AppLayout>
  );

  const c = result.classification || result.risk?.classification || "UNKNOWN";
  const riskScore = Number(result.risk_score ?? result.risk?.risk_score ?? 0);
  const confidence = Number(result.confidence ?? result.risk?.confidence ?? 0);
  const aiLabel = result.ai?.label || result.ml_prediction?.prediction || "UNKNOWN";
  return (
    <AppLayout>
      <button onClick={() => navigate("/scanner")} data-testid="result-back"
        className="mb-5 inline-flex items-center gap-2 text-xs text-tl-gray/60 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to scanner
      </button>

      {/* header */}
      <div className="tl-glass rounded-2xl p-6 sm:p-8" data-testid="scan-results-hero">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <Eyebrow className="mb-2">{result.ioc_type?.toUpperCase()} · scanned {fmtDate(result.created_at || result.analyzed_at)}</Eyebrow>
            <div className="flex items-center gap-3">
              <h1 className="break-all font-mono text-2xl font-bold text-white sm:text-3xl">{result.ioc}</h1>
              <button onClick={() => navigator.clipboard?.writeText(result.ioc)} className="text-tl-gray/40 hover:text-white" aria-label="Copy indicator"><Copy className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div><div className="tl-eyebrow">Classification</div><div className="mt-1"><SeverityBadge level={c} /></div></div>
              <div><div className="tl-eyebrow">Confidence</div><div className="mt-1 font-display text-2xl font-bold text-white">{Number.isFinite(confidence) ? `${confidence}%` : "0%"}</div></div>
              <div><div className="tl-eyebrow">AI verdict</div><div className="mt-1 font-display text-xl font-semibold text-tl-blue2">{aiLabel}</div></div>
            </div>
          </div>
          <div className="flex justify-center"><RiskGauge score={riskScore} level={c} /></div>
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <Section kicker="Module 04" title="Threat Intelligence" testid="threat-intel-providers-grid">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.providers?.map((p, i) => <ProviderStatusCard key={p.id} provider={p} index={i} />)}
          </div>
          <p className="mt-4 text-[11px] text-tl-gray/40">Unavailable providers are never treated as clean. Configure provider API keys on the backend to enable live telemetry.</p>
        </Section>

        <Section kicker="Module 05" title="Correlation">
          <CorrelationPanel correlation={result.correlation} />
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section kicker="Module 06" title="AI Analysis"><AIPanel ai={result.ai} /></Section>
          <Section kicker="Module 07" title="Why this result?">
            <EvidenceTree ioc={result.ioc} providers={result.providers} features={result.ai?.features} classification={c} />
          </Section>
        </div>

        {result.related_iocs?.length > 0 && (
          <Section kicker="Module 12" title="Related IOC network">
            <NetworkGraph nodes={result.related_iocs} />
          </Section>
        )}

        <Section kicker="Module 09" title="Recommendations">
          <div className="grid gap-4 md:grid-cols-2">
            {result.recommendations?.map((r, i) => <RecommendationCard key={i} rec={r} index={i} />)}
          </div>
        </Section>

        <Section kicker="Module 10" title="Report export">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => genReport("pdf")} disabled={busy} data-testid="export-pdf"
              className="inline-flex items-center gap-2 rounded-full border border-tl-gray/20 px-5 py-3 text-sm text-white transition-colors hover:border-tl-blue hover:bg-tl-blue/10 disabled:opacity-50">
              <FileText className="h-4 w-4 text-tl-crit" /> {busy === "pdf" ? "Generating…" : "Generate PDF"}
            </button>
            <button onClick={() => genReport("excel")} disabled={busy} data-testid="export-excel"
              className="inline-flex items-center gap-2 rounded-full border border-tl-gray/20 px-5 py-3 text-sm text-white transition-colors hover:border-tl-blue hover:bg-tl-blue/10 disabled:opacity-50">
              <FileSpreadsheet className="h-4 w-4 text-tl-safe" /> {busy === "excel" ? "Generating…" : "Generate Excel"}
            </button>
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
