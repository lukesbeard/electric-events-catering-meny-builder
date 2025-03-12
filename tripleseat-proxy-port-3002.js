/**
 * Tripleseat API Proxy Server (Port 3002)
 * 
 * This server acts as a proxy between your client-side code and the Tripleseat API.
 * It helps avoid CORS restrictions by making the API calls from the server instead of the browser.
 * 
 * To use this proxy:
 * 1. Install dependencies: npm install express axios cors
 * 2. Start the server: node tripleseat-proxy-port-3002.js
 * 3. Update your client-side code to call this proxy instead of Tripleseat directly
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3002; // Using port 3002 instead of 3001

// Enable JSON parsing for request bodies
app.use(express.json());

// Enable CORS for all origins during testing
app.use(cors());

// Proxy endpoint for Tripleseat lead creation
app.post('/api/tripleseat/leads', async (req, res) => {
  try {
    console.log('Received proxy request for Tripleseat lead creation');
    
    // Extract authentication details from the request body
    const { public_key, consumer_key, consumer_secret, lead } = req.body;
    
    if (!public_key || !consumer_key || !consumer_secret || !lead) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'public_key, consumer_key, consumer_secret, and lead are required'
      });
    }
    
    console.log('Making request to Tripleseat API');
    
    // Make the request to Tripleseat
    const response = await axios.post(
      'https://api.tripleseat.com/v1/leads/create.js',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Public-Key': public_key,
          'X-Consumer-Key': consumer_key,
          'X-Consumer-Secret': consumer_secret
        }
      }
    );
    
    console.log('Tripleseat API response:', response.status);
    console.log('Response data:', response.data);
    
    // Return the Tripleseat response to the client
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying request to Tripleseat:', error.message);
    
    // Extract error details if available
    const status = error.response?.status || 500;
    const errorDetails = error.response?.data || { error: error.message };
    
    res.status(status).json({
      error: error.message,
      details: errorDetails
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Tripleseat proxy server running on port ${PORT}`);
  console.log(`Test URL: http://localhost:${PORT}/api/tripleseat/leads`);
}); 