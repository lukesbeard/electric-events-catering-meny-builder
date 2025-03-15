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
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded, initializing application...');
    initializeMenuTables();
    initializeEventListeners();
    addRequiredFieldsIndicators();
    initializeAutoSave();
    restoreFormProgress();
    initializeTestButton();
    
    // Debug test buttons after a short delay to ensure DOM is fully processed
    setTimeout(debugTestButtons, 1000);
    
    // Remove duplicate event listener and ensure only one exists
    const form = document.getElementById('orderForm');
    console.log('Form element found:', !!form);
    
    if (!form) {
        console.error('Order form not found in the DOM!');
        return;
    }
    
    // Remove any existing event listeners (not directly possible, but we can replace the element)
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    console.log('Form element cloned to remove existing listeners');
    
    // Add the event listener to the new form
    newForm.addEventListener('submit', function(event) {
        console.log('Form submit event triggered!', event);
        event.preventDefault();
        console.log('Form submitted, processing...');
        sendOrderEmail(event);
    });
    
    console.log('Current config:', getCurrentConfig().id);
    console.log('Form submission handler attached to form:', newForm.id);
    
    // Add a global click handler to debug all clicks
    document.addEventListener('click', function(event) {
        console.log('Click detected on:', event.target.tagName, 
                   'ID:', event.target.id, 
                   'Class:', event.target.className);
    });
});

// Debug function to check test button visibility
function debugTestButtons() {
    console.log('Debugging test buttons...');
    
    const testButtonsContainer = document.getElementById('testButtonsContainer');
    const testOrderButton = document.getElementById('testOrderButton');
    const testSubmitButton = document.getElementById('testSubmitButton');
    
    if (!testButtonsContainer) {
        console.error('Test buttons container not found!');
        return;
    }
    
    // Check if we're on localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    console.log('Is localhost:', isLocalhost);
    
    // Get computed styles
    const containerStyle = window.getComputedStyle(testButtonsContainer);
    console.log('Test buttons container display:', containerStyle.display);
    console.log('Test buttons container visibility:', containerStyle.visibility);
    
    if (testOrderButton) {
        console.log('Test order button exists');
        console.log('Test order button display:', window.getComputedStyle(testOrderButton).display);
        
        // Force visibility if on localhost
        if (isLocalhost && containerStyle.display === 'none') {
            console.log('Forcing test buttons container to be visible');
            testButtonsContainer.style.display = 'flex';
            
            // Check again after forcing display
            setTimeout(() => {
                console.log('After forcing display:', window.getComputedStyle(testButtonsContainer).display);
            }, 100);
        }
    } else {
        console.error('Test order button not found!');
    }
    
    if (testSubmitButton) {
        console.log('Test submit button exists');
        console.log('Test submit button display:', window.getComputedStyle(testSubmitButton).display);
    } else {
        console.error('Test submit button not found!');
    }
}

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
    const dropoffDateElement = document.getElementById('dropoffDate');
    const dropoffTimeElement = document.getElementById('dropoffTime');
    
    if (!dropoffDateElement || !dropoffTimeElement) {
        console.warn('Dropoff date or time elements not found');
        return true; // Skip validation if elements don't exist
    }
    
    const dropoffDate = dropoffDateElement.value;
    const dropoffTime = dropoffTimeElement.value;
    
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
                dropoffDateElement,
                dropoffTimeElement
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
                dropoffDateElement.value = earliestDateTime.toISOString().split('T')[0];
            }
            
            return false;
        } else {
            // Remove error styling if date is valid
            const dateTimeFields = [
                dropoffDateElement,
                dropoffTimeElement
            ];
            dateTimeFields.forEach(field => field.classList.remove('border-red-500'));
            return true;
        }
    }
    return true;
}

