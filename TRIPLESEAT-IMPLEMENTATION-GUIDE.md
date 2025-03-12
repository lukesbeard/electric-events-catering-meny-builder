# Tripleseat API Integration Guide

This guide explains how to integrate the Tripleseat API with your catering quote builder, focusing on solving the CORS issues that prevent direct browser-to-API communication.

## Understanding the Problem

We've identified why the Node.js script works but the browser doesn't:

### Node.js (Server-Side) Works Because:
- Node.js doesn't enforce CORS restrictions
- It can make direct HTTP requests to any domain
- Your API credentials are being sent correctly in both headers and request body

### Browser (Client-Side) Doesn't Work Because:
- Browsers enforce CORS for security reasons
- The Tripleseat API doesn't include CORS headers in its responses
- When you try to make a direct request from the browser, it's blocked by CORS
- Even with `no-cors` mode, you can send the request but can't read the response

## Solution Options

### Option 1: Deploy a Proxy Server (Recommended)

This is the most reliable solution:

1. Deploy the proxy server to a hosting service (Heroku, Vercel, etc.)
2. Update your client-side code to call the proxy instead of Tripleseat directly
3. The proxy will handle all communication with Tripleseat

#### Step 1: Deploy the Proxy Server

You can deploy the `tripleseat-proxy-port-3002.js` file to a hosting service like Heroku:

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create a new Heroku app
heroku create your-tripleseat-proxy

# Deploy to Heroku
git push heroku main
```

#### Step 2: Update Your Client-Side Code

Replace direct API calls with calls to your proxy server:

```javascript
// Before (direct call to Tripleseat - doesn't work due to CORS)
fetch('https://api.tripleseat.com/v1/leads/create.js', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Public-Key': publicKey,
    'X-Consumer-Key': consumerKey,
    'X-Consumer-Secret': consumerSecret
  },
  body: JSON.stringify(leadData)
});

// After (call to your proxy - works!)
fetch('https://your-tripleseat-proxy.herokuapp.com/api/tripleseat/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    public_key: publicKey,
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    lead: leadData
  })
})
.then(response => response.json())
.then(data => {
  console.log('Lead created:', data);
  // Store the lead ID for reference
  if (data.lead_id) {
    localStorage.setItem('lastTripleseatLeadId', data.lead_id);
  }
});
```

### Option 2: Use no-cors Mode (Limited)

If you can't deploy a proxy server, you can use no-cors mode:

```javascript
// Using no-cors mode (limited - can't read response)
fetch('https://api.tripleseat.com/v1/leads/create.js', {
  method: 'POST',
  mode: 'no-cors',
  headers: {
    'Content-Type': 'application/json',
    'X-Public-Key': publicKey,
    'X-Consumer-Key': consumerKey,
    'X-Consumer-Secret': consumerSecret
  },
  body: JSON.stringify({
    public_key: publicKey,
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    lead: leadData
  })
})
.then(response => {
  // Can't read response status or body with no-cors
  console.log('Response type:', response.type); // Will be "opaque"
  
  // Store a temporary lead ID for reference
  const tempLeadId = `temp-${Date.now()}`;
  localStorage.setItem('lastTripleseatLeadId', tempLeadId);
  
  // Show a notification
  alert('Lead submitted to Tripleseat. Please check your Tripleseat account to verify.');
});
```

Limitations of this approach:
- You can't read the response status or body
- You won't know if the request was successful
- You'll need to check Tripleseat manually to verify leads

## Implementation in Your Existing Code

### Step 1: Update the `submitToTripleseat` Function

Modify your existing `submitToTripleseat` function in `scripts.js` to use the proxy server:

```javascript
async function submitToTripleseat(formData) {
  try {
    console.log('Attempting to submit to Tripleseat via proxy');
    
    // Only proceed if Tripleseat integration is enabled
    if (!TRIPLESEAT_CONFIG.api.enabled) {
      console.log('Tripleseat integration is disabled in configuration');
      return false;
    }
    
    // Prepare Tripleseat data
    const tripleseatData = prepareTripleseatData(formData);
    console.log('Tripleseat data prepared:', tripleseatData);
    
    // Get the proxy URL from configuration or use default
    const proxyUrl = TRIPLESEAT_CONFIG.api.proxyUrl || 'https://your-tripleseat-proxy.herokuapp.com/api/tripleseat/leads';
    
    // Make the request to the proxy server
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tripleseatData)
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Tripleseat error (${response.status}):`, errorText);
      showNotification(`Tripleseat error: ${response.status} ${response.statusText}. Details: ${errorText}`, 'error');
      return false;
    }
    
    // Parse the response
    const tripleseatResult = await response.json();
    console.log('Tripleseat submission successful:', tripleseatResult);
    
    // Check if the lead was created successfully
    if (tripleseatResult && tripleseatResult.lead_id) {
      console.log(`Lead created successfully in Tripleseat with ID: ${tripleseatResult.lead_id}`);
      
      // Store the lead ID for reference
      localStorage.setItem('lastTripleseatLeadId', tripleseatResult.lead_id);
      
      // Show a success notification
      showNotification(`Lead #${tripleseatResult.lead_id} created successfully in Tripleseat!`, 'success');
      return true;
    } else {
      console.warn('Tripleseat response missing lead ID:', tripleseatResult);
      showNotification('Received unexpected response from Tripleseat. Please check your account to verify if the lead was created.', 'error');
      return false;
    }
  } catch (error) {
    console.error('Error submitting to Tripleseat:', error);
    showNotification(`Failed to submit to Tripleseat: ${error.message}`, 'error');
    return false;
  }
}
```

### Step 2: Update the Configuration File

Add a `proxyUrl` field to your `tripleseat-config.js` file:

```javascript
const TRIPLESEAT_CONFIG = {
  // API Configuration
  api: {
    webhookUrl: "https://api.tripleseat.com/v1/leads/create.js", 
    apiKey: "c8b7ab91b0c9d00de35a853334586b71561a7431",
    consumerKey: "Uef2cN123bPUupBzgGYjZKbxeUeAwwxaAnf02PSA",
    consumerSecret: "ePYEyf4nnzE2pVkBJWk7wu7AInM2QwICpIilK8MR",
    proxyUrl: "https://your-tripleseat-proxy.herokuapp.com/api/tripleseat/leads", // Add this line
    enabled: true
  },
  // ... rest of your configuration
};
```

## Testing Your Integration

1. Open http://localhost:8000/tripleseat-test-improved.html in your browser
2. Click the "Test API Call via Proxy" button
3. Check the results to see if the lead was created successfully

## Troubleshooting

### Proxy Server Not Running

If you see an error like "Failed to fetch" or "Connection refused", make sure your proxy server is running:

```bash
node tripleseat-proxy.js
```

### CORS Errors

If you're still seeing CORS errors, make sure your proxy server has CORS enabled:

```javascript
// In tripleseat-proxy.js
app.use(cors({
  origin: '*', // Allow all origins during testing
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
```

### Authentication Errors

If you're seeing 401 Unauthorized errors, check your API credentials:

1. Verify that the `apiKey`, `consumerKey`, and `consumerSecret` in `tripleseat-config.js` are correct
2. Make sure they're being sent correctly in both the headers and request body
3. Check if your Tripleseat account has API access enabled

## Conclusion

By implementing a proxy server, you can avoid CORS restrictions and successfully integrate with the Tripleseat API from your browser-based application. This approach provides the most reliable solution and allows you to read the full response from Tripleseat, including the lead ID. 