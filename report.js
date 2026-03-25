import jsPDF from "jspdf";

const BREAKS = [
  "Promise \u2192 Deliver",
  "Deliver \u2192 Operate",
  "Operate \u2192 Measure",
  "Measure \u2192 Prove",
  "Prove \u2192 Decide",
];

const GAPREC = [
  "The business case that closes deals doesn't reach the team that delivers. Implementation starts without knowing what was promised. This causes rework, misaligned configurations, and delayed time-to-value. The cost shows up as extended implementation cycles, scope creep, and customers who go live on features that don't map to the outcomes they were sold.",
  "Go-live is treated as the finish line, not the starting line. Customers don't know what outcomes to expect or when. The opportunity window for early value proof closes unused. CS inherits an account with no outcome targets, no measurement baseline, and no way to verify whether the deployment is on track to deliver what was promised.",
  "Your team measures product activity, not business outcomes. The data shows adoption but can't answer whether the promise was delivered. This is the gap most SaaS companies feel but can't articulate. Health scores look green while the customer's CFO is quietly evaluating alternatives because nobody has shown them financial impact.",
  "Outcomes may exist but can't be attributed to your product. The customer achieved results, but the evidence connecting those results to your platform is scattered across systems neither side controls. Renewal conversations become price discussions because neither side has proof. This is where NRR leaks, silently, account by account.",
  "Proven outcomes don't feed back to Sales. Every new deal starts from scratch instead of building on verified evidence from similar customers. Your best proof points are invisible to the people who need them most. Sales builds business cases from theoretical ROI models instead of actual customer results, which undermines credibility with increasingly skeptical buyers.",
];

const BENCH = {
  "> $150M ARR": { typical: "40-55", best: "80+" },
  "$50-150M ARR": { typical: "35-50", best: "75+" },
  "$25-50M ARR": { typical: "25-40", best: "70+" },
  "$10-25M ARR": { typical: "20-35", best: "65+" },
  "< $10M ARR": { typical: "15-30", best: "60+" },
};

function getVerdict(score) {
  if (score >= 80) return { level: "Strong", text: "Your promise-to-proof chain is largely intact. You're positioned to defend NRR, support pricing transitions, and withstand diligence. Focus on systematizing what you have and building the compounding data asset from verified outcomes." };
  if (score >= 60) return { level: "Developing", text: "Some links in the chain are working, but gaps exist. You're likely leaving 5-10 NRR points on the table because outcome evidence is inconsistent across accounts and segments. Quick wins are available, particularly in standardizing the business case handoff and structuring renewal conversations around outcomes rather than activity." };
  if (score >= 35) return { level: "Exposed", text: "Significant breaks in the chain. Your team creates real value for customers but can't prove it systematically. Renewals default to price conversations. Expansion is slower than it should be. Under the EU Data Act (effective September 2025), which allows customers to terminate any SaaS contract with 60 days' notice, this gap becomes a direct revenue exposure for any European customer base." };
  return { level: "Critical", text: "The promise-to-proof chain is largely disconnected. NRR is likely 10-15 points below what your customer outcomes would actually support. Revenue is protected by contract inertia and switching costs, not by evidence. In a market where AI-driven procurement evaluates structured ROI data (not narratives), and where EU customers can leave in 60 days, this needs urgent attention." };
}

