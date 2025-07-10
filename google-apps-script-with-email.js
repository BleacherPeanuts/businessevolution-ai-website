/**
 * Business Evolution AI - Form Submission Handler with Email Notifications
 * 
 * This script handles form submissions and sends email notifications.
 * Deploy this as a web app with execute permissions set to "Anyone"
 */

// Configuration - EMAIL NOTIFICATION SETTINGS
const EMAIL_CONFIG = {
  // Email addresses to notify when new submissions are received
  NOTIFICATION_EMAILS: [
    'businessevolutionai@gmail.com'
  ],
  
  // Email settings
  SUBJECT: 'New Business Evolution AI Newsletter Signup',
  FROM_NAME: 'Business Evolution AI'
};

// Column mapping for the spreadsheet
const COLUMNS = {
  FIRST_NAME: 0,    // Column A
  EMAIL: 1,         // Column B  
  TIMESTAMP: 2,     // Column C
  SOURCE: 3,        // Column D
  IP_ADDRESS: 4     // Column E
};

/**
 * Handle POST requests from the form
 */
function doPost(e) {
  try {
    // Parse the form data
    const formData = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!formData.firstName || !formData.email) {
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
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Invalid email format'
        }))
        .setMimeType(ContentService.MimeType.JSON);
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
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Successfully submitted!'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing form submission:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Server error occurred'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Send email notifications to configured recipients
 */
function sendEmailNotifications(formData, timestamp) {
  try {
    // Create email content
    const emailBody = createEmailContent(formData, timestamp);
    
    // Send email to each configured recipient
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
            
            <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; border-left: 4px solid #52C3F1;">
              <h3 style="color: #2AA3D1; margin-top: 0;">Quick Actions</h3>
              <p style="margin: 10px 0;">
                <a href="mailto:${formData.email}?subject=Welcome to Business Evolution AI!" 
                   style="background: #52C3F1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Send Welcome Email
                </a>
              </p>
              <p style="margin: 10px 0;">
                <a href="https://sheets.google.com" 
                   style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Google Sheets
                </a>
              </p>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
              <p>This email was automatically generated by your Business Evolution AI form submission handler.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Test function to verify email sending works
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