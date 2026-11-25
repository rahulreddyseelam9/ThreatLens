import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb } from "lucide-react";
import AppLayout, { PageHeader } from "@/components/layout/AppLayout";
import { recApi } from "@/api";
import { formatApiError } from "@/api/client";
import { Loader, ErrorState, EmptyState } from "@/components/common/primitives";
import { RecommendationCard } from "@/components/product/blocks";

export default function Recommendations() {
  const navigate = useNavigate();
  const [recs, setRecs] = useState(null);
  const [error, setError] = useState("");
  const load = async () => {
    setError("");
    try { const d = await recApi.list(); setRecs(d.recommendations); } catch (e) { setError(formatApiError(e)); }
  };
  useEffect(() => { load(); }, []);

  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;
  if (!recs) return <AppLayout><Loader label="Compiling recommendations…" /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader eyebrow="Module 09 · Recommendations" title="From detection to action."
        sub="Prioritized, evidence-backed actions derived from your scanned indicators." />
      {recs.length === 0 ? (
        <EmptyState icon={Lightbulb} title="NO RECOMMENDATIONS YET"
          message="Recommendations appear after you scan indicators."
          action={<button onClick={() => navigate("/scanner")} className="tl-btn-primary mt-2 px-5 py-2.5 text-xs font-semibold">Scan an indicator</button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recs.map((r, i) => <RecommendationCard key={i} rec={r} index={i} />)}
        </div>
      )}
    </AppLayout>
  );
}
