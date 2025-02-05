// Google Sheets IDs and configuration
const SPREADSHEET_ID = '1AHaAHIYUStyGmZkEqNhFAp-qTwvCDhLkAkQATJSiZnk';
const API_KEY = 'AIzaSyAILUy99UCHJ6eV341T33UR4Hkj1JlCuNE';

const SHEETS = {
    mains: {
        name: 'Mains!A2:D14',  // Using actual sheet name "Mains"
        title: 'Mains'
    },
    sides: {
        name: 'Sides!A2:D10',  // Using actual sheet name "Sides"
        title: 'Sides'
    },
    deserts: {  // Fixed spelling
        name: 'Deserts!A2:D6',  // Using correct sheet name
        title: 'Deserts'  // Fixed spelling in title
    }
};

// Fetch data from Google Sheets
async function fetchSheetData(sheetConfig) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetConfig.name}?key=${API_KEY}`;
    
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
        showError(`Failed to load ${sheetConfig.title.toLowerCase()} menu items`);
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

// Error handling UI
function showError(message) {
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
        // Fetch all data concurrently
        const [mainsData, sidesData, desertsData] = await Promise.all([
            fetchSheetData(SHEETS.mains),
            fetchSheetData(SHEETS.sides),
            fetchSheetData(SHEETS.deserts)  // Match the key in SHEETS object
        ]);

        // Debug log to see the parsed data
        console.log('Parsed data:', { mainsData, sidesData, desertsData });

        // Update the menuData object
        window.menuData = {
            mains: mainsData,
            sides: sidesData,
            deserts: desertsData  // Match the key in SHEETS object
        };

        // Initialize tables with the fetched data
        initializeTable('mainsTable', mainsData);
        initializeTable('sidesTable', sidesData);
        initializeTable('desertsTable', desertsData);

        // Add event listeners to quantity inputs
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('input', () => updateSubtotal(input));
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
    const row = document.createElement('tr');
    const servingInfo = item.measurement || item.servingSuggestion;
    
    const input = `
        <input type="number" 
               inputmode="numeric" 
               pattern="[0-9]*"
               class="quantity-input" 
               min="0" 
               value="0" 
               data-price="${item.price}" 
               data-item-name="${item.name}"
               oninput="updateSubtotalAndSave(this)">
    `;
    
    row.innerHTML = `
        <td class="px-2 md:px-4 py-3">
            <div class="font-medium text-white">${item.name}</div>
            ${servingInfo ? 
                `<div class="text-xs text-gray-400 italic">${servingInfo}</div>` : 
                ''}
        </td>
        <td class="px-2 md:px-4 py-3 hidden md:table-cell text-sm text-gray-300">${item.description}</td>
        <td class="px-2 md:px-4 py-3 text-sm text-white">$${item.price.toFixed(2)}</td>
        <td class="px-2 md:px-4 py-3">${input}</td>
        <td class="px-2 md:px-4 py-3 subtotal font-medium text-white">$0.00</td>
    `;

    // Create description row for mobile with simpler styling
    if (item.description) {
        const descriptionRow = document.createElement('tr');
        descriptionRow.className = 'md:hidden';
        descriptionRow.innerHTML = `
            <td colspan="5" class="px-2 md:px-4 pb-3 pt-0 text-sm text-gray-300" 
                style="border-bottom: solid 1px rgba(255, 255, 255, 0.1); padding: 0 0 15px 0;">
                ${item.description}
            </td>
        `;
        return [row, descriptionRow];
    }

    return row;
}

function updateSubtotal(input) {
    const price = parseFloat(input.dataset.price);
    const quantity = parseInt(input.value) || 0;
    const subtotal = price * quantity;
    const subtotalCell = input.closest('tr').querySelector('.subtotal');
    subtotalCell.textContent = `$${subtotal.toFixed(2)}`;
    updateTotal();
}

function updateTotal() {
    const subtotals = Array.from(document.querySelectorAll('.subtotal'))
        .map(cell => parseFloat(cell.textContent.replace('$', '')) || 0);
    const total = subtotals.reduce((sum, value) => sum + value, 0);
    const totalPrice = document.getElementById('totalPrice');
    const submitButton = document.getElementById('submitButton');
    const stickyBar = document.querySelector('.sticky-bar');
    
    totalPrice.textContent = `$${total.toFixed(2)}`;
    
    // Handle button and sticky bar state
    if (total <= 0) {
        submitButton.disabled = true;
        submitButton.title = 'Add items to your quote to continue';
        stickyBar.classList.remove('visible');
    } else {
        submitButton.disabled = false;
        submitButton.removeAttribute('title');
        stickyBar.classList.add('visible');
    }
}

function initializeTable(tableId, items) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = ''; // Clear existing rows
    items.forEach(item => {
        const rows = createMenuRow(item);
        if (Array.isArray(rows)) {
            rows.forEach(row => tbody.appendChild(row));
        } else {
            tbody.appendChild(rows);
        }
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

// Initialize all event listeners
function initializeEventListeners() {
    initializePartySizeToggle();
    initializeGuestCount();
}

// Enhance the existing DOMContentLoaded handler
document.addEventListener('DOMContentLoaded', () => {
    initializeMenuTables();
    initializeEventListeners();
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

// Add this new validation function
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

// Add this new function to format the order details
function formatOrderDetails(orders) {
    return orders.map(item => 
        `   • ${item.name} - ${item.quantity} units - ${item.subtotal}`
    ).join('\n');
}

// Update the formatEmailMessage function to include a better intro
function formatEmailMessage(formData) {
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
Dropoff Time: ${formData.delivery.time}

Party Size: ${formData.partySize}

Quote Details
------------
${formatOrderDetails(formData.order)}

Total: ${formData.total}

${formData.comments ? `Additional Comments
------------------
${formData.comments}` : ''}

If you have any questions, please don't hesitate to reach out.

Best regards,
Ladybird Catering Team
`;
}

