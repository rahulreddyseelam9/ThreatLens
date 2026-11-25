import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import MarketingLayout from "@/components/layout/MarketingLayout";
import ArchitectureFlow from "@/components/visuals/ArchitectureFlow";
import ThreatCore from "@/components/visuals/ThreatCore";
import { Reveal } from "@/components/common/Reveal";
import { Eyebrow, GlassCard } from "@/components/common/primitives";

const ARCH = [
  { label: "USER" }, { label: "AUTHENTICATION" }, { label: "IOC" }, { label: "THREAT INTELLIGENCE" },
  { label: "NORMALIZATION" }, { label: "CORRELATION" }, { label: "RISK ENGINE" }, { label: "AI" },
  { label: "EMERGING THREAT DETECTION" }, { label: "RECOMMENDATIONS" }, { label: "REPORTS / ALERTS" },
];

const PRINCIPLES = [
  ["Backend authoritative", "Classification and risk are computed server-side. The client never overrides the backend verdict."],
  ["Honest provider states", "Availability, clean, positive, error and unavailable are kept distinct. An unavailable source is never treated as safe."],
  ["Explainable by default", "Every AI decision exposes the features and evidence behind it — predictions are signals, not guarantees."],
  ["No fabricated evidence", "ThreatLens never invents provider verdicts or MITRE mappings. What isn't confirmed is clearly labeled."],
];

export default function About() {
  const navigate = useNavigate();
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden tl-radial">
        <div className="absolute inset-0 tl-grid-bg opacity-50" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-36 sm:px-6 lg:grid-cols-2 lg:px-12 lg:pt-44">
          <Reveal>
            <Eyebrow className="mb-4">About</Eyebrow>
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
              The ThreatLens<br /><span className="text-tl-blue2">intelligence engine.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-tl-gray/65">
              ThreatLens delivers Automated Emerging Cyber Threat Identification — collecting, normalizing, correlating and analyzing threat signals to surface high-risk and emerging indicators before they spread.
            </p>
            <button onClick={() => navigate("/register")} className="tl-btn-primary mt-8 inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold tracking-wide">
              ENTER THREATLENS <ArrowRight className="h-4 w-4" />
            </button>
          </Reveal>
          <Reveal delay={0.15}><ThreatCore height={400} /></Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-2">
          <div>
            <Eyebrow className="mb-4">Architecture</Eyebrow>
            <h2 className="mb-8 font-display text-3xl font-bold tracking-tight text-white">A layered, auditable engine.</h2>
            <ArchitectureFlow steps={ARCH} />
          </div>
          <div>
            <Eyebrow className="mb-4">Principles</Eyebrow>
            <h2 className="mb-8 font-display text-3xl font-bold tracking-tight text-white">Built to be trusted.</h2>
            <div className="space-y-4">
              {PRINCIPLES.map(([t, b], i) => (
                <Reveal key={t} delay={i * 0.05}>
                  <GlassCard className="p-5">
                    <h3 className="font-display text-base font-semibold text-white">{t}</h3>
                    <p className="mt-2 text-sm text-tl-gray/60">{b}</p>
                  </GlassCard>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
