import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Brand } from "@/components/layout/Navbar";
import ThreatCore from "@/components/visuals/ThreatCore";

function AuthShell({ children, title, sub }) {
  return (
    <div className="grid min-h-screen bg-tl-bg lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-tl-gray/10 tl-radial lg:block">
        <div className="absolute inset-0 tl-grid-bg opacity-50" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Brand />
          <ThreatCore height={420} />
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight text-white">See the threat<br /><span className="text-tl-blue2">before it spreads.</span></h2>
            <p className="mt-3 max-w-sm text-sm text-tl-gray/60">Automated emerging cyber threat identification across six indicator types and five intelligence providers.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Brand /></div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-sm text-tl-gray/55">{sub}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}

export function Field({ icon: Icon, label, testid, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wider text-tl-gray/70">{label}</span>
      <span className="relative block">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tl-gray/40" />}
        <input {...props} data-testid={testid}
          className="w-full rounded-xl border border-tl-gray/15 bg-tl-navy/30 py-3 pl-10 pr-4 text-sm text-white placeholder-tl-gray/35 outline-none transition-colors focus:border-tl-blue focus:ring-2 focus:ring-tl-blue/25" />
      </span>
    </label>
  );
}

export default function Login() {
  const { login, formatApiError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Sign in" sub="Access your ThreatLens command center.">
      <form onSubmit={submit} className="space-y-4" data-testid="login-form">
        <Field icon={Mail} label="EMAIL" type="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" testid="login-email" />
        <Field icon={Lock} label="PASSWORD" type="password" required value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" testid="login-password" />
        {error && <div data-testid="login-error" className="rounded-lg border border-tl-crit/30 bg-tl-crit/10 px-3 py-2.5 text-xs text-tl-crit">{error}</div>}
        <button type="submit" disabled={loading} data-testid="login-submit"
          className="tl-btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold tracking-wide disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>SIGN IN <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-tl-gray/55">
        No account? <Link to="/register" data-testid="to-register" className="font-semibold text-tl-blue2 hover:text-white">Create account</Link>
      </p>
    </AuthShell>
  );
}
