import jsPDF from "jspdf";

var BREAKS = [
  "Promise \u2192 Deliver",
  "Deliver \u2192 Operate",
  "Operate \u2192 Measure",
  "Measure \u2192 Prove",
  "Prove \u2192 Decide",
];

export function generateReport(ctx) {
  var doc = new jsPDF({ unit: "mm", format: "a4" });
  var w = 210, margin = 20, cw = w - 2 * margin;
  var y = 20;
  var accent = [99, 102, 241], gray = [154, 152, 144], fg = [232, 230, 225];
  var green = [34, 197, 94], amber = [245, 158, 11], red = [239, 68, 68];

  function bg() { doc.setFillColor(10, 10, 12); doc.rect(0, 0, w, 297, "F"); }
  function divider() { doc.setDrawColor(40, 40, 46); doc.setLineWidth(0.3); doc.line(margin, y, w - margin, y); y += 10; }
  function wrap(text, maxW) { return doc.splitTextToSize(text, maxW || cw); }
  function checkPage(need) { if (y + need > 275) { doc.addPage(); y = 20; bg(); } }
  function sectionTitle(text) { checkPage(20); doc.setFontSize(10); doc.setTextColor(...fg); doc.text(text, margin, y); y += 7; }
  function bodyText(text, col) { doc.setFontSize(8); doc.setTextColor(...(col || gray)); var lines = wrap(text); doc.text(lines, margin, y); y += lines.length * 4 + 4; }

  // Page 1
  bg();
  doc.setFontSize(10); doc.setTextColor(...accent);
  doc.text("PROMISE-TO-PROOF SCORE", margin, y); y += 6;
  doc.setFontSize(8); doc.setTextColor(...gray);
  doc.text("Personalized Diagnostic Report", margin, y);
  doc.text("Prepared for " + ctx.name, w - margin, y, { align: "right" }); y += 4;
  doc.setDrawColor(...accent); doc.setLineWidth(0.5);
  doc.line(margin, y, w - margin, y); y += 12;

  // Score
  var scoreCol = ctx.totalScore >= 80 ? green : ctx.totalScore >= 60 ? accent : ctx.totalScore >= 35 ? amber : red;
  var level = ctx.totalScore >= 80 ? "Strong" : ctx.totalScore >= 60 ? "Developing" : ctx.totalScore >= 35 ? "Exposed" : "Critical";
  doc.setFontSize(44); doc.setTextColor(...scoreCol);
  doc.text(String(ctx.totalScore), margin, y + 10);
  doc.setFontSize(14); doc.setTextColor(...gray); doc.text("/ 100", margin + 28, y + 10);
  doc.setFontSize(16); doc.setTextColor(...scoreCol); doc.text(level, margin + 52, y + 4);
  doc.setFontSize(8); doc.setTextColor(...gray);
  doc.text(ctx.vertical + "  |  " + ctx.size + "  |  " + ctx.role, margin + 52, y + 11);
  y += 22;

  // NRR gap
  if (ctx.nrr) {
    doc.setFontSize(9); doc.setTextColor(...fg);
    doc.text("NRR benchmark", margin, y); y += 6;
    doc.setFontSize(8); doc.setTextColor(...gray);
    var nrrText = "Your NRR: " + ctx.nrr + ". Top-quartile B2B SaaS NRR: 113%+ (Benchmarkit 2025). Companies above 120% NRR achieve valuation multiples of 21x vs 9x (SaaS Capital). Companies with structured outcome practices drive NRR 7-16 points higher than peers (McKinsey 2025).";
    var nrrLines = wrap(nrrText); doc.text(nrrLines, margin, y); y += nrrLines.length * 4 + 2;
    if (ctx.insights && !ctx.insights._error && ctx.insights.nrrGapAnalysis) {
      doc.setTextColor(200, 198, 192);
      var insLines = wrap(ctx.insights.nrrGapAnalysis); doc.text(insLines, margin, y); y += insLines.length * 4 + 4;
    }
    y += 4; divider();
  }

  // Vertical-specific context
  if (ctx.verticalData) {
    sectionTitle("Value context: " + ctx.vertical);
    bodyText("Value promise: " + ctx.verticalData.valuePromise + ".");
    bodyText("Typical outcomes: " + ctx.verticalData.typicalOutcomes + ".");
    bodyText("Proof challenge: " + ctx.verticalData.proofChallenge);
    bodyText("Renewal evidence needed: " + ctx.verticalData.renewalEvidence + ".");
    y += 2; divider();
  }

  // Break scores
  sectionTitle("Score by chain link");
  var barColors = [[99, 102, 241], [34, 211, 238], [167, 139, 250], [245, 158, 11], [52, 211, 153]];
  BREAKS.forEach(function(b, i) {
    checkPage(16);
    var score = ctx.breakScores[i];
    doc.setFontSize(8); doc.setTextColor(...gray); doc.text(b, margin, y + 3);
    doc.setTextColor(...fg); doc.text(score + "/20", w - margin, y + 3, { align: "right" });
    doc.setFillColor(30, 30, 36); doc.roundedRect(margin, y + 5, cw, 3, 1.5, 1.5, "F");
    if (score > 0) { doc.setFillColor(...barColors[i]); doc.roundedRect(margin, y + 5, Math.max((score / 20) * cw, 3), 3, 1.5, 1.5, "F"); }
    y += 14;
  });
  y += 4; divider();

  // LLM diagnosis
  if (ctx.insights && !ctx.insights._error) {
    if (ctx.insights.verticalDiagnosis) {
      sectionTitle("Diagnosis: " + ctx.vertical);
      bodyText(ctx.insights.verticalDiagnosis, [200, 198, 192]);
      divider();
    }
    if (ctx.insights.biggestBreakImpact) {
      sectionTitle("Biggest break: " + BREAKS[ctx.weakestBreak]);
      bodyText(ctx.insights.biggestBreakImpact, [200, 198, 192]);
      divider();
    }
  }

  // Page 2: Actions
  doc.addPage(); y = 20; bg();
  doc.setFontSize(10); doc.setTextColor(...accent);
  doc.text("YOUR ACTION PLAN", margin, y); y += 4;
  doc.setDrawColor(...accent); doc.setLineWidth(0.5);
  doc.line(margin, y, w - margin, y); y += 10;

  if (ctx.insights && !ctx.insights._error && ctx.insights.threeActions) {
    var timeframes = ["This month", "This quarter", "6-month horizon"];
    ctx.insights.threeActions.forEach(function(a, i) {
      checkPage(25);
      doc.setFontSize(9); doc.setTextColor(...green); doc.text(timeframes[i], margin, y); y += 5;
      doc.setFontSize(9); doc.setTextColor(...fg); doc.text(a.title, margin, y); y += 5;
      doc.setFontSize(8); doc.setTextColor(...gray);
      var lines = wrap(a.detail); doc.text(lines, margin, y); y += lines.length * 4 + 8;
    });
    divider();
  } else {
    // Fallback generic actions
    sectionTitle("Quick wins (this quarter)");
    bodyText("1. Standardize the business case handoff: create a one-page template that captures the 3 specific outcomes Sales promised. This document travels from Sales to Implementation to CS.");
    bodyText("2. Structure 3 renewal conversations around outcomes: pick your top 3 renewals in the next 90 days. Identify what was promised and what evidence exists.");
    bodyText("3. Run the 'CFO test' on 10 accounts: for each, ask 'could we prove to this customer's CFO that our software delivered what was promised?'");
    divider();
    sectionTitle("Infrastructure (this half)");
    bodyText("1. Define your outcome taxonomy: 5-10 business outcomes by vertical and use case. The shared language across Sales, CS, and Product.");
    bodyText("2. Build the measurement connection: for each outcome, identify where evidence lives and what it takes to make it accessible.");
    bodyText("3. Pilot outcome-based EBRs with 5 accounts. Document what works and what data you're missing.");
    divider();
  }

  // Role insight
  if (ctx.insights && !ctx.insights._error && ctx.insights.roleSpecificInsight) {
    sectionTitle("For you as " + ctx.role);
    bodyText(ctx.insights.roleSpecificInsight, [200, 198, 192]);
    divider();
  }

  // EU Data Act context
  checkPage(30);
  sectionTitle("Regulatory context: EU Data Act");
  bodyText("Effective September 2025, the EU Data Act allows customers to terminate any SaaS contract with 60 days' notice, regardless of original contract length. This means retention must be earned continuously through provable value. For companies with significant EU revenue, the ability to demonstrate outcomes is no longer a CS improvement - it's a revenue defense imperative.");
  divider();

  // CTA
  checkPage(30);
  doc.setFontSize(10); doc.setTextColor(...fg);
  doc.text("Want to know exactly where the chain breaks?", margin, y); y += 6;
  doc.setFontSize(9); doc.setTextColor(...accent);
  doc.text("A 2-4 week Commercial Value Scan can quantify the gap and identify", margin, y); y += 5;
  doc.text("quick wins your team can act on immediately.", margin, y); y += 8;
  doc.setTextColor(...gray); doc.setFontSize(8);
  doc.text("Darius Fekete  |  darius.fekete@gmail.com  |  Amsterdam, Netherlands", margin, y); y += 4;
  doc.text("18 years across Simon-Kucher, Capco, and Vendavo. 40+ commercial transformations. HEC Paris EMBA.", margin, y);

  // Footer
  var pageCount = doc.internal.getNumberOfPages();
  for (var i = 1; i <= pageCount; i++) {
    doc.setPage(i); doc.setFontSize(7); doc.setTextColor(...gray);
    doc.text("Promise-to-Proof Score  |  " + ctx.name + "  |  " + ctx.vertical + "  |  Page " + i + "/" + pageCount, w / 2, 290, { align: "center" });
  }
  return doc;
}
