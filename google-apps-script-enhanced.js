/**
 * Business Evolution AI - Enhanced Form Submission Handler with Delete Capability
 * 
 * This script handles:
 * - Adding new subscribers (FormData submissions)
 * - Deleting subscribers from dashboard
 * - Getting subscriber list for dashboard
 * - Email notifications
 * 
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
  DELETE_SUBJECT: 'Subscriber Deleted - Business Evolution AI',
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
 * Handle POST requests from the form and dashboard
 */
function doPost(e) {
  try {
    // Parse the form data from FormData or URL-encoded
    const formData = e.parameter;
    
    console.log('=== ENHANCED: Request received ===');
    console.log('Action:', formData.action || 'addSubscriber');
    console.log('Form data:', formData);
    
    // Route to appropriate handler based on action
    const action = formData.action || 'addSubscriber';
    
    switch (action) {
      case 'addSubscriber':
        return handleAddSubscriber(formData);
      case 'deleteSubscriber':
        return handleDeleteSubscriber(formData);
      case 'getSubscribers':
        return handleGetSubscribers(formData);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Server error: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle adding new subscribers (from landing page)
 */
function handleAddSubscriber(formData) {
  try {
    console.log('=== ADDING SUBSCRIBER ===');
    
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
    
    // Check if email already exists
    const data = sheet.getDataRange().getValues();
    const emailExists = data.some(row => row[COLUMNS.EMAIL] === formData.email);
    
    if (emailExists) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Email already subscribed'
        }))
        .setMimeType(ContentService.MimeType.JSON);
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
    
    // Add the data to the spreadsheet
    sheet.appendRow(rowData);
    console.log('Successfully added subscriber:', formData.email);
    
    // Send email notifications
    sendEmailNotifications(formData, timestamp, 'new');
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Successfully submitted!'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error adding subscriber:', error);
    throw error;
  }
}

/**
 * Handle deleting subscribers (from dashboard)
 */
function handleDeleteSubscriber(formData) {
  try {
    console.log('=== DELETING SUBSCRIBER ===');
    console.log('Email to delete:', formData.email);
    console.log('Timestamp to match:', formData.timestamp);
    
    if (!formData.email) {
      throw new Error('Email is required for deletion');
    }
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find the row to delete
    let rowToDelete = -1;
    for (let i = 1; i < data.length; i++) { // Start from 1 to skip header
      const rowEmail = data[i][COLUMNS.EMAIL];
      const rowTimestamp = data[i][COLUMNS.TIMESTAMP];
      
      // Match by email (and optionally timestamp for precision)
      if (rowEmail === formData.email) {
        if (formData.timestamp) {
          // If timestamp provided, match it too for precision
          const providedTime = new Date(formData.timestamp);
          const rowTime = new Date(rowTimestamp);
          
          // Allow some tolerance (1 minute) for timestamp comparison
          const timeDiff = Math.abs(providedTime.getTime() - rowTime.getTime());
          if (timeDiff < 60000) { // 1 minute tolerance
            rowToDelete = i + 1; // +1 because sheet rows are 1-indexed
            break;
          }
        } else {
          // No timestamp provided, just match email (delete first occurrence)
          rowToDelete = i + 1;
          break;
        }
      }
    }
    
    if (rowToDelete === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Subscriber not found or already deleted'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Delete the row
    sheet.deleteRow(rowToDelete);
    console.log('Successfully deleted row:', rowToDelete);
    
    // Send deletion notification
    const deletedData = {
      email: formData.email,
      firstName: data[rowToDelete - 1][COLUMNS.FIRST_NAME] || 'Unknown'
    };
    sendEmailNotifications(deletedData, new Date(), 'delete');
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Subscriber deleted successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    throw error;
  }
}

/**
 * Handle getting subscribers list (for dashboard)
 */
function handleGetSubscribers(formData) {
  try {
    console.log('=== GETTING SUBSCRIBERS ===');
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      // No data or only headers
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          subscribers: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Convert rows to subscriber objects (skip header row)
    const subscribers = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      subscribers.push({
        firstName: row[COLUMNS.FIRST_NAME] || '',
        email: row[COLUMNS.EMAIL] || '',
        timestamp: row[COLUMNS.TIMESTAMP] || '',
        source: row[COLUMNS.SOURCE] || '',
        ipAddress: row[COLUMNS.IP_ADDRESS] || ''
      });
    }
    
    console.log(`Found ${subscribers.length} subscribers`);
    
    // Return subscribers data
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        subscribers: subscribers
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error getting subscribers:', error);
    throw error;
  }
}

/**
 * Send email notifications to configured recipients
 */
function sendEmailNotifications(formData, timestamp, action = 'new') {
  try {
    if (action === 'new') {
      // Create email content for new subscriber
      const emailBody = createNewSubscriberEmailContent(formData, timestamp);
      
      // Send email to each configured recipient
      EMAIL_CONFIG.NOTIFICATION_EMAILS.forEach(email => {
        try {
          MailApp.sendEmail({
            to: email,
            subject: EMAIL_CONFIG.SUBJECT,
            htmlBody: emailBody,
            name: EMAIL_CONFIG.FROM_NAME
          });
          
          console.log(`New subscriber notification sent to: ${email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
        }
      });
    } else if (action === 'delete') {
      // Create email content for deleted subscriber
      const emailBody = createDeletedSubscriberEmailContent(formData, timestamp);
      
      // Send email to each configured recipient
      EMAIL_CONFIG.NOTIFICATION_EMAILS.forEach(email => {
        try {
          MailApp.sendEmail({
            to: email,
            subject: EMAIL_CONFIG.DELETE_SUBJECT,
            htmlBody: emailBody,
            name: EMAIL_CONFIG.FROM_NAME
          });
          
          console.log(`Deletion notification sent to: ${email}`);
        } catch (emailError) {
          console.error(`Failed to send deletion email to ${email}:`, emailError);
        }
      });
    }
    
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }
}

/**
 * Create HTML email content for new subscribers
 */
function createNewSubscriberEmailContent(formData, timestamp) {
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
                <a href="mailto:${formData.email}" 
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
 * Create HTML email content for deleted subscribers
 */
function createDeletedSubscriberEmailContent(formData, timestamp) {
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
          <div style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Subscriber Deleted 🗑️</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A subscriber was removed from the Business Evolution AI list</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #dc3545; margin-top: 0;">Deleted Contact</h2>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <p><strong>👤 Name:</strong> ${formData.firstName}</p>
              <p><strong>📧 Email:</strong> ${formData.email}</p>
              <p><strong>🕐 Deleted:</strong> ${formattedTime}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404;"><strong>Note:</strong> This subscriber has been permanently removed from your email list.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
} 