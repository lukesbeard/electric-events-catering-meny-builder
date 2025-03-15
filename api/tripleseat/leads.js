// /api/tripleseat/leads.js - Proxy for Tripleseat API requests
// This serverless function handles forwarding requests to Tripleseat API
// and avoids CORS issues in the browser

export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported for this endpoint'
    });
  }

  try {
    console.log('Received Tripleseat API request');
    
    // Forward the request to Tripleseat
    const tripleseatResponse = await fetch('https://api.tripleseat.com/v1/leads/create.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    // Get the response data
    const data = await tripleseatResponse.json();
    
    console.log('Tripleseat API response:', data);
    
    // Return the response to the client
    return res.status(tripleseatResponse.status).json(data);
  } catch (error) {
    console.error('Tripleseat proxy error:', error);
    return res.status(500).json({ 
      error: 'Error connecting to Tripleseat API',
      message: 'There was a problem connecting to the booking system. Please try again or contact us directly.',
      details: error.message 
    });
  }
} 