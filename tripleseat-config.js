/**
 * Tripleseat Integration Configuration
 * 
 * This file contains all the configuration settings needed for integrating
 * the catering quote builder with Tripleseat.
 * 
 * INSTRUCTIONS:
 * 1. Replace all placeholder values with actual values from your Tripleseat account
 * 2. Ensure all IDs and URLs are correct before deploying to production
 */

const TRIPLESEAT_CONFIG = {
    // API Configuration
    api: {
        // The webhook URL for creating leads in Tripleseat
        // Get this from Settings > Webhooks in your Tripleseat account
        webhookUrl: "https://api.tripleseat.com/v1/leads/create.js", 
        
        // API key or authentication token for Tripleseat
        // This is your Public Key from Tripleseat
        apiKey: "c8b7ab91b0c9d00de35a853334586b71561a7431",
        
        // Consumer keys for additional authentication if needed
        // These are your Consumer Key and Secret from Tripleseat
        consumerKey: "Uef2cN123bPUupBzgGYjZKbxeUeAwwxaAnf02PSA",
        consumerSecret: "ePYEyf4nnzE2pVkBJWk7wu7AInM2QwICpIilK8MR",
        
        // Set to true to enable Tripleseat integration in production
        enabled: true
    },
    
    // Venue Configuration
    // Map each venue name to its corresponding Tripleseat venue ID
    venues: {
        // Actual venue IDs from Tripleseat account
        "Ladybird": "REPLACE_WITH_LADYBIRD_VENUE_ID",
        "Muchacho": "REPLACE_WITH_MUCHACHO_VENUE_ID",
        "The Dug-Out": "20521"  // Updated with provided ID
    },
    
    // Event Type Configuration
    eventTypes: {
        // Using default event type for catering and delivery
        catering: "1", // Default event type ID
        delivery: "1"  // Using the same ID for delivery
    },
    
    // Lead Source Configuration
    leadSources: {
        // Using referral ID for all lead sources
        website: "112995", // Using the same referral ID for website leads
        referral: "REPLACE_WITH_REFERRAL_LEAD_SOURCE_ID" // Updated with provided ID
    },
    
    // Default event duration in hours (used to calculate end time)
    defaultEventDuration: 3,
    
    // Custom Fields Configuration
    // Map your form fields to Tripleseat custom fields
    customFields: {
        // Add any custom fields you've configured in Tripleseat
        // Format: "formFieldName": "tripleseatCustomFieldName"
        "delivery_location": "delivery_location",
        "subtotal": "subtotal_amount",
        "total": "total_amount"
    },
    
    // Room IDs for each venue
    rooms: {
        "Ladybird": {
            "Unassigned": "219793",
            "Off-Site": "219803",
            "Buyout": "219804",
            "Flag Room": "219806",
            "The Deck on The Grove": "219808",
            "Argosy Traile Area": "219811",
            "Inside Only": "219812",
            "Lanai Room": "219813",
            "The Ranger Station": "260477",
            "Black Bear Bar": "260478",
            "The Patio": "263401",
            "The Grove": "269825",
            "Happy Traveler": "284432"
        },
        "Muchacho": {
            "Unassigned": "219792",
            "Inside Only": "219796",
            "BUY-OUT": "219797",
            "Patio 2": "219800",
            "Off-Site": "219805",
            "Pick-up Order": "219807",
            "Patio": "219809",
            "TigerSun": "383127"
        },
        "The Dug-Out": {
            "Unassigned": "241847",
            "Electric Room": "288107",
            "Off-Site": "241847" // Using Unassigned for Off-Site as well
        }
    }
};

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TRIPLESEAT_CONFIG;
} 