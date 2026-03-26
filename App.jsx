import { useState, useEffect, useRef } from "react";
import { generateReport } from "./report.js";

var VERTICALS = [
  { id: "pricing", label: "Pricing / CPQ / Revenue",
    valuePromise: "margin improvement, price realization, discount governance",
    typicalOutcomes: "2-5% margin improvement, 30-50% reduction in discount leakage, faster quote turnaround",
    proofChallenge: "Margin changes tracked in customer ERP, not your platform. Attribution requires connecting pricing decisions to financial outcomes across systems you don't control.",
    renewalEvidence: "transaction-level margin data showing before/after your implementation, with market-context normalization",
    whyProofIsHard: "Too many variables. Revenue went up \u2014 was it your pricing engine, the market recovery, the new sales team, or all three? Your platform optimizes at the boundary between the company and the market, where macro conditions, competitor moves, and demand shifts create noise that makes clean attribution nearly impossible.",
    proofShape: "The value is visible but unattributable. Everyone can see margins improved \u2014 no one can prove how much of it was you.",
    whatMakesItWorse: "Break 4 (Measure\u2192Prove) is the hardest because market conditions confound every before/after comparison. Break 3 is also hard because margin data lives in the customer's ERP. Break 5 suffers because last year's proof decays as conditions change.",
    whatDoesntWork: "Simple before/after revenue comparisons \u2014 external variables invalidate them. Claiming full attribution for margin improvement \u2014 frame it as contribution analysis instead. Tracking 'revenue lift' without adjusting for market context."
  },
  { id: "itsm", label: "ITSM / Operations",
    valuePromise: "reduced IT service costs, faster resolution, improved employee productivity",
    typicalOutcomes: "30-40% cost reduction per ticket, 50%+ self-service deflection, MTTR improvement",
    proofChallenge: "Customers measure IT efficiency through their own reporting. Your platform handles workflows but the cost and productivity data lives in finance and HR systems.",
    renewalEvidence: "cost per resolution trend, FTE hours redirected, SLA compliance improvement",
    whyProofIsHard: "Value is spread too thin. IT productivity gains show up in every department but are measured nowhere centrally. And the incidents your self-service prevented never generated tickets \u2014 so the biggest wins are invisible.",
    proofShape: "The value is real and relatively measurable, but distributed across the whole organization. No single person sees the full picture.",
    whatMakesItWorse: "Break 3 (Operate\u2192Measure) is the bottleneck \u2014 the data exists but in the wrong systems. The self-service deflection gap is particularly hard to quantify.",
    whatDoesntWork: "Focusing only on ticket metrics when the real value is in FTE reallocation and productivity. Ignoring the self-service deflection measurement gap \u2014 the tickets that never happened are your biggest value."
  },
  { id: "hr", label: "HR / HCM",
    valuePromise: "reduced time-to-hire, improved retention, lower HR cost per employee",
    typicalOutcomes: "25-40% faster hiring, 10-20pp retention improvement, onboarding time cut by 50%+",
    proofChallenge: "HR attributes retention improvements to culture and management initiatives, not software. The value is real but shared credit makes attribution murky. Retention takes 18+ months to show up in data.",
    renewalEvidence: "hiring cost reduction with clear before/after, retention cohort data, onboarding completion rates, leading indicator trends",
    whyProofIsHard: "Value takes longer to show up than the contract lasts. A better hiring decision made today shows up in retention data 18 months later. A culture shift enabled by engagement tooling may take 3-5 years to measurably impact revenue. And every employee responds differently to identical interventions, making benchmarking unreliable.",
    proofShape: "The value compounds slowly and potentially enormously, but the renewal decision arrives before the evidence matures. This is the longest feedback loop in B2B SaaS.",
    whatMakesItWorse: "Break 4 (Measure\u2192Prove) is structurally the hardest in all of B2B SaaS for HR. The time gap exceeds typical contract terms. Break 2 matters because the first 90 days post-go-live is the only fast-feedback window before the long wait kicks in.",
    whatDoesntWork: "Trying to prove retention impact within a single contract year \u2014 the math doesn't work. Individual-level attribution (did this person stay because of the software?). Building dashboards before fixing the structural data gap."
  },
  { id: "supply", label: "Supply chain / ERP",
    valuePromise: "improved forecast accuracy, reduced inventory costs, faster fulfillment",
    typicalOutcomes: "15-30% forecast improvement, 10-20% inventory cost reduction, 1-3 day cycle compression",
    proofChallenge: "Supply chain outcomes depend on market conditions, supplier behavior, and demand patterns. Isolating your platform's contribution from external factors is the core challenge. The highest value \u2014 prevented disruptions \u2014 is invisible.",
    renewalEvidence: "inventory carrying cost trend, forecast accuracy metrics, fulfillment cycle data with seasonal normalization, disruption impact analysis",
    whyProofIsHard: "The biggest value is invisible. The supply chain disruption that didn't cascade because your platform caught it early \u2014 that single event might be worth more than a year of incremental improvements, but it never shows up in any report. Plus, value spreads across shipper, carrier, and retailer \u2014 no single party sees the whole picture.",
    proofShape: "Daily value is small and steady. Crisis value is enormous but invisible. The true value distribution follows a power law, not a bell curve \u2014 which makes annual ROI calculations deeply misleading.",
    whatMakesItWorse: "Break 4 is the structural crux \u2014 proving what didn't happen. Break 3 is hard because the right metrics (prevented disruption value) are hypothetical. Break 5 is difficult because the big-value events are too rare to build reliable case studies from.",
    whatDoesntWork: "Framing ROI as an annual average \u2014 it misrepresents the power-law distribution. Tracking 'on-time delivery' as the proof metric \u2014 it captures incremental value but misses the crisis prevention that matters most. Ignoring multi-party value."
  },
  { id: "marketing", label: "Marketing / CX",
    valuePromise: "increased conversion, improved customer engagement, reduced acquisition cost",
    typicalOutcomes: "15-30% conversion lift, 20-40% engagement improvement, 10-25% CAC reduction",
    proofChallenge: "Marketing outcomes are multi-touch and multi-channel. Your platform is one variable among many. Buyers struggle to attribute revenue lift to any single tool.",
    renewalEvidence: "controlled test results, attributed pipeline and revenue, engagement-to-conversion funnel data",
    whyProofIsHard: "The noisiest attribution environment in B2B. Every campaign, every channel, every seasonal shift, and every competitor action muddies the signal. And unlike pricing where the noise comes from the market, marketing faces noise from the customer's own parallel activities \u2014 their other campaigns, channel mix changes, brand investments.",
    proofShape: "The value signal is lost in noise. Even contribution analysis is unreliable when the customer is running 15 other initiatives simultaneously.",
    whatMakesItWorse: "Break 4 is structurally hardest \u2014 clean attribution is effectively impossible in multi-touch environments. Break 1 matters because Sales often promises specific conversion lifts that the noise floor makes unprovable.",
    whatDoesntWork: "Tracking 'conversion lift' without controlled or quasi-experimental design. Multi-touch attribution models as evidence \u2014 they're allocation frameworks, not proof. Promising attribution when you should frame as incrementality."
  },
  { id: "security", label: "Security / Compliance",
    valuePromise: "reduced breach risk, lower compliance costs, faster audit cycles",
    typicalOutcomes: "40-60% compliance cost reduction, 70%+ faster audit prep, measurable risk score improvement",
    proofChallenge: "Security value is about what didn't happen. Proving the absence of breaches is harder than proving positive outcomes. Compliance savings are real but often invisible to CFOs.",
    renewalEvidence: "compliance cost per cycle trend, audit preparation time, risk score trajectory, probability-weighted loss avoidance",
    whyProofIsHard: "The better your software works, the more invisible the value becomes. A quiet year with no breaches is either proof the security platform is working perfectly or evidence it was never needed. Perfect security is indistinguishable from unnecessary security. The worst proof moment is the year when nothing happened.",
    proofShape: "Value is entirely in prevention. You're selling an invisible shield and asking the customer to pay for something they can't see or touch.",
    whatMakesItWorse: "Break 4 is structurally the hardest \u2014 you cannot prove what didn't happen through observation. Break 1 matters because Sales often overpromises measurable ROI in a domain where the highest value is structurally unmeasurable.",
    whatDoesntWork: "Tracking 'incidents prevented' \u2014 that's detections, not value. Framing compliance cost savings as the main value narrative \u2014 it undersells the real value and creates a savings ceiling. Simple incident rate comparisons without counterfactual baselines."
  },
  { id: "analytics", label: "Analytics / BI",
    valuePromise: "faster decisions, reduced operational costs through data-driven insights",
    typicalOutcomes: "10-15% operational cost reduction, 50%+ faster reporting, measurable decision quality improvement",
    proofChallenge: "Analytics platforms enable better decisions but don't make them. The human layer between insight and action makes attribution extremely difficult.",
    renewalEvidence: "decisions traced to platform insights with financial outcomes, time-to-decision metrics, operational cost trends",
    whyProofIsHard: "Four layers of noise between your platform and the business outcome: the platform provides the insight, the human interprets it, the organization executes on it, the market responds. Your platform is necessary but not sufficient \u2014 it enables but doesn't cause. This is the widest gap between 'we helped' and 'we can prove we helped' in B2B SaaS.",
    proofShape: "The enabler gap. The platform is a necessary ingredient in better outcomes, but isolating its contribution from human judgment and organizational execution is nearly impossible.",
    whatMakesItWorse: "Break 4 is structurally hardest \u2014 the human decision layer makes attribution nearly impossible. Break 5 is difficult because case studies require revealing the customer's decisions and financial impact, which is often confidential.",
    whatDoesntWork: "Tracking dashboard views or report generation as proof of value \u2014 that's activity, not outcome. Claiming attribution for decisions the platform informed but didn't make."
  },
  { id: "other", label: "Other B2B SaaS",
    valuePromise: "operational efficiency, cost reduction, revenue enablement",
    typicalOutcomes: "varies by use case",
    proofChallenge: "The proof challenge depends on how directly your product connects to measurable business outcomes versus being an enabling layer.",
    renewalEvidence: "depends on your specific value proposition",
    whyProofIsHard: "Every B2B product faces some combination of: invisible prevention value, delayed outcomes, noisy attribution, value spread across parties, pass/fail outcomes, or non-comparable customers. The specific mix determines where proof breaks down.",
    proofShape: "Depends on your product. Ask: is the proof problem about existence (value may not be real), attribution (value is real but unattributable), visibility (value is real but invisible), or timing (value is real but hasn't shown up yet)?",
    whatMakesItWorse: "Depends on your specific product and value chain.",
    whatDoesntWork: "Generic 'improve your CS' advice. Even for products that don't fit neatly into a category, the proof challenge has a structural shape that determines what actually helps."
  },
];

