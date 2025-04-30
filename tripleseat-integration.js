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
    
    // Use event start and end times if available and not empty, otherwise use delivery time + default duration
    if (formData.event && formData.event.startTime && formData.event.endTime && 
        formData.event.startTime.trim() !== '' && formData.event.endTime.trim() !== '') {
        const startTime = new Date(formData.delivery.date + 'T' + formData.event.startTime);
        const endTime = new Date(formData.delivery.date + 'T' + formData.event.endTime);
        
        // Only update if the times are valid
        if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
            eventDate.setTime(startTime.getTime());
            eventEndDate.setTime(endTime.getTime());
            logTripleSeatDebug('Using provided event times:', {
                start: formData.event.startTime,
                end: formData.event.endTime
            });
        } else {
            // Fallback to delivery time + default duration if event times are invalid
            logTripleSeatDebug('Invalid event times, falling back to delivery time + default duration');
            const defaultDuration = TRIPLESEAT_CONFIG.defaultEventDuration || 3; // Fallback to 3 hours if undefined
            eventEndDate.setHours(eventEndDate.getHours() + defaultDuration);
        }
    } else {
        // Use delivery time + default duration if no event times provided or they're empty
        logTripleSeatDebug('No event times provided, using delivery time + default duration');
        const defaultDuration = TRIPLESEAT_CONFIG.defaultEventDuration || 3; // Fallback to 3 hours if undefined
        eventEndDate.setHours(eventEndDate.getHours() + defaultDuration);
    }
    
    // Format dates for Tripleseat
    const formatTripleseatDate = (date) => {
        // Check if date is valid before attempting to format it
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            console.error('Invalid date passed to formatTripleseatDate:', date);
            // Return a default future date or the current time
            const defaultDate = new Date();
            defaultDate.setHours(defaultDate.getHours() + 24); // Default to 24 hours from now
            return defaultDate.toISOString().split('.')[0] + 'Z';
        }
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
            email_address: formData.contact.email,
            phone: formData.contact.phone,
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
            event_style: "dropoff",
            // Add full delivery address
            address: formData.source === 'The Dug-Out' ? 
                `${formData.delivery.location}, Frankie Allen Park, 100 Bagley St NE` : 
                formData.delivery.address || '',
            city: formData.delivery.city || 'Atlanta',
            state: formData.delivery.state || 'GA',
            zip: formData.delivery.zip || '30305',
            // Add offsite address attributes for offsite events
            offsite_address_attributes: {
                address1: formData.source === 'The Dug-Out' ? 
                    `${formData.delivery.location}, Frankie Allen Park, 100 Bagley St NE` : 
                    formData.delivery.address || '',
                address2: '',  // Optional second address line
                zip_code: formData.delivery.zip || '30305',
                city: formData.delivery.city || 'Atlanta',
                state: formData.delivery.state || 'GA'
            },
            notes: notes.trim(),
            // Add order details to additional_information field per Tripleseat API docs
            additional_information: `
--------------------------------------------------
CATERING QUOTE DETAILS
--------------------------------------------------

CONTACT INFORMATION:
Name: ${formData.contact.name}
Email: ${formData.contact.email}
Phone: ${formData.contact.phone}

LOCATION & DELIVERY DETAILS:
==========================
Location: ${formData.delivery.location || 'Not specified'}
${formData.delivery.address ? `STREET ADDRESS: ${formData.delivery.address}` : ''}
${formData.delivery.city ? `CITY: ${formData.delivery.city}` : ''}
${formData.delivery.zip ? `ZIP CODE: ${formData.delivery.zip}` : ''}
${formData.delivery.state ? `STATE: ${formData.delivery.state}` : ''}
${formData.delivery.instructions ? `Delivery Instructions: ${formData.delivery.instructions}` : ''}
Delivery Date: ${formData.delivery.date ? new Date(formData.delivery.date).toLocaleDateString() : 'Not specified'}
Delivery Time: ${formData.delivery.time || 'Not specified'}

EVENT DETAILS:
Party Size: ${formData.partySize || 'Not specified'}
${formData.event ? `Event Type: ${formData.event.type || 'Not specified'}` : ''}
${formData.event && formData.event.setup ? `Setup Time: ${formData.event.setup}` : ''}
${formData.event && formData.event.startTime ? `Event Start Time: ${formData.event.startTime}` : ''}
${formData.event && formData.event.endTime ? `Event End Time: ${formData.event.endTime}` : ''}
Source: ${formData.source} Catering Form

ORDER DETAILS:
${formData.order.map(item => `- ${item.name} (${item.quantity}) - ${item.subtotal}`).join('\n')}

PRICING:
Subtotal: ${formData.subtotal}
Tax (8.9%): $${tax.toFixed(2)}
${formData.fees ? `Service Fees: ${formData.fees}` : ''}
${formData.delivery && formData.delivery.fee ? `Delivery Fee: ${formData.delivery.fee}` : ''}
TOTAL: $${total.toFixed(2)}

${formData.comments ? `ADDITIONAL COMMENTS:
${formData.comments}` : ''}

--------------------------------------------------
Form Submitted: ${new Date().toLocaleString()}
--------------------------------------------------`
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
        
        // Better debugging for contact and address information
        logTripleSeatDebug('CONTACT INFO BEING SENT:', {
            name: formData.contact.name,
            email: formData.contact.email,
            phone: formData.contact.phone
        });
        
        logTripleSeatDebug('ADDRESS INFO BEING SENT:', {
            location: formData.delivery.location,
            street: formData.delivery.address,
            city: formData.delivery.city,
            zip: formData.delivery.zip
        });
        
        // Convert form data to Tripleseat format
        const tripleseatData = convertFormDataForTripleseat(formData);
        
        // DEBUGGING: Log the structure of the notes field
        logTripleSeatDebug('NOTES FIELD CONTENT PREVIEW (first 100 chars):', tripleseatData.lead.notes.substring(0, 100));
        logTripleSeatDebug('NOTES FIELD LENGTH:', tripleseatData.lead.notes.length);
        
        // DEBUGGING: Log the custom fields we're sending
        logTripleSeatDebug('CUSTOM FIELDS BEING SENT:', tripleseatData.custom_fields);
        
        // Additional debug for the specific contact fields that should map to Tripleseat
        logTripleSeatDebug('TRIPLESEAT API CONTACT FIELDS:', {
            first_name: tripleseatData.lead.first_name, 
            last_name: tripleseatData.lead.last_name,
            email: tripleseatData.lead.email,
            phone_number: tripleseatData.lead.phone_number,
            email_address: tripleseatData.lead.email_address,
            phone: tripleseatData.lead.phone
        });
        
        // Get the appropriate URL based on environment
        const tripleseatUrl = TRIPLESEAT_CONFIG.getProxyUrl();
        logTripleSeatDebug(`Sending data to Tripleseat via: ${tripleseatUrl}`);
        
        // Log the complete payload structure for verification
        logTripleSeatDebug('Complete Tripleseat Payload:', {
            event_style: tripleseatData.lead.event_style,
            event_type_id: tripleseatData.lead.event_type_id,
            start_date: tripleseatData.lead.start_date,
            end_date: tripleseatData.lead.end_date,
            location_id: tripleseatData.lead.location_id,
            rooms: tripleseatData.lead.rooms
        });

        // Check if we want to use mock API
        const urlParams = new URLSearchParams(window.location.search);
        const useMock = urlParams.get('mock') === 'true';
        
        // Prepare the response structure
        let result = { success: false, error: null, lead_id: null, mock: false };
        
        try {
            // Send the data to Tripleseat
            const response = await fetch(tripleseatUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tripleseatData)
            });
            
            // Log the full response for debugging
            logTripleSeatDebug('Tripleseat API Response Status:', response.status);
            logTripleSeatDebug('Tripleseat API Response Headers:', Object.fromEntries(response.headers.entries()));
            logTripleSeatDebug('Tripleseat Payload Event Style:', tripleseatData.lead.event_style);
            
            // Check if the response is ok
            if (!response.ok) {
                const errorText = await response.text();
                logTripleSeatDebug('Tripleseat API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
            }
            
            // Parse the response
            const responseData = await response.json();
            logTripleSeatDebug('Tripleseat API Response Data:', responseData);
            
            // For mock response, add a flag
            if (useMock || responseData.mock) {
                result.mock = true;
            }
            
            // Check for success in the response - handle different response formats
            if (responseData.lead_id || responseData.success_message || responseData.success) {
                result.success = true;
                result.lead_id = responseData.lead_id || null;
                result.message = responseData.success_message || 'Lead created successfully';
                
                if (responseData.mock) {
                    result.message += ' (Mock Response)';
                }
            } else if (responseData.error) {
                result.error = responseData.error;
                // Log the full error details
                logTripleSeatDebug('Tripleseat API Error Details:', {
                    error: responseData.error,
                    errors: responseData.errors,
                    message: responseData.message
                });
                // Add a more user-friendly message for production
                result.userMessage = 'We couldn\'t process your booking request at this time. Your form data has been saved and our team will follow up with you.';
            } else {
                // Log the unexpected response format
                logTripleSeatDebug('Unexpected Tripleseat API Response Format:', responseData);
                result.error = 'Unknown error from Tripleseat';
                result.userMessage = 'Your catering request has been saved, but we couldn\'t connect to our booking system. Our team will follow up with you shortly.';
            }
        } catch (error) {
            logTripleSeatDebug('Error sending to Tripleseat:', error);
            result.error = error.message;
            
            // Add user-friendly messages based on error type
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                result.userMessage = 'Connection issue: Please check your internet connection and try again.';
            } else if (error.message.includes('Timeout')) {
                result.userMessage = 'Our booking system is taking longer than expected to respond. Your request has been saved.';
            } else {
                result.userMessage = 'We encountered an unexpected issue with our booking system. Your quote information has been saved.';
            }
        }
        
        return result;
    } catch (error) {
        logTripleSeatDebug('Error in sendToTripleseat function:', error);
        return { success: false, error: error.message };
    }
}