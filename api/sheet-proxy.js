export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Format the data as URL-encoded form data instead of JSON
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(req.body)) {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }

    const response = await fetch('https://script.google.com/macros/s/AKfycbxk4H4ldwyfsSRk_g6rAp5FDRmqct2oMihQxrt_kpqMFhJmL6aOJ74a3HfgBQCXLPTIug/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      redirect: 'follow'
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