var SIZES = ["< $10M ARR", "$10-25M ARR", "$25-50M ARR", "$50-150M ARR", "> $150M ARR"];
var NRR_RANGES = ["Below 90%", "90-100%", "100-105%", "105-110%", "110-115%", "115-120%", "Above 120%", "Not sure"];
var ROLES = ["CEO / GM", "CRO / CCO", "VP / Head of CS", "VP Sales / Revenue", "Head of Value / PreSales", "PE operating partner", "Other"];
var BREAKS = [
  { name: "Promise \u2192 Deliver", short: "Handoff" },
  { name: "Deliver \u2192 Operate", short: "Go-live" },
  { name: "Operate \u2192 Measure", short: "Measurement" },
  { name: "Measure \u2192 Prove", short: "Attribution" },
  { name: "Prove \u2192 Decide", short: "Feedback loop" },
];
var QS = [
  { b:0, q:"When a deal closes, does the implementation team receive the specific business case that Sales built?", opts:[{t:"Always \u2014 structured handoff with outcomes and KPIs",s:10},{t:"Sometimes \u2014 informally, depends on the people",s:5},{t:"Rarely \u2014 implementation scopes from scratch",s:0}]},
  { b:0, q:"How much of the original business case survives into the implementation scope?", opts:[{t:"Most of it \u2014 implementation targets the promised outcomes",s:10},{t:"Some \u2014 translated into technical requirements, financial context lost",s:5},{t:"Very little \u2014 business case and implementation live in different worlds",s:0}]},
  { b:1, q:"After go-live, does the customer know which business outcomes to expect and by when?", opts:[{t:"Yes \u2014 clear milestones tied to the original business case",s:10},{t:"Partially \u2014 they know the product works, not the expected impact",s:5},{t:"No \u2014 go-live is project completion, not value delivery start",s:0}]},
  { b:1, q:"Is there a structured handoff from Implementation to CS that includes outcome targets?", opts:[{t:"Yes \u2014 documented and standardized for every account",s:10},{t:"Informal \u2014 happens inconsistently",s:5},{t:"No \u2014 CS starts fresh",s:0}]},
  { b:2, q:"What does your CS team primarily track post-sale?", opts:[{t:"Business outcomes tied to the original promise",s:10},{t:"Product adoption and health scores (logins, usage, NPS)",s:5},{t:"Mainly reactive \u2014 tickets, escalations, sentiment",s:0}]},
  { b:2, q:"Could your CSMs describe the specific business outcome each customer was promised \u2014 without looking it up?", opts:[{t:"Yes, for most accounts",s:10},{t:"Top accounts only",s:5},{t:"Unlikely \u2014 focus is on product health",s:0}]},
  { b:3, q:"At renewal, what evidence does your team bring?", opts:[{t:"Quantified business outcomes attributed to your product",s:10},{t:"Adoption data, health scores, and a value narrative",s:5},{t:"Relationship strength and a pricing discussion",s:0}]},
  { b:3, q:"If a customer\u2019s CFO asked \u2018prove this software delivered what we were promised\u2019 \u2014 how fast could you respond?", opts:[{t:"Hours \u2014 evidence is structured and available",s:10},{t:"Days to weeks \u2014 assembled from multiple systems",s:5},{t:"We probably couldn\u2019t produce it",s:0}]},
  { b:4, q:"Does outcome data from successful customers feed back into how Sales builds the next business case?", opts:[{t:"Yes \u2014 verified outcomes calibrate future promises by segment",s:10},{t:"Informally \u2014 Sales knows anecdotally what works",s:5},{t:"No \u2014 Sales builds cases independently of post-sale data",s:0}]},
  { b:4, q:"Could your company quantify your product\u2019s financial impact across the customer base \u2014 in a way that holds up under diligence?", opts:[{t:"Yes \u2014 structured, consistent, and auditable",s:10},{t:"Partially \u2014 some customers, inconsistently",s:5},{t:"No \u2014 narrative and anecdotal",s:0}]},
];
var VERDICTS = [{min:80,level:"Strong",col:"#22C55E",bg:"#052E16"},{min:60,level:"Developing",col:"#3B82F6",bg:"#0C1B3A"},{min:35,level:"Exposed",col:"#F59E0B",bg:"#2D1B00"},{min:0,level:"Critical",col:"#EF4444",bg:"#2D0A0A"}];
var NRR_BENCH = { _src: "McKinsey 2025, Benchmarkit 2025, SaaS Capital 2024", topQuartile: "113%+", bestInClass: "120%+", outcomeGap: "7-16 points", valuationMultiple: "21x vs 9x" };
var GAPREC = ["The business case dies at signature. Implementation starts without knowing what was promised.","Go-live = project done, not value start. Customers don\u2019t know what outcomes to expect.","Your team measures activity, not outcomes. Can\u2019t answer whether the promise was delivered.","Outcomes may exist but can\u2019t be attributed. Renewals become price conversations.","Proven outcomes don\u2019t feed back to Sales. Every deal starts from scratch."];

