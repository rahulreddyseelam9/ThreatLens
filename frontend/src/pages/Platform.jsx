import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ScanLine, Network, GitBranch, Brain, Radar, Lightbulb, FileText, BellRing, ArrowRight,
} from "lucide-react";
import MarketingLayout from "@/components/layout/MarketingLayout";
import ArchitectureFlow from "@/components/visuals/ArchitectureFlow";
import { Reveal, Stagger, staggerItem } from "@/components/common/Reveal";
import { Eyebrow, GlassCard } from "@/components/common/primitives";

const MODULES = [
  { icon: ScanLine, title: "IOC Scanning", body: "Validate and scan IP, URL, domain and hash indicators individually or in bulk." },
  { icon: Network, title: "Threat Intelligence", body: "Query five providers with distinct availability, clean, positive and error states." },
  { icon: GitBranch, title: "Intelligence Fusion", body: "Normalize and correlate multi-source evidence into one threat profile." },
  { icon: Brain, title: "AI Analysis", body: "A heuristic classifier predicts SAFE / SUSPICIOUS / MALICIOUS with explainability." },
  { icon: Radar, title: "Emerging Threats", body: "Surface indicators trending toward high risk before they spread widely." },
  { icon: Lightbulb, title: "Recommendations", body: "Prioritized, evidence-backed actions: investigate, block, monitor, review." },
  { icon: FileText, title: "Reports", body: "Export signed intelligence reports in PDF or Excel for stakeholders." },
  { icon: BellRing, title: "Alerts", body: "High and critical findings can trigger configured email alerts." },
];

const PIPELINE = [
  { label: "COLLECT", hint: "Gather provider signals" },
  { label: "NORMALIZE", hint: "Unify formats" },
  { label: "CORRELATE", hint: "Cross-source evidence" },
  { label: "ANALYZE", hint: "Heuristic + AI" },
  { label: "RISK", hint: "0–100 score" },
  { label: "EMERGING THREAT", hint: "Early signal" },
];

export default function Platform() {
  const navigate = useNavigate();
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden tl-radial">
        <div className="absolute inset-0 tl-grid-bg opacity-50" />
        <div className="relative mx-auto max-w-4xl px-6 pb-14 pt-36 text-center lg:pt-44">
          <Reveal>
            <Eyebrow className="mb-4">The ThreatLens Platform</Eyebrow>
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              One platform.<br /><span className="text-tl-blue2">Multiple threat signals.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-tl-gray/65 sm:text-lg">
              ThreatLens connects scanning, intelligence, fusion, AI, emerging-threat detection, recommendations, reports and alerts into one auditable pipeline.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-12">
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <motion.div key={m.title} variants={staggerItem}>
                <GlassCard className="h-full p-6">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-tl-blue/15 text-tl-blue2 ring-1 ring-tl-blue/30">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-white">{m.title}</h3>
                  <p className="mt-2 text-sm text-tl-gray/60">{m.body}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </Stagger>
      </section>

      <section className="border-t border-tl-gray/10 bg-tl-navy/15">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-12 lg:py-28">
          <Reveal>
            <Eyebrow className="mb-4">The Pipeline</Eyebrow>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">A transparent path from signal to decision.</h2>
            <p className="mt-4 max-w-lg text-base text-tl-gray/65">
              Each indicator flows through a deterministic pipeline. The backend remains the single source of truth for classification and risk — the client never invents evidence.
            </p>
            <button onClick={() => navigate("/scanner")} className="tl-btn-primary mt-8 inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold tracking-wide">
              START SCANNING <ArrowRight className="h-4 w-4" />
            </button>
          </Reveal>
          <Reveal delay={0.15}><ArchitectureFlow steps={PIPELINE} /></Reveal>
        </div>
      </section>
    </MarketingLayout>
  );
}
