# Tripleseat Integration Setup Guide

This guide will walk you through the process of integrating the Electric Events Catering Quote Builder with Tripleseat for streamlined lead management.

## Overview

The integration allows catering quote requests submitted through your website to be automatically created as leads in your Tripleseat account. This eliminates manual data entry and ensures all leads are properly tracked.

## Prerequisites

- Access to your Tripleseat account with administrative privileges
- Access to the website files for deployment
- Basic understanding of HTML/JavaScript (for troubleshooting)
- API credentials from Tripleseat (API Key, Consumer Key, Consumer Secret)
- Webhook URL for lead creation
- Venue IDs, Room IDs, Event Type IDs, and Lead Source IDs from Tripleseat

## Step 1: Gather Required Information from Tripleseat

### API Information
- ✅ Public Key: `c8b7ab91b0c9d00de35a853334586b71561a7431` (already configured)
- ✅ Consumer Key: `Uef2cN123bPUupBzgGYjZKbxeUeAwwxaAnf02PSA` (already configured)
- ✅ Consumer Secret: `ePYEyf4nnzE2pVkBJWk7wu7AInM2QwICpIilK8MR` (already configured)

### Venue IDs
- ✅ Ladybird: `18694` (already configured)
- ✅ Muchacho: `18693` (already configured)
- ✅ The Dug-Out: `20521` (already configured)

### Event Type IDs
- ✅ Catering: `1` (using default event type ID)
- ✅ Delivery: `1` (using default event type ID)

### Lead Source IDs
- ✅ Website: `112995` (using referral ID for all leads)
- ✅ Referral: `112995` (already configured)

### Room IDs
- ✅ The Dug-Out:
  - Unassigned: `241847`
  - Electric Room: `288107`

## Step 2: Update the Configuration File

The `tripleseat-config.js` file has been fully configured with all required information:

1. ✅ Venue IDs for Ladybird, Muchacho, and The Dug-Out
2. ✅ Event type IDs for catering and delivery (using default ID)
3. ✅ Lead source IDs (using referral ID for all leads)
4. ✅ Room IDs for The Dug-Out

The completed configuration:

```javascript
eventTypes: {
    catering: "1", // Default event type ID
    delivery: "1"  // Using the same ID for delivery
},

leadSources: {
    website: "112995",  // Using referral ID for all leads
    referral: "112995"  // Already configured
},

rooms: {
    "20521": {
        "241847": "Unassigned",
        "288107": "Electric Room"
    }
}
```

## Step 3: Test the Integration

1. Start a local server to test the integration:
   ```
   python -m http.server 8000
   ```
   or use any other local server method you prefer

2. Open `http://localhost:8000/the-dug-out-catering.html` in your browser

3. Check the browser console (F12 > Console) for any configuration warnings:
   - The `verifyTripleseatConfig()` function will automatically check your configuration

4. Fill out a test order using the "Fill Test Order" button

5. Submit the test order using the "Test Submit" button

6. Check your Tripleseat account to verify that a new lead was created

## Step 4: Deploy to Production

Once testing is complete:

1. Upload all updated files to your production server:
   - `tripleseat-config.js` (with all IDs properly configured)
   - `scripts.js`
   - `the-dug-out-catering.html`
   - Any other modified files

2. Test the integration in the production environment by submitting a test order

3. Monitor the first few submissions to ensure leads are being created correctly

## Troubleshooting 401 Unauthorized Errors

If you're seeing a 401 Unauthorized error when submitting to Tripleseat, this indicates an authentication problem. Follow these steps to resolve it:

### 1. Verify API Credentials

First, check that your API credentials in `tripleseat-config.js` are correct:

```javascript
api: {
    webhookUrl: "https://api.tripleseat.com/v1/leads/create.js", 
    apiKey: "c8b7ab91b0c9d00de35a853334586b71561a7431",
    consumerKey: "Uef2cN123bPUupBzgGYjZKbxeUeAwwxaAnf02PSA",
    consumerSecret: "ePYEyf4nnzE2pVkBJWk7wu7AInM2QwICpIilK8MR",
    enabled: true
}
```

Ensure that:
- The `apiKey` matches your Tripleseat Public Key exactly
- The `consumerKey` matches your Tripleseat Consumer Key exactly
- The `consumerSecret` matches your Tripleseat Consumer Secret exactly
- There are no extra spaces or characters in any of these values

### 2. Check API Access in Tripleseat

1. Log in to your Tripleseat account
2. Go to Settings > API Access
3. Verify that API access is enabled for your account
4. Check that the Public Key, Consumer Key, and Consumer Secret match what's in your configuration

### 3. Regenerate API Keys if Necessary

If you continue to experience 401 errors:

1. In Tripleseat, go to Settings > API Access
2. Click "Regenerate Keys" to create new API keys
3. Copy the new Public Key, Consumer Key, and Consumer Secret
4. Update these values in your `tripleseat-config.js` file
5. Test the integration again