var S = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400&display=swap');*{box-sizing:border-box;margin:0;padding:0}:root{--bg:#0A0A0C;--bg2:#111114;--bg3:#18181C;--fg:#E8E6E1;--fg2:#9A9890;--fg3:#5C5B56;--accent:#6366F1;--accent2:#818CF8;--border:rgba(255,255,255,0.06);--sans:'DM Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}html{scroll-behavior:smooth}body{font-family:var(--sans);background:var(--bg);color:var(--fg);-webkit-font-smoothing:antialiased}.hero{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px 20px}.hero-pill{font-size:11px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;padding:5px 14px;border-radius:100px;background:rgba(99,102,241,0.12);color:var(--accent2);margin-bottom:20px;display:inline-block}.hero h1{font-size:clamp(28px,5vw,44px);font-weight:600;letter-spacing:-0.03em;line-height:1.15;max-width:640px;margin-bottom:16px}.hero h1 em{font-style:normal;color:var(--accent2)}.hero p{font-size:15px;color:var(--fg2);line-height:1.7;max-width:520px;margin-bottom:28px}.hero-btn{padding:14px 36px;border-radius:10px;font-size:15px;font-weight:500;font-family:var(--sans);border:none;cursor:pointer;background:var(--accent);color:#fff;transition:all 0.2s}.hero-btn:hover{background:#5558E6;transform:translateY(-1px)}.hero-sub{font-size:12px;color:var(--fg3);margin-top:12px}.stats{display:flex;gap:40px;margin-bottom:32px;flex-wrap:wrap;justify-content:center}.stat-num{font-size:28px;font-weight:600;font-family:var(--mono);color:var(--accent2)}.stat-label{font-size:11px;color:var(--fg3);margin-top:2px}.wrap{max-width:560px;margin:0 auto;padding:40px 20px 60px}.pill{display:inline-block;font-size:11px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;padding:4px 12px;border-radius:100px;background:rgba(99,102,241,0.12);color:var(--accent2)}h2.section{font-size:26px;font-weight:600;letter-spacing:-0.02em;margin:16px 0 8px}.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.chip{padding:7px 14px;border-radius:8px;font-size:13px;font-family:var(--sans);background:var(--bg3);color:var(--fg2);border:1px solid var(--border);cursor:pointer;transition:all 0.15s}.chip:hover{border-color:rgba(255,255,255,0.12);color:var(--fg)}.chip.on{background:rgba(99,102,241,0.15);border-color:rgba(99,102,241,0.4);color:var(--accent2)}.label{font-size:12px;color:var(--fg3);letter-spacing:0.04em;text-transform:uppercase;margin-bottom:8px;margin-top:20px}.btn-main{width:100%;padding:13px 0;border-radius:10px;font-size:15px;font-weight:500;font-family:var(--sans);border:none;cursor:pointer;background:var(--accent);color:#fff;margin-top:28px;transition:all 0.2s}.btn-main:hover{background:#5558E6}.btn-main:disabled{background:var(--bg3);color:var(--fg3);cursor:not-allowed}.progress-wrap{display:flex;align-items:center;gap:12px;margin-bottom:24px}.progress-bar{flex:1;height:2px;background:var(--bg3);border-radius:1px;overflow:hidden}.progress-fill{height:2px;background:var(--accent);border-radius:1px;transition:width 0.4s ease}.progress-text{font-size:12px;color:var(--fg3);font-family:var(--mono);min-width:44px;text-align:right}.q-break{font-size:11px;color:var(--fg3);letter-spacing:0.06em;margin-bottom:12px}.q-text{font-size:17px;font-weight:500;line-height:1.5;margin-bottom:20px}.opt{width:100%;text-align:left;padding:14px 18px;border-radius:10px;font-size:13px;line-height:1.5;font-family:var(--sans);background:var(--bg2);border:1px solid var(--border);color:var(--fg2);cursor:pointer;transition:all 0.15s;margin-bottom:8px;display:block}.opt:hover{border-color:rgba(255,255,255,0.12);color:var(--fg);background:var(--bg3)}.opt.sel{border-color:rgba(99,102,241,0.5);background:rgba(99,102,241,0.08);color:var(--fg)}.back{font-size:12px;color:var(--fg3);background:none;border:none;cursor:pointer;font-family:var(--sans);margin-top:8px;padding:0}.back:hover{color:var(--fg2)}.gate-box{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:32px 28px;text-align:center}.gate-box h3{font-size:22px;font-weight:600;margin-bottom:6px}.gate-input{width:100%;padding:12px 16px;border-radius:8px;font-size:14px;font-family:var(--sans);background:var(--bg);border:1px solid var(--border);color:var(--fg);margin-top:14px;outline:none;transition:border-color 0.2s}.gate-input:focus{border-color:rgba(99,102,241,0.5)}.gate-input::placeholder{color:var(--fg3)}.consent{font-size:11px;color:var(--fg3);line-height:1.5;margin-top:10px}.score-num{font-size:72px;font-weight:300;letter-spacing:-0.04em;line-height:1;font-family:var(--mono)}.chain{display:flex;align-items:center;justify-content:center;gap:0;margin:20px 0;flex-wrap:wrap}.chain-node{padding:5px 9px;border-radius:6px;font-size:10px;font-weight:500;background:var(--bg3);border:1px solid var(--border);color:var(--fg2);white-space:nowrap}.chain-link{width:18px;height:2px;border-radius:1px;position:relative}.chain-x{position:absolute;top:-7px;left:6px;font-size:11px;font-weight:600;line-height:1}.bar-label{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}.bar-name{color:var(--fg2)}.bar-val{color:var(--fg);font-family:var(--mono);font-weight:500}.bar-track{height:4px;border-radius:2px;background:var(--bg3);margin-bottom:12px}.bar-fill{height:4px;border-radius:2px;transition:width 0.8s cubic-bezier(0.25,1,0.5,1)}.rbox{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 18px;margin:12px 0}.rbox.green{background:rgba(34,197,94,0.04);border-color:rgba(34,197,94,0.15)}.rbox.red{background:rgba(239,68,68,0.04);border-color:rgba(239,68,68,0.12)}.rbox.amber{background:rgba(245,158,11,0.04);border-color:rgba(245,158,11,0.12)}.rbox.purple{background:rgba(99,102,241,0.04);border-color:rgba(99,102,241,0.12)}.rbox-label{font-size:10px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:5px}.rbox-text{font-size:12px;color:var(--fg2);line-height:1.65}.rbox-text strong{color:var(--fg);font-weight:500}.cta-box{text-align:center;margin:20px 0 12px;padding:18px;border-radius:10px;border:1px solid var(--border)}.btn-ghost{width:100%;padding:10px 0;font-size:13px;font-family:var(--sans);background:none;border:1px solid var(--border);border-radius:8px;color:var(--fg3);cursor:pointer}.btn-ghost:hover{border-color:rgba(255,255,255,0.12);color:var(--fg2)}.btn-dl{width:100%;padding:13px 0;border-radius:10px;font-size:14px;font-weight:500;font-family:var(--sans);border:1px solid rgba(34,197,94,0.3);cursor:pointer;background:rgba(34,197,94,0.08);color:#22C55E;margin-bottom:8px;transition:all 0.2s}.btn-dl:hover{background:rgba(34,197,94,0.14)}.llm-box{text-align:center;padding:20px;color:var(--fg3);font-size:13px}.dot{display:inline-block;animation:pulse 1.4s ease infinite;width:6px;height:6px;border-radius:50%;background:var(--accent);margin:0 3px}.dot:nth-child(2){animation-delay:0.2s}.dot:nth-child(3){animation-delay:0.4s}@keyframes pulse{0%,80%,100%{opacity:0.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}.fade{animation:fadeIn 0.4s ease}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.score-reveal{animation:scoreIn 0.8s cubic-bezier(0.25,1,0.5,1)}@keyframes scoreIn{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}footer{text-align:center;padding:40px 20px;font-size:11px;color:var(--fg3);border-top:1px solid var(--border)}footer a{color:var(--accent2);text-decoration:none}";

function Chain({scores}){var stages=["Promise","Deliver","Operate","Measure","Prove","Decide"];return(<div className="chain">{stages.map(function(s,i){var bs=i>0&&i<6?scores[i-1]:null;var str=bs!==null?(bs>=15?"strong":bs>=8?"weak":"broken"):null;var lc=str==="strong"?"#22C55E":str==="weak"?"#F59E0B":str==="broken"?"#EF4444":"transparent";return(<div key={i} style={{display:"flex",alignItems:"center"}}>{i>0&&<div className="chain-link" style={{background:lc}}>{str==="broken"&&<span className="chain-x" style={{color:"#EF4444"}}>{"\u00d7"}</span>}</div>}<div className="chain-node" style={i===0?{background:"rgba(99,102,241,0.15)",borderColor:"rgba(99,102,241,0.3)",color:"#A5B4FC"}:{}}>{s}</div></div>);})}</div>);}
function BarChart({scores}){var cols=["#6366F1","#22D3EE","#A78BFA","#F59E0B","#34D399"];return(<div style={{margin:"20px 0"}}>{BREAKS.map(function(b,i){return(<div key={i}><div className="bar-label"><span className="bar-name">{b.name}</span><span className="bar-val">{scores[i]}/20</span></div><div className="bar-track"><div className="bar-fill" style={{width:(scores[i]/20)*100+"%",background:cols[i]}}/></div></div>);})}</div>);}

async function getInsights(ctx){
  var prompt = "You are a senior commercial strategy advisor. You speak plainly \u2014 no jargon, no frameworks, no consulting-speak. You explain things the way a smart operator would explain them to a peer over coffee.\n\nA " + ctx.role + " at a " + ctx.size + " " + ctx.vertLabel + " company just completed a promise-to-proof diagnostic.\n\nScores (each out of 20):\n  Promise\u2192Deliver: " + ctx.bs[0] + "\n  Deliver\u2192Operate: " + ctx.bs[1] + "\n  Operate\u2192Measure: " + ctx.bs[2] + "\n  Measure\u2192Prove: " + ctx.bs[3] + "\n  Prove\u2192Decide: " + ctx.bs[4] + "\n  Total: " + ctx.total + "/100\n\nCurrent NRR: " + ctx.nrr + "\n\nSourced benchmarks \u2014 ONLY use these three data points. Do NOT invent any other numbers:\n- Companies with strong outcome practices achieve NRR 7-16 points higher than peers (McKinsey)\n- Top-quartile B2B SaaS NRR is 113% (Benchmarkit 2025)\n- Companies above 120% NRR get valuation multiples of 21x vs 9x (SaaS Capital)\n\nCRITICAL RULES ON NUMBERS:\n- Do NOT invent discount percentages (like '15-25% renewal discounts').\n- Do NOT invent dollar amounts (like '$1-4M ARR impact') unless directly calculated from their stated ARR range and the sourced NRR benchmarks above.\n- Do NOT invent improvement percentages (like '30-40% faster sales cycles').\n- Do NOT state made-up industry averages.\n- If you want to describe a financial impact, describe the MECHANISM (how it works) not the MAGNITUDE (how big it is). Say 'this typically shows up as discount pressure at renewal and stalled expansion conversations' NOT 'this costs 15-25% in renewal discounts'.\n- The only numbers you may use are: the user's scores, the user's NRR range, and the three sourced benchmarks above.\n\nHere is what you need to know about " + ctx.vertLabel + " companies:\n\nValue promise: " + ctx.vd.valuePromise + "\nTypical outcomes: " + ctx.vd.typicalOutcomes + "\n\nWhy proof is specifically hard in this vertical: " + ctx.vd.whyProofIsHard + "\n\nThe shape of the proof problem: " + ctx.vd.proofShape + "\n\nWhich breaks hurt most: " + ctx.vd.whatMakesItWorse + "\n\nWhat approaches don't work here (avoid suggesting these): " + ctx.vd.whatDoesntWork + "\n\nEvidence that actually drives renewals: " + ctx.vd.renewalEvidence + "\n\nINSTRUCTIONS:\n- Write like an experienced operator talking to a peer. No consulting frameworks. No buzzwords.\n- Be specific to " + ctx.vertLabel + ". If your text would work for any SaaS company, it's too generic \u2014 rewrite it.\n- Do NOT give a step-by-step implementation plan or timeline. Instead, identify where the architecture is broken and what areas are worth investigating further.\n- Do NOT be salesy or prescriptive. Be diagnostic \u2014 describe what you see, not what to do.\n- Frame observations as patterns you've seen in similar companies, not as certainties about this specific company.\n\nRespond ONLY with valid JSON. No backticks, no markdown.\n\n{\n  \"nrrGapAnalysis\": \"3-4 sentences. How is the proof gap costing this " + ctx.vertLabel + " company NRR? Describe the MECHANISM, not the magnitude. Name what typically happens: do renewals become price conversations? Do expansions stall because champions can't make the internal case? Does churn increase when a new CFO arrives and asks for proof? Reference McKinsey/Benchmarkit/SaaS Capital by name. Do NOT invent specific dollar amounts or percentages.\",\n  \"verticalDiagnosis\": \"4-5 sentences. What do these scores tell you about this " + ctx.vertLabel + " company? In plain language, explain why proof is structurally hard in this space: where does the evidence actually live, why can't the platform capture it, and what conversations go wrong at renewal because of that gap? Name specific systems (ERP, HRIS, CRM, etc). This MUST be specific to " + ctx.vertLabel + ".\",\n  \"biggestBreakImpact\": \"3-4 sentences. Their weakest link is " + BREAKS[ctx.weak].name + " (" + ctx.bs[ctx.weak] + "/20). Describe what typically goes wrong at this break for " + ctx.vertLabel + " companies. Frame as 'what we commonly see' not 'what this costs you $X'. If this isn't the most structurally dangerous break for this vertical (check 'which breaks hurt most' above), acknowledge their weak point but flag the structural one too.\",\n  \"areasToInvestigate\": [\n    { \"area\": \"short label\", \"observation\": \"2-3 sentences. Describe what's likely broken and why it matters for " + ctx.vertLabel + ". Frame as an observation or question: 'In most " + ctx.vertLabel.toLowerCase() + " companies, we see that...' or 'A question worth asking is whether...' Do NOT prescribe solutions.\" },\n    { \"area\": \"short label\", \"observation\": \"2-3 sentences. A different area of the architecture worth examining. Be specific to their scores and vertical.\" },\n    { \"area\": \"short label\", \"observation\": \"2-3 sentences. Connect to the structural reason proof is hard in this vertical.\" }\n  ],\n  \"roleSpecificInsight\": \"2-3 sentences for a " + ctx.role + ". How should they think about this \u2014 not as a CS problem but as a commercial architecture issue? Who else needs to be involved? Keep it practical.\"\n}";

  try{
    var r=await fetch("/api/collect",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"insights",prompt:prompt})});
    if(!r.ok){return{_error:"Server returned "+r.status};}
    var d=await r.json();
    if(d.error){return{_error:d.error};}
    return d.insights||{_error:"No insights in response"};
  }catch(e){return{_error:String(e)};}
}

