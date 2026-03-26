import jsPDF from "jspdf";

var BREAK_NAMES = [
  "Promise \u2192 Deliver",
  "Deliver \u2192 Operate",
  "Operate \u2192 Measure",
  "Measure \u2192 Prove",
  "Prove \u2192 Decide",
];

var BAR_COLORS = [
  [99, 102, 241],
  [34, 211, 238],
  [167, 139, 250],
  [245, 158, 11],
  [52, 211, 153],
];

export function generateReport(ctx) {
  var doc = new jsPDF({ unit: "mm", format: "a4" });
  var W = 210, H = 297;
  var ML = 22, MR = 22, MT = 22;
  var CW = W - ML - MR;
  var y = MT;

  // Colors
  var C = {
    bg: [10, 10, 12],
    bg2: [17, 17, 20],
    bg3: [24, 24, 28],
    fg: [232, 230, 225],
    fg2: [154, 152, 144],
    fg3: [92, 91, 86],
    accent: [99, 102, 241],
    accent2: [129, 140, 248],
    green: [34, 197, 94],
    amber: [245, 158, 11],
    red: [239, 68, 68],
  };

  function pageBg() {
    doc.setFillColor(...C.bg);
    doc.rect(0, 0, W, H, "F");
  }

  function pageFooter(pageNum, totalPages) {
    doc.setFontSize(7);
    doc.setTextColor(...C.fg3);
    doc.text(ctx.name + "  |  " + ctx.vertical + "  |  " + ctx.size, ML, H - 10);
    doc.text("Page " + pageNum + " of " + totalPages, W - MR, H - 10, { align: "right" });
    doc.setDrawColor(...C.bg3);
    doc.setLineWidth(0.3);
    doc.line(ML, H - 14, W - MR, H - 14);
  }

  function needPage(need) {
    if (y + need > H - 20) {
      doc.addPage();
      pageBg();
      y = MT;
      return true;
    }
    return false;
  }

  function sectionHeader(text, color) {
    needPage(14);
    doc.setFillColor(...(color || C.accent));
    doc.rect(ML, y, 3, 10, "F");
    doc.setFontSize(10);
    doc.setTextColor(...C.fg);
    doc.text(text, ML + 8, y + 7);
    y += 16;
  }

  function bodyParagraph(text, color) {
    doc.setFontSize(8.5);
    doc.setTextColor(...(color || C.fg2));
    var lines = doc.splitTextToSize(String(text || ""), CW - 4);
    needPage(lines.length * 4.2 + 4);
    doc.text(lines, ML + 2, y);
    y += lines.length * 4.2 + 6;
  }

  function spacer(h) { y += (h || 6); }

  function thinLine() {
    doc.setDrawColor(...C.bg3);
    doc.setLineWidth(0.2);
    doc.line(ML, y, W - MR, y);
    y += 8;
  }

  // ═══════════════════════════════════════════
  // PAGE 1: Score + Context
  // ═══════════════════════════════════════════
  pageBg();

  // Header bar
  doc.setFillColor(...C.bg2);
  doc.rect(0, 0, W, 38, "F");
  doc.setFontSize(9);
  doc.setTextColor(...C.accent2);
  doc.text("PROMISE-TO-PROOF SCORE", ML, 14);
  doc.setFontSize(8);
  doc.setTextColor(...C.fg3);
  doc.text("Diagnostic Report", ML, 22);
  doc.text("Prepared for " + ctx.name, W - MR, 14, { align: "right" });
  doc.text(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), W - MR, 22, { align: "right" });
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.5);
  doc.line(0, 38, W, 38);

  y = 52;

  // Score display
  var scoreCol = ctx.totalScore >= 80 ? C.green : ctx.totalScore >= 60 ? C.accent : ctx.totalScore >= 35 ? C.amber : C.red;
  var level = ctx.totalScore >= 80 ? "Strong" : ctx.totalScore >= 60 ? "Developing" : ctx.totalScore >= 35 ? "Exposed" : "Critical";

  doc.setFontSize(56);
  doc.setTextColor(...scoreCol);
  doc.text(String(ctx.totalScore), ML, y + 16);

  var scoreW = doc.getTextWidth(String(ctx.totalScore));
  doc.setFontSize(18);
  doc.setTextColor(...C.fg3);
  doc.text("/ 100", ML + scoreW + 4, y + 16);

  doc.setFontSize(20);
  doc.setTextColor(...scoreCol);
  doc.text(level, ML + scoreW + 36, y + 6);

  doc.setFontSize(9);
  doc.setTextColor(...C.fg2);
  doc.text(ctx.vertical, ML + scoreW + 36, y + 14);
  doc.setFontSize(8);
  doc.setTextColor(...C.fg3);
  doc.text(ctx.size + "  |  " + ctx.role + "  |  NRR: " + (ctx.nrr || "n/a"), ML + scoreW + 36, y + 21);

  y += 36;
  thinLine();

  // Bar chart
  doc.setFontSize(9);
  doc.setTextColor(...C.fg);
  doc.text("Score by chain link", ML, y);
  y += 8;

  BREAK_NAMES.forEach(function(b, i) {
    var score = ctx.breakScores[i];
    var pct = Math.max((score / 20) * (CW - 50), 2);
    var strength = score >= 15 ? "strong" : score >= 8 ? "partial" : "broken";
    var dotCol = strength === "strong" ? C.green : strength === "partial" ? C.amber : C.red;

    // Label
    doc.setFontSize(8);
    doc.setTextColor(...C.fg2);
    doc.text(b, ML, y + 3.5);

    // Track
    doc.setFillColor(...C.bg3);
    doc.roundedRect(ML + 50, y, CW - 50, 5, 2.5, 2.5, "F");

    // Fill
    doc.setFillColor(...BAR_COLORS[i]);
    doc.roundedRect(ML + 50, y, pct, 5, 2.5, 2.5, "F");

    // Score label
    doc.setFontSize(8);
    doc.setTextColor(...C.fg);
    doc.text(score + "/20", W - MR, y + 3.5, { align: "right" });

    // Status dot
    doc.setFillColor(...dotCol);
    doc.circle(W - MR - 18, y + 2.5, 1.5, "F");

    y += 10;
  });

  y += 4;
  thinLine();

  // NRR benchmark
  sectionHeader("NRR benchmark", C.amber);
  bodyParagraph("Your NRR: " + (ctx.nrr || "not provided") + ". Top-quartile B2B SaaS NRR is 113%+ (Benchmarkit 2025). Companies above 120% NRR achieve valuation multiples of 21x vs 9x (SaaS Capital). Companies with structured outcome practices drive NRR 7\u201316 points higher than peers (McKinsey).");

  var ins = ctx.insights && !ctx.insights._error ? ctx.insights : null;

  if (ins && ins.nrrGapAnalysis) {
    bodyParagraph(ins.nrrGapAnalysis, C.fg2);
  }

  // ═══════════════════════════════════════════
  // PAGE 2: Diagnosis
  // ═══════════════════════════════════════════
  doc.addPage();
  pageBg();
  y = MT;

  // Why proof is hard
  if (ctx.verticalData && ctx.verticalData.whyProofIsHard) {
    sectionHeader("Why proof is hard for " + ctx.vertical.toLowerCase(), C.amber);
    bodyParagraph(ctx.verticalData.whyProofIsHard);
    if (ctx.verticalData.proofShape) {
      doc.setFontSize(8);
      doc.setTextColor(...C.fg3);
      var shapeLines = doc.splitTextToSize("The shape of the problem: " + ctx.verticalData.proofShape, CW - 4);
      doc.text(shapeLines, ML + 2, y);
      y += shapeLines.length * 4 + 6;
    }
    spacer(2);
    thinLine();
  }

  // Vertical diagnosis (LLM)
  if (ins && ins.verticalDiagnosis) {
    sectionHeader("Your diagnosis", C.accent);
    bodyParagraph(ins.verticalDiagnosis, [200, 198, 192]);
    thinLine();
  }

  // Biggest break (LLM)
  if (ins && ins.biggestBreakImpact) {
    sectionHeader("Biggest break: " + BREAK_NAMES[ctx.weakestBreak], C.red);
    bodyParagraph(ins.biggestBreakImpact, [200, 198, 192]);
    thinLine();
  }

  // What evidence drives renewal
  if (ctx.verticalData && ctx.verticalData.renewalEvidence) {
    sectionHeader("Evidence that drives renewal", C.green);
    bodyParagraph("For " + ctx.vertical.toLowerCase() + " companies: " + ctx.verticalData.renewalEvidence + ".");
    thinLine();
  }

  // ═══════════════════════════════════════════
  // PAGE 3: Areas to investigate + CTA
  // ═══════════════════════════════════════════
  doc.addPage();
  pageBg();
  y = MT;

  sectionHeader("Areas to investigate", C.accent);

  if (ins && ins.areasToInvestigate) {
    ins.areasToInvestigate.forEach(function(a, i) {
      needPage(30);

      // Area label
      doc.setFillColor(...C.bg2);
      doc.roundedRect(ML, y, CW, 6, 2, 2, "F");
      doc.setFontSize(8);
      doc.setTextColor(...C.accent2);
      doc.text((i + 1) + ".  " + (a.area || ""), ML + 4, y + 4.2);
      y += 10;

      // Observation
      bodyParagraph(a.observation, [200, 198, 192]);
      spacer(2);
    });
  } else {
    // Fallback
    var fallbackAreas = [
      { area: "The handoff between Sales and Implementation", text: "Does the business case that closes the deal reach the team that delivers? Or does implementation start from scratch every time?" },
      { area: "The measurement gap", text: "Is your CS team tracking product activity (logins, usage, health scores) or actual business outcomes tied to what was promised?" },
      { area: "The renewal conversation", text: "What evidence does your team bring? Adoption data, or proof that the customer got what they paid for?" },
    ];
    fallbackAreas.forEach(function(a, i) {
      doc.setFillColor(...C.bg2);
      doc.roundedRect(ML, y, CW, 6, 2, 2, "F");
      doc.setFontSize(8);
      doc.setTextColor(...C.accent2);
      doc.text((i + 1) + ".  " + a.area, ML + 4, y + 4.2);
      y += 10;
      bodyParagraph(a.text, [200, 198, 192]);
      spacer(2);
    });
  }

  thinLine();

  // Role insight
  if (ins && ins.roleSpecificInsight) {
    sectionHeader("For you as " + ctx.role, C.accent);
    bodyParagraph(ins.roleSpecificInsight, [200, 198, 192]);
    thinLine();
  }

  // EU Data Act
  needPage(35);
  sectionHeader("Regulatory context", C.fg3);
  bodyParagraph("Effective September 2025, the EU Data Act allows customers to terminate any SaaS contract with 60 days\u2019 notice, regardless of original contract length. For companies with significant EU revenue, the ability to demonstrate outcomes is no longer a CS improvement \u2014 it\u2019s a revenue defense imperative.");

  spacer(8);
  thinLine();

  // CTA
  needPage(30);
  doc.setFontSize(10);
  doc.setTextColor(...C.fg);
  doc.text("Want to understand where the architecture breaks?", ML, y);
  y += 10;
  doc.setFontSize(8.5);
  doc.setTextColor(...C.fg2);
  doc.text("This diagnostic identifies the pattern. A deeper conversation can pinpoint", ML, y);
  y += 4.5;
  doc.text("exactly where and how to close the gap for your specific company.", ML, y);
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(...C.accent2);
  doc.text("darius.fekete@gmail.com", ML, y);
  y += 6;
  doc.setFontSize(7.5);
  doc.setTextColor(...C.fg3);
  doc.text("Darius Fekete  |  Amsterdam, Netherlands", ML, y);
  y += 4;
  doc.text("18 years across Simon-Kucher, Capco, and Vendavo. 40+ commercial engagements. HEC Paris EMBA.", ML, y);

  // ═══════════════════════════════════════════
  // Add footers to all pages
  // ═══════════════════════════════════════════
  var totalPages = doc.internal.getNumberOfPages();
  for (var p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    pageFooter(p, totalPages);
  }

  return doc;
}
