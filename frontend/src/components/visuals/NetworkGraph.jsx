import { useState } from "react";
import { motion } from "framer-motion";
import { severityColor } from "@/lib/format";

const TYPE_COLOR = {
  ip: "#4DABF7", domain: "#4D5DB3", url: "#B9C3D6",
  hash: "#B16258", email: "#B16258", analytical: "#8B5CF6",
};

// Interactive related-IOC network graph (SVG force-less radial layout).
export default function NetworkGraph({ primary = "PRIMARY IOC", nodes = [], onSelect }) {
  const [hover, setHover] = useState(null);
  const w = 640, h = 420, cx = w / 2, cy = h / 2;
  const R = 150;

  const placed = nodes.slice(0, 8).map((n, i, arr) => {
    const angle = (i / Math.max(1, arr.length)) * Math.PI * 2 - Math.PI / 2;
    const radius = R + (i % 2 ? 40 : 0);
    return { ...n, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius * 0.8 };
  });

  const colorFor = (n) =>
    n.relationship === "analytical" ? TYPE_COLOR.analytical : severityColor(n.classification);

  return (
    <div className="w-full overflow-x-auto" data-testid="ioc-network-graph">
      <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto w-full max-w-3xl">
        {placed.map((n, i) => {
          const c = colorFor(n);
          return (
            <motion.line key={`l${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y}
              stroke={c} strokeWidth={hover === i ? 2 : 1} strokeOpacity={hover === i ? 0.9 : 0.35}
              initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.06 }} />
          );
        })}

        {/* center */}
        <circle cx={cx} cy={cy} r={34} fill="rgba(20,27,212,0.25)" stroke="#141BD4" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={10} fill="#dfe4ff" className="tl-pulse" />
        <text x={cx} y={cy + 52} textAnchor="middle" fill="#B9C3D6" fontSize="10"
          fontFamily="Space Grotesk" className="uppercase tracking-wider">Primary IOC</text>

        {placed.map((n, i) => {
          const c = colorFor(n);
          return (
            <g key={`n${i}`} style={{ cursor: onSelect ? "pointer" : "default" }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              onClick={() => onSelect && onSelect(n)} data-testid={`graph-node-${i}`}>
              <motion.circle cx={n.x} cy={n.y} r={hover === i ? 13 : 10} fill={`${c}22`} stroke={c}
                strokeWidth="1.5" initial={{ scale: 0 }} whileInView={{ scale: 1 }}
                viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 200 }} />
              {hover === i && (
                <g>
                  <rect x={n.x + 14} y={n.y - 26} width={Math.min(220, (n.ioc?.length || 6) * 6.4 + 20)} height="38" rx="6"
                    fill="rgba(2,2,7,0.95)" stroke={c} strokeOpacity="0.5" />
                  <text x={n.x + 22} y={n.y - 12} fill="#fff" fontSize="9" fontFamily="monospace">
                    {(n.ioc || "").slice(0, 30)}
                  </text>
                  <text x={n.x + 22} y={n.y + 2} fill={c} fontSize="9" fontFamily="Space Grotesk">
                    {n.type?.toUpperCase()} · {n.classification} · {n.risk_score}
                  </text>
                </g>
              )}
              <text x={n.x} y={n.y + 24} textAnchor="middle" fill="#B9C3D6" fontSize="8" fontFamily="monospace">
                {n.type?.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-[10px] font-mono text-tl-gray/60">
        <Legend c="#4DABF7" t="Normal intelligence" />
        <Legend c="#FF9F43" t="High risk" />
        <Legend c="#FF4D67" t="Critical" />
        <Legend c="#8B5CF6" t="Analytical / AI" />
      </div>
    </div>
  );
}

function Legend({ c, t }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} /> {t}
    </span>
  );
}
