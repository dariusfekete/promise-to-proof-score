import { useState, useEffect, useRef } from "react";
import { generateReport } from "./report.js";

var VERTICALS = ["Pricing / CPQ / Revenue", "ITSM / Operations", "HR / HCM", "Supply chain / ERP", "Marketing / CX", "Security / Compliance", "Analytics / BI", "Other B2B SaaS"];
var SIZES = ["< $10M ARR", "$10\u201325M ARR", "$25\u201350M ARR", "$50\u2013150M ARR", "> $150M ARR"];
var ROLES = ["CEO / GM", "CRO / CCO", "VP / Head of CS", "VP Sales / Revenue", "Head of Value / PreSales", "PE operating partner", "Other"];

var BREAKS = [
  { name: "Promise \u2192 Deliver", short: "Handoff" },
  { name: "Deliver \u2192 Operate", short: "Go-live" },
  { name: "Operate \u2192 Measure", short: "Measurement" },
  { name: "Measure \u2192 Prove", short: "Attribution" },
  { name: "Prove \u2192 Decide", short: "Feedback loop" },
];

var QS = [
  { b: 0, q: "When a deal closes, does the implementation team receive the specific business case that Sales built?", opts: [
    { t: "Always \u2014 structured handoff with outcomes and KPIs", s: 10 },
    { t: "Sometimes \u2014 informally, depends on the people", s: 5 },
    { t: "Rarely \u2014 implementation scopes from scratch", s: 0 },
  ]},
  { b: 0, q: "How much of the original business case survives into the implementation scope?", opts: [
    { t: "Most of it \u2014 implementation targets the promised outcomes", s: 10 },
    { t: "Some \u2014 translated into technical requirements, financial context lost", s: 5 },
    { t: "Very little \u2014 business case and implementation live in different worlds", s: 0 },
  ]},
  { b: 1, q: "After go-live, does the customer know which business outcomes to expect and by when?", opts: [
    { t: "Yes \u2014 clear milestones tied to the original business case", s: 10 },
    { t: "Partially \u2014 they know the product works, not the expected impact", s: 5 },
    { t: "No \u2014 go-live is project completion, not value delivery start", s: 0 },
  ]},
  { b: 1, q: "Is there a structured handoff from Implementation to CS that includes outcome targets?", opts: [
    { t: "Yes \u2014 documented and standardized for every account", s: 10 },
    { t: "Informal \u2014 happens inconsistently", s: 5 },
    { t: "No \u2014 CS starts fresh", s: 0 },
  ]},
  { b: 2, q: "What does your CS team primarily track post-sale?", opts: [
    { t: "Business outcomes tied to the original promise", s: 10 },
    { t: "Product adoption and health scores (logins, usage, NPS)", s: 5 },
    { t: "Mainly reactive \u2014 tickets, escalations, sentiment", s: 0 },
  ]},
  { b: 2, q: "Could your CSMs describe the specific business outcome each customer was promised \u2014 without looking it up?", opts: [
    { t: "Yes, for most accounts", s: 10 },
    { t: "Top accounts only", s: 5 },
    { t: "Unlikely \u2014 focus is on product health", s: 0 },
  ]},
  { b: 3, q: "At renewal, what evidence does your team bring?", opts: [
    { t: "Quantified business outcomes attributed to your product", s: 10 },
    { t: "Adoption data, health scores, and a value narrative", s: 5 },
    { t: "Relationship strength and a pricing discussion", s: 0 },
  ]},
  { b: 3, q: "If a customer\u2019s CFO asked \u2018prove this software delivered what we were promised\u2019 \u2014 how fast could you respond?", opts: [
    { t: "Hours \u2014 evidence is structured and available", s: 10 },
    { t: "Days to weeks \u2014 assembled from multiple systems", s: 5 },
    { t: "We probably couldn\u2019t produce it", s: 0 },
  ]},
  { b: 4, q: "Does outcome data from successful customers feed back into how Sales builds the next business case?", opts: [
    { t: "Yes \u2014 verified outcomes calibrate future promises by segment", s: 10 },
    { t: "Informally \u2014 Sales knows anecdotally what works", s: 5 },
    { t: "No \u2014 Sales builds cases independently of post-sale data", s: 0 },
  ]},
  { b: 4, q: "Could your company quantify your product\u2019s financial impact across the customer base \u2014 in a way that holds up under diligence?", opts: [
    { t: "Yes \u2014 structured, consistent, and auditable", s: 10 },
    { t: "Partially \u2014 some customers, inconsistently", s: 5 },
    { t: "No \u2014 narrative and anecdotal", s: 0 },
  ]},
];

