// Verify sheet ID matches exactly
const SHEET_ID = '19_RFERZ2gDdwejHoar5-vRsyRHI3vj3tQUobc7qjNb4';

function doPost(e) {
  // Add detailed logging
  console.log('Starting doPost execution');
  console.log('Received POST request:', e.postData.contents);
  
  const headers = {
    'Access-Control-Allow-Origin': '*', // Change back to * for testing
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };

  try {
    // Log request details
    console.log('Request method:', e.method);
    console.log('Request headers:', e.headers);
    console.log('Content type:', e.postData.type);
    
    let data;
    try {
      // Handle both JSON and form-encoded data
      if (e.postData.type === "application/x-www-form-urlencoded") {
        console.log('Processing form data');
        const formData = e.parameter;
        data = Object.keys(formData).reduce((acc, key) => {
          try {
            acc[key] = JSON.parse(formData[key]);
          } catch (e) {
            acc[key] = formData[key];
          }
          return acc;
        }, {});
      } else {
        console.log('Processing JSON data');
        data = JSON.parse(e.postData.contents);
      }
      console.log('Parsed data:', data);
    } catch (parseError) {
      console.error('Error parsing request data:', parseError);
      throw new Error('Invalid data format');
    }

    // Verify spreadsheet access
    console.log('Opening spreadsheet with ID:', SHEET_ID);
    const sheet = SpreadsheetApp.openById(SHEET_ID);
    if (!sheet) {
      throw new Error('Could not open spreadsheet');
    }
    
    console.log('Getting Sheet1');
    const activeSheet = sheet.getSheetByName('Sheet1');
    if (!activeSheet) {
      throw new Error('Could not find Sheet1');
    }

    // Format and log the row data
    const rowData = [
      'New',                // Column A: Status
      data.source,         // Column B: Source (Ladybird or Muchacho)
      data.total.replace('$', ''), // Column C: Order Value
      data.contact.name,   // Column D: Contact Name
      data.comments,       // Column E: Additional Comments
      data.contact.email,  // Column F: Email Address
      data.contact.phone,  // Column G: Phone Number
      `${data.delivery.address}, ${data.delivery.city}, ${data.delivery.zip}`, // Column H: Delivery Address
      data.delivery.date,  // Column I: Event Date
      data.delivery.time,  // Column J: Drop Off Time
      data.partySize,     // Column K: Party Size
      formatOrderDetails(data.order) // Column L: Order Details
    ];

    console.log('Row data to insert:', rowData);
    
    // Insert the row and verify
    try {
      console.log('Inserting row after header');
      activeSheet.insertRowAfter(1);
      const range = activeSheet.getRange(2, 1, 1, rowData.length);
      console.log('Setting values in range:', range.getA1Notation());
      range.setValues([rowData]);
      console.log('Row inserted successfully');
    } catch (writeError) {
      console.error('Error writing to sheet:', writeError);
      throw writeError;
    }

    console.log('Sending success response');
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true,
      message: 'Data written successfully',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);

  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
  }
}

function formatOrderDetails(orders) {
  return orders.map(item => 
    `${item.name} (${item.quantity}x) - ${item.subtotal}`
  ).join('\n');
}

function doOptions(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Match the main handler's setting
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
  
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(headers);
} 