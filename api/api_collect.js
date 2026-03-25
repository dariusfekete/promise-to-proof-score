export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var data = req.body;
  var action = data.action;

  // LEAD COLLECTION
  if (action === "lead") {
    console.log("NEW_LEAD", JSON.stringify(data));
    var SHEET_URL = process.env.GOOGLE_SHEET_WEBHOOK;
    if (SHEET_URL) {
      try {
        await fetch(SHEET_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            company: data.company || "",
            vertical: data.vertical || "",
            size: data.size || "",
            role: data.role || "",
            nrr: data.nrr || "",
            score: data.score,
            verdict: data.verdict || "",
            breakScores: (data.breakScores || []).join(", "),
            weakestBreak: data.weakestBreak,
            timestamp: data.timestamp || new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.error("Sheet webhook failed:", e);
      }
    }
    return res.status(200).json({ ok: true });
  }

  // LLM PROXY
  if (action === "insights") {
    var ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_KEY) {
      return res.status(200).json({ insights: null, error: "No API key" });
    }
    try {
      var response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: data.prompt }],
        }),
      });
      var result = await response.json();
      var text = result.content.map(function(c) { return c.text || ""; }).join("");
      var clean = text.replace(/```json|```/g, "").trim();
      return res.status(200).json({ insights: JSON.parse(clean) });
    } catch (e) {
      console.error("LLM error:", e);
      return res.status(200).json({ insights: null, error: String(e) });
    }
  }

  return res.status(400).json({ error: "Unknown action" });
}
