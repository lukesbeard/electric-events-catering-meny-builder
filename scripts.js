// Google Sheets configuration
const SHEET_CONFIGS = {
    ladybird: {
        id: '1AHaAHIYUStyGmZkEqNhFAp-qTwvCDhLkAkQATJSiZnk',
        sheets: {
            mains: {
                name: 'Mains!A2:D14',
                title: 'Mains'
            },
            sides: {
                name: 'Sides!A2:D25',  // Extended range to ensure we capture all side items
                title: 'Sides'
            },
            deserts: {
                name: 'Deserts!A2:D6',
                title: 'Deserts'
            }
        }
    },
    muchacho: {
        id: '1nhmXLYpzWOwM9DIobMSjA-rbTge5UZF__1uCzUVpZ1Q',
        sheets: {
            mains: {
                name: 'Mains!A2:D16',  // Adjusted range for Muchacho menu
                title: 'Package Options'
            },
            sides: {
                name: 'Sides!A2:D25',  // Extended range to match Ladybird approach
                title: 'A la Carte & Sides'
            }
        }
    },
    dugout: {
        id: '1f0r1MByzLidkOYt2tVqgYG1snOQbuIzUWpw86hbO7VA',
        sheets: {
            mains: {
                name: 'Mains!A2:D14',
                title: 'The Lineup'
            },
            sides: {
                name: 'Sides!A2:D25',
                title: 'Extra Innings'
            }
        }
    }
};

const API_KEY = 'AIzaSyAILUy99UCHJ6eV341T33UR4Hkj1JlCuNE';

// Determine which configuration to use based on the page
function getCurrentConfig() {
    if (document.body.classList.contains('muchacho-menu')) {
        return SHEET_CONFIGS.muchacho;
    } else if (document.body.classList.contains('dugout-menu') || window.location.pathname.includes('the-dug-out-catering')) {
        return SHEET_CONFIGS.dugout;
    } else {
        return SHEET_CONFIGS.ladybird;
    }
}

// Fetch data from Google Sheets
async function fetchSheetData(sheetConfig) {
    const currentConfig = getCurrentConfig();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${currentConfig.id}/values/${sheetConfig.name}?key=${API_KEY}`;
    
    try {
        console.log(`Fetching ${sheetConfig.title} from: ${sheetConfig.name}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log(`Raw ${sheetConfig.title} data:`, data);
        const parsedData = parseSheetData(data.values || []);
        console.log(`Parsed ${sheetConfig.title} data:`, parsedData);
        
        return parsedData;
    } catch (error) {
        console.error(`Error fetching ${sheetConfig.title} data:`, error);
        // Don't show errors for optional menus on pages that don't need them
        if (!(currentConfig === SHEET_CONFIGS.dugout && sheetConfig.title.toLowerCase() === 'deserts')) {
            showError(`Failed to load ${sheetConfig.title.toLowerCase()} menu items`);
        }
        return [];
    }
}

// Parse the sheet data into our required format
function parseSheetData(rows) {
    let currentItem = null;
    const items = [];

    // Skip the header row
    const dataRows = rows.slice(1);

    dataRows.forEach(row => {
        // Skip empty rows and header rows
        if (!row[0] || row[0].toLowerCase().includes('price')) {
            return;
        }

        if (row[1]) { // This is a main item row with price
            currentItem = {
                name: row[0],
                price: parseFloat(row[1].replace(/[^\d.]/g, '') || '0'),
                unit: row[2] || '1',
                measurement: row[3] || '',
                description: '',
                servingSuggestion: row[3] || ''  // Use measurement as serving suggestion
            };
            items.push(currentItem);
        } else if (currentItem) { // This is a description row
            currentItem.description = row[0];
            // Don't overwrite serving suggestion from measurement
        }
    });

    return items;
}