// Initialize test button for localhost testing
function initializeTestButton() {
    console.log('Initializing test buttons...');
    
    const testButtonsContainer = document.getElementById('testButtonsContainer');
    const testOrderButton = document.getElementById('testOrderButton');
    const testSubmitButton = document.getElementById('testSubmitButton');
    
    console.log('Test buttons found:', {
        container: !!testButtonsContainer,
        orderButton: !!testOrderButton,
        submitButton: !!testSubmitButton
    });
    
    if (!testButtonsContainer || !testOrderButton || !testSubmitButton) {
        console.warn('Some test buttons not found in the DOM');
        return;
    }
    
    // Only show the test buttons on localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    console.log('Is localhost:', isLocalhost, 'Hostname:', window.location.hostname);
    
    if (isLocalhost) {
        console.log('Showing test buttons and attaching event handlers');
        testButtonsContainer.style.display = 'flex';
        
        // Add click handler for filling test data
        testOrderButton.addEventListener('click', function(event) {
            console.log('Test Order button clicked!');
            fillTestOrder();
        });
        
        // Add click handler for test submission
        testSubmitButton.addEventListener('click', function(event) {
            console.log('Test Submit button clicked!');
            // First fill the form with test data if it's not already filled
            if (!document.getElementById('contactName').value) {
                console.log('Form not filled, filling with test data first');
                fillTestOrder();
                
                // Wait a bit for the test data to be filled and menu items to be added
                setTimeout(() => {
                    console.log('Timeout completed, now submitting to Google Sheet');
                    testSubmitToGoogleSheet();
                }, 2000);
            } else {
                console.log('Form already filled, submitting directly');
                testSubmitToGoogleSheet();
            }
        });
        
        // Add visual feedback on hover
        testOrderButton.addEventListener('mouseover', function() {
            console.log('Test Order button hover');
            this.style.opacity = '0.8';
        });
        
        testOrderButton.addEventListener('mouseout', function() {
            this.style.opacity = '1';
        });
        
        testSubmitButton.addEventListener('mouseover', function() {
            console.log('Test Submit button hover');
            this.style.opacity = '0.8';
        });
        
        testSubmitButton.addEventListener('mouseout', function() {
            this.style.opacity = '1';
        });
        
        console.log('Test buttons initialized successfully');
    } else {
        console.log('Not localhost, hiding test buttons');
        testButtonsContainer.style.display = 'none';
    }
}

// Function to test submission to Google Sheet
function testSubmitToGoogleSheet() {
    console.log('testSubmitToGoogleSheet function called');
    
    try {
        // Add forcesubmit=true to the URL
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('forcesubmit', 'true');
        window.history.replaceState({}, '', currentUrl.toString());
        
        console.log('Test submitting to Google Sheet with URL parameter forcesubmit=true');
        showNotification('Submitting test data to Google Sheet...', 'success');
        
        // Get the form and prepare for submission
        const form = document.getElementById('orderForm');
        if (!form) {
            console.error('Form not found');
            showNotification('Error: Form not found', 'error');
            return;
        }
        
        console.log('Form found, preparing to submit');
        
        // Make sure we have at least one item in the order
        const hasItems = Array.from(document.querySelectorAll('.quantity-input'))
            .some(input => parseInt(input.value) > 0);
            
        if (!hasItems) {
            console.warn('No items in order, adding some automatically');
            // Add at least one item if none are selected
            const quantityInputs = document.querySelectorAll('.quantity-input');
            if (quantityInputs.length > 0) {
                const randomIndex = Math.floor(Math.random() * quantityInputs.length);
                const input = quantityInputs[randomIndex];
                input.value = 2;
                updateSubtotal(input);
                console.log('Added item:', input.dataset.itemName, 'with quantity 2');
            }
        }
        
        // Validate the form before submission
        if (!validateContactDetails()) {
            console.error('Form validation failed');
            showNotification('Please fill in all required fields before submitting', 'error');
            return;
        }
        
        console.log('Form validation passed, dispatching submit event');
        
        // Create and dispatch a submit event
        const submitEvent = new Event('submit', {
            bubbles: true,
            cancelable: true
        });
        
        // Directly call sendOrderEmail instead of relying on event dispatch
        // This ensures we bypass any potential event handling issues
        sendOrderEmail(submitEvent);
        
        console.log('Test submission initiated');
        
        // Check submission status after a delay
        setTimeout(checkTestSubmissionStatus, 5000);
    } catch (error) {
        console.error('Error in testSubmitToGoogleSheet:', error);
        showNotification('Error submitting test data: ' + error.message, 'error');
    }
}

