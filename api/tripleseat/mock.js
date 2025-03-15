// /api/tripleseat/mock.js - Mock API for testing Tripleseat integration
// This endpoint simulates Tripleseat API responses without actually creating leads

export default async function handler(req, res) {
  // Set CORS headers
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
  
  console.log('Received mock Tripleseat request');
  
  // Log the request body for debugging
  if (req.body) {
    console.log('Request payload:', {
      lead: {
        first_name: req.body.lead?.first_name,
        last_name: req.body.lead?.last_name,
        location_id: req.body.lead?.location_id,
        // Truncate other details to avoid log pollution
      }
    });
  }
  
  // Add a delay to simulate network request (500-1500ms)
  const delay = Math.floor(Math.random() * 1000) + 500;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Create a fake lead ID (5-digit number)
  const mockLeadId = Math.floor(Math.random() * 90000) + 10000;
  
  // Create a mock response that matches Tripleseat's format
  const mockResponse = {
    success: true,
    lead_id: mockLeadId.toString(),
    success_message: "Lead created successfully (TEST MODE)",
    mock: true
  };
  
  console.log('Sending mock response:', mockResponse);
  
  return res.status(200).json(mockResponse);
} 