// Error handling UI - Update with condition to prevent showing errors for dugout desserts
function showError(message) {
    // Skip showing errors for deserts on The Dug-Out page
    if (getCurrentConfig() === SHEET_CONFIGS.dugout && message.toLowerCase().includes('desserts')) {
        console.log('Suppressing error message for The Dug-Out desserts:', message);
        return;
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-900 border border-red-600 text-white px-4 py-3 rounded relative mb-4';
    errorDiv.innerHTML = `
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">${message}</span>
    `;
    
    // Update selector to match your HTML structure
    const container = document.querySelector('.max-w-7xl');
    container.insertBefore(errorDiv, container.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
}

// Loading state UI
function setLoadingState(isLoading) {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        const existingSpinner = table.parentNode.querySelector('.loading-spinner');
        if (isLoading) {
            table.classList.add('opacity-50');
            if (!existingSpinner) {
                addLoadingSpinner(table);
            }
        } else {
            table.classList.remove('opacity-50');
            if (existingSpinner) {
                existingSpinner.remove();
            }
        }
    });
}

// Initialize all menu tables
async function initializeMenuTables() {
    setLoadingState(true);
    try {
        const currentConfig = getCurrentConfig();
        const promises = [];
        const menuData = {};

        // Build array of promises based on available sheets
        Object.entries(currentConfig.sheets).forEach(([key, sheet]) => {
            const menuId = `${key}Menu`;
            // Only fetch data if we have a corresponding element on the page
            if (document.getElementById(menuId)) {
                promises.push(
                    fetchSheetData(sheet).then(data => {
                        menuData[key] = data;
                    })
                );
            } else {
                console.log(`Skipping ${sheet.title} - no element with ID ${menuId} found on page`);
            }
        });

        await Promise.all(promises);

        // Initialize each menu section that exists in the current page
        Object.entries(currentConfig.sheets).forEach(([key, sheet]) => {
            const menuId = `${key}Menu`;
            const menuElement = document.getElementById(menuId);
            // Only initialize if the menu element exists in the page and we have data for it
            if (menuElement && menuData[key]) {
                initializeTable(key + 'Table', menuData[key]);
            }
        });

    } catch (error) {
        console.error('Error initializing menu tables:', error);
        showError('Failed to load menu data. Please refresh the page to try again.');
    } finally {
        setLoadingState(false);
    }
}

// Call initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeMenuTables);

// UI Helper Functions
function createMenuRow(item) {
    const servingInfo = item.measurement || item.servingSuggestion;
    
    const menuItem = document.createElement('div');
    menuItem.className = 'flex flex-col md:flex-row gap-4 border-b border-white/10 pb-6 last:border-b-0';
    
    menuItem.innerHTML = `
        <div class="flex-1">
            <div class="flex flex-col gap-1">
                <h3 class="text-2xl font-medium text-white">${item.name}</h3>
                <div class="text-lg font-medium">
                    <span class="text-primary">$${item.price.toFixed(2)}</span>
                    ${servingInfo ? `<span class="text-white text-base"> ${servingInfo}</span>` : ''}
                </div>
                <div class="text-md mt-1 max-w-[600px]">${item.description}</div>
            </div>
        </div>
        <div class="flex items-center gap-4 md:min-w-[200px]">
            <div class="flex-1 md:flex-none">
                <input type="number" 
                       inputmode="numeric" 
                       pattern="[0-9]*"
                       class="quantity-input" 
                       min="0" 
                       max="100"
                       value="0" 
                       data-price="${item.price}" 
                       data-item-name="${item.name}"
                       oninput="handleQuantityChange(this)">
            </div>
            <div class="subtotal font-medium text-2xl text-white whitespace-nowrap">$0.00</div>
        </div>
    `;

    return menuItem;
}

function updateSubtotal(input) {
    const price = parseFloat(input.dataset.price);
    const quantity = parseInt(input.value) || 0;
    const subtotal = price * quantity;
    const subtotalElement = input.closest('div.flex').querySelector('.subtotal');
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    updateTotal();
}

