/**
 * Tripleseat Integration Configuration
 * 
 * This file contains all the configuration settings needed for integrating
 * the catering quote builder with Tripleseat.
 */

const TRIPLESEAT_CONFIG = {
    // API Configuration
    api: {
        // The webhook URL for creating leads in Tripleseat
        webhookUrl: "https://api.tripleseat.com/v1/leads/create.js", 
        
        // API key or authentication token for Tripleseat (will use env variable in production)
        apiKey: typeof process !== 'undefined' && process.env.TRIPLESEAT_API_KEY ? 
                process.env.TRIPLESEAT_API_KEY : 
                "c8b7ab91b0c9d00de35a853334586b71561a7431",
        
        // Consumer keys for additional authentication if needed (will use env variables in production)
        consumerKey: typeof process !== 'undefined' && process.env.TRIPLESEAT_CONSUMER_KEY ? 
                     process.env.TRIPLESEAT_CONSUMER_KEY : 
                     "Uef2cN123bPUupBzgGYjZKbxeUeAwwxaAnf02PSA",
        consumerSecret: typeof process !== 'undefined' && process.env.TRIPLESEAT_CONSUMER_SECRET ? 
                        process.env.TRIPLESEAT_CONSUMER_SECRET : 
                        "ePYEyf4nnzE2pVkBJWk7wu7AInM2QwICpIilK8MR",
        
        // Proxy URL for avoiding CORS issues
        proxyUrl: "/api/tripleseat/leads",
        
        // Set to true to enable Tripleseat integration in production
        enabled: true
    },
    
    // Environment detection and URL helpers
    getEnvironment: function() {
        const hostname = window.location.hostname;
        return (hostname === 'localhost' || hostname === '127.0.0.1') ? 'development' : 'production';
    },
    
    getProxyUrl: function() {
        // Check if we want to use mock API
        const urlParams = new URLSearchParams(window.location.search);
        const useMock = urlParams.get('mock') === 'true';
        
        // In development, use the local server
        if (this.getEnvironment() === 'development') {
            // For local development, port may vary
            const localDevPort = '3002';
            
            return useMock ? 
                `http://localhost:${localDevPort}/api/tripleseat/mock` : 
                `http://localhost:${localDevPort}/api/tripleseat/leads`;
        }
        
        // In production, always use the relative path
        return useMock ? 
            '/api/tripleseat/mock' : 
            '/api/tripleseat/leads';
    },
    
    // Feature toggle check
    isEnabled: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const disabled = urlParams.get('disableTripleseat') === 'true';
        
        if (disabled) {
            return false;
        }
        
        return this.api.enabled;
    },
    
    // Venue Configuration
    venues: {
        "Ladybird": "18694",
        "Muchacho": "18693",
        "The Dug-Out": "20521"
    },
    
    // Event Type Configuration
    eventTypes: {
        catering: "286252",
        delivery: "286252"
    },
    
    // Lead Source Configuration
    leadSources: {
        website: "112995",
        referral: "REPLACE_WITH_REFERRAL_LEAD_SOURCE_ID"
    },
    
    // Default event duration in hours (used to calculate end time)
    defaultEventDuration: 3,
    
    // Custom Fields Configuration
    customFields: {
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
            "Off-Site": "241847"
        }
    }
};

// Debug logging helper for development
function logTripleSeatDebug(message, data) {
    if (TRIPLESEAT_CONFIG.getEnvironment() === 'development') {
        console.log(`[TripleSeat Debug] ${message}`, data);
    }
} 