var VERDICTS = [
  { min: 80, level: "Strong", col: "#22C55E", bg: "#052E16" },
  { min: 60, level: "Developing", col: "#3B82F6", bg: "#0C1B3A" },
  { min: 35, level: "Exposed", col: "#F59E0B", bg: "#2D1B00" },
  { min: 0, level: "Critical", col: "#EF4444", bg: "#2D0A0A" },
];

var VERDICT_TEXT = {
  Strong: "Your promise-to-proof chain is largely intact. Focus on systematizing.",
  Developing: "Gaps exist. You\u2019re likely leaving 5\u201310 NRR points on the table.",
  Exposed: "Your team creates real value but can\u2019t prove it. Renewals default to price.",
  Critical: "The chain is largely disconnected. NRR is 10\u201315 points below potential.",
};

var BENCH = {
  "> $150M ARR": { typical: "40\u201355", best: "80+" },
  "$50\u2013150M ARR": { typical: "35\u201350", best: "75+" },
  "$25\u201350M ARR": { typical: "25\u201340", best: "70+" },
  "$10\u201325M ARR": { typical: "20\u201335", best: "65+" },
  "< $10M ARR": { typical: "15\u201330", best: "60+" },
};

var GAPREC_SHORT = [
  "The business case dies at signature. Implementation starts without knowing what was promised.",
  "Go-live = project done, not value start. Customers don\u2019t know what outcomes to expect.",
  "Your team measures activity, not outcomes. Can\u2019t answer whether the promise was delivered.",
  "Outcomes may exist but can\u2019t be attributed. Renewals become price conversations.",
  "Proven outcomes don\u2019t feed back to Sales. Every deal starts from scratch.",
];