// Function to check if the test submission was successful
function checkTestSubmissionStatus() {
    console.log('Checking test submission status...');
    
    try {
        // Make a GET request to the Google Script to check if the test data was received
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbxk4H4ldwyfsSRk_g6rAp5FDRmqct2oMihQxrt_kpqMFhJmL6aOJ74a3HfgBQCXLPTIug/exec?checkTestSubmission=true';
        
        // We can't actually read the response due to CORS, but we can log that we tried
        console.log('Attempted to check submission status at:', scriptUrl);
        console.log('Note: Due to CORS restrictions, we cannot directly verify if the submission was successful');
        console.log('Check the Google Sheet directly to confirm the test data was received');
        
        // Show a notification with instructions
        showNotification('Test submission completed. Please check the Google Sheet to verify the data was received.', 'success');
    } catch (error) {
        console.error('Error checking test submission status:', error);
    }
}

// Fill the form with test data
function fillTestOrder() {
    console.log('fillTestOrder function called');
    
    try {
        // Fill contact information
        const contactName = document.getElementById('contactName');
        if (contactName) {
            contactName.value = 'Test Customer';
            console.log('Set contact name to:', contactName.value);
        } else {
            console.warn('contactName element not found');
        }
        
        const contactEmail = document.getElementById('contactEmail');
        if (contactEmail) {
            contactEmail.value = 'test@example.com';
            console.log('Set contact email to:', contactEmail.value);
        } else {
            console.warn('contactEmail element not found');
        }
        
        const contactPhone = document.getElementById('contactPhone');
        if (contactPhone) {
            contactPhone.value = '555-123-4567';
            console.log('Set contact phone to:', contactPhone.value);
        } else {
            console.warn('contactPhone element not found');
        }
        
        // Fill location field
        const locationField = document.getElementById('locationField');
        if (locationField) {
            locationField.value = 'Major Field';
            console.log('Set location field to:', locationField.value);
        } else {
            console.warn('locationField element not found');
        }
        
        // Set party size
        const exactSizeRadio = document.getElementById('exactSize');
        const exactPartySize = document.getElementById('exactPartySize');
        if (exactSizeRadio && exactPartySize) {
            exactSizeRadio.checked = true;
            exactPartySize.value = '50';
            console.log('Set party size to exact:', exactPartySize.value);
            
            // Disable range inputs
            const partySizeMin = document.getElementById('partySizeMin');
            const partySizeMax = document.getElementById('partySizeMax');
            if (partySizeMin) partySizeMin.disabled = true;
            if (partySizeMax) partySizeMax.disabled = true;
        } else {
            console.warn('Party size elements not found:', {
                exactSizeRadio: !!exactSizeRadio,
                exactPartySize: !!exactPartySize
            });
        }
        
        // Set date and time (3 days from now at 2:00 PM)
        const currentDate = new Date();
        const testDate = new Date(currentDate);
        testDate.setDate(currentDate.getDate() + 3);
        
        const dateField = document.getElementById('dropoffDate');
        if (dateField) {
            const formattedDate = testDate.toISOString().split('T')[0];
            dateField.value = formattedDate;
            console.log('Set date field to:', dateField.value);
        } else {
            console.warn('dropoffDate element not found');
        }
        
        const timeField = document.getElementById('dropoffTime');
        if (timeField) {
            timeField.value = '14:00';
            console.log('Set time field to:', timeField.value);
        } else {
            console.warn('dropoffTime element not found');
        }
        
        // Add comments
        const commentsField = document.getElementById('comments');
        if (commentsField) {
            commentsField.value = 'This is a test order generated automatically for development purposes.';
            console.log('Set comments field');
        } else {
            console.warn('comments element not found');
        }
        
        console.log('Basic form fields filled, now adding menu items...');
        
        // Add some menu items (wait for menu to load)
        setTimeout(() => {
            try {
                // Get all quantity inputs
                const quantityInputs = document.querySelectorAll('.quantity-input');
                console.log('Found quantity inputs:', quantityInputs.length);
                
                if (quantityInputs.length > 0) {
                    // Add random quantities to some items
                    const itemCount = Math.min(quantityInputs.length, 5); // Add up to 5 items
                    console.log('Adding quantities to', itemCount, 'items');
                    
                    for (let i = 0; i < itemCount; i++) {
                        const randomIndex = Math.floor(Math.random() * quantityInputs.length);
                        const input = quantityInputs[randomIndex];
                        
                        // Set a random quantity between 1 and 5
                        const quantity = Math.floor(Math.random() * 5) + 1;
                        input.value = quantity;
                        console.log('Set item quantity:', input.dataset.itemName, 'to', quantity);
                        
                        // Update subtotal
                        updateSubtotal(input);
                    }
                    
                    // Update total
                    updateTotal();
                    
                    console.log('Test order filled successfully!');
                    showNotification('Test order data filled successfully!', 'success');
                } else {
                    console.warn('No menu items found to add to test order');
                    showNotification('Could not find menu items to add to test order', 'error');
                }
            } catch (error) {
                console.error('Error filling menu items:', error);
                showNotification('Error filling menu items: ' + error.message, 'error');
            }
        }, 1500); // Wait for menu to load
    } catch (error) {
        console.error('Error in fillTestOrder:', error);
        showNotification('Error filling test order: ' + error.message, 'error');
    }
}

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

    // Determine if this is a Dug Out order
    const isDugOutOrder = formData.source === 'The Dug-Out';

    // Format the location display based on the source
    let locationDisplay = '';
    if (isDugOutOrder) {
        locationDisplay = `Drop Off Location: ${formData.delivery.location}`;
    } else {
        locationDisplay = `Location: ${formData.delivery.location}`;
    }

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
${locationDisplay}
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

    // Get location field value
    const locationField = document.getElementById('locationField');
    
    const data = {
        quantities: quantities,
        timestamp: new Date().getTime(),
        contact: {
            name: document.getElementById('contactName')?.value || '',
            email: document.getElementById('contactEmail')?.value || '',
            phone: document.getElementById('contactPhone')?.value || ''
        },
        delivery: {
            location: locationField?.value || '',
            date: document.getElementById('dropoffDate')?.value || '',
            time: document.getElementById('dropoffTime')?.value || ''
        }
    };

    saveToLocalStorage(data);
}