function updateTotal() {
    const subtotals = Array.from(document.querySelectorAll('.subtotal'))
        .map(element => parseFloat(element.textContent.replace('$', '')) || 0);
    const subtotal = subtotals.reduce((sum, value) => sum + value, 0);
    const tax = subtotal * 0.089;
    const total = subtotal + tax;
    
    const totalPriceWithTax = document.getElementById('totalPriceWithTax');
    const subtotalPrice = document.getElementById('subtotalPrice');
    const submitButton = document.getElementById('submitButton');
    
    totalPriceWithTax.textContent = `$${total.toFixed(2)}`;
    subtotalPrice.textContent = `$${subtotal.toFixed(2)} + 8.9% Tax`;
    
    if (subtotal <= 0) {
        submitButton.disabled = true;
        submitButton.title = 'Add items to your quote to continue';
    } else {
        submitButton.disabled = false;
        submitButton.removeAttribute('title');
    }
}

function initializeTable(tableId, items) {
    // Convert old table IDs to new menu IDs
    const menuId = tableId.replace('Table', 'Menu');
    const menuContainer = document.querySelector(`#${menuId}`);
    
    if (!menuContainer) {
        console.error(`Menu container not found for ID: ${menuId}`);
        return;
    }
    
    menuContainer.innerHTML = ''; // Clear existing items
    
    items.forEach(item => {
        const menuItem = createMenuRow(item);
        menuContainer.appendChild(menuItem);
    });
}

// Party Size Toggle Handler
function initializePartySizeToggle() {
    document.querySelectorAll('input[name="partySizeType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isRange = e.target.value === 'range';
            document.getElementById('exactPartySize').disabled = isRange;
            document.getElementById('partySizeMin').disabled = !isRange;
            document.getElementById('partySizeMax').disabled = !isRange;
        });
    });
}

// Guest Count Handler
function initializeGuestCount() {
    const guestCount = document.getElementById('guestCount');
    if (guestCount) {
        guestCount.addEventListener('input', _.debounce(() => {
            // Add logic here to suggest quantities based on guest count
            console.log('Guest count updated:', guestCount.value);
        }, 500));
    }
}

// Update initializeEventListeners to include the clock emoji
function initializeEventListeners() {
    initializePartySizeToggle();
    initializeGuestCount();
    
    // Calculate the date 3 days from now
    const currentDate = new Date();
    const threeDaysFromNow = new Date(currentDate);
    threeDaysFromNow.setDate(currentDate.getDate() + 3); // Add 3 days
    
    // Format the date to YYYY-MM-DD format
    const formattedMinDate = threeDaysFromNow.toISOString().split('T')[0];
    
    // Set up the date input
    const dateInput = document.getElementById('dropoffDate');
    if (dateInput) {
        // Set minimum date to 3 days from now
        dateInput.min = formattedMinDate;
        
        // Set default value to 3 days from now
        dateInput.value = formattedMinDate;

        // Update the existing helper text element with clock emoji
        const helperTextElement = document.querySelector('.helper-date-text');
        if (helperTextElement) {
            helperTextElement.textContent = `⏰ Earliest possible dropoff: ${threeDaysFromNow.toLocaleDateString()}`;
        }
    }
}