### 4. Use the Test Authentication Button

When testing locally, you can use the "Test Tripleseat Auth" button to specifically test your authentication credentials:

1. Start your local server
2. Open the page in your browser
3. Click the "Test Tripleseat Auth" button
4. Check the browser console (F12 > Console) for detailed error messages
5. Look for any specific error messages returned by Tripleseat

### 5. Check Request Headers and Body Format

The Tripleseat API requires authentication parameters to be included in both the request headers AND the request body:

**Headers:**
- `X-Public-Key`: Your Public Key
- `X-Consumer-Key`: Your Consumer Key
- `X-Consumer-Secret`: Your Consumer Secret

**Request Body:**
```json
{
  "public_key": "your_public_key",
  "consumer_key": "your_consumer_key",
  "consumer_secret": "your_consumer_secret",
  "lead": {
    "first_name": "Test",
    "last_name": "User",
    // other lead fields...
  }
}
```

Make sure both the headers and the request body include the authentication parameters. Missing either one can result in 401 Unauthorized errors.

### 6. Verify Webhook URL

Ensure the webhook URL is correct:
- The standard URL is `https://api.tripleseat.com/v1/leads/create.js`
- Check if your Tripleseat account requires a different endpoint

## CORS Restrictions and Limitations

### Understanding CORS Restrictions
When making direct API calls to Tripleseat from a browser, you may encounter Cross-Origin Resource Sharing (CORS) restrictions. This is a security feature implemented by browsers that prevents web pages from making requests to a different domain than the one that served the web page.

### How This Integration Handles CORS
This integration uses the `no-cors` mode when making requests to Tripleseat's API. This approach:
- Allows the browser to send the request to Tripleseat
- Prevents the browser from reading the response from Tripleseat
- Creates leads in Tripleseat, but cannot confirm success or retrieve the lead ID

### Limitations Due to CORS
Because of these restrictions:
1. We cannot display the actual lead ID on the thank-you page
2. We cannot check the status of a lead after submission
3. We use a temporary ID for tracking purposes

### Solutions for Production
For a production environment, consider these options:
1. **Server-side Proxy**: Implement a server-side proxy that makes the API calls to Tripleseat on behalf of the browser
2. **Webhook Integration**: Use Tripleseat's webhook features to send data back to your server
3. **Manual Verification**: Log in to Tripleseat to verify lead creation

## Troubleshooting

### Common Issues

1. **401 Unauthorized Error:**
   - This indicates an authentication problem with your Tripleseat API credentials
   - The most common cause is not including authentication parameters in both the request headers AND the request body
   - Verify that the `apiKey`, `consumerKey`, and `consumerSecret` in `tripleseat-config.js` are correct
   - Check that the keys are being sent in the correct format (as `X-Public-Key`, `X-Consumer-Key`, and `X-Consumer-Secret` headers)
   - Ensure your Tripleseat account has API access enabled
   - Try regenerating your API keys in Tripleseat if the issue persists

2. **Leads not appearing in Tripleseat:**
   - Check the browser console for error messages
   - Verify that all IDs in the configuration file are correct
   - Ensure the API keys are valid
   - Check that the webhook URL is correct

3. **Authentication errors:**
   - Verify that the public key, consumer key, and consumer secret are correct
   - Check if your Tripleseat account has API access enabled

4. **Missing data in Tripleseat leads:**
   - Review the `prepareTripleseatData()` function in `scripts.js` to ensure all required fields are being mapped correctly
   - Check if any custom fields need to be configured in Tripleseat

### Testing Tools

The catering quote builder includes built-in testing tools:

- **Fill Test Order button:** Automatically fills the form with test data
- **Test Submit button:** Submits the form data to Tripleseat without sending an email
- **Test Tripleseat Auth button:** Specifically tests your Tripleseat authentication credentials
- **Console logging:** Detailed logs in the browser console for debugging

## Additional Configuration Options

### Custom Fields

If you need to map additional form fields to custom fields in Tripleseat:

1. Create the custom fields in your Tripleseat account
2. Add the field mappings to the `customFields` section of the configuration file:

```javascript
customFields: {
    "delivery_location": "delivery_location",
    "subtotal": "subtotal_amount",
    "total": "total_amount",
    "new_field_name": "tripleseat_custom_field_name"
}
```

### Room Selection

The configuration includes room IDs for each venue. If you want to specify a particular room for leads:

1. Update the `prepareTripleseatData()` function in `scripts.js` to include room selection logic
2. Use the room IDs from the `rooms` object in the configuration file

## Support

If you encounter any issues with the Tripleseat integration, please contact:

- For technical issues: [your technical contact]
- For Tripleseat account questions: [your Tripleseat account manager]

---

Last updated: May 28, 2024 