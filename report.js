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
  function wrap(text, maxW) { return doc.splitTextToSize(String(text || ""), maxW || cw); }
  function checkPage(need) { if (y + need > 275) { doc.addPage(); y = 20; bg(); } }
  function sectionTitle(text) { checkPage(20); doc.setFontSize(10); doc.setTextColor(...fg); doc.text(text, margin, y); y += 7; }
  function bodyText(text, col) { doc.setFontSize(8); doc.setTextColor(...(col || gray)); var lines = wrap(text); doc.text(lines, margin, y); y += lines.length * 4 + 4; }

  // Page 1
  bg();
  doc.setFontSize(10); doc.setTextColor(...accent);
  doc.text("PROMISE-TO-PROOF SCORE", margin, y); y += 6;
  doc.setFontSize(8); doc.setTextColor(...gray);
  doc.text("Diagnostic Report", margin, y);
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

  // NRR benchmark
  if (ctx.nrr) {
    sectionTitle("NRR benchmark");
    bodyText("Your NRR: " + ctx.nrr + ". Top-quartile B2B SaaS NRR: 113%+ (Benchmarkit 2025). Companies above 120% NRR achieve valuation multiples of 21x vs 9x (SaaS Capital). Companies with structured outcome practices drive NRR 7-16 points higher than peers (McKinsey 2025).");
    if (ctx.insights && !ctx.insights._error && ctx.insights.nrrGapAnalysis) {
      bodyText(ctx.insights.nrrGapAnalysis, [200, 198, 192]);
    }
    divider();
  }

  // Why proof is hard
  if (ctx.verticalData && ctx.verticalData.whyProofIsHard) {
    sectionTitle("Why proof is hard for " + ctx.vertical.toLowerCase());
    bodyText(ctx.verticalData.whyProofIsHard);
    if (ctx.verticalData.proofShape) {
      bodyText("The shape of the problem: " + ctx.verticalData.proofShape, [200, 198, 192]);
    }
    bodyText("Evidence that drives renewal: " + ctx.verticalData.renewalEvidence + ".");
    divider();
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
  var ins = ctx.insights && !ctx.insights._error ? ctx.insights : null;

  if (ins && ins.verticalDiagnosis) {
    sectionTitle("Diagnosis: " + ctx.vertical);
    bodyText(ins.verticalDiagnosis, [200, 198, 192]);
    divider();
  }

  if (ins && ins.biggestBreakImpact) {
    sectionTitle("Biggest break: " + BREAKS[ctx.weakestBreak]);
    bodyText(ins.biggestBreakImpact, [200, 198, 192]);
    divider();
  }

  // Areas to investigate
  doc.addPage(); y = 20; bg();
  doc.setFontSize(10); doc.setTextColor(...accent);
  doc.text("AREAS TO INVESTIGATE", margin, y); y += 4;
  doc.setDrawColor(...accent); doc.setLineWidth(0.5);
  doc.line(margin, y, w - margin, y); y += 10;

  if (ins && ins.areasToInvestigate) {
    ins.areasToInvestigate.forEach(function(a) {
      checkPage(25);
      doc.setFontSize(9); doc.setTextColor(...fg); doc.text(a.area, margin, y); y += 5;
      doc.setFontSize(8); doc.setTextColor(...gray);
      var lines = wrap(a.observation); doc.text(lines, margin, y); y += lines.length * 4 + 8;
    });
    divider();
  } else {
    // Fallback
    sectionTitle("Where to look");
    bodyText("1. The handoff between Sales and Implementation: does the business case that closes the deal reach the team that delivers? Or does implementation start from scratch?");
    bodyText("2. The measurement gap: is your CS team tracking product activity (logins, usage, health scores) or actual business outcomes tied to what was promised?");
    bodyText("3. The renewal conversation: what evidence does your team bring? Adoption data, or proof that the customer got what they paid for?");
    divider();
  }

  // Role insight
  if (ins && ins.roleSpecificInsight) {
    sectionTitle("For you as " + ctx.role);
    bodyText(ins.roleSpecificInsight, [200, 198, 192]);
    divider();
  }

  // What makes proof hard (from vertical data, if not already covered by LLM)
  if (ctx.verticalData && ctx.verticalData.whatMakesItWorse && !ins) {
    sectionTitle("Which breaks matter most for " + ctx.vertical.toLowerCase());
    bodyText(ctx.verticalData.whatMakesItWorse);
    divider();
  }

  // EU Data Act
  checkPage(30);
  sectionTitle("Regulatory context: EU Data Act");
  bodyText("Effective September 2025, the EU Data Act allows customers to terminate any SaaS contract with 60 days' notice, regardless of original contract length. This means retention must be earned continuously through provable value. For companies with significant EU revenue, the ability to demonstrate outcomes is no longer a CS improvement \u2014 it's a revenue defense imperative.");
  divider();

  // CTA
  checkPage(30);
  doc.setFontSize(10); doc.setTextColor(...fg);
  doc.text("Want to understand where the architecture breaks?", margin, y); y += 8;
  doc.setTextColor(...gray); doc.setFontSize(8);
  doc.text("Darius Fekete  |  darius.fekete@gmail.com  |  Amsterdam, Netherlands", margin, y); y += 4;
  doc.text("18 years across Simon-Kucher, Capco, and Vendavo. 40+ commercial engagements. HEC Paris EMBA.", margin, y);

  // Footer
  var pageCount = doc.internal.getNumberOfPages();
  for (var i = 1; i <= pageCount; i++) {
    doc.setPage(i); doc.setFontSize(7); doc.setTextColor(...gray);
    doc.text("Promise-to-Proof Score  |  " + ctx.name + "  |  " + ctx.vertical + "  |  Page " + i + "/" + pageCount, w / 2, 290, { align: "center" });
  }
  return doc;
}
