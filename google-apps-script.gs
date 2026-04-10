/**
 * Google Apps Script to save ID card data and embed images DIRECTLY into the sheet.
 * 
 * This version inserts the images as objects in the Sheet rather than saving links to Drive.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'save';
    var idNum = data.idNumber;
    
    if (!idNum) throw new Error("ID Number is required");
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    var rowIndex = -1;
    
    // Search for existing record by ID Number (Column B)
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1] == idNum) {
        rowIndex = i + 1;
        break;
      }
    }

    // Handle DELETE
    if (action === 'delete') {
      if (rowIndex !== -1) {
        sheet.deleteRow(rowIndex);
        // Also need to find and delete floating images if possible, 
        // but GAS doesn't easily link floating images to rows.
        return createResponse("success", "Record deleted from Sheet");
      }
      return createResponse("error", "Record not found");
    }

    // Handle SAVE/EDIT
    var lastRow = rowIndex !== -1 ? rowIndex : sheet.getLastRow() + 1;
    
    // Set row height to accommodate images
    sheet.setRowHeight(lastRow, 100);
    
    // Prepare Data (Timestamp, ID, Name, Contact, Phone)
    var basicData = [
      new Date(),
      data.idNumber,
      data.name,
      data.emergencyContact,
      data.emergencyPhone
    ];
    
    // Write text data
    sheet.getRange(lastRow, 1, 1, basicData.length).setValues([basicData]);
    
    // Function to insert image directly into sheet
    function embedImage(base64Data, column, row, width, height) {
      if (!base64Data || !base64Data.includes('base64,')) return;
      
      try {
        var contentType = base64Data.split(';')[0].split(':')[1];
        var base64String = base64Data.split(',')[1];
        var blob = Utilities.newBlob(Utilities.base64Decode(base64String), contentType);
        
        // Insert image at the cell
        var image = sheet.insertImage(blob, column, row);
        
        // Standard sizing Logic
        var rowHeight = sheet.getRowHeight(row);
        var colWidth = sheet.getColumnWidth(column); // Standard is ~100
        
        var imgOriginalWidth = image.getWidth();
        var imgOriginalHeight = image.getHeight();
        var aspectRatio = imgOriginalWidth / imgOriginalHeight;
        
        // Target height is 90% of row height to leave small margin
        var newHeight = rowHeight * 0.9; 
        var newWidth = newHeight * aspectRatio;
        
        // If image is too wide for column, scale based on width instead
        if (newWidth > colWidth * 0.95) {
          newWidth = colWidth * 0.9;
          newHeight = newWidth / aspectRatio;
        }
        
        image.setHeight(newHeight).setWidth(newWidth);
        
        // Calculate offsets to CENTER the image in the cell
        var offsetX = Math.max(0, (colWidth - newWidth) / 2);
        var offsetY = Math.max(0, (rowHeight - newHeight) / 2);
        
        image.setAnchorCellXOffset(offsetX).setAnchorCellYOffset(offsetY);
        
      } catch (err) {
        console.error("Image embed error: " + err);
      }
    }

    // Embed images in columns F, G, H, I (6, 7, 8, 9)
    embedImage(data.photo, 6, lastRow);
    embedImage(data.signature, 7, lastRow);
    embedImage(data.managerSignature, 8, lastRow);
    embedImage(data.headSignature, 9, lastRow);

    return createResponse("success", rowIndex !== -1 ? "Record updated with images" : "Record saved with embedded images");
    
  } catch (error) {
    return createResponse("error", error.toString());
  }
}

function createResponse(result, message) {
  return ContentService.createTextOutput(JSON.stringify({
    "result": result,
    "message": message
  })).setMimeType(ContentService.MimeType.JSON);
}
