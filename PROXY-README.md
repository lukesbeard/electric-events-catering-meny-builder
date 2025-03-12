# Tripleseat API Proxy Server

This server acts as a proxy between your client-side code and the Tripleseat API. It helps avoid CORS restrictions by making the API calls from the server instead of the browser.

## Why a Proxy Server is Needed

When making direct API calls from a browser to Tripleseat, you'll encounter CORS (Cross-Origin Resource Sharing) restrictions. This is because Tripleseat's API doesn't include the necessary CORS headers to allow requests from your domain.

Using a proxy server solves this problem by:
1. Receiving requests from your client-side code
2. Making the API calls to Tripleseat from the server (where CORS doesn't apply)
3. Returning the responses back to your client

## Setup Instructions

### Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

3. The server will run on port 3000 by default. You can change this by setting the `PORT` environment variable.

### Production Deployment

#### Option 1: Deploy to a Node.js hosting service (Recommended)

1. Deploy to a Node.js hosting service like Heroku, Vercel, or DigitalOcean App Platform:

   For Heroku:
   ```
   heroku create
   git push heroku main
   ```

2. Set the `ALLOWED_ORIGIN` environment variable to your website's domain:
   ```
   heroku config:set ALLOWED_ORIGIN=https://catering.electriceventsatl.com
   ```

#### Option 2: Run on your own server

1. Install Node.js on your server

2. Clone this repository or upload the files to your server

3. Install dependencies:
   ```
   npm install --production
   ```

4. Set up a process manager like PM2 to keep the server running:
   ```
   npm install -g pm2
   pm2 start tripleseat-proxy.js
   pm2 save
   pm2 startup
   ```

5. Set up a reverse proxy with Nginx or Apache to forward requests to the Node.js server

## Usage

### Update your client-side code

Instead of calling the Tripleseat API directly, update your client-side code to call your proxy server:

```javascript
// Before (direct call to Tripleseat)
fetch('https://api.tripleseat.com/v1/leads/create.js', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Public-Key': publicKey,
    'X-Consumer-Key': consumerKey,
    'X-Consumer-Secret': consumerSecret
  },
  body: JSON.stringify(data)
});

// After (call to your proxy)
fetch('https://your-proxy-server.com/api/tripleseat/leads', {
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
.then(data => console.log('Lead created:', data))
.catch(error => console.error('Error:', error));
```

## API Endpoints

### POST /api/tripleseat/leads

Creates a lead in Tripleseat.

**Request Body:**
```json
{
  "public_key": "your_public_key",
  "consumer_key": "your_consumer_key",
  "consumer_secret": "your_consumer_secret",
  "lead": {
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "phone_number": "555-123-4567",
    "event_name": "Test Event",
    "description": "Test Description",
    "start_time": "2099-12-31 12:00:00",
    "end_time": "2099-12-31 15:00:00",
    "guest_count": 10,
    "location_id": "venue_id",
    "room_id": "room_id",
    "status": "new_lead",
    "event_type_id": "event_type_id",
    "lead_source_id": "lead_source_id"
  }
}
```

**Response:**
The response from Tripleseat will be returned as-is.

### GET /health

Health check endpoint to verify the server is running.

**Response:**
```json
{
  "status": "ok"
}
```

## Security Considerations

1. This proxy server should only accept requests from your domain. The CORS configuration is set to only allow requests from the domain specified in the `ALLOWED_ORIGIN` environment variable.

2. Consider adding authentication to the proxy server to prevent unauthorized use.

3. In a production environment, always use HTTPS to encrypt the data being sent to and from the proxy server.

4. Be careful with error handling to avoid leaking sensitive information in error messages.

## Troubleshooting

If you encounter issues with the proxy server:

1. Check the server logs for error messages
2. Verify that the Tripleseat API credentials are correct
3. Ensure that the proxy server is accessible from your client-side code
4. Check that the CORS configuration is correct for your domain 