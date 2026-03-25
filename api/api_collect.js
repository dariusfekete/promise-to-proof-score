export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var action;
  try {
    action = req.body && req.body.action;
  } catch (e) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // ── LEAD COLLECTION ──
  if (action === "lead") {
    console.log("NEW_LEAD", JSON.stringify(req.body));
    var SHEET_URL = process.env.GOOGLE_SHEET_WEBHOOK;
    if (SHEET_URL) {
      try {
        await fetch(SHEET_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
        });
      } catch (e) {
        console.error("Sheet error:", e.message);
      }
    }
    return res.status(200).json({ ok: true });
  }

  // ── LLM INSIGHTS ──
  if (action === "insights") {
    var apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not set");
      return res.status(200).json({ insights: null, error: "API key not configured. Add ANTHROPIC_API_KEY to Vercel env vars." });
    }

    var prompt = req.body && req.body.prompt;
    if (!prompt) {
      return res.status(200).json({ insights: null, error: "No prompt provided" });
    }

    // Call Anthropic
    var apiResponse;
    try {
      apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });
    } catch (fetchErr) {
      console.error("Fetch to Anthropic failed:", fetchErr.message);
      return res.status(200).json({ insights: null, error: "Network error calling Anthropic: " + fetchErr.message });
    }

    // Read response
    var responseBody;
    try {
      responseBody = await apiResponse.json();
    } catch (jsonErr) {
      console.error("Could not parse Anthropic response as JSON:", jsonErr.message);
      return res.status(200).json({ insights: null, error: "Invalid response from Anthropic API" });
    }

    // Check for API errors
    if (!apiResponse.ok) {
      var errMsg = responseBody.error ? responseBody.error.message : JSON.stringify(responseBody);
      console.error("Anthropic API error:", apiResponse.status, errMsg);
      return res.status(200).json({ insights: null, error: "Anthropic API " + apiResponse.status + ": " + errMsg });
    }

    // Extract text from content blocks
    var text = "";
    try {
      if (responseBody.content && Array.isArray(responseBody.content)) {
        text = responseBody.content.map(function(c) { return c.text || ""; }).join("");
      }
    } catch (e) {
      console.error("Could not extract text from response:", e.message);
      return res.status(200).json({ insights: null, error: "Unexpected response structure from Anthropic" });
    }

    if (!text) {
      console.error("Empty text in Anthropic response:", JSON.stringify(responseBody).slice(0, 500));
      return res.status(200).json({ insights: null, error: "Empty response from Anthropic" });
    }

    // Parse JSON from the LLM output
    var insights;
    try {
      var clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
      insights = JSON.parse(clean);
    } catch (parseErr) {
      console.error("Could not parse LLM output as JSON:", parseErr.message, "Raw:", text.slice(0, 300));
      return res.status(200).json({ insights: null, error: "LLM returned invalid JSON" });
    }

    return res.status(200).json({ insights: insights });
  }

  return res.status(400).json({ error: "Unknown action: " + action });
}
