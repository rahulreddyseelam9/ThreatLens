import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, ShieldCheck, Radar, GitBranch, Brain, Gauge, Lightbulb,
  FileDown, Network, ScanLine, Cpu, Layers,
} from "lucide-react";
import MarketingLayout from "@/components/layout/MarketingLayout";
import ThreatCore from "@/components/visuals/ThreatCore";
import ArchitectureFlow from "@/components/visuals/ArchitectureFlow";
import { Reveal, Stagger, staggerItem } from "@/components/common/Reveal";
import { Eyebrow, GlassCard } from "@/components/common/primitives";

const PIPELINE = [
  { label: "COLLECT" }, { label: "NORMALIZE" }, { label: "CORRELATE" },
  { label: "ANALYZE" }, { label: "RISK" }, { label: "AI" }, { label: "EMERGING THREAT" },
];

const SECTIONS = [
  { icon: Network, kicker: "THREAT INTELLIGENCE", title: "Threat intelligence without blind spots.",
    body: "Query VirusTotal, AbuseIPDB, AlienVault OTX, URLHaus and Cisco Talos through one interface. Availability, clean, positive, and error states stay distinct — an unavailable source is never treated as safe." },
  { icon: GitBranch, kicker: "INTELLIGENCE FUSION", title: "From signals to one threat profile.",
    body: "Multi-source evidence is normalized and correlated into a single profile with source agreement, evidence strength and multi-source confirmation surfaced transparently." },
  { icon: Gauge, kicker: "RISK ENGINE", title: "Turn evidence into risk.",
    body: "A calibrated 0–100 risk score with SAFE, LOW, MEDIUM, HIGH and CRITICAL bands — driven by the backend risk engine, never a conflicting client-side score." },
  { icon: Brain, kicker: "EXPLAINABLE AI", title: "AI that explains its decision.",
    body: "Every classification exposes the features and evidence behind it. Predictions are early signals to investigate — never presented as guaranteed verdicts." },
  { icon: Radar, kicker: "EMERGING THREATS", title: "See the signal before it spreads.",
    body: "Recency, related-indicator counts and provider confirmation combine into an emerging-threat signal that flags high-risk indicators as they surface." },
  { icon: Lightbulb, kicker: "RECOMMENDATIONS", title: "From detection to action.",
    body: "Prioritized recommendations — investigate, block, monitor, review — each with a reason, related indicators and a concrete suggested action." },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <MarketingLayout>
      {/* HERO */}
      <section className="relative overflow-hidden tl-radial">
        <div className="absolute inset-0 tl-grid-bg opacity-60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-2 lg:gap-6 lg:px-12 lg:pb-28 lg:pt-40">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Eyebrow className="mb-5">Automated Emerging Cyber Threat Identification</Eyebrow>
            </motion.div>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {["SEE THE THREAT", "BEFORE IT SPREADS."].map((line, i) => (
                <motion.span key={line} className="block"
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}>
                  {i === 1 ? <span className="text-tl-blue2">{line}</span> : line}
                </motion.span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="mt-6 max-w-xl text-base text-tl-gray/70 sm:text-lg">
              AI-powered emerging cyber threat intelligence that collects, correlates and analyzes threat signals to identify high-risk and emerging indicators.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="mt-9 flex flex-wrap items-center gap-4">
              <button data-testid="hero-start-scanning" onClick={() => navigate("/scanner")}
                className="tl-btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold tracking-wide">
                START SCANNING <ArrowRight className="h-4 w-4" />
              </button>
              <Link to="/intelligence" data-testid="hero-explore-intel"
                className="inline-flex items-center gap-2 rounded-full border border-tl-gray/20 px-7 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:border-tl-blue hover:bg-tl-blue/10">
                EXPLORE INTELLIGENCE
              </Link>
            </motion.div>
            <div className="mt-10 flex items-center gap-6 font-mono text-[11px] text-tl-gray/40">
              <span>THREATLENS / 01</span>
              <span className="h-px w-16 bg-tl-gray/20" />
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-tl-safe" /> 6 IOC TYPES · 5 PROVIDERS</span>
            </div>
          </div>

          <div className="relative">
            <ThreatCore height={480} />
            <div className="pointer-events-none absolute bottom-0 left-1/2 hidden -translate-x-1/2 flex-wrap justify-center gap-2 sm:flex">
              {PIPELINE.map((p) => (
                <span key={p.label} className="rounded-full border border-tl-gray/15 bg-tl-navy/40 px-3 py-1 font-mono text-[9px] tracking-wider text-tl-gray/60">{p.label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IOC types strip */}
      <section className="border-y border-tl-gray/10 bg-tl-navy/20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-6 lg:px-12">
          <span className="tl-eyebrow">Supported indicators</span>
          {["IP", "URL", "DOMAIN", "MD5", "SHA1", "SHA256"].map((t) => (
            <span key={t} className="font-mono text-sm font-semibold tracking-wider text-tl-gray/70">{t}</span>
          ))}
        </div>
      </section>

      {/* SCAN THE SIGNAL */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-12 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow className="mb-4">IOC Scanner</Eyebrow>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Scan the signal.</h2>
            <p className="mt-4 max-w-lg text-base text-tl-gray/65">
              Submit an indicator and collect available threat intelligence from multiple sources. ThreatLens validates, collects, correlates, analyzes and generates a risk profile — in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["VALIDATING", "COLLECTING", "CORRELATING", "ANALYZING", "GENERATING RISK"].map((s, i) => (
                <motion.span key={s} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="rounded-full border border-tl-blue/25 bg-tl-blue/5 px-3 py-1.5 font-mono text-[10px] tracking-wider text-tl-blue2">{s}</motion.span>
              ))}
            </div>
            <button onClick={() => navigate("/scanner")} data-testid="home-open-scanner"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-tl-blue2">
              Open the scanner <ArrowRight className="h-4 w-4" />
            </button>
          </Reveal>
          <Reveal delay={0.15}>
            <GlassCard hover={false} className="p-6">
              <div className="flex items-center gap-2 border-b border-tl-gray/10 pb-4">
                <ScanLine className="h-4 w-4 text-tl-blue2" />
                <span className="font-mono text-xs text-tl-gray/60">threatlens · scan</span>
              </div>
              <div className="mt-5 rounded-xl border border-tl-gray/15 bg-tl-bg/50 px-4 py-3 font-mono text-sm text-white">45.133.1.101</div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[["RISK", "72"], ["CLASS", "HIGH"], ["CONF", "68%"]].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-tl-gray/10 bg-tl-navy/30 px-3 py-3 text-center">
                    <div className="font-mono text-[10px] text-tl-gray/50">{k}</div>
                    <div className="mt-1 font-display text-lg font-bold text-tl-high">{v}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-tl-gray/40">Illustrative preview. Live results come from the ThreatLens backend.</p>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      {/* CAPABILITY SECTIONS */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-12">
        <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.title} variants={staggerItem}>
                <GlassCard className="h-full p-6">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-tl-blue/15 text-tl-blue2 ring-1 ring-tl-blue/30">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-5 tl-eyebrow">{s.kicker}</div>
                  <h3 className="mt-2 font-display text-xl font-semibold text-white">{s.title}</h3>
                  <p className="mt-3 text-sm text-tl-gray/60">{s.body}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </Stagger>
      </section>

      {/* PIPELINE / ARCHITECTURE */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-12 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <Eyebrow className="mb-4">The Engine</Eyebrow>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">One platform. Multiple threat signals.</h2>
            <p className="mt-4 max-w-lg text-base text-tl-gray/65">
              Every indicator flows through a transparent, auditable pipeline — from raw collection to an emerging-threat signal — with the backend as the single source of truth.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[[Cpu, "Risk Engine"], [Brain, "AI/ML"], [Layers, "Fusion"], [FileDown, "Reports"]].map(([Ic, l]) => (
                <div key={l} className="rounded-xl border border-tl-gray/10 bg-tl-navy/25 px-3 py-4 text-center">
                  <Ic className="mx-auto h-5 w-5 text-tl-blue2" />
                  <div className="mt-2 text-xs text-tl-gray/60">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <ArchitectureFlow steps={PIPELINE.map((p) => ({ label: p.label }))} />
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-tl-gray/10 tl-radial">
        <div className="absolute inset-0 tl-grid-bg opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
          <Reveal>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              SEE THE THREAT.<br />UNDERSTAND THE SIGNAL.<br /><span className="text-tl-blue2">ACT WITH CONFIDENCE.</span>
            </h2>
            <button data-testid="cta-enter-threatlens" onClick={() => navigate("/register")}
              className="tl-btn-primary mt-10 inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold tracking-wide">
              ENTER THREATLENS <ArrowRight className="h-4 w-4" />
            </button>
          </Reveal>
        </div>
      </section>
    </MarketingLayout>
  );
}
