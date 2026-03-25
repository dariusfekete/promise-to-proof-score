export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  var data = req.body;
  console.log("NEW_LEAD", JSON.stringify(data));
  return res.status(200).json({ ok: true });
}
