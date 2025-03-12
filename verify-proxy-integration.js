/**
 * Verify Proxy Integration Script
 * 
 * This script verifies that the proxy server is properly integrated with the actual forms.
 * It adds a "Verify Proxy" button to the page that tests the connection to the proxy server.
 * 
 * To use this script:
 * 1. Make sure the proxy server is running: node tripleseat-proxy-port-3002.js
 * 2. Open one of the catering forms in your browser
 * 3. Open the browser console and paste this entire script
 * 4. Click the "Verify Proxy" button that appears at the top of the page
 */

(function() {
    // Create a verify button
    const verifyButton = document.createElement('button');
    verifyButton.textContent = 'Verify Proxy';
    verifyButton.style.position = 'fixed';
    verifyButton.style.top = '10px';
    verifyButton.style.left = '10px';
    verifyButton.style.zIndex = '9999';
    verifyButton.style.padding = '10px 20px';
    verifyButton.style.backgroundColor = '#2196F3';
    verifyButton.style.color = 'white';
    verifyButton.style.border = 'none';
    verifyButton.style.borderRadius = '5px';
    verifyButton.style.cursor = 'pointer';
    
    // Add the button to the page
    document.body.appendChild(verifyButton);
    
    // Create a result container
    const resultContainer = document.createElement('div');
    resultContainer.style.position = 'fixed';
    resultContainer.style.top = '60px';
    resultContainer.style.left = '10px';
    resultContainer.style.zIndex = '9999';
    resultContainer.style.padding = '10px';
    resultContainer.style.backgroundColor = '#f8f9fa';
    resultContainer.style.border = '1px solid #ddd';
    resultContainer.style.borderRadius = '5px';
    resultContainer.style.maxWidth = '400px';
    resultContainer.style.display = 'none';
    
    // Add the result container to the page
    document.body.appendChild(resultContainer);
    
    // Function to verify the proxy server
    async function verifyProxyServer() {
        console.log('Verifying proxy server...');
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = '<p>Testing connection to proxy server...</p>';
        
        try {
            // Check if TRIPLESEAT_CONFIG is defined
            if (typeof TRIPLESEAT_CONFIG === 'undefined') {
                throw new Error('TRIPLESEAT_CONFIG is not defined. Make sure tripleseat-config.js is loaded.');
            }
            
            // Check if proxyUrl is defined
            if (!TRIPLESEAT_CONFIG.api.proxyUrl) {
                throw new Error('proxyUrl is not defined in TRIPLESEAT_CONFIG. Make sure it is set in tripleseat-config.js.');
            }
            
            // Test the connection to the proxy server
            const response = await fetch(TRIPLESEAT_CONFIG.api.proxyUrl.replace('/api/tripleseat/leads', '/health'), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Proxy server returned status ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status !== 'ok') {
                throw new Error(`Proxy server returned unexpected status: ${data.status}`);
            }
            
            // Test a simple lead creation
            const testData = {
                public_key: TRIPLESEAT_CONFIG.api.apiKey,
                consumer_key: TRIPLESEAT_CONFIG.api.consumerKey,
                consumer_secret: TRIPLESEAT_CONFIG.api.consumerSecret,
                lead: {
                    first_name: 'Proxy',
                    last_name: 'Test',
                    email: 'proxy-test@example.com',
                    phone_number: '555-123-4567',
                    event_name: 'Proxy Test',
                    description: 'This is a test lead created to verify the proxy server integration.',
                    start_time: '2024-04-15 12:00:00',
                    end_time: '2024-04-15 15:00:00',
                    guest_count: 10,
                    location_id: TRIPLESEAT_CONFIG.venues['The Dug-Out'] || '20521',
                    room_id: '241847',
                    status: 'new_lead',
                    event_type_id: TRIPLESEAT_CONFIG.eventTypes.catering || '1',
                    lead_source_id: TRIPLESEAT_CONFIG.leadSources.website || '112995'
                }
            };
            
            resultContainer.innerHTML = '<p>Proxy server is running. Testing lead creation...</p>';
            
            const leadResponse = await fetch(TRIPLESEAT_CONFIG.api.proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });
            
            if (!leadResponse.ok) {
                const errorText = await leadResponse.text();
                throw new Error(`Lead creation failed: ${leadResponse.status} ${leadResponse.statusText}. Details: ${errorText}`);
            }
            
            const leadData = await leadResponse.json();
            
            if (!leadData.lead_id) {
                throw new Error(`Lead creation response missing lead_id: ${JSON.stringify(leadData)}`);
            }
            
            resultContainer.innerHTML = `
                <p style="color: green; font-weight: bold;">✅ Proxy server is working correctly!</p>
                <p>Successfully created test lead with ID: ${leadData.lead_id}</p>
                <p>The proxy server is properly integrated with the form.</p>
                <p>You can now test the actual form submission.</p>
            `;
            
            console.log('Proxy server verification successful!');
            console.log('Lead created with ID:', leadData.lead_id);
            
        } catch (error) {
            console.error('Proxy server verification failed:', error);
            
            resultContainer.innerHTML = `
                <p style="color: red; font-weight: bold;">❌ Proxy server verification failed!</p>
                <p>${error.message}</p>
                <p>Make sure the proxy server is running:</p>
                <pre style="background-color: #f5f5f5; padding: 5px; border-radius: 3px;">node tripleseat-proxy-port-3002.js</pre>
            `;
        }
    }
    
    // Add click event listener to the verify button
    verifyButton.addEventListener('click', verifyProxyServer);
    
    console.log('Verify script loaded! Click the "Verify Proxy" button to test the proxy server integration.');
})(); 