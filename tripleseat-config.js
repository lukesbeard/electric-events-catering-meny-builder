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
        
        // API key or authentication token for Tripleseat
        apiKey: "c8b7ab91b0c9d00de35a853334586b71561a7431",
        
        // Consumer keys for additional authentication if needed
        consumerKey: "Uef2cN123bPUupBzgGYjZKbxeUeAwwxaAnf02PSA",
        consumerSecret: "ePYEyf4nnzE2pVkBJWk7wu7AInM2QwICpIilK8MR",
        
        // Proxy URL for avoiding CORS issues
        proxyUrl: "/api/tripleseat/leads",
        
        // Set to true to enable Tripleseat integration in production
        enabled: true
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
    },
    
    // Environment detection and URL helpers
    getEnvironment: function() {
        const hostname = window.location.hostname;
        return (hostname === 'localhost' || hostname === '127.0.0.1') ? 'development' : 'production';
    },
    
    getProxyUrl: function() {
        if (this.getEnvironment() === 'development') {
            // Check if we want to use real API or mock
            const urlParams = new URLSearchParams(window.location.search);
            const useMock = urlParams.get('mock') === 'true';
            
            return useMock ? 
                'http://localhost:3002/api/tripleseat/mock' : 
                'http://localhost:3002/api/tripleseat/leads';
        }
        
        // Return production proxy URL
        return '/api/tripleseat/leads';
    },
    
    // Feature toggle check
    isEnabled: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const disabled = urlParams.get('disableTripleseat') === 'true';
        
        if (disabled) {
            return false;
        }
        
        return this.api.enabled;
    }
};

// Debug logging helper for development
function logTripleSeatDebug(message, data) {
    if (TRIPLESEAT_CONFIG.getEnvironment() === 'development') {
        console.log(`[TripleSeat Debug] ${message}`, data);
    }
} 