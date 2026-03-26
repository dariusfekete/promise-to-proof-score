export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // GET = test endpoint. Visit /api/collect in browser to verify deployment.
  if (req.method === "GET") {
    var hasKey = !!process.env.ANTHROPIC_API_KEY;
    return res.status(200).json({
      status: "Function is running",
      node: process.version,
      anthropicKeySet: hasKey,
      sheetWebhookSet: !!process.env.GOOGLE_SHEET_WEBHOOK,
    });
  }

  if (req.method !== "POST") return res.status(200).json({ error: "Use POST" });

  var body = req.body || {};
  var action = body.action || "unknown";

  // LEAD
  if (action === "lead") {
    console.log("NEW_LEAD", JSON.stringify(body));
    var sheetUrl = process.env.GOOGLE_SHEET_WEBHOOK;
    if (sheetUrl) {
      try {
        await fetch(sheetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (e) { console.error("Sheet:", e.message); }
    }
    return res.status(200).json({ ok: true });
  }

  // INSIGHTS
  if (action === "insights") {
    var key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return res.status(200).json({ insights: null, error: "ANTHROPIC_API_KEY not set" });
    }

    var prompt = body.prompt;
    if (!prompt) {
      return res.status(200).json({ insights: null, error: "No prompt" });
    }

    var apiRes;
    try {
      apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });
    } catch (e) {
      return res.status(200).json({ insights: null, error: "Fetch failed: " + e.message });
    }

    var raw;
    try { raw = await apiRes.json(); }
    catch (e) { return res.status(200).json({ insights: null, error: "Response parse failed" }); }

    if (!apiRes.ok) {
      var msg = raw.error ? raw.error.message : JSON.stringify(raw).slice(0, 200);
      return res.status(200).json({ insights: null, error: "Anthropic " + apiRes.status + ": " + msg });
    }

    var text = "";
    if (raw.content && Array.isArray(raw.content)) {
      for (var i = 0; i < raw.content.length; i++) {
        if (raw.content[i].text) text += raw.content[i].text;
      }
    }
    if (!text) return res.status(200).json({ insights: null, error: "Empty response" });

    try {
      var clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return res.status(200).json({ insights: JSON.parse(clean) });
    } catch (e) {
      return res.status(200).json({ insights: null, error: "JSON parse failed: " + text.slice(0, 100) });
    }
  }

  return res.status(200).json({ error: "Unknown action: " + action });
}
