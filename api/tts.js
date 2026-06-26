export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { text, voice = 'nova', speed = 1.0 } = req.body ?? {};

  if (!text || typeof text !== 'string' || text.length > 300) {
    return res.status(400).json({ error: 'invalid text' });
  }

  const clampedSpeed = Math.min(4.0, Math.max(0.25, Number(speed) || 1.0));

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice,
      input: text,
      speed: clampedSpeed,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    console.error('OpenAI TTS error:', response.status, err);
    return res.status(502).json({ error: 'tts failed' });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(buffer);
}
