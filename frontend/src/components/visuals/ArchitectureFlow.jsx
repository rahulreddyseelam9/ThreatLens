import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

// Vertical animated architecture flow used on About / Platform pages.
export default function ArchitectureFlow({ steps }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-stretch gap-1" data-testid="architecture-flow">
      {steps.map((s, i) => (
        <div key={s.label}>
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="tl-glass rounded-xl px-5 py-3.5 text-center">
            <div className="font-display text-sm font-semibold tracking-wide text-white">{s.label}</div>
            {s.hint && <div className="mt-0.5 text-xs text-tl-gray/55">{s.hint}</div>}
          </motion.div>
          {i < steps.length - 1 && (
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 + 0.1 }} className="flex justify-center py-1">
              <ArrowDown className="h-4 w-4 text-tl-blue2/60" />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}
