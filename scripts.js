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
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4';
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
        const [mainsData, sidesData, dessertsData] = await Promise.all([
            fetchSheetData(SHEETS.mains),
            fetchSheetData(SHEETS.sides),
            fetchSheetData(SHEETS.deserts)
        ]);

        // Debug log to see the parsed data
        console.log('Parsed data:', { mainsData, sidesData, dessertsData });

        // Update the menuData object
        window.menuData = {
            mains: mainsData,
            sides: sidesData,
            desserts: dessertsData
        };

        // Initialize tables with the fetched data
        initializeTable('mainsTable', mainsData);
        initializeTable('sidesTable', sidesData);
        initializeTable('desertsTable', dessertsData);

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
    
    row.innerHTML = `
        <td class="px-4 py-3">
            <div class="font-medium text-gray-900">${item.name}</div>
            ${servingInfo ? 
                `<div class="text-xs text-gray-500 italic">${servingInfo}</div>` : 
                ''}
        </td>
        <td class="px-4 py-3 item-description text-sm text-gray-500">${item.description}</td>
        <td class="px-4 py-3 text-sm">$${item.price.toFixed(2)}</td>
        <td class="px-4 py-3">
            <input type="number" class="quantity-input" min="0" value="0" 
                   data-price="${item.price}" data-item-name="${item.name}">
        </td>
        <td class="px-4 py-3 subtotal font-medium">$0.00</td>
    `;
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
    document.getElementById('totalPrice').textContent = `$${total.toFixed(2)}`;
}

function initializeTable(tableId, items) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = ''; // Clear existing rows
    items.forEach(item => {
        const row = createMenuRow(item);
        tbody.appendChild(row);
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
    spinner.className = 'loading-spinner absolute inset-0 flex items-center justify-center bg-white bg-opacity-75';
    spinner.innerHTML = `
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    `;
    table.parentNode.style.position = 'relative';
    table.parentNode.appendChild(spinner);
    return spinner;
} 