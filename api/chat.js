export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      key_configured: !!process.env.ECNU_KEY,
      usage: 'POST {"messages":[{"role":"user","content":"..."}]}',
    });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const KEY = process.env.ECNU_KEY;
  if (!KEY) {
    return res.status(500).json({ error: 'ECNU_KEY not configured' });
  }

  const body = req.body || {};
  const payload = {
    model: body.model || 'ecnu-plus',
    messages: body.messages || [],
    temperature: body.temperature === undefined ? 0.7 : body.temperature,
    max_tokens: body.max_tokens || 300,
    stream: false,
  };

  try {
    const r = await fetch(
      'https://chat.ecnu.edu.cn/open/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + KEY,
        },
        body: JSON.stringify(payload),
      }
    );
    const text = await r.text();
    res.status(r.status).setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (e) {
    return res.status(500).json({ error: String(e).slice(0, 100) });
  }
}