export default function App(){
  var _p=useState("hero"),phase=_p[0],setPhase=_p[1];
  var _v=useState(""),vertId=_v[0],setVertId=_v[1];
  var _s=useState(""),size=_s[0],setSize=_s[1];
  var _n=useState(""),nrr=_n[0],setNrr=_n[1];
  var _r=useState(""),role=_r[0],setRole=_r[1];
  var _c=useState(0),cur=_c[0],setCur=_c[1];
  var _a=useState({}),ans=_a[0],setAns=_a[1];
  var _e=useState(""),email=_e[0],setEmail=_e[1];
  var _nm=useState(""),name=_nm[0],setName=_nm[1];
  var _co=useState(""),company=_co[0],setCompany=_co[1];
  var _se=useState(false),sending=_se[0],setSending=_se[1];
  var _in=useState(null),insights=_in[0],setInsights=_in[1];
  var _il=useState(false),loading=_il[0],setLoading=_il[1];
  var topRef=useRef(null);
  var vert=VERTICALS.find(function(v){return v.id===vertId;});

  useEffect(function(){if(phase!=="hero"&&topRef.current)topRef.current.scrollIntoView({behavior:"smooth",block:"start"});},[phase,cur]);

  var pick=function(qi,s){var next=Object.assign({},ans);next[qi]=s;setAns(next);
    if(cur<QS.length-1)setTimeout(function(){setCur(cur+1);},200);
    else setTimeout(function(){setPhase("gate");},400);};

  var total=Object.values(ans).reduce(function(a,b){return a+b;},0);
  var bscores=BREAKS.map(function(_,bi){return QS.filter(function(q){return q.b===bi;}).reduce(function(sum,q){return sum+(ans[QS.indexOf(q)]||0);},0);});
  var verdict=VERDICTS.find(function(v){return total>=v.min;});
  var weakest=bscores.indexOf(Math.min.apply(null,bscores));
  var nrrBench=NRR_BENCH;
  var validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  var handleGate=async function(){
    setSending(true);
    try{await fetch("/api/collect",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"lead",name:name,email:email,company:company,vertical:vert?vert.label:"",size:size,role:role,nrr:nrr,score:total,breakScores:bscores,weakestBreak:weakest,verdict:verdict.level,timestamp:new Date().toISOString()})});}catch(e){}
    setSending(false);setPhase("result");
    setLoading(true);
    var result=await getInsights({role:role,size:size,vertLabel:vert?vert.label:"B2B SaaS",vd:vert||VERTICALS[7],total:total,bs:bscores,nrr:nrr,bench:nrrBench,weak:weakest});
    setInsights(result);setLoading(false);
  };

  var handleDL=function(){
    var doc=generateReport({name:name,email:email,vertical:vert?vert.label:"",size:size,role:role,nrr:nrr,totalScore:total,breakScores:bscores,weakestBreak:weakest,insights:insights,verticalData:vert||VERTICALS[7],nrrBench:nrrBench});
    doc.save("Promise-to-Proof_"+name.replace(/\s+/g,"_")+".pdf");
  };

  var reset=function(){setPhase("hero");setCur(0);setAns({});setEmail("");setName("");setCompany("");setVertId("");setSize("");setRole("");setNrr("");setInsights(null);};

  if(phase==="hero")return(<><style>{S}</style><div className="hero"><span className="hero-pill">Free diagnostic for B2B SaaS</span><h1>How much NRR are you leaving on the table because you can{"'"}t prove <em>outcomes</em>?</h1><p>Get a personalized diagnosis for your SaaS vertical {"\u2014"} specific to how your product creates value, where proof breaks down, and what to look at next.</p><div className="stats"><div><div className="stat-num">10</div><div className="stat-label">questions</div></div><div><div className="stat-num">2</div><div className="stat-label">minutes</div></div><div><div className="stat-num">5</div><div className="stat-label">chain links scored</div></div></div><button className="hero-btn" onClick={function(){setPhase("context");}}>Take the assessment</button><div className="hero-sub">Free. Personalized for your vertical. Downloadable PDF report.</div></div><footer>Built by <a href="mailto:darius.fekete@gmail.com">Darius Fekete</a> {"\u00b7"} 18 years building commercial systems inside PE-backed B2B companies</footer></>);

  if(phase==="context")return(<><style>{S}</style><div className="wrap fade" ref={topRef}><div className="pill">Step 1 of 3</div><h2 className="section">About your company</h2><p style={{fontSize:13,color:"var(--fg2)",lineHeight:1.6}}>Different SaaS verticals have fundamentally different value chains. This shapes your diagnosis.</p>
    <div className="label">What does your product do?</div><div className="chips">{VERTICALS.map(function(v){return <button key={v.id} className={"chip"+(vertId===v.id?" on":"")} onClick={function(){setVertId(v.id);}}>{v.label}</button>;})}</div>
    {vert&&<div style={{fontSize:12,color:"var(--fg3)",marginTop:8,lineHeight:1.5,padding:"8px 12px",background:"var(--bg2)",borderRadius:8,border:"1px solid var(--border)"}}><strong style={{color:"var(--fg2)"}}>Value promise:</strong> {vert.valuePromise}</div>}
    <div className="label">Company size</div><div className="chips">{SIZES.map(function(s){return <button key={s} className={"chip"+(size===s?" on":"")} onClick={function(){setSize(s);}}>{s}</button>;})}</div>
    <div className="label">Current NRR (approximate)</div><div className="chips">{NRR_RANGES.map(function(n){return <button key={n} className={"chip"+(nrr===n?" on":"")} onClick={function(){setNrr(n);}}>{n}</button>;})}</div>
    <div className="label">Your role</div><div className="chips">{ROLES.map(function(r){return <button key={r} className={"chip"+(role===r?" on":"")} onClick={function(){setRole(r);}}>{r}</button>;})}</div>
    <button className="btn-main" disabled={!vertId||!size||!role||!nrr} onClick={function(){setPhase("questions");}}>Start assessment {"\u2192"}</button></div></>);

  if(phase==="questions"){var q=QS[cur];return(<><style>{S}</style><div className="wrap fade" ref={topRef}><div className="progress-wrap"><div className="progress-bar"><div className="progress-fill" style={{width:((cur+1)/QS.length)*100+"%"}}/></div><div className="progress-text">{cur+1}/{QS.length}</div></div><div className="q-break">{BREAKS[q.b].name}</div><div className="q-text">{q.q}</div>{q.opts.map(function(o,oi){return <button key={oi} className={"opt"+(ans[cur]===o.s?" sel":"")} onClick={function(){pick(cur,o.s);}}>{o.t}</button>;})}{cur>0&&<button className="back" onClick={function(){setCur(cur-1);}}>{"\u2190"} Back</button>}</div></>);}

  if(phase==="gate")return(<><style>{S}</style><div className="wrap fade" ref={topRef}><div className="gate-box"><div className="pill" style={{marginBottom:12}}>Your results are ready</div><h3>Get your personalized report</h3><p style={{fontSize:13,color:"var(--fg2)",marginTop:6,lineHeight:1.6}}>Includes {vert?vert.label:""}-specific diagnosis, NRR gap analysis, and areas to investigate.</p><input className="gate-input" type="text" placeholder="Your name" value={name} onChange={function(e){setName(e.target.value);}}/><input className="gate-input" type="email" placeholder="Work email" value={email} onChange={function(e){setEmail(e.target.value);}}/><input className="gate-input" type="text" placeholder="Company (optional)" value={company} onChange={function(e){setCompany(e.target.value);}}/><button className="btn-main" disabled={!validEmail||!name.trim()||sending} onClick={handleGate}>{sending?"Preparing...":"View results & get report"}</button><p className="consent">Your data stays private. No spam.</p></div></div></>);

  // RESULTS
  return(<><style>{S}</style><div className="wrap" ref={topRef}>
    <div style={{textAlign:"center",marginBottom:8}} className="score-reveal"><div className="pill" style={{marginBottom:16}}>Your promise-to-proof score</div><div className="score-num" style={{color:verdict.col}}>{total}</div><div style={{fontSize:14,color:"var(--fg3)",marginTop:4}}>out of 100</div></div>
    <div className="fade" style={{padding:"14px 18px",borderRadius:10,background:verdict.bg,borderLeft:"3px solid "+verdict.col,margin:"16px 0"}}><div style={{fontSize:13,fontWeight:600,color:verdict.col,marginBottom:4}}>{verdict.level}</div><div style={{fontSize:12,color:"var(--fg2)",lineHeight:1.7}}>{total>=80?"Your chain is largely intact. Focus on systematizing.":total>=60?"Gaps exist. You\u2019re likely leaving 5\u201310 NRR points on the table.":total>=35?"Significant breaks. Your team creates value but can\u2019t prove it.":"The chain is largely disconnected. NRR is well below potential."}</div></div>

    <div className={"rbox "+(nrr==="Above 120%"?"green":nrr==="Not sure"?"":"110-115%|115-120%".includes(nrr)?"amber":"red")}><div className="rbox-label" style={{color:nrr==="Above 120%"?"#22C55E":"#F59E0B"}}>NRR benchmark</div><div className="rbox-text"><strong>Your NRR: {nrr}</strong>. Top-quartile B2B SaaS: <strong>{nrrBench.topQuartile}</strong> (Benchmarkit 2025). Companies above 120% NRR achieve valuation multiples of {nrrBench.valuationMultiple} (SaaS Capital). Companies with structured outcome practices drive NRR <strong>{nrrBench.outcomeGap} higher</strong> than peers (McKinsey).</div></div>

    <Chain scores={bscores}/>
    <div className="fade"><div style={{fontSize:13,fontWeight:500,color:"var(--fg2)",marginBottom:6}}>Score by chain link</div><BarChart scores={bscores}/></div>

    {vert&&vert.id!=="other"&&<div className="rbox amber fade"><div className="rbox-label" style={{color:"#F59E0B"}}>Why proof is hard for {vert.label.toLowerCase()}</div><div className="rbox-text">{vert.whyProofIsHard}</div></div>}

    <div className="rbox red fade"><div className="rbox-label" style={{color:"#EF4444"}}>Your biggest gap: {BREAKS[weakest].name}</div><div className="rbox-text">{GAPREC[weakest]}</div></div>

    {loading&&<div className="llm-box"><div style={{marginBottom:8}}><span className="dot"/><span className="dot"/><span className="dot"/></div>Generating your {vert?vert.label:""}  diagnosis...</div>}

    {insights&&insights._error&&<div className="rbox red fade"><div className="rbox-label" style={{color:"#EF4444"}}>Diagnosis unavailable</div><div className="rbox-text">Could not generate personalized insights. Error: {insights._error}<br/><br/>The report will include your score, vertical context, and general observations. For a personalized diagnosis, contact darius.fekete@gmail.com.</div></div>}

    {insights&&!insights._error&&<div className="fade">
      <div className="rbox purple"><div className="rbox-label" style={{color:"var(--accent2)"}}>Your diagnosis</div><div className="rbox-text">{insights.verticalDiagnosis}</div></div>
      {insights.nrrGapAnalysis&&<div className="rbox"><div className="rbox-label" style={{color:"var(--fg3)"}}>NRR impact</div><div className="rbox-text">{insights.nrrGapAnalysis}</div></div>}
      {insights.biggestBreakImpact&&<div className="rbox red"><div className="rbox-label" style={{color:"#EF4444"}}>Impact of {BREAKS[weakest].name}</div><div className="rbox-text">{insights.biggestBreakImpact}</div></div>}
      {insights.areasToInvestigate&&<div style={{marginTop:14}}><div style={{fontSize:13,fontWeight:500,color:"var(--fg)",marginBottom:10}}>Areas to investigate</div>{insights.areasToInvestigate.map(function(a,i){return(<div key={i} className="rbox" style={{marginBottom:6}}><div className="rbox-label" style={{color:"var(--fg2)"}}>{a.area}</div><div className="rbox-text">{a.observation}</div></div>);})}</div>}
      {insights.roleSpecificInsight&&<div className="rbox purple" style={{marginTop:8}}><div className="rbox-label" style={{color:"var(--accent2)"}}>For you as {role}</div><div className="rbox-text">{insights.roleSpecificInsight}</div></div>}
    </div>}

    <button className="btn-dl fade" style={{marginTop:16}} onClick={handleDL} disabled={loading}>{loading?"Report generating...":"\u2193 Download full report (PDF)"}</button>
    <div className="cta-box fade"><div style={{fontSize:13,color:"var(--fg2)",lineHeight:1.6,marginBottom:8}}>Want to understand exactly where the architecture breaks in your company?</div><div style={{fontSize:14,fontWeight:500,color:"var(--accent2)"}}>darius.fekete@gmail.com</div></div>
    <button className="btn-ghost" style={{marginTop:8}} onClick={reset}>Take it again</button>
    <div style={{textAlign:"center",marginTop:28,fontSize:10,color:"var(--fg3)"}}>Built by Darius Fekete {"\u00b7"} <a href="mailto:darius.fekete@gmail.com" style={{color:"var(--accent2)",textDecoration:"none"}}>Get in touch</a></div>
  </div></>);
}