// Update validate72HourRequirement to include the clock emoji
function validate72HourRequirement(showAlert = true) {
    const dropoffDate = document.getElementById('dropoffDate').value;
    const dropoffTime = document.getElementById('dropoffTime').value;
    
    if (dropoffDate && dropoffTime) {
        // Combine date and time to create a timestamp
        const dropoffDateTime = new Date(`${dropoffDate}T${dropoffTime}`);
        const currentDateTime = new Date();
        const minimumDifferenceInMs = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
        const earliestDateTime = new Date(currentDateTime.getTime() + minimumDifferenceInMs);
        
        // Calculate difference in milliseconds
        const differenceInMs = dropoffDateTime - currentDateTime;
        
        if (differenceInMs < minimumDifferenceInMs) {
            const dateTimeFields = [
                document.getElementById('dropoffDate'),
                document.getElementById('dropoffTime')
            ];
            
            dateTimeFields.forEach(field => field.classList.add('border-red-500'));
            
            if (showAlert) {
                const formattedDate = earliestDateTime.toLocaleDateString();
                const formattedTime = earliestDateTime.toLocaleTimeString();
                
                showNotification(
                    `⏰ Earliest possible dropoff: ${formattedDate} after ${formattedTime}`,
                    'error'
                );
                
                // Reset the date to the minimum allowed date
                document.getElementById('dropoffDate').value = earliestDateTime.toISOString().split('T')[0];
            }
            
            return false;
        } else {
            // Remove error styling if date is valid
            const dateTimeFields = [
                document.getElementById('dropoffDate'),
                document.getElementById('dropoffTime')
            ];
            dateTimeFields.forEach(field => field.classList.remove('border-red-500'));
            return true;
        }
    }
    return true;
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    initializeMenuTables();
    initializeEventListeners();
    addRequiredFieldsIndicators();
    initializeAutoSave();
    restoreFormProgress();
    
    // Remove duplicate event listener and ensure only one exists
    const form = document.getElementById('orderForm');
    
    // Remove any existing event listeners (not directly possible, but we can replace the element)
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add the event listener to the new form
    newForm.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log('Form submitted, processing...');
        sendOrderEmail(event);
    });
    
    console.log('Current config:', getCurrentConfig().id);
    console.log('Form submission handler attached');
});

// Add a loading spinner function
function addLoadingSpinner(table) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner absolute inset-0 flex items-center justify-center bg-background bg-opacity-75';
    spinner.innerHTML = `
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    `;
    table.parentNode.style.position = 'relative';
    table.parentNode.appendChild(spinner);
    return spinner;
}

// Update the formatOrderDetails function to include tax info
function formatOrderDetails(orders) {
    return orders.map(item => 
        `   • ${item.name} - ${item.quantity} units - ${item.subtotal}`
    ).join('\n');
}

// Update the formatEmailMessage function to show subtotal and tax
function formatEmailMessage(formData) {
    // Calculate tax amounts for display
    const subtotal = parseFloat(formData.subtotal.replace('$', ''));
    const tax = subtotal * 0.089;
    const total = subtotal + tax;

    return `
Thank you for your catering quote request! We'll review your details and get back to you shortly.

${formData.contact.name}, we've received your request for a party of ${formData.partySize}.

Quote Details Below
======================

Contact Information
------------------
Name: ${formData.contact.name}
Email: ${formData.contact.email}
Phone: ${formData.contact.phone}

Delivery Details
---------------
Address: ${formData.delivery.address}
City: ${formData.delivery.city}, ${formData.delivery.zip}
Dropoff Date: ${new Date(formData.delivery.date).toLocaleDateString()}
Dropoff Time: ${formData.delivery.time}

Party Size: ${formData.partySize}

Order Details
------------
${formatOrderDetails(formData.order)}

Pricing
-------
Subtotal: ${formData.subtotal}
Tax (8.9%): $${tax.toFixed(2)}
Total: $${total.toFixed(2)}

${formData.comments ? `Additional Comments
------------------
${formData.comments}` : ''}

If you have any questions, please don't hesitate to reach out.

Speak soon,
Electric Events Catering Team
`;
}