// Update the sendOrderEmail function to use the new formatting
async function sendOrderEmail(event) {
    event.preventDefault();
    
    if (!validateContactDetails()) {
        return;
    }

    const submitButton = document.getElementById('submitButton');
    const submitSpinner = document.getElementById('submitSpinner');
    const buttonText = submitButton.querySelector('span');

    try {
        // Show spinner and disable button
        submitButton.disabled = true;
        submitSpinner.classList.remove('hidden');
        buttonText.textContent = 'Sending...';

        // Get all form data
        const formData = {
            contact: {
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                phone: document.getElementById('contactPhone').value
            },
            delivery: {
                address: document.getElementById('locationStreet').value,
                city: document.getElementById('locationCity').value,
                zip: document.getElementById('locationZip').value,
                time: document.getElementById('dropoffTime').value
            },
            partySize: getPartySize(),
            order: getOrderDetails(),
            total: document.getElementById('totalPrice').textContent,
            comments: document.getElementById('comments').value
        };

        // Format the message
        const formattedMessage = formatEmailMessage(formData);

        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                access_key: 'f890e702-fef2-4b76-84bf-0e5bf3262032',
                subject: `Catering Quote Request - ${formData.contact.name} - Party of ${formData.partySize}`,
                name: formData.contact.name,
                email: formData.contact.email,
                cc: 'michael@electric-hospitality.com',
                message: formattedMessage
            })
        });

        const result = await response.json();
        
        if (result.success) {
            localStorage.removeItem('cateringFormData'); // Clear saved data after successful submission
            showNotification('Quote request submitted successfully! We\'ll be in touch soon.', 'success');
        } else {
            throw new Error(result.message || 'Failed to submit quote request');
        }
    } catch (error) {
        console.error('Failed to send email:', error);
        showNotification('Failed to submit quote request. Please try again.', 'error');
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitSpinner.classList.add('hidden');
        buttonText.textContent = 'Get Quote';
    }
}

// Add event listener for form submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('orderForm');
    form.addEventListener('submit', sendOrderEmail);
    
    // ... rest of your existing initialization code ...
});

