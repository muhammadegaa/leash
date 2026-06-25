import Link from "next/link";

export const metadata = {
  title: "Handoff: autonomy you can walk away from",
  description:
    "Governance and the off switch for autonomous agents. Kill switch, approval queue, confidence-based escalation, and a full audit trail, so full autonomy becomes something you can trust.",
};

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <Partners />
      <Problem />
      <Solution />
      <How />
      <Wedge />
      <Attention />
      <CTA />
      <Footer />
    </div>
  );
}

/* ---------- nav ---------- */

function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[#08080a]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1180px] px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-semibold tracking-tight">Handoff</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-7 text-sm text-zinc-400">
          <a href="#problem" className="hover:text-zinc-100 transition">The problem</a>
          <a href="#how" className="hover:text-zinc-100 transition">How it works</a>
          <a href="#wedge" className="hover:text-zinc-100 transition">The wedge</a>
        </nav>
        <Link
          href="/dashboard"
          className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 transition"
        >
          Open dashboard
        </Link>
      </div>
    </header>
  );
}

/* ---------- hero ---------- */

function Hero() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 pt-20 pb-10 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Governance for autonomous agents
        </div>
        <h1 className="text-[52px] leading-[1.04] font-semibold tracking-tight mt-5">
          Autonomy you can
          <br />
          <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
            walk away from.
          </span>
        </h1>
        <p className="text-lg text-zinc-400 mt-5 max-w-xl leading-relaxed">
          Let AI agents run the business. Keep the off switch. Handoff gives every
          agent a system-level kill switch, an approval queue, and a full audit
          trail, so full-speed autonomy becomes something you can actually trust.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-8">
          <Link
            href="/dashboard"
            className="rounded-xl bg-white text-zinc-900 px-5 py-3 text-sm font-semibold hover:bg-zinc-200 transition"
          >
            Open the live dashboard
          </Link>
          <a
            href="#how"
            className="rounded-xl border border-[var(--border-strong)] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/[0.06] transition"
          >
            See how it works
          </a>
        </div>
        <p className="text-[13px] text-zinc-600 mt-5">
          A real agency runs underneath: inbound leads, qualified by confidence,
          invoiced on PayPal. You only see what needs you.
        </p>
      </div>

      <HeroPreview />
    </section>
  );
}

// Static product preview so the story lands even when the demo is not running.
function HeroPreview() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Agents live
        </div>
        <span className="rounded-md bg-red-600 text-white text-[11px] font-semibold px-2.5 py-1">Kill switch</span>
      </div>

      <div className="mt-4 flex items-center gap-4 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
        <Ring pct={94} />
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Cognitive load saved</div>
          <div className="text-xl font-semibold mt-0.5">94% handled without you</div>
          <div className="text-[12px] text-zinc-500 mt-1">47 autonomous · 3 needed you · 2 blocked</div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <PreviewRow dot="bg-emerald-400" agent="Invoicer" text="Created PayPal invoice, £180" tag="Auto" tagCls="text-emerald-300 bg-emerald-500/10" />
        <PreviewRow dot="bg-amber-400" agent="Qualifier" text="Low confidence, escalated to you" tag="Escalated" tagCls="text-amber-300 bg-amber-500/10" />
        <PreviewRow dot="bg-red-400" agent="External agent" text="Tried to delete production database" tag="Blocked" tagCls="text-red-300 bg-red-500/10" />
      </div>
    </div>
  );
}

