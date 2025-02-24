export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbybXEoi0uC7mhwpGUsyuy7jp4i0--3ZQytJ2fqBavnDeUaeaOGaEI38sWVao6eGlkEudA/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
      redirect: 'follow',
      mode: 'cors'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google response not ok: ${response.status}. Details: ${errorText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to proxy request',
      details: error.message,
      stack: error.stack
    });
  }
} 