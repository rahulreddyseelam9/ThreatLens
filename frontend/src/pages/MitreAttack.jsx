import { useState } from "react";
import { motion } from "framer-motion";
import { Grid3x3, Info } from "lucide-react";
import AppLayout, { PageHeader } from "@/components/layout/AppLayout";

// Public MITRE ATT&CK reference (enterprise). Not per-scan sightings.
const TACTICS = [
  { name: "Reconnaissance", techniques: [["T1595", "Active Scanning"], ["T1592", "Gather Victim Host Information"]] },
  { name: "Resource Development", techniques: [["T1583.001", "Acquire Infrastructure: Domains"], ["T1608", "Stage Capabilities"]] },
  { name: "Initial Access", techniques: [["T1566.002", "Phishing: Spearphishing Link"], ["T1190", "Exploit Public-Facing App"]] },
  { name: "Execution", techniques: [["T1204.002", "User Execution: Malicious File"], ["T1059", "Command & Scripting Interpreter"]] },
  { name: "Defense Evasion", techniques: [["T1027", "Obfuscated Files or Information"], ["T1140", "Deobfuscate/Decode"]] },
  { name: "Command and Control", techniques: [["T1071", "Application Layer Protocol"], ["T1105", "Ingress Tool Transfer"]] },
];

const DETAIL = {
  T1595: "Adversaries may execute active reconnaissance scans to gather information for targeting.",
  T1592: "Adversaries may gather information about victim hosts prior to compromise.",
  "T1583.001": "Adversaries may acquire domains that can be used during targeting.",
  T1608: "Adversaries may upload, install, or otherwise set up capabilities for use during targeting.",
  "T1566.002": "Adversaries may send spearphishing messages with a malicious link to gain access.",
  T1190: "Adversaries may exploit a weakness in an Internet-facing host or system.",
  "T1204.002": "An adversary may rely upon a user opening a malicious file to gain execution.",
  T1059: "Adversaries may abuse command and script interpreters to execute commands.",
  T1027: "Adversaries may attempt to make an executable or file difficult to detect.",
  T1140: "Adversaries may use obfuscated files to hide artifacts of an intrusion.",
  T1071: "Adversaries may communicate using application layer protocols to blend in.",
  T1105: "Adversaries may transfer tools or files from an external system.",
};

export default function MitreAttack() {
  const [sel, setSel] = useState(null);
  return (
    <AppLayout>
      <PageHeader eyebrow="Module 08 · Threat Context" title="MITRE ATT&CK context"
        sub="Reference tactics and techniques used to contextualize indicators. Per-scan associations are heuristic and require corroborating provider intelligence." />

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-tl-blue/20 bg-tl-blue/5 px-4 py-3 text-xs text-tl-gray/70" data-testid="mitre-note">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-tl-blue2" />
        ThreatLens does not invent technique mappings. The matrix below is public ATT&CK reference data; confirmed sightings require live provider telemetry.
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="mitre-matrix">
        {TACTICS.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.05 }} className="tl-glass rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Grid3x3 className="h-4 w-4 text-tl-blue2" />
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">{t.name}</h3>
            </div>
            <div className="space-y-2">
              {t.techniques.map(([id, name]) => (
                <button key={id} onClick={() => setSel({ id, name })} data-testid={`mitre-tech-${id}`}
                  className="w-full rounded-lg border border-tl-gray/10 bg-tl-navy/20 px-3 py-2.5 text-left transition-colors hover:border-tl-blue/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-tl-blue2">{id}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-tl-gray/70">{name}</div>
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {sel && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mt-6 tl-glass rounded-2xl p-6" data-testid="mitre-detail">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-tl-blue/15 px-3 py-1 font-mono text-sm text-tl-blue2">{sel.id}</span>
            <h3 className="font-display text-lg font-semibold text-white">{sel.name}</h3>
          </div>
          <p className="mt-3 text-sm text-tl-gray/65">{DETAIL[sel.id]}</p>
          <p className="mt-3 text-[11px] text-tl-gray/40">Evidence / related indicators are shown on a scan result when provider intelligence confirms an association.</p>
        </motion.div>
      )}
    </AppLayout>
  );
}
