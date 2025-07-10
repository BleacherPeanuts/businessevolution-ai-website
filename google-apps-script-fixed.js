/**
 * Business Evolution AI - Form Submission Handler (FIXED VERSION)
 * 
 * This version properly handles FormData submissions
 */

// Configuration
const EMAIL_CONFIG = {
  NOTIFICATION_EMAILS: ['businessevolutionai@gmail.com'],
  SUBJECT: 'New Business Evolution AI Newsletter Signup',
  FROM_NAME: 'Business Evolution AI'
};

function doPost(e) {
  try {
    console.log('=== DEBUG: Form submission started ===');
    console.log('Raw event object keys:', Object.keys(e));
    console.log('e.parameter:', e.parameter);
    console.log('e.postData:', e.postData);
    
    // Get form data from the correct location
    let formData;
    
    // Check if data is in e.parameter (FormData) or e.postData (JSON)
    if (e.parameter && Object.keys(e.parameter).length > 0) {
      console.log('DEBUG: Using e.parameter (FormData)');
      formData = e.parameter;
    } else if (e.postData && e.postData.contents) {
      console.log('DEBUG: Using e.postData (JSON)');
      formData = JSON.parse(e.postData.contents);
    } else {
      console.log('ERROR: No form data found');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'No form data received'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('Parsed formData:', formData);
    
    // Validate required fields
    if (!formData.firstName || !formData.email) {
      console.log('ERROR: Missing required fields');
      console.log('firstName:', formData.firstName);
      console.log('email:', formData.email);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Missing required fields'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log('ERROR: Invalid email format:', formData.email);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Invalid email format'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('=== DEBUG: Validation passed ===');
    
    // Create a new spreadsheet if none exists
    let sheet;
    try {
      // Try to get active sheet first
      sheet = SpreadsheetApp.getActiveSheet();
      console.log('DEBUG: Got active sheet:', sheet.getName());
    } catch (sheetError) {
      console.log('DEBUG: No active sheet, creating new spreadsheet...');
      try {
        // Create a new spreadsheet
        const spreadsheet = SpreadsheetApp.create('Business Evolution AI - Newsletter Signups');
        sheet = spreadsheet.getActiveSheet();
        
        // Add headers
        sheet.getRange(1, 1, 1, 5).setValues([
          ['First Name', 'Email', 'Timestamp', 'Source', 'IP Address']
        ]);
        
        console.log('DEBUG: Created new spreadsheet:', spreadsheet.getUrl());
        console.log('DEBUG: Please connect this script to the spreadsheet for future use');
        
      } catch (createError) {
        console.log('ERROR: Failed to create spreadsheet:', createError);
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            message: 'Spreadsheet error: ' + createError.toString()
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Prepare the data row
    const timestamp = new Date();
    const rowData = [
      formData.firstName,
      formData.email,
      timestamp,
      formData.source || 'Business Evolution AI',
      formData.ipAddress || 'Unknown'
    ];
    
    console.log('DEBUG: Prepared row data:', rowData);
    
    // Add the data to the spreadsheet
    try {
      sheet.appendRow(rowData);
      console.log('DEBUG: Successfully added row to spreadsheet');
    } catch (appendError) {
      console.log('ERROR: Failed to append row:', appendError);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Failed to save data: ' + appendError.toString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Try to send email notifications
    try {
      console.log('DEBUG: Attempting to send email notifications...');
      sendEmailNotifications(formData, timestamp);
      console.log('DEBUG: Email notifications sent successfully');
    } catch (emailError) {
      console.log('ERROR: Email sending failed:', emailError);
      // Don't fail the entire submission if email fails
    }
    
    console.log('=== DEBUG: Form submission completed successfully ===');
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Successfully submitted!'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.log('=== CRITICAL ERROR ===');
    console.log('Error type:', error.name);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Server error: ' + error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
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
        console.log(`Failed to send email to ${email}:`, emailError);
      }
    });
  } catch (error) {
    console.log('Error in sendEmailNotifications:', error);
    throw error;
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
            
            <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; border-left: 4px solid #52C3F1;">
              <h3 style="color: #2AA3D1; margin-top: 0;">Quick Actions</h3>
              <p style="margin: 10px 0;">
                <a href="mailto:${formData.email}?subject=Welcome to Business Evolution AI!" 
                   style="background: #52C3F1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Send Welcome Email
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Test function
 */
function testEmailNotification() {
  const testData = {
    firstName: 'Test User',
    email: 'test@example.com',
    source: 'Business Evolution AI',
    ipAddress: '127.0.0.1'
  };
  
  sendEmailNotifications(testData, new Date());
  console.log('Test email sent!');
} 