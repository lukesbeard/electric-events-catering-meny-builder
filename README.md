# Electric Events Catering Menu Builder Tripleseat Integration

This repository contains the code for the Electric Events Catering Menu Builder with Tripleseat Integration.

## Tripleseat Integration

The catering form now integrates with Tripleseat to automatically create leads when customers submit catering requests.

### How It Works

1. When a customer submits a catering form, the data is first sent to Google Sheets (existing functionality)
2. After successful Google Sheets submission, the data is also sent to Tripleseat as a lead
3. All menu items and order details are included in the Tripleseat lead notes

### Local Testing

To test the Tripleseat integration locally:

1. Start your regular HTTP server:
   ```
   python -m http.server 8000
   ```

2. In a separate terminal, start the Tripleseat proxy server:
   ```
   python tripleseat_proxy.py
   ```

3. Open the site in your browser at http://localhost:8000/index.html

### Deployment to Vercel

The application is configured for deployment on Vercel:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project into Vercel
3. Set up the following environment variables in the Vercel dashboard:
   - `TRIPLESEAT_API_KEY` - Your Tripleseat API key
   - `TRIPLESEAT_CONSUMER_KEY` - Your Tripleseat consumer key
   - `TRIPLESEAT_CONSUMER_SECRET` - Your Tripleseat consumer secret

4. Deploy the application

The serverless API routes in the `/api` directory will handle proxy requests to Tripleseat, avoiding CORS issues.

### Testing Options

The following URL parameters can be used for testing:

- `?mock=true` - Use mocked responses from the Tripleseat API
- `?disableTripleseat=true` - Disable Tripleseat integration completely
- `?forcesubmit=true` - Force form submission even in development mode
- `?devmode=true` - Force development mode regardless of hostname

### Files

- `tripleseat-config.js` - Configuration settings for Tripleseat integration
- `tripleseat-integration.js` - Main integration logic
- `tripleseat_proxy.py` - Local proxy server for testing
- `api/tripleseat/leads.js` - Serverless function for Tripleseat API proxy
- `api/tripleseat/mock.js` - Serverless function for mock API responses
- `vercel.json` - Vercel configuration

### Configuration

To configure the Tripleseat integration, edit the `tripleseat-config.js` file:

1. Update venue IDs for each venue
2. Configure room IDs if needed
3. Set up any custom fields needed

The current configuration includes:

- API keys and authentication
- Venue and room mappings
- Event type configuration
- Lead source settings 