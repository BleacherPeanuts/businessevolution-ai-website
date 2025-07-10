/**
 * Business Evolution AI - Enhanced Form Handler with Email Sending
 * Handles both form submissions and dashboard data requests
 */

// Configuration
const EMAIL_CONFIG = {
  NOTIFICATION_EMAILS: ['businessevolutionai@gmail.com'],
  SUBJECT: 'New Business Evolution AI Newsletter Signup',
  FROM_NAME: 'Business Evolution AI'
};

/**
 * Main handler for all POST requests
 */
function doPost(e) {
  try {
    // Check what type of request this is
    if (e.parameter.action === 'getSubscribers') {
      return handleGetSubscribers(e);
    } else if (e.parameter.action === 'sendEmail') {
      return handleEmailSend(e);
    } else if (e.parameter.action === 'deleteSubscriber') {
      return handleDeleteSubscriber(e);
    } else {
      // Default to form submission handler
      return handleFormSubmission(e);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Get subscribers from the spreadsheet
 */
function handleGetSubscribers(e) {
  try {
    console.log('Getting subscribers from spreadsheet...');
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    const subscribers = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1]) {  // Has name and email
        subscribers.push({
          firstName: row[0],
          email: row[1],
          timestamp: row[2] ? new Date(row[2]).toISOString() : null,
          source: row[3] || 'Business Evolution AI'
        });
      }
    }
    
    console.log(`Found ${subscribers.length} subscribers`);
    return createResponse(true, 'Subscribers retrieved', { subscribers });
    
  } catch (error) {
    console.error('Error getting subscribers:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Handle form submissions (your existing functionality)
 */
function handleFormSubmission(e) {
  try {
    console.log('Handling form submission...');
    const formData = e.parameter;
    
    // Validate required fields
    if (!formData.firstName || !formData.email) {
      return createResponse(false, 'Missing required fields');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return createResponse(false, 'Invalid email format');
    }
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Prepare the data row
    const timestamp = new Date();
    const rowData = [
      formData.firstName,
      formData.email,
      timestamp,
      formData.source || 'Business Evolution AI',
      formData.ipAddress || 'Unknown'
    ];
    
    // Add the data to the spreadsheet
    sheet.appendRow(rowData);
    
    // Send email notifications
    sendEmailNotifications(formData, timestamp);
    
    return createResponse(true, 'Successfully submitted!');
    
  } catch (error) {
    console.error('Error processing form submission:', error);
    return createResponse(false, 'Server error occurred');
  }
}

/**
 * Handle email sending requests (for future use)
 */
function handleEmailSend(e) {
  // Email sending functionality would go here
  return createResponse(false, 'Email sending not implemented yet');
}

/**
 * Delete a subscriber from the spreadsheet
 */
function handleDeleteSubscriber(e) {
  try {
    const email = e.parameter.email;
    const timestamp = e.parameter.timestamp;
    
    if (!email) {
      return createResponse(false, 'Email is required for deletion');
    }
    
    console.log(`Deleting subscriber: ${email} at ${timestamp}`);
    
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find and delete the matching row(s)
    let deletedCount = 0;
    for (let i = data.length - 1; i >= 1; i--) { // Start from bottom, skip header
      const row = data[i];
      const rowEmail = row[1]; // Email is in column B (index 1)
      const rowTimestamp = row[2] ? new Date(row[2]).toISOString() : null;
      
      if (rowEmail === email && (!timestamp || rowTimestamp === timestamp)) {
        sheet.deleteRow(i + 1); // +1 because sheets are 1-indexed
        deletedCount++;
        console.log(`Deleted row ${i + 1} for ${email}`);
        
        // If we have a specific timestamp, only delete one row
        if (timestamp) {
          break;
        }
      }
    }
    
    if (deletedCount > 0) {
      return createResponse(true, `Deleted ${deletedCount} subscriber(s)`, { deletedCount });
    } else {
      return createResponse(false, 'Subscriber not found');
    }
    
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Send email notifications
 */
function sendEmailNotifications(formData, timestamp) {
  try {
    const emailBody = createEmailContent(formData, timestamp);
    
    EMAIL_CONFIG.NOTIFICATION_EMAILS.forEach(email => {
      try {
        MailApp.sendEmail({
          to: email,
          subject: EMAIL_CONFIG.SUBJECT,
          htmlBody: emailBody,
          name: EMAIL_CONFIG.FROM_NAME
        });
        console.log(`Email sent successfully to: ${email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError);
      }
    });
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }
}

/**
 * Create HTML email content
 */
function createEmailContent(formData, timestamp) {
  const formattedTime = timestamp.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #52C3F1, #2AA3D1); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">New Newsletter Signup! 🚀</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone just joined the Business Evolution AI community</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #2AA3D1; margin-top: 0;">Contact Details</h2>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <p><strong>👤 Name:</strong> ${formData.firstName}</p>
              <p><strong>📧 Email:</strong> <a href="mailto:${formData.email}" style="color: #52C3F1;">${formData.email}</a></p>
              <p><strong>🕐 Submitted:</strong> ${formattedTime}</p>
              <p><strong>🌐 Source:</strong> ${formData.source || 'Business Evolution AI'}</p>
              <p><strong>📍 IP Address:</strong> ${formData.ipAddress || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Create a standardized JSON response
 */
function createResponse(success, message, data = {}) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: success,
      message: message,
      ...data
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function for getting subscribers
 */
function testGetSubscribers() {
  const result = handleGetSubscribers({ parameter: { action: 'getSubscribers' } });
  console.log(result.getContent());
} 