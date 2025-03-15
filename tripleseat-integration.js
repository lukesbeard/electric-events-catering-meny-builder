/**
 * Tripleseat Integration
 * 
 * This file contains all the functions needed to integrate with Tripleseat
 * for lead creation based on catering form submissions.
 */

// Format order details for Tripleseat
function formatOrderDetailsForTripleseat(orderItems) {
    if (!orderItems || !orderItems.length) {
        return "No items ordered";
    }
    
    return orderItems.map(item => 
        `${item.name} - ${item.quantity} units - ${item.subtotal}`
    ).join('\n');
}

// Convert form data to Tripleseat format
function convertFormDataForTripleseat(formData) {
    logTripleSeatDebug('Converting form data to Tripleseat format', formData);
    
    // Determine venue ID
    const venueId = TRIPLESEAT_CONFIG.venues[formData.source] || '';
    
    if (!venueId) {
        logTripleSeatDebug('WARNING: No venue ID found for source', formData.source);
    }
    
    // Calculate event start and end times
    const eventDate = new Date(formData.delivery.date + 'T' + formData.delivery.time);
    const eventEndDate = new Date(eventDate);
    eventEndDate.setHours(eventEndDate.getHours() + TRIPLESEAT_CONFIG.defaultEventDuration);
    
    // Format dates for Tripleseat
    const formatTripleseatDate = (date) => {
        return date.toISOString().split('.')[0] + 'Z';  // Format as ISO string with Z
    };
    
    // Determine location/room
    let roomId = '';
    
    // If we have a valid venue, check if the location matches any room names
    if (venueId && formData.delivery.location) {
        const roomConfig = TRIPLESEAT_CONFIG.rooms[formData.source];
        if (roomConfig) {
            // Check if location contains any room name (case insensitive)
            const locationLower = formData.delivery.location.toLowerCase();
            for (const roomName in roomConfig) {
                if (locationLower.includes(roomName.toLowerCase())) {
                    roomId = roomConfig[roomName];
                    break;
                }
            }
            
            // Default to Off-Site if no match and likely an external location
            if (!roomId && !(locationLower.includes('onsite') || locationLower.includes('on-site'))) {
                roomId = roomConfig['Off-Site'] || '';
            }
            
            // Default to Unassigned if still no match
            if (!roomId) {
                roomId = roomConfig['Unassigned'] || '';
            }
        }
    }
    
    // Format the order details
    const formattedOrderDetails = formatOrderDetailsForTripleseat(formData.order);
    
    // Format notes with additional order information
    const notes = `
CATERING ORDER DETAILS
======================

Party Size: ${formData.partySize}
${formData.subtotal ? `Subtotal: ${formData.subtotal}` : ''}
${formData.total ? `Total (with tax): ${formData.total}` : ''}

ORDER ITEMS
-----------
${formattedOrderDetails}

${formData.comments ? `ADDITIONAL NOTES
---------------
${formData.comments}` : ''}

This lead was generated from the ${formData.source} Catering Order Form.
    `;
    
    // Build Tripleseat payload
    const tripleseatData = {
        public_key: TRIPLESEAT_CONFIG.api.apiKey,
        lead: {
            first_name: formData.contact.name.split(' ')[0] || '',
            last_name: formData.contact.name.split(' ').slice(1).join(' ') || '',
            email: formData.contact.email,
            phone_number: formData.contact.phone,
            location_id: venueId,
            event_type_id: TRIPLESEAT_CONFIG.eventTypes.catering,
            lead_source_id: TRIPLESEAT_CONFIG.leadSources.website,
            description: `Catering Order - ${formData.source}`,
            rooms: roomId ? [roomId] : [],
            guest_count: parseInt(formData.partySize) || 0,
            start_date: formatTripleseatDate(eventDate),
            end_date: formatTripleseatDate(eventEndDate),
            notes: notes.trim()
        },
        // Add custom fields if needed
        custom_fields: {
            delivery_location: formData.delivery.location || '',
            subtotal_amount: formData.subtotal || '',
            total_amount: formData.total || ''
        }
    };
    
    logTripleSeatDebug('Converted data for Tripleseat', tripleseatData);
    return tripleseatData;
}

// Send data to Tripleseat
async function sendToTripleseat(formData) {
    // Check if Tripleseat integration is enabled
    if (!TRIPLESEAT_CONFIG.isEnabled()) {
        logTripleSeatDebug('Tripleseat integration is disabled, skipping');
        return { success: false, message: 'Tripleseat integration is disabled' };
    }
    
    try {
        logTripleSeatDebug('Preparing to send data to Tripleseat', formData);
        
        // Convert form data to Tripleseat format
        const tripleseatData = convertFormDataForTripleseat(formData);
        
        // Get the appropriate URL based on environment
        const tripleseatUrl = TRIPLESEAT_CONFIG.getProxyUrl();
        logTripleSeatDebug(`Sending to Tripleseat via: ${tripleseatUrl}`);
        
        // Send the data
        const response = await fetch(tripleseatUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tripleseatData)
        });
        
        // Handle no-cors responses
        if (response.type === 'opaque') {
            logTripleSeatDebug('Received opaque response due to no-cors mode');
            return { 
                success: true,
                message: 'Request sent to Tripleseat. No response details available due to CORS restrictions.'
            };
        }
        
        // Parse the response if possible
        let result;
        try {
            result = await response.json();
            logTripleSeatDebug('Tripleseat response', result);
        } catch (parseError) {
            logTripleSeatDebug('Could not parse Tripleseat response', {
                status: response.status,
                statusText: response.statusText,
                error: parseError.message
            });
            
            // If we got a 200 OK but couldn't parse JSON, assume success
            if (response.ok) {
                return { success: true, message: 'Lead created in Tripleseat' };
            } else {
                throw new Error(`Failed to parse Tripleseat response: ${parseError.message}`);
            }
        }
        
        if (result && result.success) {
            return { 
                success: true, 
                lead_id: result.lead_id || '',
                message: 'Lead created in Tripleseat' 
            };
        } else {
            throw new Error(result?.error || 'Unknown error from Tripleseat');
        }
    } catch (error) {
        logTripleSeatDebug('Error sending to Tripleseat', error);
        return { 
            success: false, 
            error: error.message || 'Failed to send data to Tripleseat',
            message: 'Failed to create lead in Tripleseat'
        };
    }
} 