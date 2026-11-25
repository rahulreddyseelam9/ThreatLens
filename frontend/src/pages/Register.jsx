import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, User, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Field } from "./Login";

import { motion } from "framer-motion";
import { Brand } from "@/components/layout/Navbar";
import ThreatCore from "@/components/visuals/ThreatCore";

export default function Register() {
  const { register, formatApiError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await register({ username: form.username, email: form.email, password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally { setLoading(false); }
  };

  return (
    <div className="grid min-h-screen bg-tl-bg lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-tl-gray/10 tl-radial lg:block">
        <div className="absolute inset-0 tl-grid-bg opacity-50" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Brand />
          <ThreatCore height={420} />
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight text-white">Deploy your<br /><span className="text-tl-blue2">threat intelligence.</span></h2>
            <p className="mt-3 max-w-sm text-sm text-tl-gray/60">Create an account to start scanning indicators and tracking emerging threats.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Brand /></div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Create account</h1>
          <p className="mt-2 text-sm text-tl-gray/55">Join ThreatLens in under a minute.</p>
          <form onSubmit={submit} className="mt-8 space-y-4" data-testid="register-form">
            <Field icon={User} label="USERNAME" required value={form.username} onChange={set("username")} placeholder="analyst" testid="register-username" />
            <Field icon={Mail} label="EMAIL" type="email" required value={form.email} onChange={set("email")} placeholder="you@company.com" testid="register-email" />
            <Field icon={Lock} label="PASSWORD" type="password" required value={form.password} onChange={set("password")} placeholder="••••••••" testid="register-password" />
            <Field icon={Lock} label="CONFIRM PASSWORD" type="password" required value={form.confirm} onChange={set("confirm")} placeholder="••••••••" testid="register-confirm" />
            {error && <div data-testid="register-error" className="rounded-lg border border-tl-crit/30 bg-tl-crit/10 px-3 py-2.5 text-xs text-tl-crit">{error}</div>}
            <button type="submit" disabled={loading} data-testid="register-submit"
              className="tl-btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold tracking-wide disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>CREATE ACCOUNT <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-tl-gray/55">
            Already have an account? <Link to="/login" data-testid="to-login" className="font-semibold text-tl-blue2 hover:text-white">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