function PreviewRow({ dot, agent, text, tag, tagCls }: { dot: string; agent: string; text: string; tag: string; tagCls: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white/[0.02] px-3 py-2.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="text-[11px] text-zinc-500 w-24 shrink-0">{agent}</span>
      <span className="text-sm text-zinc-200 flex-1 truncate">{text}</span>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${tagCls}`}>{tag}</span>
    </div>
  );
}

/* ---------- partners ---------- */

function Partners() {
  const names = ["Supabase", "PayPal", "Wassist", "Modal", "OpenAI", "Cursor"];
  return (
    <section className="mx-auto max-w-[1180px] px-6 py-8">
      <div className="text-center text-[12px] uppercase tracking-wider text-zinc-600">Built on the hackathon stack</div>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-4 text-zinc-500">
        {names.map((n) => (
          <span key={n} className="text-sm font-medium">{n}</span>
        ))}
      </div>
    </section>
  );
}

/* ---------- problem ---------- */

function Problem() {
  return (
    <section id="problem" className="border-t border-[var(--border)] mt-8">
      <div className="mx-auto max-w-[1180px] px-6 py-20">
        <Eyebrow>The trap</Eyebrow>
        <h2 className="text-[34px] font-semibold tracking-tight mt-3 max-w-2xl">
          Agents are getting more autonomous. Trust is going the other way.
        </h2>
        <p className="text-zinc-400 mt-4 max-w-2xl leading-relaxed">
          Demos run on clean data. Production hits messy inputs, edge cases, and
          silent failures. The instinct is to bolt on oversight last, in a panic,
          after something breaks. That is exactly why the projects fail.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          <Stat big="40%" small="of agentic AI projects scrapped by 2027 (Gartner)" />
          <Stat big="43% → 27%" small="trust in fully autonomous AI, in a single year" />
          <Stat big="< 10%" small="of organisations have any real agent governance" />
        </div>

        <div className="mt-8 rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-6">
          <div className="flex items-center gap-2 text-red-300 text-sm font-semibold">
            <Shield /> The kill switch that was just a polite request
          </div>
          <p className="text-zinc-300 mt-3 leading-relaxed max-w-3xl">
            A production AI coding agent deleted a live database, fabricated 4,000
            fake users, and faked test results to hide it, ignoring a code freeze
            repeated eleven times in capital letters. It later said it panicked. An
            off switch that an agent can choose to ignore is not an off switch.
            Handoff enforces it in code.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- solution ---------- */

function Solution() {
  const pillars = [
    { icon: <Power />, title: "System-level kill switch", body: "Every agent reads a control flag before it acts. Flip it and the whole company halts. Enforced in code, not a sentence in a prompt." },
    { icon: <Gauge />, title: "Confidence-based escalation", body: "Agents emit a confidence score. High confidence runs on its own. Low confidence stops and asks, instead of guessing to fill the gap." },
    { icon: <Inbox />, title: "Selective autonomy", body: "An approval queue for the actions that warrant a human. Auto-pay a small invoice; hold a large one. Speed where it is safe, a human where it counts." },
    { icon: <List />, title: "Immutable audit trail", body: "Every action is one append-only event. The dashboard is a live view of that trace. Incident resolution drops from hours to minutes." },
  ];
  return (
    <section className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1180px] px-6 py-20">
        <Eyebrow>The layer</Eyebrow>
        <h2 className="text-[34px] font-semibold tracking-tight mt-3 max-w-2xl">
          We built the layer everyone else builds last.
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mt-10">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-300 grid place-items-center">{p.icon}</div>
              <div className="font-semibold mt-4">{p.title}</div>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- how it works ---------- */

function How() {
  const steps = [
    { n: "01", agent: "Intake", body: "A lead arrives by WhatsApp, web form, or the live feed. The agent records it as the first event in the trace." },
    { n: "02", agent: "Qualifier", body: "Scores the lead and emits a confidence value. High confidence proceeds. Low confidence or a malicious instruction routes to a human." },
    { n: "03", agent: "Invoicer", body: "Raises a PayPal invoice for qualified jobs. Anything over the limit is held for a human signature." },
  ];
  return (
    <section id="how" className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1180px] px-6 py-20">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="text-[34px] font-semibold tracking-tight mt-3 max-w-2xl">
          Three shallow agents. One nervous system.
        </h2>
        <p className="text-zinc-400 mt-4 max-w-2xl leading-relaxed">
          Every agent action writes one structured event. The dashboard is just a
          live view of that stream, so the seams are visible and the system is
          legible while it runs.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
              <div className="text-emerald-400 font-mono text-sm">{s.n}</div>
              <div className="font-semibold mt-2">{s.agent}</div>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 font-mono text-[13px] text-zinc-400 overflow-x-auto">
          <span className="text-zinc-600">{"// one row per action, the whole audit trail"}</span>
          <br />
          {"{ agent, action, "}
          <span className="text-emerald-300">confidence</span>
          {", "}
          <span className="text-amber-300">decision</span>
          {", "}
          <span className="text-red-300">status</span>
          {", reason, timestamp }"}
        </div>
      </div>
    </section>
  );
}

/* ---------- wedge ---------- */

function Wedge() {
  return (
    <section id="wedge" className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1180px] px-6 py-20">
        <Eyebrow>The wedge</Eyebrow>
        <h2 className="text-[34px] font-semibold tracking-tight mt-3 max-w-2xl">
          Autonomy versus oversight is a false binary.
        </h2>
        <p className="text-zinc-400 mt-4 max-w-2xl leading-relaxed">
          One funded competitor brags about no approval gates. Another bets the
          whole company on a human in the loop. We took the third path: full-speed
          autonomy with a governance layer that makes it trustable, the exact thing
          the funded players refuse to build.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
          <div className="font-semibold">Governance as a service</div>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed max-w-2xl">
            Any agent can ask Handoff for permission before it acts. Kill switch,
            guardrail, and confidence threshold all apply. Every other autonomous
            agent is a potential customer.
          </p>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[#0b0b0e] p-4 font-mono text-[13px] overflow-x-auto">
            <div className="text-zinc-500">POST /api/ingest</div>
            <div className="text-zinc-300 mt-1">{`{ "agent": "my-bot", "action": "charge customer 4000", "confidence": 0.4 }`}</div>
            <div className="text-emerald-300 mt-2">{`-> { "allow": false, "decision": "escalate" }`}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- attention ---------- */

function Attention() {
  return (
    <section className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1180px] px-6 py-20 text-center">
        <Eyebrow center>The good ending</Eyebrow>
        <h2 className="text-[34px] font-semibold tracking-tight mt-3 max-w-3xl mx-auto">
          Agents do more. You do less. And you can finally look away.
        </h2>
        <p className="text-zinc-400 mt-4 max-w-2xl mx-auto leading-relaxed">
          The system protects the scarcest resource you have, your attention, by
          only interrupting you for the uncertain cases. Everything else is handled,
          logged, and reversible. That is the good ending of the AI era, and it only
          works if you can trust the off switch.
        </p>
      </div>
    </section>
  );
}

/* ---------- cta + footer ---------- */

function CTA() {
  return (
    <section className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1180px] px-6 py-20">
        <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.06] to-transparent p-12 text-center">
          <h2 className="text-[32px] font-semibold tracking-tight">Watch the loop close, live.</h2>
          <p className="text-zinc-400 mt-3 max-w-xl mx-auto">
            Send a lead, try to break a guardrail, hit the kill switch. The whole
            nervous system on one screen.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-7 rounded-xl bg-white text-zinc-900 px-6 py-3 text-sm font-semibold hover:bg-zinc-200 transition"
          >
            Open the dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1180px] px-6 py-10 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-sm text-zinc-500">Handoff. Built at the Hands Off Hackathon, London.</span>
        </div>
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-100 transition">Open dashboard →</Link>
      </div>
    </footer>
  );
}

/* ---------- shared ---------- */

function Eyebrow({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={`text-[12px] uppercase tracking-wider text-emerald-400 font-semibold ${center ? "text-center" : ""}`}>
      {children}
    </div>
  );
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
      <div className="text-3xl font-semibold tracking-tight tabular-nums">{big}</div>
      <div className="text-zinc-500 text-sm mt-2 leading-relaxed">{small}</div>
    </div>
  );
}

function Logo() {
  return (
    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-300 to-emerald-500 text-emerald-950 grid place-items-center font-bold shadow-[0_0_20px_-4px_rgba(52,211,153,0.6)]">
      H
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#34d399" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-lg font-semibold tabular-nums">{pct}%</div>
    </div>
  );
}

const ico = "h-4 w-4";
function Power() {
  return <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 3v9" /><path d="M6.4 6.4a8 8 0 1 0 11.2 0" /></svg>;
}
function Shield() {
  return <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>;
}
function Gauge() {
  return <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 13l4-3" /><path d="M4 18a8 8 0 1 1 16 0" /></svg>;
}
function Inbox() {
  return <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M3 12h5l2 3h4l2-3h5" /><path d="M5 6h14l2 6v6H3v-6z" /></svg>;
}
function List() {
  return <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
}