var S = "\n@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400&display=swap');\n*{box-sizing:border-box;margin:0;padding:0}\n:root{--bg:#0A0A0C;--bg2:#111114;--bg3:#18181C;--fg:#E8E6E1;--fg2:#9A9890;--fg3:#5C5B56;--accent:#6366F1;--accent2:#818CF8;--border:rgba(255,255,255,0.06);--sans:'DM Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}\nhtml{scroll-behavior:smooth}\nbody{font-family:var(--sans);background:var(--bg);color:var(--fg);-webkit-font-smoothing:antialiased}\n\n.hero{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px 20px}\n.hero-pill{font-size:11px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;padding:5px 14px;border-radius:100px;background:rgba(99,102,241,0.12);color:var(--accent2);margin-bottom:20px;display:inline-block}\n.hero h1{font-size:clamp(32px,5vw,48px);font-weight:600;letter-spacing:-0.03em;line-height:1.15;max-width:680px;margin-bottom:16px}\n.hero h1 em{font-style:normal;color:var(--accent2)}\n.hero p{font-size:16px;color:var(--fg2);line-height:1.7;max-width:520px;margin-bottom:28px}\n.hero-btn{padding:14px 36px;border-radius:10px;font-size:15px;font-weight:500;font-family:var(--sans);border:none;cursor:pointer;background:var(--accent);color:#fff;transition:all 0.2s}\n.hero-btn:hover{background:#5558E6;transform:translateY(-1px)}\n.hero-sub{font-size:12px;color:var(--fg3);margin-top:12px}\n\n.stats{display:flex;gap:40px;margin-bottom:32px;flex-wrap:wrap;justify-content:center}\n.stat-num{font-size:28px;font-weight:600;font-family:var(--mono);color:var(--accent2)}\n.stat-label{font-size:11px;color:var(--fg3);margin-top:2px;letter-spacing:0.03em}\n\n.wrap{max-width:560px;margin:0 auto;padding:40px 20px 60px}\n.pill{display:inline-block;font-size:11px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;padding:4px 12px;border-radius:100px;background:rgba(99,102,241,0.12);color:var(--accent2)}\nh2.section{font-size:28px;font-weight:600;letter-spacing:-0.02em;margin:16px 0 8px}\n\n.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}\n.chip{padding:7px 14px;border-radius:8px;font-size:13px;font-family:var(--sans);background:var(--bg3);color:var(--fg2);border:1px solid var(--border);cursor:pointer;transition:all 0.15s}\n.chip:hover{border-color:rgba(255,255,255,0.12);color:var(--fg)}\n.chip.on{background:rgba(99,102,241,0.15);border-color:rgba(99,102,241,0.4);color:var(--accent2)}\n.label{font-size:12px;color:var(--fg3);letter-spacing:0.04em;text-transform:uppercase;margin-bottom:8px;margin-top:20px}\n\n.btn-main{width:100%;padding:13px 0;border-radius:10px;font-size:15px;font-weight:500;font-family:var(--sans);border:none;cursor:pointer;background:var(--accent);color:#fff;margin-top:28px;transition:all 0.2s}\n.btn-main:hover{background:#5558E6}\n.btn-main:disabled{background:var(--bg3);color:var(--fg3);cursor:not-allowed}\n\n.progress-wrap{display:flex;align-items:center;gap:12px;margin-bottom:24px}\n.progress-bar{flex:1;height:2px;background:var(--bg3);border-radius:1px;overflow:hidden}\n.progress-fill{height:2px;background:var(--accent);border-radius:1px;transition:width 0.4s ease}\n.progress-text{font-size:12px;color:var(--fg3);font-family:var(--mono);min-width:44px;text-align:right}\n\n.q-break{font-size:11px;color:var(--fg3);letter-spacing:0.06em;margin-bottom:12px}\n.q-text{font-size:18px;font-weight:500;line-height:1.5;margin-bottom:20px;letter-spacing:-0.01em}\n\n.opt{width:100%;text-align:left;padding:14px 18px;border-radius:10px;font-size:14px;line-height:1.5;font-family:var(--sans);background:var(--bg2);border:1px solid var(--border);color:var(--fg2);cursor:pointer;transition:all 0.15s;margin-bottom:8px;display:block}\n.opt:hover{border-color:rgba(255,255,255,0.12);color:var(--fg);background:var(--bg3)}\n.opt.sel{border-color:rgba(99,102,241,0.5);background:rgba(99,102,241,0.08);color:var(--fg)}\n.back{font-size:12px;color:var(--fg3);background:none;border:none;cursor:pointer;font-family:var(--sans);margin-top:8px;padding:0}\n.back:hover{color:var(--fg2)}\n\n.gate-box{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:32px 28px;text-align:center}\n.gate-box h3{font-size:22px;font-weight:600;margin-bottom:6px}\n.gate-input{width:100%;padding:12px 16px;border-radius:8px;font-size:14px;font-family:var(--sans);background:var(--bg);border:1px solid var(--border);color:var(--fg);margin-top:16px;outline:none;transition:border-color 0.2s}\n.gate-input:focus{border-color:rgba(99,102,241,0.5)}\n.gate-input::placeholder{color:var(--fg3)}\n.consent{font-size:11px;color:var(--fg3);line-height:1.5;margin-top:10px}\n\n.score-num{font-size:80px;font-weight:300;letter-spacing:-0.04em;line-height:1;font-family:var(--mono)}\n.chain{display:flex;align-items:center;justify-content:center;gap:0;margin:24px 0;flex-wrap:wrap}\n.chain-node{padding:6px 10px;border-radius:6px;font-size:10px;font-weight:500;background:var(--bg3);border:1px solid var(--border);color:var(--fg2);white-space:nowrap}\n.chain-link{width:20px;height:2px;border-radius:1px;position:relative}\n.chain-x{position:absolute;top:-7px;left:7px;font-size:11px;font-weight:600;line-height:1}\n\n.bar-label{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}\n.bar-name{color:var(--fg2)}\n.bar-val{color:var(--fg);font-family:var(--mono);font-weight:500}\n.bar-track{height:4px;border-radius:2px;background:var(--bg3);margin-bottom:12px}\n.bar-fill{height:4px;border-radius:2px;transition:width 0.8s cubic-bezier(0.25,1,0.5,1)}\n\n.gap-box{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:16px 20px;margin:16px 0}\n.bench-box{background:var(--bg3);border-radius:10px;padding:14px 18px;margin:16px 0}\n\n.cta-box{text-align:center;margin:24px 0 12px;padding:20px;border-radius:10px;border:1px solid var(--border)}\n.btn-ghost{width:100%;padding:10px 0;font-size:13px;font-family:var(--sans);background:none;border:1px solid var(--border);border-radius:8px;color:var(--fg3);cursor:pointer;transition:all 0.15s}\n.btn-ghost:hover{border-color:rgba(255,255,255,0.12);color:var(--fg2)}\n.btn-dl{width:100%;padding:13px 0;border-radius:10px;font-size:14px;font-weight:500;font-family:var(--sans);border:1px solid rgba(34,197,94,0.3);cursor:pointer;background:rgba(34,197,94,0.08);color:#22C55E;margin-bottom:8px;transition:all 0.2s}\n.btn-dl:hover{background:rgba(34,197,94,0.14)}\n\n.fade{animation:fadeIn 0.4s ease}\n@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}\n.score-reveal{animation:scoreIn 0.8s cubic-bezier(0.25,1,0.5,1)}\n@keyframes scoreIn{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}\n\nfooter{text-align:center;padding:40px 20px;font-size:11px;color:var(--fg3);border-top:1px solid var(--border)}\nfooter a{color:var(--accent2);text-decoration:none}\n";

