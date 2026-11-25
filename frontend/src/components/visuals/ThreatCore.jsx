import { useEffect, useRef } from "react";

// Canvas-rendered ThreatLens Intelligence Core.
// Rotating rings, orbiting IOC nodes, scanning arc and connecting signals.
// Uses Canvas 2D for guaranteed stability across devices (WebGL-free).
export default function ThreatCore({ height = 460 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, cx, cy, dpr;

    const nodes = [
      { r: 0.62, a: 0, s: 0.0045, label: "IP", size: 5, color: "#4DABF7" },
      { r: 0.62, a: 1.1, s: 0.0045, label: "URL", size: 5, color: "#4D5DB3" },
      { r: 0.78, a: 2.3, s: -0.0032, label: "DOMAIN", size: 6, color: "#B9C3D6" },
      { r: 0.78, a: 3.6, s: -0.0032, label: "MD5", size: 4, color: "#4D5DB3" },
      { r: 0.92, a: 5.0, s: 0.0026, label: "SHA256", size: 5, color: "#141BD4" },
      { r: 0.92, a: 0.4, s: 0.0026, label: "SIGNAL", size: 4, color: "#4DABF7" },
      { r: 0.5, a: 4.2, s: 0.006, label: "HASH", size: 4, color: "#B16258" },
    ];
    const particles = Array.from({ length: 46 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.35 + Math.random() * 0.7,
      sp: 0.001 + Math.random() * 0.003,
      sz: Math.random() * 1.6 + 0.4,
    }));

    let t = 0;
    let scan = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = h / 2;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const base = Math.min(w, h) / 2;
      ctx.clearRect(0, 0, w, h);

      // ambient glow
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, base);
      g.addColorStop(0, "rgba(20,27,212,0.28)");
      g.addColorStop(0.5, "rgba(26,28,82,0.14)");
      g.addColorStop(1, "rgba(2,2,7,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // rotating rings
      for (let i = 0; i < 3; i++) {
        const rr = base * (0.5 + i * 0.2);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * (i % 2 ? -0.0006 : 0.0009) + i);
        ctx.beginPath();
        ctx.ellipse(0, 0, rr, rr * 0.42, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(77,93,179,${0.28 - i * 0.06})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // concentric core rings
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, base * (0.16 + i * 0.06), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(185,195,214,${0.22 - i * 0.05})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // particles
      particles.forEach((p) => {
        p.a += p.sp;
        const px = cx + Math.cos(p.a) * base * p.r;
        const py = cy + Math.sin(p.a) * base * p.r * 0.5;
        ctx.beginPath();
        ctx.arc(px, py, p.sz, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(77,93,179,0.5)";
        ctx.fill();
      });

      // connection lines + nodes
      nodes.forEach((n) => {
        n.a += reduce ? 0 : n.s;
        const nx = cx + Math.cos(n.a) * base * n.r;
        const ny = cy + Math.sin(n.a) * base * n.r * 0.5;
        const grad = ctx.createLinearGradient(cx, cy, nx, ny);
        grad.addColorStop(0, "rgba(20,27,212,0.5)");
        grad.addColorStop(1, "rgba(77,93,179,0)");
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(nx, ny, n.size, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = n.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = "9px 'Space Grotesk', monospace";
        ctx.fillStyle = "rgba(185,195,214,0.75)";
        ctx.fillText(n.label, nx + 8, ny + 3);
      });

      // scanning arc
      if (!reduce) scan += 0.02;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(scan);
      const arc = ctx.createLinearGradient(0, 0, base * 0.9, 0);
      arc.addColorStop(0, "rgba(20,27,212,0)");
      arc.addColorStop(1, "rgba(20,27,212,0.85)");
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(base * 0.9, 0);
      ctx.strokeStyle = arc;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // core
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.14);
      cg.addColorStop(0, "rgba(120,140,255,0.95)");
      cg.addColorStop(0.5, "rgba(20,27,212,0.8)");
      cg.addColorStop(1, "rgba(12,17,162,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, base * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();

      const pulse = 1 + Math.sin(t * 0.05) * 0.12;
      ctx.beginPath();
      ctx.arc(cx, cy, base * 0.06 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220,228,255,0.95)";
      ctx.fill();

      t += 1;
      if (!reduce) rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    if (reduce) draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative w-full" style={{ height }} data-testid="threat-core-visual" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full tl-float" style={{ display: "block" }} />
    </div>
  );
}