export function generateReport({ name, email, vertical, size, role, totalScore, breakScores, weakestBreak }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = 210;
  const margin = 20;
  const cw = w - 2 * margin;
  let y = 20;

  const accent = [99, 102, 241];
  const dark = [27, 42, 74];
  const gray = [154, 152, 144];
  const fg = [232, 230, 225];
  const green = [34, 197, 94];
  const amber = [245, 158, 11];
  const red = [239, 68, 68];

  doc.setFillColor(10, 10, 12);
  doc.rect(0, 0, w, 297, "F");

  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text("PROMISE-TO-PROOF SCORE", margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text("Diagnostic Report", margin, y);
  doc.text("Prepared for " + name, w - margin, y, { align: "right" });
  y += 4;
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(margin, y, w - margin, y);
  y += 12;

  const verdict = getVerdict(totalScore);
  const scoreCol = totalScore >= 80 ? green : totalScore >= 60 ? accent : totalScore >= 35 ? amber : red;
  doc.setFontSize(48);
  doc.setTextColor(...scoreCol);
  doc.text(String(totalScore), margin, y + 12);
  doc.setFontSize(14);
  doc.setTextColor(...gray);
  doc.text("/ 100", margin + 30, y + 12);
  doc.setFontSize(16);
  doc.setTextColor(...scoreCol);
  doc.text(verdict.level, margin + 55, y + 4);
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text(vertical + "  |  " + size + "  |  " + role, margin + 55, y + 12);
  y += 22;

  doc.setFontSize(9);
  doc.setTextColor(200, 198, 192);
  const verdictLines = doc.splitTextToSize(verdict.text, cw);
  doc.text(verdictLines, margin, y);
  y += verdictLines.length * 4.5 + 8;

  doc.setDrawColor(40, 40, 46);
  doc.setLineWidth(0.3);
  doc.line(margin, y, w - margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(...fg);
  doc.text("Score by chain link", margin, y);
  y += 8;

  const barColors = [[99, 102, 241], [34, 211, 238], [167, 139, 250], [245, 158, 11], [52, 211, 153]];
  BREAKS.forEach(function(b, i) {
    var score = breakScores[i];
    var pct = (score / 20) * cw;
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text(b, margin, y + 3);
    doc.setTextColor(...fg);
    doc.text(score + "/20", w - margin, y + 3, { align: "right" });
    doc.setFillColor(30, 30, 36);
    doc.roundedRect(margin, y + 5, cw, 3, 1.5, 1.5, "F");
    if (pct > 0) {
      doc.setFillColor(...barColors[i]);
      doc.roundedRect(margin, y + 5, Math.max(pct, 3), 3, 1.5, 1.5, "F");
    }
    y += 14;
  });

  y += 4;
  doc.setDrawColor(40, 40, 46);
  doc.line(margin, y, w - margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(...fg);
  doc.text("Your biggest gap", margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(...accent);
  doc.text(BREAKS[weakestBreak], margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(180, 178, 170);
  var gapLines = doc.splitTextToSize(GAPREC[weakestBreak], cw);
  doc.text(gapLines, margin, y);
  y += gapLines.length * 4 + 8;

  var bench = BENCH[size] || BENCH["$25-50M ARR"];
  doc.setDrawColor(40, 40, 46);
  doc.line(margin, y, w - margin, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(...fg);
  doc.text("Benchmark: " + size, margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  var benchText = "Companies in your range typically score " + bench.typical + ". Best-in-class: " + bench.best + ". Companies with strong outcome practices drive NRR 7-16 points higher than peers (McKinsey, 2025).";
  var benchLines = doc.splitTextToSize(benchText, cw);
  doc.text(benchLines, margin, y);
  y += benchLines.length * 4 + 8;

  // Page 2
  doc.addPage();
  y = 20;
  doc.setFillColor(10, 10, 12);
  doc.rect(0, 0, w, 297, "F");

  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text("WHAT TO DO NEXT", margin, y);
  y += 4;
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(margin, y, w - margin, y);
  y += 10;

  var actions = [
    { title: "Quick wins (act this quarter)", items: [
      "Standardize the business case handoff: create a one-page template that captures the 3 specific outcomes Sales promised, the baseline metrics, and the expected timeline. This document travels from Sales to Implementation to CS.",
      "Structure 3 renewal conversations around outcomes: pick your top 3 renewals in the next 90 days. Before each one, identify what was promised and what evidence exists. Even partial evidence changes the conversation from price to value.",
      "Run the 'CFO test' on 10 accounts: for each, ask 'could we prove to this customer's CFO that our software delivered what was promised?' Document the gap between what you'd need and what you have.",
    ]},
    { title: "Infrastructure (build this half)", items: [
      "Define your outcome taxonomy: create a standardized list of 5-10 business outcomes your product delivers, by vertical and use case. This becomes the shared language across Sales, CS, and Product.",
      "Build the measurement connection: for each outcome in your taxonomy, identify where the evidence lives (your platform, customer's ERP, manual reporting) and what it would take to make it accessible at renewal.",
      "Pilot outcome-based EBRs: select 5 accounts and run executive business reviews grounded in business outcomes rather than product activity. Document what works, what data you're missing, and how the customer responds.",
    ]},
    { title: "Strategic (plan for next year)", items: [
      "Assess EU Data Act exposure: quantify what percentage of your ARR comes from EU customers now exposed to 60-day termination rights. Model the NRR impact if 10-20% of those customers re-evaluate without outcome evidence.",
      "Evaluate pricing transition readiness: if you're considering usage-based or outcome-based pricing, assess whether your outcome data foundation can support it. You cannot charge for results you cannot measure.",
      "Build the feedback loop: create the process for verified customer outcomes to feed back into Sales, Product, and Marketing. This closes the chain and creates a compounding data asset.",
    ]},
  ];

  actions.forEach(function(section) {
    if (y > 250) { doc.addPage(); y = 20; doc.setFillColor(10, 10, 12); doc.rect(0, 0, w, 297, "F"); }
    doc.setFontSize(10);
    doc.setTextColor(...fg);
    doc.text(section.title, margin, y);
    y += 7;
    section.items.forEach(function(item, idx) {
      if (y > 265) { doc.addPage(); y = 20; doc.setFillColor(10, 10, 12); doc.rect(0, 0, w, 297, "F"); }
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      var lines = doc.splitTextToSize((idx + 1) + ". " + item, cw - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4 + 4;
    });
    y += 6;
  });

  if (y > 240) { doc.addPage(); y = 20; doc.setFillColor(10, 10, 12); doc.rect(0, 0, w, 297, "F"); }
  y += 8;
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(margin, y, w - margin, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(...fg);
  doc.text("Want to know exactly where the chain breaks in your company?", margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(...accent);
  doc.text("A 2-4 week Commercial Value Scan can quantify the gap and identify quick wins", margin, y);
  y += 5;
  doc.text("your team can act on immediately.", margin, y);
  y += 8;
  doc.setTextColor(...gray);
  doc.setFontSize(8);
  doc.text("Darius Fekete  |  darius.fekete@gmail.com  |  Amsterdam, Netherlands", margin, y);
  y += 4;
  doc.text("18 years across Simon-Kucher, Capco, and Vendavo. 40+ commercial transformations. HEC Paris EMBA.", margin, y);

  var pageCount = doc.internal.getNumberOfPages();
  for (var i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text("Promise-to-Proof Score Report  |  " + name + "  |  Page " + i + " of " + pageCount, w / 2, 290, { align: "center" });
  }

  return doc;
}