// Update restoreFormProgress to handle date and time
function restoreFormProgress() {
    const savedData = getFromLocalStorage();
    if (!savedData) return;

    // Restore contact info if it exists
    if (savedData.contact) {
        const contactFields = [
            { id: 'contactName', value: savedData.contact.name },
            { id: 'contactEmail', value: savedData.contact.email },
            { id: 'contactPhone', value: savedData.contact.phone }
        ];
        
        contactFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element && field.value) {
                element.value = field.value;
            }
        });
    }
    
    // Restore delivery info if it exists
    if (savedData.delivery) {
        // Restore location if it exists
        const locationField = document.getElementById('locationField');
        if (locationField && savedData.delivery.location) {
            locationField.value = savedData.delivery.location;
        }
        
        // Restore date and time
        if (savedData.delivery.date) {
            const dateField = document.getElementById('dropoffDate');
            if (dateField) {
                dateField.value = savedData.delivery.date;
            }
        }
        
        if (savedData.delivery.time) {
            const timeField = document.getElementById('dropoffTime');
            if (timeField) {
                timeField.value = savedData.delivery.time;
            }
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

        // Determine if we're on the Dug Out page
        const isDugOutPage = document.body.classList.contains('dugout-menu') || window.location.pathname.includes('the-dug-out-catering');
        console.log('Is Dug Out page:', isDugOutPage);
        
        // Get location field value
        const locationValue = document.getElementById('locationField')?.value || '';
        console.log('Location field value:', locationValue);
        
        // Get all form data
        const formData = {
            source: document.body.classList.contains('muchacho-menu') ? 'Muchacho' : 
                   (document.body.classList.contains('dugout-menu') ? 'The Dug-Out' : 'Ladybird'),
            contact: {
                name: document.getElementById('contactName')?.value || '',
                email: document.getElementById('contactEmail')?.value || '',
                phone: document.getElementById('contactPhone')?.value || ''
            },
            delivery: {
                // Include all fields for all venues to ensure compatibility
                location: locationValue || document.getElementById('locationStreet')?.value || '',
                // Correctly use the street address field for address
                address: document.getElementById('locationStreet')?.value || '',
                city: isDugOutPage ? "Atlanta" : document.getElementById('locationCity')?.value || '',
                zip: isDugOutPage ? "30309" : document.getElementById('locationZip')?.value || '',
                date: document.getElementById('dropoffDate')?.value || '',
                time: document.getElementById('dropoffTime')?.value || ''
            },
            partySize: getPartySize(),
            order: getOrderDetails(),
            subtotal: document.getElementById('subtotalPrice')?.textContent.split(' + ')[0] || '$0.00',
            total: document.getElementById('totalPriceWithTax')?.textContent || '$0.00',
            comments: document.getElementById('comments')?.value || '',
            isTest: true // Flag to indicate this is a test submission
        };
        
        console.log('Form data prepared:', formData);
        console.log('Delivery details:', {
            location: formData.delivery.location,
            address: formData.delivery.address,
            city: formData.delivery.city,
            zip: formData.delivery.zip
        });

        // Check if we're in development
        const forceDevMode = new URLSearchParams(window.location.search).get('devmode') === 'true';
        const isDevelopment = forceDevMode || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const forceSubmit = new URLSearchParams(window.location.search).get('forcesubmit') === 'true';
        
        console.log('Environment:', isDevelopment ? 'Development' : 'Production');
        console.log('Force submit:', forceSubmit ? 'Yes' : 'No');

        if (isDevelopment && !forceSubmit) {
            // Development code...
            console.log('Development mode - skipping actual submission');
            console.log('%c FORM DATA THAT WOULD BE SENT:', 'background: #333; color: #bada55; font-size: 16px;');
            console.table({
                'Source': formData.source,
                'Contact Name': formData.contact.name,
                'Contact Email': formData.contact.email,
                'Contact Phone': formData.contact.phone
            });
            console.table({
                'Location': formData.delivery.location,
                'Address': formData.delivery.address,
                'City': formData.delivery.city,
                'ZIP': formData.delivery.zip,
                'Date': formData.delivery.date,
                'Time': formData.delivery.time
            });
            console.log('Party Size:', formData.partySize);
            console.log('Order Details:', formData.order);
            console.log('Subtotal:', formData.subtotal);
            console.log('Total:', formData.total);
            console.log('Comments:', formData.comments);
            
            // Show a success notification for testing
            showNotification('TEST MODE: Form data logged to console. Submission would be successful in production.', 'success');
            sheetSubmissionSuccessful = true;
            
            // Attempt to send to Tripleseat in test mode
            if (typeof sendToTripleseat === 'function') {
                console.log('Attempting to send to Tripleseat in test mode');
                
                try {
                    const tripleseatResult = await sendToTripleseat(formData);
                    console.log('Tripleseat test result:', tripleseatResult);
                    
                    if (tripleseatResult.success) {
                        showNotification('TEST MODE: Successfully sent to Tripleseat!', 'success');
                    } else {
                        console.warn('Tripleseat submission failed:', tripleseatResult.error);
                        // Use user-friendly message if available, even in test mode
                        const errorMsg = tripleseatResult.userMessage || tripleseatResult.error || 'Unknown error';
                        showNotification('TEST MODE: Tripleseat submission failed: ' + errorMsg, 'error');
                    }
                } catch (tripleseatError) {
                    console.error('Error sending to Tripleseat:', tripleseatError);
                    showNotification('TEST MODE: Error sending to Tripleseat: ' + (tripleseatError.userMessage || tripleseatError.message), 'error');
                }
            } else {
                console.warn('Tripleseat integration not available');
            }
        } else {
            // Production mode or forced submission from localhost
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
                    
                    // Add test flag to URL for test submissions
                    let scriptUrl = 'https://script.google.com/macros/s/AKfycbxk4H4ldwyfsSRk_g6rAp5FDRmqct2oMihQxrt_kpqMFhJmL6aOJ74a3HfgBQCXLPTIug/exec';
                    if (isDevelopment && forceSubmit) {
                        scriptUrl += '?test=true';
                        console.log('Adding test flag to script URL');
                    }
                    
                    const directResponse = await fetch(scriptUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData),
                        redirect: 'follow'
                    });
                    
                    console.log('Direct submission completed');
                    console.log('Response status:', directResponse.status);
                    console.log('Response type:', directResponse.type);
                    
                    // Since no-cors mode doesn't allow reading the response,
                    // we'll assume success if we get here without an error
                    sheetSubmissionSuccessful = true;
                    
                    // Add a delay to ensure the submission has time to process
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (directError) {
                    console.error('Direct submission failed:', directError);
                    throw new Error('Failed to save to spreadsheet after both attempts');
                }
            }

            // Only proceed with email if sheet submission was successful
            if (sheetSubmissionSuccessful) {
                // If we're in development mode but forced submission, show a success message without sending email
                if (isDevelopment && forceSubmit) {
                    console.log('Sheet submission successful in test mode with forcesubmit=true');
                    showNotification('TEST MODE: Successfully submitted to Google Sheet! Email sending skipped.', 'success');
                    
                    // Attempt to send to Tripleseat in test mode
                    if (typeof sendToTripleseat === 'function') {
                        console.log('Attempting to send to Tripleseat in test mode');
                        
                        try {
                            const tripleseatResult = await sendToTripleseat(formData);
                            console.log('Tripleseat test result:', tripleseatResult);
                            
                            if (tripleseatResult.success) {
                                console.log('Successfully sent to Tripleseat:', tripleseatResult);
                                tripleseatSuccess = true;
                            } else {
                                console.warn('Failed to send to Tripleseat:', tripleseatResult.error);
                                // Log the error but don't block the successful form submission flow
                                // If we have a user-friendly message, log it but don't show it since form submission was successful
                                if (tripleseatResult.userMessage) {
                                    console.log('User message for Tripleseat error:', tripleseatResult.userMessage);
                                }
                            }
                        } catch (tripleseatError) {
                            console.error('Error sending to Tripleseat:', tripleseatError);
                            // Log the error but don't block the successful form submission flow
                        }
                    } else {
                        console.warn('Tripleseat integration not available');
                    }
                } else {
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
                    emailForm.append('ccemail', "michael@electric-hospitality.com;joe@electric-hospitality.com; brad@electric-hospitality.com; Landon@electric-hospitality.com");
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
                        // Attempt to send to Tripleseat after email success
                        let tripleseatSuccess = false;
                        
                        if (typeof sendToTripleseat === 'function') {
                            try {
                                console.log('Sending to Tripleseat in production mode');
                                const tripleseatResult = await sendToTripleseat(formData);
                                
                                if (tripleseatResult.success) {
                                    console.log('Successfully sent to Tripleseat:', tripleseatResult);
                                    tripleseatSuccess = true;
                                } else {
                                    console.warn('Failed to send to Tripleseat:', tripleseatResult.error);
                                    // Log the error but don't block the successful form submission flow
                                    // If we have a user-friendly message, log it but don't show it since form submission was successful
                                    if (tripleseatResult.userMessage) {
                                        console.log('User message for Tripleseat error:', tripleseatResult.userMessage);
                                    }
                                }
                            } catch (tripleseatError) {
                                console.error('Error sending to Tripleseat:', tripleseatError);
                                // Log the error but don't block the successful form submission flow
                            }
                        } else {
                            console.warn('Tripleseat integration not available');
                        }
                        
                        clearSavedData();
                        
                        // Show success message with Tripleseat status
                        const tripleseatMsg = tripleseatSuccess ? ' Lead also created in Tripleseat.' : '';
                        showNotification('Quote request submitted successfully!' + tripleseatMsg + ' We\'ll be in touch soon.', 'success');
                        
                        console.log('Form submitted successfully! Redirecting to thank-you page');
                        window.location.href = 'thank-you.html';  // Re-enable the redirect
                    } else {
                        throw new Error(result.message || 'Failed to submit quote request');
                    }
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
    // Check if we're in development mode
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Format production messages to be more user-friendly
    let displayMessage = message;
    if (!isDevelopment) {
        // Filter out development-specific messages in production
        if (message.includes('TEST MODE:')) {
            // Don't show test mode messages in production
            return;
        }
        
        // Make error messages more user-friendly in production
        if (type === 'error') {
            // Replace technical error messages with user-friendly ones
            if (message.includes('Failed to submit quote request')) {
                displayMessage = 'We couldn\'t process your request right now. Please try again or contact us directly for assistance.';
            } else if (message.includes('HTTP error') || message.includes('network') || message.includes('fetch')) {
                displayMessage = 'We\'re having trouble connecting to our booking system. Please check your internet connection and try again.';
            } else if (message.includes('Tripleseat')) {
                displayMessage = 'We couldn\'t create your booking at this time. Your quote information has been saved, and our team will follow up with you.';
            }
        }
        
        // Make success messages more engaging in production
        if (type === 'success') {
            if (message.includes('Quote request submitted successfully')) {
                displayMessage = '🎉 Your catering request has been submitted! We\'ll be in touch soon to confirm details.';
            }
        }
    }
    
    // Create and style the notification
    const notification = document.createElement('div');
    
    // Add icons and better styling based on the message type
    const iconHtml = type === 'success' 
        ? '<svg class="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
        : '<svg class="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
    
    notification.className = `validation fixed top-4 right-4 p-4 rounded-lg ${
        type === 'success' ? 'bg-green-800' : 'bg-red-800'
    } text-white max-w-md whitespace-pre-line z-[33333] shadow-lg flex items-start`;
    
    notification.style.color = 'white !important'; // Force white text with !important
    notification.innerHTML = `
        ${iconHtml}
        <div class="flex-1">${displayMessage}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Add a subtle animation
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.style.transition = 'opacity 0.3s, transform 0.3s';
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Auto dismiss after appropriate time based on message length
    const displayTime = Math.max(4000, displayMessage.length * 50); // Longer messages stay longer
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, displayTime);
}

// Helper functions
function getPartySize() {
    const exactSizeElement = document.getElementById('exactSize');
    const exactPartySizeElement = document.getElementById('exactPartySize');
    const partySizeMinElement = document.getElementById('partySizeMin');
    const partySizeMaxElement = document.getElementById('partySizeMax');
    
    if (!exactSizeElement) {
        console.warn('Party size radio button not found');
        return 'Unknown';
    }
    
    const isExact = exactSizeElement.checked;
    
    if (isExact) {
        if (!exactPartySizeElement) {
            console.warn('Exact party size input not found');
            return 'Unknown';
        }
        return exactPartySizeElement.value || 'Not specified';
    }
    
    if (!partySizeMinElement || !partySizeMaxElement) {
        console.warn('Party size range inputs not found');
        return 'Unknown';
    }
    
    return `${partySizeMinElement.value || 'Min'} - ${partySizeMaxElement.value || 'Max'}`;
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
    // Determine if we're on the Dug Out page
    const isDugOutPage = document.body.classList.contains('dugout-menu') || window.location.pathname.includes('the-dug-out-catering');
    
    const requiredFields = [
        { id: 'contactName', label: 'Contact Name' },
        { id: 'contactEmail', label: 'Email Address' },
        { id: 'contactPhone', label: 'Phone Number' },
        { id: 'locationField', label: isDugOutPage ? 'Drop Off Location' : 'Event Location' },
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
    const exactSizeElement = document.getElementById('exactSize');
    const exactPartySizeElement = document.getElementById('exactPartySize');
    const partySizeMinElement = document.getElementById('partySizeMin');
    const partySizeMaxElement = document.getElementById('partySizeMax');
    
    if (exactSizeElement && exactPartySizeElement) {
        const isExact = exactSizeElement.checked;
        const exactSize = exactPartySizeElement.value;
        
        if (isExact && !exactSize) {
            missingFields.push('Party Size');
        }
    }
    
    if (exactSizeElement && partySizeMinElement && partySizeMaxElement) {
        const isExact = exactSizeElement.checked;
        const minSize = partySizeMinElement.value;
        const maxSize = partySizeMaxElement.value;
        
        if (!isExact && (!minSize || !maxSize)) {
            missingFields.push('Party Size Range');
        }
    }

    // Validate each required field
    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element) {
            console.warn(`Field ${field.id} not found in the form`);
            continue;
        }
        
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