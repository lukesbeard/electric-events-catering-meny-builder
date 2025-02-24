function doPost(e) {
  const sheet = SpreadsheetApp.openById('19_RFERZ2gDdwejHoar5-vRsyRHI3vj3tQUobc7qjNb4').getSheetByName('Sheet1');
  const data = JSON.parse(e.postData.contents);
  
  // Format the data for the spreadsheet
  const rowData = [
    'New', // Status
    data.source, // Source (Ladybird or Muchacho)
    data.total.replace('$', ''), // Order Value
    data.contact.name, // Contact Name
    data.comments, // Additional Comments
    data.contact.email, // Email Address
    data.contact.phone, // Phone Number
    `${data.delivery.address}, ${data.delivery.city}, ${data.delivery.zip}`, // Delivery Address
    data.delivery.date, // Event Date
    data.delivery.time, // Drop Off Time
    data.partySize, // Party Size
    formatOrderDetails(data.order) // Order Details
  ];
  
  // Insert the new row after the header
  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatOrderDetails(orders) {
  return orders.map(item => 
    `${item.name} (${item.quantity}x) - ${item.subtotal}`
  ).join('\n');
} 