// Simple local storage functions
function saveToLocalStorage(data) {
    try {
        localStorage.setItem('cateringFormData', JSON.stringify(data));
        console.log('Saved data:', data);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function getFromLocalStorage() {
    try {
        const data = localStorage.getItem('cateringFormData');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

// Update saveFormProgress to include date and time
function saveFormProgress() {
    const quantities = Array.from(document.querySelectorAll('.quantity-input'))
        .map(input => ({
            itemName: input.dataset.itemName,
            quantity: input.value || '0'
        }))
        .filter(item => item.itemName);

    const data = {
        quantities: quantities,
        timestamp: new Date().getTime(),
        delivery: {
            date: document.getElementById('dropoffDate')?.value || '',
            time: document.getElementById('dropoffTime').value || ''
        }
    };

    saveToLocalStorage(data);
}

// Update restoreFormProgress to handle date and time
function restoreFormProgress() {
    const savedData = getFromLocalStorage();
    if (!savedData) return;

    // Restore date and time if they exist
    if (savedData.delivery) {
        if (savedData.delivery.date) {
            document.getElementById('dropoffDate').value = savedData.delivery.date;
        }
        if (savedData.delivery.time) {
            document.getElementById('dropoffTime').value = savedData.delivery.time;
        }
    }

    // Restore quantities
    if (savedData.quantities) {
        function applyQuantities() {
            const inputs = document.querySelectorAll('.quantity-input');
            if (!inputs.length) return false;

            savedData.quantities.forEach(saved => {
                const input = Array.from(inputs)
                    .find(input => input.dataset.itemName === saved.itemName);
                
                if (input) {
                    input.value = saved.quantity;
                    updateSubtotal(input);
                }
            });

            updateTotal();
            return true;
        }

        // Try immediately after menu loads
        if (!applyQuantities()) {
            const checkInterval = setInterval(() => {
                if (applyQuantities()) {
                    clearInterval(checkInterval);
                }
            }, 100);

            // Safety cleanup after 5 seconds
            setTimeout(() => clearInterval(checkInterval), 5000);
        }
    }
}

// Update quantity change handler
function handleQuantityChange(input) {
    updateSubtotal(input);
    saveFormProgress();
}

// Clear storage after successful submission
function clearSavedData() {
    localStorage.removeItem('cateringFormData');
}

// Update the sendOrderEmail function to add more logging
async function sendOrderEmail(event) {
    console.log('sendOrderEmail function called');
    event.preventDefault();
    
    if (!validateContactDetails()) {
        console.log('Form validation failed');
        return;
    }
    
    console.log('Form validation passed, proceeding with submission');

    const submitButton = document.getElementById('submitButton');
    const submitSpinner = document.getElementById('submitSpinner');
    const buttonText = submitButton.querySelector('span');
    let sheetSubmissionSuccessful = false;

    try {
        // Show spinner and disable button
        submitButton.disabled = true;
        submitSpinner.classList.remove('hidden');
        buttonText.textContent = 'Sending...';
        
        console.log('Preparing form data for submission');

        // Get all form data
        const formData = {
            source: document.body.classList.contains('muchacho-menu') ? 'Muchacho' : 
                   (document.body.classList.contains('dugout-menu') ? 'The Dug-Out' : 'Ladybird'),
            contact: {
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                phone: document.getElementById('contactPhone').value
            },
            delivery: {
                address: document.getElementById('locationStreet').value,
                city: document.getElementById('locationCity').value,
                zip: document.getElementById('locationZip').value,
                date: document.getElementById('dropoffDate').value,
                time: document.getElementById('dropoffTime').value
            },
            partySize: getPartySize(),
            order: getOrderDetails(),
            subtotal: document.getElementById('subtotalPrice').textContent.split(' + ')[0],
            total: document.getElementById('totalPriceWithTax').textContent,
            comments: document.getElementById('comments').value
        };
        
        console.log('Form data prepared:', formData);

        // Check if we're in development
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        console.log('Environment:', isDevelopment ? 'Development' : 'Production');

        if (isDevelopment) {
            // Development code...
            console.log('Development mode - skipping actual submission');
            sheetSubmissionSuccessful = true;
        } else {
            // Production mode - try both methods for sheet submission
            try {
                console.log('Attempting to submit to sheet via proxy');
                // First try with proxy
                const sheetResponse = await fetch('/api/sheet-proxy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const sheetResult = await sheetResponse.json();
                console.log('Sheet response:', sheetResult);

                if (sheetResult.success) {
                    sheetSubmissionSuccessful = true;
                } else {
                    throw new Error(sheetResult.error || 'Failed to save to spreadsheet');
                }
            } catch (proxyError) {
                console.log('Proxy error, trying direct submission:', proxyError);
                
                // Fallback to direct submission
                try {
                    console.log('Attempting direct submission to Google Script');
                    const directResponse = await fetch('https://script.google.com/macros/s/AKfycbxk4H4ldwyfsSRk_g6rAp5FDRmqct2oMihQxrt_kpqMFhJmL6aOJ74a3HfgBQCXLPTIug/exec', {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData),
                        redirect: 'follow'
                    });
                    
                    console.log('Direct submission completed');
                    sheetSubmissionSuccessful = true;
                } catch (directError) {
                    console.error('Direct submission failed:', directError);
                    throw new Error('Failed to save to spreadsheet after both attempts');
                }
            }

            // Only proceed with email if sheet submission was successful
            if (sheetSubmissionSuccessful) {
                console.log('Sheet submission successful, proceeding with email');
                // Create FormData object for email
                const emailForm = new FormData();
                emailForm.append('access_key', 'f890e702-fef2-4b76-84bf-0e5bf3262032');
                emailForm.append('subject', `Electric Events Catering Quote - ${formData.contact.name} - Party of ${formData.partySize}`);
                emailForm.append('name', formData.contact.name);
                emailForm.append('email', formData.contact.email);
                emailForm.append('from_name', "Electric Events Catering");
                emailForm.append('replyto', "brad@electric-hospitality.com");
                emailForm.append('message', formatEmailMessage(formData));
                emailForm.append('ccemail', "michael@electric-hospitality.com; brad@electric-hospitality.com; Landon@electric-hospitality.com");
                emailForm.append('botcheck', '');
                emailForm.append('autoresponse', 'true');

                console.log('Sending email via Web3Forms');
                const emailResponse = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: emailForm
                });

                const result = await emailResponse.json();
                console.log('Email submission result:', result);
                
                if (result.success) {
                    clearSavedData();
                    showNotification('Quote request submitted successfully! We\'ll be in touch soon.', 'success');
                    console.log('Form submitted successfully! Redirecting to thank-you page');
                    window.location.href = 'thank-you.html';  // Re-enable the redirect
                } else {
                    throw new Error(result.message || 'Failed to submit quote request');
                }
            }
        }
    } catch (error) {
        console.error('Failed to send form:', error);
        showNotification('Failed to submit quote request. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitSpinner.classList.add('hidden');
        buttonText.textContent = 'Get Quote';
    }
}

// Update the showNotification function
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `validation fixed top-4 right-4 p-4 rounded-lg ${
        type === 'success' ? 'bg-green-900' : 'bg-red-900'
    } text-white max-w-md whitespace-pre-line z-[33333]`; // Added z-index
    notification.style.color = 'white !important'; // Force white text with !important
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 7000);
}

// Helper functions
function getPartySize() {
    const isExact = document.getElementById('exactSize').checked;
    if (isExact) {
        return document.getElementById('exactPartySize').value;
    }
    return `${document.getElementById('partySizeMin').value} - ${document.getElementById('partySizeMax').value}`;
}

function getOrderDetails() {
    const orders = [];
    document.querySelectorAll('.quantity-input').forEach(input => {
        const quantity = parseInt(input.value);
        if (quantity > 0) {
            orders.push({
                name: input.dataset.itemName,
                quantity: quantity,
                subtotal: input.closest('div.flex').querySelector('.subtotal').textContent
            });
        }
    });
    return orders;
}

// Add visual feedback for required fields
function addRequiredFieldsIndicators() {
    document.querySelectorAll('input[required]').forEach(input => {
        // Add red asterisk to required field labels
        const label = input.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.innerHTML += ' <span class="text-red-500">*</span>';
        }

        // Add validation styling
        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                input.classList.add('border-red-500');
            } else {
                input.classList.remove('border-red-500');
            }
        });
    });
}

