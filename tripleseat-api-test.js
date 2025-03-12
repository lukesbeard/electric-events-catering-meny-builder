/**
 * Tripleseat API Test Script
 * 
 * This script tests the Tripleseat API connection directly using axios.
 * It will help diagnose authentication issues by showing the full error message.
 */

const axios = require('axios');

// Tripleseat API credentials from your config
const credentials = {
  public_key: "c8b7ab91b0c9d00de35a853334586b71561a7431",
  consumer_key: "Uef2cN123bPUupBzgGYjZKbxeUeAwwxaAnf02PSA",
  consumer_secret: "ePYEyf4nnzE2pVkBJWk7wu7AInM2QwICpIilK8MR"
};

// Create a test lead
const testLead = {
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  phone_number: "555-123-4567",
  event_name: "API Test Event",
  description: "Testing the Tripleseat API connection",
  start_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
  end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
  guest_count: 10,
  location_id: "20521", // The Dug-Out venue ID
  room_id: "241847", // Unassigned room ID
  status: "new_lead",
  event_type_id: "1",
  lead_source_id: "112995"
};

// Prepare the request data
const requestData = {
  ...credentials,
  lead: testLead
};

console.log('Testing Tripleseat API connection...');
console.log('Request data:', JSON.stringify(requestData, null, 2));

// Make the API request
axios.post('https://api.tripleseat.com/v1/leads/create.js', requestData, {
  headers: {
    'Content-Type': 'application/json',
    'X-Public-Key': credentials.public_key,
    'X-Consumer-Key': credentials.consumer_key,
    'X-Consumer-Secret': credentials.consumer_secret
  }
})
.then(response => {
  console.log('Success! Response:', response.data);
})
.catch(error => {
  console.error('Error:', error.message);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Response status:', error.response.status);
    console.error('Response headers:', error.response.headers);
    console.error('Response data:', error.response.data);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received:', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Request setup error:', error.message);
  }
});

console.log('Request sent. Waiting for response...'); 