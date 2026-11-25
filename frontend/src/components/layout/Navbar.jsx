import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ScanLine } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/platform", label: "PLATFORM" },
  { to: "/scanner", label: "SCANNER" },
  { to: "/intelligence", label: "INTELLIGENCE" },
  { to: "/emerging-threats", label: "EMERGING THREATS" },
  { to: "/reports", label: "REPORTS" },
  { to: "/about", label: "ABOUT" },
];

export function Brand({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-3" data-testid="brand-logo">
      <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-tl-blue/15 ring-1 ring-tl-blue/40">
        <ScanLine className="h-5 w-5 text-tl-blue2" />
        <span className="absolute inset-0 rounded-lg ring-1 ring-tl-blue/30 tl-pulse" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-lg font-bold tracking-tight text-white">THREATLENS</span>
        {!compact && <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.22em] text-tl-blue2">AI CYBER THREAT INTELLIGENCE</span>}
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <header
      data-testid="main-navbar"
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-tl-gray/15 bg-tl-bg/85 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-12">
        <Brand />
        <div className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => {
            const active = location.pathname === n.to;
            return (
              <Link key={n.to} to={n.to} data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`relative text-xs font-semibold tracking-wider transition-colors ${active ? "text-white" : "text-tl-gray/70 hover:text-white"}`}>
                {n.label}
                {active && <motion.span layoutId="nav-underline" className="absolute -bottom-1.5 left-0 h-0.5 w-full bg-tl-blue" />}
              </Link>
            );
          })}
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <button data-testid="nav-dashboard-btn" onClick={() => navigate("/dashboard")}
              className="tl-btn-primary px-5 py-2 text-xs font-semibold tracking-wide">COMMAND CENTER</button>
          ) : (
            <>
              <button data-testid="nav-login-btn" onClick={() => navigate("/login")}
                className="rounded-full px-4 py-2 text-xs font-semibold tracking-wide text-tl-gray transition-colors hover:text-white">LOGIN</button>
              <button data-testid="nav-getstarted-btn" onClick={() => navigate("/register")}
                className="tl-btn-primary px-5 py-2 text-xs font-semibold tracking-wide">GET STARTED</button>
            </>
          )}
        </div>
        <button data-testid="nav-mobile-toggle" onClick={() => setOpen((o) => !o)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-tl-gray/15 text-white lg:hidden" aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-tl-gray/10 bg-tl-bg/95 backdrop-blur-xl lg:hidden" data-testid="mobile-menu">
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="rounded-lg px-3 py-3 text-sm font-semibold tracking-wide text-tl-gray hover:bg-tl-navy/40 hover:text-white">{n.label}</Link>
              ))}
              <div className="mt-2 flex gap-3">
                {user ? (
                  <button onClick={() => navigate("/dashboard")} className="tl-btn-primary flex-1 py-2.5 text-xs font-semibold">COMMAND CENTER</button>
                ) : (
                  <>
                    <button onClick={() => navigate("/login")} className="flex-1 rounded-full border border-tl-gray/20 py-2.5 text-xs font-semibold text-white">LOGIN</button>
                    <button onClick={() => navigate("/register")} className="tl-btn-primary flex-1 py-2.5 text-xs font-semibold">GET STARTED</button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