// Update the initializeAutoSave function
function initializeAutoSave() {
    // Save on any input change immediately
    document.addEventListener('input', (e) => {
        saveFormProgress();
    });

    // Save on any change event
    document.addEventListener('change', (e) => {
        saveFormProgress();
    });
}

// Update the validateContactDetails function with the dynamic message
function validateContactDetails() {
    const requiredFields = [
        { id: 'contactName', label: 'Contact Name' },
        { id: 'contactEmail', label: 'Email Address' },
        { id: 'contactPhone', label: 'Phone Number' },
        { id: 'locationStreet', label: 'Street Address' },
        { id: 'locationCity', label: 'City' },
        { id: 'locationZip', label: 'ZIP Code' },
        { id: 'dropoffTime', label: 'Dropoff Time' }
    ];

    const missingFields = [];
    const invalidFields = [];

    // Calculate earliest possible date for the error message
    const currentDateTime = new Date();
    const earliestDateTime = new Date(currentDateTime.getTime() + (72 * 60 * 60 * 1000));
    const formattedDate = earliestDateTime.toLocaleDateString();
    const formattedTime = earliestDateTime.toLocaleTimeString();
    const earliestDateMessage = `⏰ Earliest possible dropoff: ${formattedDate} after ${formattedTime}`;

    // Check party size
    const isExact = document.getElementById('exactSize').checked;
    const exactSize = document.getElementById('exactPartySize').value;
    const minSize = document.getElementById('partySizeMin').value;
    const maxSize = document.getElementById('partySizeMax').value;

    if (isExact && !exactSize) {
        missingFields.push('Party Size');
    }
    if (!isExact && (!minSize || !maxSize)) {
        missingFields.push('Party Size Range');
    }

    // Validate each required field
    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        const value = element.value.trim();

        if (!value) {
            missingFields.push(field.label);
            element.classList.add('border-red-500');
            continue;
        }

        // Email validation
        if (field.id === 'contactEmail') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                invalidFields.push('Email Address (invalid format)');
                element.classList.add('border-red-500');
                continue;
            }
        }

        // Phone validation
        if (field.id === 'contactPhone') {
            const phoneRegex = /^[\d\s-()]+$/;
            if (!phoneRegex.test(value)) {
                invalidFields.push('Phone Number (invalid format)');
                element.classList.add('border-red-500');
                continue;
            }
        }

        // ZIP code validation
        if (field.id === 'locationZip') {
            const zipRegex = /^\d{5}(-\d{4})?$/;
            if (!zipRegex.test(value)) {
                invalidFields.push('ZIP Code (must be 5 digits)');
                element.classList.add('border-red-500');
                continue;
            }
        }

        element.classList.remove('border-red-500');
    }

    // Update the 72-hour requirement check with new message
    if (!validate72HourRequirement(false) && !invalidFields.includes(earliestDateMessage)) {
        invalidFields.push(earliestDateMessage);
    }

    if (missingFields.length > 0 || invalidFields.length > 0) {
        let errorMessage = '';
        
        if (missingFields.length > 0) {
            errorMessage += 'Required fields missing:\n• ' + missingFields.join('\n• ');
        }
        
        if (invalidFields.length > 0) {
            if (errorMessage) errorMessage += '\n\n';
            errorMessage += 'Invalid fields:\n• ' + invalidFields.join('\n• ');
        }

        showNotification(errorMessage, 'error');
        
        // Focus the first missing or invalid field
        const firstFieldId = missingFields.length > 0 ? 
            requiredFields.find(f => missingFields.includes(f.label))?.id :
            requiredFields.find(f => invalidFields.includes(f.label))?.id;
            
        if (firstFieldId) {
            document.getElementById(firstFieldId).focus();
        }

        return false;
    }

    return true;
} 