function Chain({ scores }) {
  var stages = ["Promise", "Deliver", "Operate", "Measure", "Prove", "Decide"];
  return (
    <div className="chain">
      {stages.map(function(s, i) {
        var bs = i > 0 && i < 6 ? scores[i - 1] : null;
        var str = bs !== null ? (bs >= 15 ? "strong" : bs >= 8 ? "weak" : "broken") : null;
        var lc = str === "strong" ? "#22C55E" : str === "weak" ? "#F59E0B" : str === "broken" ? "#EF4444" : "transparent";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && (
              <div className="chain-link" style={{ background: lc }}>
                {str === "broken" && <span className="chain-x" style={{ color: "#EF4444" }}>\u00d7</span>}
              </div>
            )}
            <div className="chain-node" style={i === 0 ? { background: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.3)", color: "#A5B4FC" } : {}}>{s}</div>
          </div>
        );
      })}
    </div>
  );
}

function BarChart({ scores }) {
  var cols = ["#6366F1", "#22D3EE", "#A78BFA", "#F59E0B", "#34D399"];
  return (
    <div style={{ margin: "24px 0" }}>
      {BREAKS.map(function(b, i) {
        return (
          <div key={i}>
            <div className="bar-label"><span className="bar-name">{b.name}</span><span className="bar-val">{scores[i]}/20</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: (scores[i] / 20) * 100 + "%", background: cols[i] }} /></div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  var _a = useState("hero"), phase = _a[0], setPhase = _a[1];
  var _b = useState(""), vert = _b[0], setVert = _b[1];
  var _c = useState(""), size = _c[0], setSize = _c[1];
  var _d = useState(""), role = _d[0], setRole = _d[1];
  var _e = useState(0), cur = _e[0], setCur = _e[1];
  var _f = useState({}), ans = _f[0], setAns = _f[1];
  var _g = useState(""), email = _g[0], setEmail = _g[1];
  var _h = useState(""), name = _h[0], setName = _h[1];
  var _i = useState(""), company = _i[0], setCompany = _i[1];
  var _j = useState(false), sending = _j[0], setSending = _j[1];
  var topRef = useRef(null);

  useEffect(function() {
    if (phase !== "hero" && topRef.current) topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase, cur]);

  var pick = function(qi, s) {
    var next = Object.assign({}, ans);
    next[qi] = s;
    setAns(next);
    if (cur < QS.length - 1) setTimeout(function() { setCur(cur + 1); }, 200);
    else setTimeout(function() { setPhase("gate"); }, 400);
  };

  var total = Object.values(ans).reduce(function(a, b) { return a + b; }, 0);
  var bscores = BREAKS.map(function(_, bi) {
    return QS.filter(function(q) { return q.b === bi; }).reduce(function(sum, q) {
      var qi = QS.indexOf(q);
      return sum + (ans[qi] || 0);
    }, 0);
  });
  var verdict = VERDICTS.find(function(v) { return total >= v.min; });
  var weakest = bscores.indexOf(Math.min.apply(null, bscores));
  var bench = BENCH[size] || BENCH["$25\u201350M ARR"];
  var validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  var handleSubmitGate = async function() {
    setSending(true);
    try {
      await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name, email: email, company: company, vertical: vert, size: size, role: role,
          score: total, breakScores: bscores, weakestBreak: weakest,
          verdict: verdict.level, timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.log("Lead collection skipped:", e);
    }
    setSending(false);
    setPhase("result");
  };

  var handleDownload = function() {
    var doc = generateReport({
      name: name, email: email, vertical: vert, size: size, role: role,
      totalScore: total, breakScores: bscores, weakestBreak: weakest,
    });
    doc.save("Promise-to-Proof-Score_" + name.replace(/\s+/g, "_") + ".pdf");
  };

  var resetAll = function() {
    setPhase("hero"); setCur(0); setAns({}); setEmail(""); setName(""); setCompany(""); setVert(""); setSize(""); setRole("");
  };

  // HERO
  if (phase === "hero") {
    return (
      <>
        <style>{S}</style>
        <div className="hero">
          <span className="hero-pill">Free diagnostic for B2B SaaS</span>
          <h1>How much NRR are you leaving on the table because you can{"'"}t prove <em>outcomes</em>?</h1>
          <p>Most B2B SaaS companies track adoption well. Almost none connect it back to the business case that closed the deal. That gap costs 10{"\u2013"}15 NRR points. Find out where your chain breaks.</p>
          <div className="stats">
            <div><div className="stat-num">10</div><div className="stat-label">questions</div></div>
            <div><div className="stat-num">2</div><div className="stat-label">minutes</div></div>
            <div><div className="stat-num">5</div><div className="stat-label">chain links scored</div></div>
          </div>
          <button className="hero-btn" onClick={function() { setPhase("context"); }}>Take the assessment</button>
          <div className="hero-sub">Free. No credit card. Get a downloadable report.</div>
        </div>
        <footer>Built by <a href="mailto:darius.fekete@gmail.com">Darius Fekete</a> {"\u00b7"} 18 years building commercial systems inside PE-backed B2B companies</footer>
      </>
    );
  }

  // CONTEXT
  if (phase === "context") {
    return (
      <>
        <style>{S}</style>
        <div className="wrap fade" ref={topRef}>
          <div className="pill">Step 1 of 3</div>
          <h2 className="section">About your company</h2>
          <p style={{ fontSize: 14, color: "var(--fg2)", lineHeight: 1.6 }}>This helps us benchmark your score against peers.</p>
          <div className="label">SaaS vertical</div>
          <div className="chips">{VERTICALS.map(function(v) { return <button key={v} className={"chip" + (vert === v ? " on" : "")} onClick={function() { setVert(v); }}>{v}</button>; })}</div>
          <div className="label">Company size</div>
          <div className="chips">{SIZES.map(function(s) { return <button key={s} className={"chip" + (size === s ? " on" : "")} onClick={function() { setSize(s); }}>{s}</button>; })}</div>
          <div className="label">Your role</div>
          <div className="chips">{ROLES.map(function(r) { return <button key={r} className={"chip" + (role === r ? " on" : "")} onClick={function() { setRole(r); }}>{r}</button>; })}</div>
          <button className="btn-main" disabled={!vert || !size || !role} onClick={function() { setPhase("questions"); }}>Start assessment {"\u2192"}</button>
        </div>
      </>
    );
  }

  // QUESTIONS
  if (phase === "questions") {
    var q = QS[cur];
    return (
      <>
        <style>{S}</style>
        <div className="wrap fade" ref={topRef}>
          <div className="progress-wrap">
            <div className="progress-bar"><div className="progress-fill" style={{ width: ((cur + 1) / QS.length) * 100 + "%" }} /></div>
            <div className="progress-text">{cur + 1}/{QS.length}</div>
          </div>
          <div className="q-break">{BREAKS[q.b].name}</div>
          <div className="q-text">{q.q}</div>
          {q.opts.map(function(o, oi) {
            return <button key={oi} className={"opt" + (ans[cur] === o.s ? " sel" : "")} onClick={function() { pick(cur, o.s); }}>{o.t}</button>;
          })}
          {cur > 0 && <button className="back" onClick={function() { setCur(cur - 1); }}>{"\u2190"} Back</button>}
        </div>
      </>
    );
  }

  // EMAIL GATE
  if (phase === "gate") {
    return (
      <>
        <style>{S}</style>
        <div className="wrap fade" ref={topRef}>
          <div className="gate-box">
            <div className="pill" style={{ marginBottom: 12 }}>Your results are ready</div>
            <h3>Get your full report</h3>
            <p style={{ fontSize: 13, color: "var(--fg2)", marginTop: 6, lineHeight: 1.6 }}>Score, breakdown by chain link, biggest gap, benchmarks, and recommendations.</p>
            <input className="gate-input" type="text" placeholder="Your name" value={name} onChange={function(e) { setName(e.target.value); }} />
            <input className="gate-input" type="email" placeholder="Work email" value={email} onChange={function(e) { setEmail(e.target.value); }} />
            <input className="gate-input" type="text" placeholder="Company (optional)" value={company} onChange={function(e) { setCompany(e.target.value); }} />
            <button className="btn-main" disabled={!validEmail || !name.trim() || sending} onClick={handleSubmitGate}>
              {sending ? "Preparing..." : "View results & download report"}
            </button>
            <p className="consent">Your data stays private. No spam. Just your diagnostic report.</p>
          </div>
        </div>
      </>
    );
  }

  // RESULTS
  return (
    <>
      <style>{S}</style>
      <div className="wrap" ref={topRef}>
        <div style={{ textAlign: "center", marginBottom: 8 }} className="score-reveal">
          <div className="pill" style={{ marginBottom: 16 }}>Your promise-to-proof score</div>
          <div className="score-num" style={{ color: verdict.col }}>{total}</div>
          <div style={{ fontSize: 14, color: "var(--fg3)", marginTop: 4 }}>out of 100</div>
        </div>

        <div className="fade" style={{ padding: "16px 20px", borderRadius: 10, background: verdict.bg, borderLeft: "3px solid " + verdict.col, margin: "20px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: verdict.col, marginBottom: 4 }}>{verdict.level}</div>
          <div style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.7 }}>{VERDICT_TEXT[verdict.level]}</div>
        </div>

        <Chain scores={bscores} />

        <div className="fade">
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg2)", marginBottom: 8 }}>Score by chain link</div>
          <BarChart scores={bscores} />
        </div>

        <div className="gap-box fade">
          <div style={{ fontSize: 11, color: "var(--fg3)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>Your biggest gap</div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{BREAKS[weakest].name}</div>
          <div style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.7 }}>{GAPREC_SHORT[weakest]}</div>
        </div>

        <div className="bench-box fade">
          <div style={{ fontSize: 11, color: "var(--fg3)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>Benchmark {"\u00b7"} {size}</div>
          <div style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.6 }}>
            Companies in your range typically score {bench.typical}. Best-in-class: {bench.best}. Companies with strong outcome practices drive NRR 7{"\u2013"}16 points higher than peers.
          </div>
        </div>

        <button className="btn-dl fade" onClick={handleDownload}>{"\u2193"} Download full report (PDF)</button>

        <div className="cta-box fade">
          <div style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.6, marginBottom: 8 }}>
            The report includes detailed analysis, specific recommendations, and next steps.<br /><br />
            Want to know exactly where the chain breaks in your company?
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--accent2)" }}>darius.fekete@gmail.com</div>
        </div>

        <button className="btn-ghost" style={{ marginTop: 8 }} onClick={resetAll}>Take it again</button>

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "var(--fg3)" }}>
          Built by Darius Fekete {"\u00b7"} <a href="mailto:darius.fekete@gmail.com" style={{ color: "var(--accent2)", textDecoration: "none" }}>Get in touch</a>
        </div>
      </div>
    </>
  );
}
