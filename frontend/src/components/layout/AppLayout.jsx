import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ScanLine, Layers, Network, Brain, Radar, GitBranch,
  History as HistoryIcon, Lightbulb, FileText, BellRing, Grid3x3, LogOut, Menu, X, ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Brand } from "./Navbar";

const GROUPS = [
  {
    title: "Operate",
    items: [
      { to: "/dashboard", label: "Command Center", icon: LayoutDashboard },
      { to: "/scanner", label: "IOC Scanner", icon: ScanLine },
      { to: "/batch-scanner", label: "Batch Scanner", icon: Layers },
      { to: "/history", label: "Scan History", icon: HistoryIcon },
    ],
  },
  {
    title: "Analyze",
    items: [
      { to: "/intelligence", label: "Threat Intelligence", icon: Network },
      { to: "/fusion", label: "Intelligence Fusion", icon: GitBranch },
      { to: "/ai-analysis", label: "AI Analysis", icon: Brain },
      { to: "/emerging-threats", label: "Emerging Threats", icon: Radar },
      { to: "/mitre-attack", label: "MITRE ATT&CK", icon: Grid3x3 },
    ],
  },
  {
    title: "Act",
    items: [
      { to: "/recommendations", label: "Recommendations", icon: Lightbulb },
      { to: "/alerts", label: "Alerts", icon: BellRing },
      { to: "/reports", label: "Reports", icon: FileText },
    ],
  },
];

function SidebarContent({ onNavigate }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Brand />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="px-3 pb-2 tl-eyebrow">{g.title}</div>
            <div className="space-y-1">
              {g.items.map((it) => {
                const active = location.pathname === it.to;
                const Icon = it.icon;
                return (
                  <Link key={it.to} to={it.to} onClick={onNavigate}
                    data-testid={`side-${it.to.replace("/", "")}`}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active ? "bg-tl-blue/15 text-white ring-1 ring-tl-blue/40" : "text-tl-gray/70 hover:bg-tl-navy/40 hover:text-white"
                    }`}>
                    <Icon className={`h-4 w-4 ${active ? "text-tl-blue2" : "text-tl-gray/50 group-hover:text-tl-blue2"}`} />
                    {it.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-tl-gray/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-tl-blue/20 text-xs font-bold text-tl-blue2">
            {(user?.username || user?.email || "A")[0].toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-white">{user?.username || "Analyst"}</div>
            <div className="truncate text-[10px] text-tl-gray/50">{user?.email}</div>
          </div>
          <button data-testid="logout-btn" onClick={async () => { await logout(); navigate("/"); }}
            className="grid h-8 w-8 place-items-center rounded-lg text-tl-gray/60 transition-colors hover:bg-tl-crit/10 hover:text-tl-crit" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-tl-bg tl-grid-bg">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-tl-gray/10 bg-tl-bg/95 backdrop-blur-xl lg:block" data-testid="app-sidebar">
        <SidebarContent />
      </aside>

      {/* mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-tl-gray/10 bg-tl-bg/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Brand compact />
        <button data-testid="app-mobile-toggle" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg border border-tl-gray/15 text-white" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-black/60 lg:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-tl-gray/10 bg-tl-bg lg:hidden">
              <button onClick={() => setOpen(false)} className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-tl-gray" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="lg:pl-64" data-testid="app-main">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, sub, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="tl-eyebrow mb-2 flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5" />{eyebrow}</div>}
        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-sm text-tl-gray/60">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
