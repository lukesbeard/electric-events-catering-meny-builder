// Verify sheet ID matches exactly
const SHEET_ID = '19_RFERZ2gDdwejHoar5-vRsyRHI3vj3tQUobc7qjNb4';

function doPost(e) {
  // Add logging to debug
  console.log('Received POST request:', e.postData.contents);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID);
    if (!sheet) {
      throw new Error('Could not open spreadsheet');
    }
    
    const activeSheet = sheet.getSheetByName('Sheet1');
    if (!activeSheet) {
      throw new Error('Could not find Sheet1');
    }

    const data = JSON.parse(e.postData.contents);
    console.log('Parsed data:', data);

    // Format the data for the spreadsheet
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
    
    // Insert the new row after the header
    activeSheet.insertRowAfter(1);
    activeSheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);

    return ContentService.createTextOutput(JSON.stringify({ 
      success: true,
      message: 'Data written successfully' 
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);

  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false,
      error: error.message 
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

// Add a doOptions function to handle CORS preflight requests
function doOptions(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(headers);
} 