import { Link } from "react-router-dom";
import { Brand } from "./Navbar";

export default function Footer() {
  return (
    <footer className="relative border-t border-tl-gray/10 bg-tl-bg" data-testid="footer">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-12">
        <div className="lg:col-span-1">
          <Brand />
          <p className="mt-4 max-w-xs text-sm text-tl-gray/60">See the threat before it spreads. Automated emerging cyber threat identification.</p>
        </div>
        <FooterCol title="Platform" links={[
          ["Platform", "/platform"], ["Scanner", "/scanner"], ["Intelligence", "/intelligence"],
          ["Emerging Threats", "/emerging-threats"],
        ]} />
        <FooterCol title="Operate" links={[
          ["Dashboard", "/dashboard"], ["Reports", "/reports"], ["Alerts", "/alerts"], ["About", "/about"],
        ]} />
        <div>
          <h4 className="tl-eyebrow mb-4">Security</h4>
          <ul className="space-y-2.5 text-sm text-tl-gray/60">
            <li>Authentication</li>
            <li>Privacy</li>
            <li>Responsible Use</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-tl-gray/10 px-6 py-6 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs text-tl-gray/40 sm:flex-row">
          <span>© {new Date().getFullYear()} ThreatLens · Automated Emerging Cyber Threat Identification</span>
          <span className="font-mono">THREATLENS / SIGNAL INTELLIGENCE</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="tl-eyebrow mb-4">{title}</h4>
      <ul className="space-y-2.5 text-sm">
        {links.map(([l, to]) => (
          <li key={l}><Link to={to} className="text-tl-gray/60 transition-colors hover:text-white">{l}</Link></li>
        ))}
      </ul>
    </div>
  );
}
