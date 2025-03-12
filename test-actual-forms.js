/**
 * Test Script for Actual Catering Forms
 * 
 * This script helps test the actual catering forms with the Tripleseat proxy server.
 * It adds a test button to each form that fills it with test data and submits it.
 * 
 * To use this script:
 * 1. Make sure the proxy server is running: node tripleseat-proxy-port-3002.js
 * 2. Open one of the catering forms in your browser
 * 3. Open the browser console and paste this entire script
 * 4. Click the "Test Form Submission" button that appears at the top of the page
 */

(function() {
    // Create a test button
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Form Submission';
    testButton.style.position = 'fixed';
    testButton.style.top = '10px';
    testButton.style.right = '10px';
    testButton.style.zIndex = '9999';
    testButton.style.padding = '10px 20px';
    testButton.style.backgroundColor = '#4CAF50';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '5px';
    testButton.style.cursor = 'pointer';
    
    // Add the button to the page
    document.body.appendChild(testButton);
    
    // Function to fill the form with test data
    function fillFormWithTestData() {
        console.log('Filling form with test data...');
        
        // Contact information
        document.getElementById('contactName').value = 'Test User';
        document.getElementById('contactEmail').value = 'test@example.com';
        document.getElementById('contactPhone').value = '555-123-4567';
        
        // Delivery information
        if (document.getElementById('locationStreet')) {
            document.getElementById('locationStreet').value = '123 Test Street';
            document.getElementById('locationCity').value = 'Atlanta';
            document.getElementById('locationZip').value = '30303';
        } else if (document.getElementById('locationField')) {
            document.getElementById('locationField').value = '123 Test Street, Atlanta, GA 30303';
        }
        
        // Set date to 3 days from now
        const today = new Date();
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);
        
        const formattedDate = threeDaysFromNow.toISOString().split('T')[0];
        
        if (document.getElementById('dropoffDate')) {
            document.getElementById('dropoffDate').value = formattedDate;
        } else if (document.getElementById('deliveryDate')) {
            document.getElementById('deliveryDate').value = formattedDate;
        }
        
        // Set time
        if (document.getElementById('dropoffTime')) {
            document.getElementById('dropoffTime').value = '12:00';
        } else if (document.getElementById('deliveryTime')) {
            document.getElementById('deliveryTime').value = '12:00';
        }
        
        // Party size
        if (document.getElementById('exactPartySize')) {
            document.getElementById('exactPartySize').value = '25';
        } else if (document.getElementById('guestCount')) {
            document.getElementById('guestCount').value = '25';
        }
        
        // Comments
        if (document.getElementById('comments')) {
            document.getElementById('comments').value = 'This is a test submission from the test script.';
        }
        
        // Add some menu items if they exist
        // This is more complex because menu items are dynamically generated
        // We'll just log a message for now
        console.log('Note: Menu items need to be selected manually.');
        
        console.log('Form filled with test data!');
    }
    
    // Function to submit the form
    function submitForm() {
        console.log('Submitting form...');
        
        // Get the form element
        const form = document.getElementById('orderForm');
        
        if (!form) {
            console.error('Form not found!');
            return;
        }
        
        // Create and dispatch a submit event
        const submitEvent = new Event('submit', {
            bubbles: true,
            cancelable: true
        });
        
        form.dispatchEvent(submitEvent);
        
        console.log('Form submitted!');
    }
    
    // Add click event listener to the test button
    testButton.addEventListener('click', function() {
        fillFormWithTestData();
        
        // Wait a moment before submitting to ensure all fields are filled
        setTimeout(submitForm, 500);
    });
    
    console.log('Test script loaded! Click the "Test Form Submission" button to fill and submit the form.');
})(); 