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

// Format the full order details like the email
function formatFullOrderForTripleseat(formData) {
    // Calculate tax amounts for display
    const subtotal = parseFloat(formData.subtotal.replace('$', ''));
    const tax = subtotal * 0.089;
    const total = subtotal + tax;

    // Determine if this is a Dug Out order
    const isDugOutOrder = formData.source === 'The Dug-Out';

    // Format the location display based on the source
    let locationDisplay = '';
    if (isDugOutOrder) {
        locationDisplay = `Drop Off Location: ${formData.delivery.location}`;
    } else {
        locationDisplay = `Location: ${formData.delivery.location}`;
    }
    
    // Format each order item with a bullet point
    const orderDetails = formData.order.map(item => 
        `• ${item.name} - ${item.quantity} units - ${item.subtotal}`
    ).join('\n');

    return `*** CATERING ORDER DETAILS ***

CONTACT INFORMATION:
Name: ${formData.contact.name}
Email: ${formData.contact.email}
Phone: ${formData.contact.phone}

DELIVERY INFORMATION:
${locationDisplay}
${formData.delivery.address ? `Address: ${formData.delivery.address}` : ''}
${formData.delivery.city ? `City: ${formData.delivery.city}` : ''}
${formData.delivery.zip ? `ZIP: ${formData.delivery.zip}` : ''}
Dropoff Date: ${formData.delivery.date ? new Date(formData.delivery.date).toLocaleDateString() : 'Not specified'}
Dropoff Time: ${formData.delivery.time || 'Not specified'}

Party Size: ${formData.partySize}

ORDER ITEMS:
${orderDetails}

PRICING:
Subtotal: ${formData.subtotal}
Tax (8.9%): $${tax.toFixed(2)}
Total: $${total.toFixed(2)}

${formData.comments ? `ADDITIONAL COMMENTS:
${formData.comments}` : ''}

Source: ${formData.source} Catering Order Form
`;
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
    
    // Calculate subtotal and total for use in description and custom fields
    const subtotal = parseFloat(formData.subtotal.replace('$', ''));
    const tax = subtotal * 0.089;
    const total = subtotal + tax;
    
    // Format comprehensive order details using the email template format
    const notes = formatFullOrderForTripleseat(formData);
    
    // Build Tripleseat payload
    const tripleseatData = {
        public_key: TRIPLESEAT_CONFIG.api.apiKey,
        lead: {
            first_name: formData.contact.name.split(' ')[0] || '',
            last_name: formData.contact.name.split(' ').slice(1).join(' ') || '',
            email: formData.contact.email,
            phone_number: formData.contact.phone,
            location_id: venueId,
            // Add a location_name that includes order details - this field is often displayed prominently
            location_name: `Order: ${formData.order.map(item => `${item.name} (${item.quantity})`).join(', ')}`,
            event_type_id: TRIPLESEAT_CONFIG.eventTypes.catering,
            lead_source_id: TRIPLESEAT_CONFIG.leadSources.website,
            description: `${formData.source} Catering Order - ${formData.delivery.date ? new Date(formData.delivery.date).toLocaleDateString() : 'TBD'} - $${total.toFixed(2)} - ${formData.order.length} items`,
            title: `Order Details: ${formData.order.map(item => `${item.name} (${item.quantity})`).join(', ')}`,
            rooms: roomId ? [roomId] : [],
            guest_count: parseInt(formData.partySize) || 0,
            start_date: formatTripleseatDate(eventDate),
            end_date: formatTripleseatDate(eventEndDate),
            notes: notes.trim(),
            // Add order details to additional_information field per Tripleseat API docs
            additional_information: `
ORDER DETAILS:
${formData.order.map(item => `- ${item.name} (${item.quantity}) - ${item.subtotal}`).join('\n')}

SUBTOTAL: ${formData.subtotal}
TAX (8.9%): $${tax.toFixed(2)}
TOTAL: $${total.toFixed(2)}

DELIVERY INFORMATION:
Location: ${formData.delivery.location || 'Not specified'}
${formData.delivery.address ? `Address: ${formData.delivery.address}` : ''}
${formData.delivery.city ? `City: ${formData.delivery.city}` : ''}
${formData.delivery.zip ? `ZIP: ${formData.delivery.zip}` : ''}
Delivery Date: ${formData.delivery.date ? new Date(formData.delivery.date).toLocaleDateString() : 'Not specified'}
Delivery Time: ${formData.delivery.time || 'Not specified'}
`
        },
        // Add custom fields if needed
        custom_fields: {
            delivery_location: formData.delivery.location || '',
            subtotal_amount: formData.subtotal || '',
            total_amount: formData.total || '',
            order_details: formData.order.map(item => `${item.name} (${item.quantity})`).join(', '),
            order_summary: `${formData.order.length} items, ${formData.subtotal} + tax`
        },
        // Test including order details in comment - this might be more visible in the Tripleseat UI
        comment: {
            comment: `ORDER DETAILS:\n${formData.order.map(item => `- ${item.name} (${item.quantity}) - ${item.subtotal}`).join('\n')}\n\nTotal: ${formData.total}`
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
        
        // DEBUGGING: Log the structure of the notes field
        logTripleSeatDebug('NOTES FIELD CONTENT PREVIEW (first 100 chars):', tripleseatData.lead.notes.substring(0, 100));
        logTripleSeatDebug('NOTES FIELD LENGTH:', tripleseatData.lead.notes.length);
        
        // DEBUGGING: Log the custom fields we're sending
        logTripleSeatDebug('CUSTOM FIELDS BEING SENT:', tripleseatData.custom_fields);
        
        // Get the appropriate URL based on environment
        const tripleseatUrl = TRIPLESEAT_CONFIG.getProxyUrl();
        logTripleSeatDebug(`Sending to Tripleseat via: ${tripleseatUrl}`);
        
        // DEBUGGING: Log entire payload to check for structural issues
        logTripleSeatDebug('FULL PAYLOAD BEING SENT TO TRIPLESEAT:', JSON.stringify(tripleseatData));
        
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
        
        // DEBUGGING: Log raw response details
        logTripleSeatDebug('RESPONSE STATUS:', response.status);
        logTripleSeatDebug('RESPONSE STATUS TEXT:', response.statusText);
        logTripleSeatDebug('RESPONSE HEADERS:', [...response.headers.entries()]);
        
        // Parse the response if possible
        let result;
        try {
            result = await response.json();
            logTripleSeatDebug('Tripleseat response', result);
            
            // DEBUGGING: Check if response contains any error messages about fields
            logTripleSeatDebug('CHECKING FOR FIELD ERRORS IN RESPONSE:', result.errors || 'No explicit errors');
            
            // Add more detailed logging about the lead location
            if (result && result.lead_id) {
                const leadUrl = `https://app.tripleseat.com/leads/${result.lead_id}`;
                logTripleSeatDebug('Lead created successfully! View at:', leadUrl);
            }
            
            // Check for success message or lead_id to determine if creation was successful
            if (result.success || result.success_message || result.lead_id) {
                return {
                    success: true,
                    message: result.success_message || 'Lead created successfully!',
                    leadId: result.lead_id || '',
                    data: result
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Unknown error from Tripleseat',
                    data: result
                };
            }
        } catch (parseError) {
            logTripleSeatDebug('Error parsing Tripleseat response', parseError);
            
            // If we can't parse the response but got a successful status code, assume success
            if (response.ok) {
                return {
                    success: true,
                    message: 'Lead likely created successfully, but could not parse response',
                    data: null
                };
            } else {
                return {
                    success: false,
                    error: 'Could not parse Tripleseat response: ' + parseError.message,
                    data: null
                };
            }
        }
    } catch (error) {
        logTripleSeatDebug('Error sending data to Tripleseat', error);
        return { success: false, error: 'Error sending data to Tripleseat: ' + error.message };
    }
}