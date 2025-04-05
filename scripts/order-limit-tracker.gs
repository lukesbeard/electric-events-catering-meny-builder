/**
 * Google Apps Script to track order counts for Electric Events Family Meal orders
 * 
 * This script should be deployed as a web app with:
 * - Execute as: Me
 * - Who has access: Anyone (even anonymous)
 * 
 * Deploy the script and use the web app URL in the family-meal.html page
 */

// Spreadsheet ID where order counts will be tracked
const SPREADSHEET_ID = '1CjPzoq7gPhXCCqvMV-TBImJyS0TU2NXJlfBbuf3ixP8';
const COUNTS_SHEET_NAME = 'Daily Order Count'; // This sheet tracks the count of orders per day
const ORDERS_SHEET_NAME = 'Orders'; // This sheet stores the actual order details

/**
 * Main entry point for the web app
 * Handles GET and POST requests
 */
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

/**
 * Handles all requests to the web app
 * @param {Object} e - The request parameters
 * @return {TextOutput} JSON response
 */
function handleRequest(e) {
  try {
    // Set CORS headers
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Get the parameters
    const params = e.parameter;
    const action = params.action;
    const weekId = params.week;
    
    // Check if we have the required parameters
    if (!action) {
      return outputJSON({ success: false, error: 'Missing action parameter' });
    }
    
    if (!weekId && (action === 'check' || action === 'increment')) {
      return outputJSON({ success: false, error: 'Missing week parameter' });
    }
    
    // Handle the action
    let result;
    switch (action) {
      case 'check':
        result = checkOrderCount(weekId);
        break;
      case 'increment':
        result = incrementOrderCount(weekId);
        break;
      case 'submitOrder':
        // Extract order data from request parameters
        const orderData = {
          weekId: weekId,
          name: params.name || '',
          email: params.email || '',
          phone: params.phone || '',
          partySize: params.partySize || '',
          orderDetails: params.orderDetails || '',
          subtotal: params.subtotal || '',
          total: params.total || '',
          comments: params.comments || '',
          timestamp: new Date()
        };
        result = submitOrder(orderData);
        break;
      default:
        result = { success: false, error: 'Invalid action' };
    }
    
    return outputJSON(result);
  } catch (error) {
    return outputJSON({ success: false, error: error.toString() });
  }
}

/**
 * Outputs JSON response with CORS headers
 * @param {Object} data - The data to output as JSON
 * @return {TextOutput} JSON response
 */
function outputJSON(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Gets the count of orders for a specific week
 * @param {string} weekId - The ID of the week to check
 * @return {Object} Result with success flag and count
 */
function checkOrderCount(weekId) {
  try {
    const sheet = getOrCreateCountsSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === weekId) {
        // Found the week, return the count
        return { 
          success: true, 
          count: data[i][1],
          timestamp: data[i][2]
        };
      }
    }
    
    // Week not found, return 0
    return { success: true, count: 0 };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Increments the count of orders for a specific week
 * @param {string} weekId - The ID of the week to increment
 * @return {Object} Result with success flag
 */
function incrementOrderCount(weekId) {
  try {
    const sheet = getOrCreateCountsSheet();
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    
    // Check if the week already exists
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === weekId) {
        // Week exists, increment the count
        const currentCount = parseInt(data[i][1] || 0);
        sheet.getRange(i + 1, 2).setValue(currentCount + 1);
        sheet.getRange(i + 1, 3).setValue(now);
        
        return { 
          success: true, 
          count: currentCount + 1,
          timestamp: now
        };
      }
    }
    
    // Week doesn't exist, add it with count 1
    sheet.appendRow([weekId, 1, now]);
    
    return { 
      success: true, 
      count: 1,
      timestamp: now
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Submits a family meal order to the Orders sheet
 * @param {Object} orderData - The order data to submit
 * @return {Object} Result with success flag
 */
function submitOrder(orderData) {
  try {
    const sheet = getOrCreateOrdersSheet();
    const now = new Date();
    
    // Prepare the row data
    const rowData = [
      orderData.weekId,
      orderData.name,
      orderData.email,
      orderData.phone,
      orderData.partySize,
      orderData.orderDetails,
      orderData.subtotal,
      orderData.total,
      orderData.comments,
      now
    ];
    
    // Append the order data
    sheet.appendRow(rowData);
    
    return {
      success: true,
      timestamp: now,
      message: 'Order successfully submitted'
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Gets or creates the counts sheet
 * @return {Sheet} The counts sheet
 */
function getOrCreateCountsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(COUNTS_SHEET_NAME);
  
  if (!sheet) {
    // Create the sheet if it doesn't exist
    sheet = ss.insertSheet(COUNTS_SHEET_NAME);
    sheet.appendRow(['WeekId', 'Count', 'LastUpdated']);
    sheet.getRange('A1:C1').setFontWeight('bold');
  }
  
  return sheet;
}

/**
 * Gets or creates the orders sheet
 * @return {Sheet} The orders sheet
 */
function getOrCreateOrdersSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(ORDERS_SHEET_NAME);
  
  if (!sheet) {
    // Create the sheet if it doesn't exist
    sheet = ss.insertSheet(ORDERS_SHEET_NAME);
    sheet.appendRow([
      'WeekId', 
      'Customer Name', 
      'Email', 
      'Phone', 
      'Party Size', 
      'Order Details', 
      'Subtotal', 
      'Total', 
      'Comments', 
      'Timestamp'
    ]);
    sheet.getRange('A1:J1').setFontWeight('bold');
  }
  
  return sheet;
} 