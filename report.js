import jsPDF from "jspdf";

// jsPDF default fonts can't render unicode arrows - use plain text
var BREAK_LABELS = [
  "Promise > Deliver",
  "Deliver > Operate",
  "Operate > Measure",
  "Measure > Prove",
  "Prove > Decide",
];

var BAR_COLORS = [
  [99, 102, 241],
  [34, 211, 238],
  [167, 139, 250],
  [245, 158, 11],
  [52, 211, 153],
];

// Strip unicode arrows from LLM text for clean PDF rendering
function clean(str) {
  return String(str || "")
    .replace(/\u2192/g, ">")
    .replace(/\u2014/g, " - ")
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u2013/g, "-");
}

export function generateReport(ctx) {
  var doc = new jsPDF({ unit: "mm", format: "a4" });
  var W = 210, H = 297;
  var ML = 24, MR = 24;
  var CW = W - ML - MR;
  var y = 0;

  // Consistent type scale
  var FS = { title: 11, body: 9, small: 7.5, label: 7, score: 48, verdict: 18 };
  var LH = 4.5; // line height for body text

  // Colors
  var BG =   [10, 10, 12];
  var BG2 =  [20, 20, 24];
  var BG3 =  [32, 32, 38];
  var FG =   [232, 230, 225];
  var FG2 =  [170, 168, 160];
  var FG3 =  [100, 98, 92];
  var ACC =  [99, 102, 241];
  var ACC2 = [129, 140, 248];
  var GRN =  [34, 197, 94];
  var AMB =  [245, 158, 11];
  var RED =  [239, 68, 68];

  function pageBg() {
    doc.setFillColor(...BG);
    doc.rect(0, 0, W, H, "F");
  }

  function newPage() {
    doc.addPage();
    pageBg();
    y = 28;
  }

  function needSpace(px) {
    if (y + px > H - 22) { newPage(); return true; }
    return false;
  }

  function writeLines(text, maxW, fontSize, color, lineH) {
    doc.setFontSize(fontSize || FS.body);
    doc.setTextColor(...(color || FG2));
    var lines = doc.splitTextToSize(clean(text), maxW || CW);
    var h = lineH || LH;
    needSpace(lines.length * h + 4);
    for (var i = 0; i < lines.length; i++) {
      doc.text(lines[i], ML, y);
      y += h;
    }
    y += 3;
  }

  function sectionHead(text, accentColor) {
    needSpace(18);
    y += 4;
    doc.setFillColor(...(accentColor || ACC));
    doc.rect(ML, y - 4, 2.5, 12, "F");
    doc.setFontSize(FS.title);
    doc.setTextColor(...FG);
    doc.text(clean(text), ML + 8, y + 4);
    y += 14;
  }

  function divider() {
    y += 2;
    doc.setDrawColor(...BG3);
    doc.setLineWidth(0.15);
    doc.line(ML, y, W - MR, y);
    y += 8;
  }

  // ── PAGE 1 ─────────────────────────────────────────────
  pageBg();

  // Header band
  doc.setFillColor(...BG2);
  doc.rect(0, 0, W, 40, "F");
  doc.setDrawColor(...ACC);
  doc.setLineWidth(0.4);
  doc.line(0, 40, W, 40);

  doc.setFontSize(9);
  doc.setTextColor(...ACC2);
  doc.text("PROMISE-TO-PROOF SCORE", ML, 16);

  doc.setFontSize(FS.body);
  doc.setTextColor(...FG3);
  doc.text("Diagnostic Report", ML, 24);
  doc.text("Prepared for " + clean(ctx.name), ML, 32);

  doc.setTextColor(...FG3);
  doc.text(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), W - MR, 16, { align: "right" });

  // Score block
  y = 56;
  var scoreCol = ctx.totalScore >= 80 ? GRN : ctx.totalScore >= 60 ? ACC : ctx.totalScore >= 35 ? AMB : RED;
  var level = ctx.totalScore >= 80 ? "Strong" : ctx.totalScore >= 60 ? "Developing" : ctx.totalScore >= 35 ? "Exposed" : "Critical";

  doc.setFontSize(FS.score);
  doc.setTextColor(...scoreCol);
  doc.text(String(ctx.totalScore), ML, y);

  doc.setFontSize(16);
  doc.setTextColor(...FG3);
  doc.text("/ 100", ML + 32, y);

  doc.setFontSize(FS.verdict);
  doc.setTextColor(...scoreCol);
  doc.text(level, ML + 60, y - 8);

  doc.setFontSize(FS.body);
  doc.setTextColor(...FG2);
  doc.text(clean(ctx.vertical), ML + 60, y - 1);

  doc.setFontSize(FS.small);
  doc.setTextColor(...FG3);
  doc.text(clean(ctx.size + "  |  " + ctx.role + "  |  NRR: " + (ctx.nrr || "n/a")), ML + 60, y + 5);

  y += 18;
  divider();

  // Bar chart
  doc.setFontSize(FS.body);
  doc.setTextColor(...FG);
  doc.text("Score by chain link", ML, y);
  y += 8;

  BREAK_LABELS.forEach(function(label, i) {
    var score = ctx.breakScores[i];
    var pct = Math.max((score / 20) * (CW - 55), 2);
    var dotCol = score >= 15 ? GRN : score >= 8 ? AMB : RED;

    doc.setFontSize(FS.small);
    doc.setTextColor(...FG2);
    doc.text(label, ML, y + 3);

    doc.setFillColor(...BG3);
    doc.roundedRect(ML + 52, y, CW - 72, 4.5, 2, 2, "F");

    doc.setFillColor(...BAR_COLORS[i]);
    doc.roundedRect(ML + 52, y, Math.min(pct, CW - 72), 4.5, 2, 2, "F");

    doc.setFillColor(...dotCol);
    doc.circle(W - MR - 12, y + 2.2, 1.3, "F");

    doc.setFontSize(FS.small);
    doc.setTextColor(...FG);
    doc.text(score + "/20", W - MR, y + 3, { align: "right" });

    y += 9;
  });

  y += 2;
  divider();

  // NRR benchmark
  sectionHead("NRR benchmark", AMB);
  writeLines("Your NRR: " + (ctx.nrr || "not provided") + ". Top-quartile B2B SaaS NRR is 113%+ (Benchmarkit 2025). Companies above 120% NRR achieve valuation multiples of 21x vs 9x (SaaS Capital). Companies with structured outcome practices drive NRR 7-16 points higher than peers (McKinsey).");

  var ins = ctx.insights && !ctx.insights._error ? ctx.insights : null;

  if (ins && ins.nrrGapAnalysis) {
    writeLines(ins.nrrGapAnalysis, null, FS.body, FG2);
  }

  // Pattern archetype
  if (ctx.pattern) {
    sectionHead("Your pattern: " + clean(ctx.pattern.name), ACC);
    writeLines(ctx.pattern.desc);
    divider();
  }

  // ── PAGE 2 ─────────────────────────────────────────────
  newPage();

  // Customer perspective
  if (ctx.customerView) {
    sectionHead("What your customer experiences", FG3);
    writeLines(ctx.customerView);
    divider();
  }

  // Why proof is hard
  if (ctx.verticalData && ctx.verticalData.whyProofIsHard) {
    sectionHead("Why proof is hard for " + clean(ctx.vertical).toLowerCase(), AMB);
    writeLines(ctx.verticalData.whyProofIsHard);

    if (ctx.verticalData.proofShape) {
      y += 2;
      doc.setFontSize(FS.small);
      doc.setTextColor(...FG3);
      var shapeLines = doc.splitTextToSize("The shape of the problem: " + clean(ctx.verticalData.proofShape), CW);
      for (var si = 0; si < shapeLines.length; si++) {
        doc.text(shapeLines[si], ML, y);
        y += 3.8;
      }
      y += 4;
    }
    divider();
  }

  // Vertical diagnosis (LLM)
  if (ins && ins.verticalDiagnosis) {
    sectionHead("Your diagnosis", ACC);
    writeLines(ins.verticalDiagnosis);
    divider();
  }

  // Biggest break (LLM)
  if (ins && ins.biggestBreakImpact) {
    sectionHead("Biggest break: " + BREAK_LABELS[ctx.weakestBreak], RED);
    writeLines(ins.biggestBreakImpact);
    divider();
  }

  // Break cascades
  if (ctx.cascades && ctx.cascades.length > 0) {
    sectionHead("How your breaks compound", AMB);
    ctx.cascades.forEach(function(c) {
      writeLines(c);
    });
    divider();
  }

  // Evidence that drives renewal
  if (ctx.verticalData && ctx.verticalData.renewalEvidence) {
    sectionHead("Evidence that drives renewal", GRN);
    writeLines("For " + clean(ctx.vertical).toLowerCase() + " companies: " + ctx.verticalData.renewalEvidence + ".");
    divider();
  }

  // ── PAGE 3 ─────────────────────────────────────────────
  newPage();

  sectionHead("Areas to investigate", ACC);

  if (ins && ins.areasToInvestigate) {
    ins.areasToInvestigate.forEach(function(a, i) {
      needSpace(28);

      // Numbered label bar
      doc.setFillColor(...BG2);
      doc.roundedRect(ML, y, CW, 7, 2, 2, "F");
      doc.setFontSize(FS.body);
      doc.setTextColor(...ACC2);
      doc.text((i + 1) + ".  " + clean(a.area || ""), ML + 4, y + 5);
      y += 12;

      writeLines(a.observation);
      y += 2;
    });
  } else {
    var fallback = [
      { area: "The handoff between Sales and Implementation", text: "Does the business case that closes the deal reach the team that delivers? Or does implementation start from scratch every time?" },
      { area: "The measurement gap", text: "Is your CS team tracking product activity (logins, usage, health scores) or actual business outcomes tied to what was promised?" },
      { area: "The renewal conversation", text: "What evidence does your team bring? Adoption data, or proof that the customer got what they paid for?" },
    ];
    fallback.forEach(function(a, i) {
      doc.setFillColor(...BG2);
      doc.roundedRect(ML, y, CW, 7, 2, 2, "F");
      doc.setFontSize(FS.body);
      doc.setTextColor(...ACC2);
      doc.text((i + 1) + ".  " + a.area, ML + 4, y + 5);
      y += 12;
      writeLines(a.text);
      y += 2;
    });
  }

  divider();

  // Role insight
  if (ins && ins.roleSpecificInsight) {
    sectionHead("For you as " + clean(ctx.role), ACC);
    writeLines(ins.roleSpecificInsight);
    divider();
  }

  // EU Data Act
  needSpace(30);
  sectionHead("Regulatory context", FG3);
  writeLines("Effective September 2025, the EU Data Act allows customers to terminate any SaaS contract with 60 days' notice, regardless of original contract length. For companies with significant EU revenue, the ability to demonstrate outcomes is no longer a CS improvement - it's a revenue defense imperative.");

  // ── CTA PAGE / SECTION ─────────────────────────────────
  y += 6;
  needSpace(40);
  divider();

  doc.setFontSize(FS.title);
  doc.setTextColor(...FG);
  doc.text("Want to understand where the architecture breaks?", ML, y);
  y += 8;

  doc.setFontSize(FS.body);
  doc.setTextColor(...FG2);
  doc.text("This diagnostic identifies the pattern. A deeper conversation can pinpoint", ML, y);
  y += LH;
  doc.text("exactly where and how to close the gap for your specific company.", ML, y);
  y += 10;

  doc.setFontSize(FS.body);
  doc.setTextColor(...ACC2);
  doc.text("darius.fekete@gmail.com", ML, y);
  y += 8;

  doc.setFontSize(FS.small);
  doc.setTextColor(...FG3);
  doc.text("Darius Fekete  |  Amsterdam, Netherlands", ML, y);
  y += 4;
  doc.text("18 years across Simon-Kucher, Capco, and Vendavo. 40+ commercial engagements. HEC Paris EMBA.", ML, y);

  // ── FOOTERS ────────────────────────────────────────────
  var totalPages = doc.internal.getNumberOfPages();
  for (var p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    // Footer line
    doc.setDrawColor(...BG3);
    doc.setLineWidth(0.15);
    doc.line(ML, H - 16, W - MR, H - 16);
    // Footer text
    doc.setFontSize(FS.label);
    doc.setTextColor(...FG3);
    doc.text(clean(ctx.name) + "  |  " + clean(ctx.vertical) + "  |  " + clean(ctx.size), ML, H - 10);
    doc.text("Page " + p + " of " + totalPages, W - MR, H - 10, { align: "right" });
  }

  return doc;
}