// Add notification UI
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg ${
        type === 'success' ? 'bg-green-900' : 'bg-red-900'
    } text-white max-w-md whitespace-pre-line`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 7000); // Increased timeout for longer messages
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
                subtotal: input.closest('tr').querySelector('.subtotal').textContent
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

// Add new function to handle both subtotal update and saving
function updateSubtotalAndSave(input) {
    updateSubtotal(input);
    saveFormProgress();
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

// Update the restore function to ensure quantities are properly restored
function restoreFormProgress() {
    const savedData = localStorage.getItem('cateringFormData');
    if (!savedData) return;

    try {
        const formData = JSON.parse(savedData);

        // Restore contact and delivery info
        document.getElementById('contactName').value = formData.contact.name || '';
        document.getElementById('contactEmail').value = formData.contact.email || '';
        document.getElementById('contactPhone').value = formData.contact.phone || '';
        document.getElementById('locationStreet').value = formData.delivery.address || '';
        document.getElementById('locationCity').value = formData.delivery.city || '';
        document.getElementById('locationZip').value = formData.delivery.zip || '';
        document.getElementById('dropoffTime').value = formData.delivery.time || '';

        // Restore party size
        if (formData.partySize) {
            const isExact = formData.partySize.isExact;
            document.getElementById('exactSize').checked = isExact;
            document.getElementById('rangeSize').checked = !isExact;
            document.getElementById('exactPartySize').value = formData.partySize.exactSize || '';
            document.getElementById('exactPartySize').disabled = !isExact;
            document.getElementById('partySizeMin').value = formData.partySize.minSize || '';
            document.getElementById('partySizeMin').disabled = isExact;
            document.getElementById('partySizeMax').value = formData.partySize.maxSize || '';
            document.getElementById('partySizeMax').disabled = isExact;
        }

        // Restore comments
        document.getElementById('comments').value = formData.comments || '';

        // Update restore quantities with proper total calculations
        if (formData.quantities && formData.quantities.length > 0) {
            const restoreQuantities = () => {
                const inputs = document.querySelectorAll('.quantity-input');
                if (inputs.length === 0) return false;

                formData.quantities.forEach(item => {
                    const input = Array.from(inputs)
                        .find(input => input.dataset.itemName === item.itemName);
                    if (input) {
                        input.value = item.quantity;
                        updateSubtotal(input);
                    }
                });

                updateTotal();
                return true;
            };

            // Try to restore immediately
            if (!restoreQuantities()) {
                // If failed, wait for menu to load
                const observer = new MutationObserver((mutations, obs) => {
                    if (restoreQuantities()) {
                        obs.disconnect();
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        }
    } catch (error) {
        console.error('Error restoring form data:', error);
    }
}

// Update the saveFormProgress function to be more reliable
function saveFormProgress() {
    const formData = {
        quantities: Array.from(document.querySelectorAll('.quantity-input'))
            .map(input => ({
                itemName: input.dataset.itemName,
                quantity: input.value
            }))
            .filter(item => item.quantity > 0) // Only save non-zero quantities
    };

    // Only add other form data if the elements exist
    // Contact info
    if (document.getElementById('contactName')) {
        formData.contact = {
            name: document.getElementById('contactName')?.value || '',
            email: document.getElementById('contactEmail')?.value || '',
            phone: document.getElementById('contactPhone')?.value || ''
        };
    }

    // Delivery info
    if (document.getElementById('locationStreet')) {
        formData.delivery = {
            address: document.getElementById('locationStreet')?.value || '',
            city: document.getElementById('locationCity')?.value || '',
            zip: document.getElementById('locationZip')?.value || '',
            time: document.getElementById('dropoffTime')?.value || ''
        };
    }

    // Party size
    if (document.getElementById('exactSize')) {
        formData.partySize = {
            isExact: document.getElementById('exactSize')?.checked || false,
            exactSize: document.getElementById('exactPartySize')?.value || '',
            minSize: document.getElementById('partySizeMin')?.value || '',
            maxSize: document.getElementById('partySizeMax')?.value || ''
        };
    }

    // Comments
    if (document.getElementById('comments')) {
        formData.comments = document.getElementById('comments')?.value || '';
    }

    localStorage.setItem('cateringFormData', JSON.stringify(formData));
    console.log('Saved form data:', formData); // Debug log
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    initializeMenuTables();
    initializeEventListeners();
    addRequiredFieldsIndicators();
    initializeAutoSave();
    restoreFormProgress();
    
    const form = document.getElementById('orderForm');
    form.addEventListener('submit', sendOrderEmail);
}); 