# Business Evolution AI - Landing Page Setup Guide

This guide provides complete setup instructions for deploying your Business Evolution AI landing page with email collection to GitHub Pages and connecting it to your BusinessEvolution.AI domain.

## 📋 Quick Overview

This landing page includes:
- Professional tech-themed design with animated growth bars
- Email collection form with validation
- Google Sheets integration for email storage
- Mobile-responsive design
- SEO optimization with meta tags
- GDPR-compliant email collection

## 🚀 Part 1: GitHub Repository Setup

### Step 1: Create a New GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository `business-evolution-landing` (or any name you prefer)
5. Set it to **Public** (required for GitHub Pages)
6. Check "Add a README file"
7. Click "Create repository"

### Step 2: Upload Your Files

**Method A: Using GitHub Web Interface**
1. In your new repository, click "uploading an existing file"
2. Drag and drop all files:
   - `index.html`
   - `style.css` 
   - `script.js`
   - `images/` folder (with logo.png and favicon.ico)
3. Scroll down and click "Commit changes"

**Method B: Using Git Command Line**
```bash
git clone https://github.com/YOUR_USERNAME/business-evolution-landing.git
cd business-evolution-landing
# Copy all your files into this directory
git add .
git commit -m "Initial landing page setup"
git push origin main
```

## 🌐 Part 2: GitHub Pages Setup

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on the "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)"
6. Click "Save"

### Step 2: Test Your Site

1. GitHub will provide a URL like: `https://YOUR_USERNAME.github.io/business-evolution-landing`
2. Wait 5-10 minutes for deployment
3. Visit the URL to test your site

## 🔗 Part 3: Custom Domain Setup (BusinessEvolution.AI)

### Step 1: Configure GitHub Pages for Custom Domain

1. In your repository Settings → Pages
2. Under "Custom domain", enter: `businessevolution.ai`
3. Check "Enforce HTTPS" (after DNS propagation)
4. Click "Save"

This creates a `CNAME` file in your repository.

### Step 2: Configure DNS in Namecheap

1. Log into your Namecheap account
2. Go to "Domain List" and click "Manage" next to BusinessEvolution.AI
3. Go to "Advanced DNS" tab
4. Delete any existing A records and CNAME records for `@` and `www`
5. Add these new records:

**A Records (for apex domain):**
```
Type: A Record
Host: @
Value: 185.199.108.153
TTL: Automatic

Type: A Record
Host: @
Value: 185.199.109.153
TTL: Automatic

Type: A Record
Host: @
Value: 185.199.110.153
TTL: Automatic

Type: A Record
Host: @
Value: 185.199.111.153
TTL: Automatic
```

**CNAME Record (for www subdomain):**
```
Type: CNAME Record
Host: www
Value: YOUR_USERNAME.github.io
TTL: Automatic
```

### Step 3: Wait for DNS Propagation

- DNS changes can take 24-48 hours to fully propagate
- You can check status at: https://www.whatsmydns.net/
- Once propagated, enable "Enforce HTTPS" in GitHub Pages settings

## 📊 Part 4: Google Sheets Integration Setup

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Business Evolution AI - Email List"
4. Set up columns in row 1:
   - A1: "Email"
   - B1: "Timestamp" 
   - C1: "Source"
   - D1: "IP Address" (optional)

### Step 2: Create Google Apps Script

1. In your Google Sheet, go to "Extensions" → "Apps Script"
2. Delete the default code and paste this:

```javascript
function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Get form data
    const email = e.parameter.email;
    const timestamp = e.parameter.timestamp || new Date().toISOString();
    const source = e.parameter.source || 'landing-page';
    
    // Validate email
    if (!email || !isValidEmail(email)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          result: 'error',
          error: 'Invalid email address'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Check if email already exists
    const data = sheet.getDataRange().getValues();
    const emailExists = data.some(row => row[0] === email);
    
    if (emailExists) {
      return ContentService
        .createTextOutput(JSON.stringify({
          result: 'error',
          error: 'Email already subscribed'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Add new row
    sheet.appendRow([email, timestamp, source, getClientIP()]);
    
    // Send success response
    return ContentService
      .createTextOutput(JSON.stringify({
        result: 'success',
        message: 'Email added successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        result: 'error',
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getClientIP() {
  // This is a simplified version - Apps Script has limitations for getting client IP
  return 'N/A';
}

// Test function (optional)
function testPost() {
  const testData = {
    parameter: {
      email: 'test@example.com',
      timestamp: new Date().toISOString(),
      source: 'test'
    }
  };
  
  const result = doPost(testData);
  console.log(result.getContent());
}
```

### Step 3: Deploy the Apps Script

1. Click "Deploy" → "New deployment"
2. Choose "Web app" as the type
3. Set these options:
   - Execute as: "Me"
   - Who has access: "Anyone"
4. Click "Deploy"
5. **Copy the Web App URL** - you'll need this!
6. Click "Done"

### Step 4: Update Your Landing Page

1. Open `script.js` in your code editor
2. Find this line:
```javascript
GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
```
3. Replace `YOUR_SCRIPT_ID` with your actual Apps Script Web App URL
4. Save and commit the changes to GitHub

## 🎨 Part 5: Adding Your Logo and Favicon

### Logo Setup
1. Create or obtain your Business Evolution AI logo
2. Save it as `logo.png` in the `images/` folder
3. Recommended size: 300x100px (or similar aspect ratio)
4. Ensure it has a transparent background

### Favicon Setup
1. Create a favicon from your logo using a tool like [Favicon.io](https://favicon.io)
2. Save it as `favicon.ico` in the `images/` folder
3. Size: 16x16px or 32x32px

## 📈 Part 6: Optional Enhancements

### Google Analytics Setup
1. Create a Google Analytics account
2. Get your tracking ID (GA4 format: G-XXXXXXXXXX)
3. Uncomment the Google Analytics code in `index.html`
4. Replace `GA_TRACKING_ID` with your actual tracking ID

### Email Notifications
Add this to your Google Apps Script to get email notifications:

```javascript
function sendEmailNotification(email) {
  const subject = 'New Newsletter Signup - Business Evolution AI';
  const body = `New email signup: ${email}\nTime: ${new Date().toLocaleString()}`;
  
  // Replace with your email
  GmailApp.sendEmail('your-email@gmail.com', subject, body);
}
```

## 🔧 Testing Your Setup

### 1. Test Email Form
- Visit your live site
- Enter a test email address
- Check if it appears in your Google Sheet
- Verify success/error messages display correctly

### 2. Test Mobile Responsiveness
- Test on various screen sizes
- Verify animations work properly
- Check that form is easily usable on mobile

### 3. Test Performance
- Use Google PageSpeed Insights
- Check loading times
- Verify all animations are smooth

## 🐛 Troubleshooting

### Common Issues

**GitHub Pages not working:**
- Ensure repository is public
- Check that `index.html` is in the root directory
- Wait 5-10 minutes after enabling Pages

**Custom domain not working:**
- Verify DNS records are correct
- Check DNS propagation status
- Ensure HTTPS is enabled after DNS propagates

**Form submission not working:**
- Check browser console for JavaScript errors
- Verify Google Apps Script URL is correct
- Test the Apps Script directly in the editor

**Emails not saving to Google Sheets:**
- Check Apps Script execution permissions
- Verify the script is deployed as a web app
- Check the Apps Script logs for errors

### Performance Optimization

**Images:**
- Compress logo and favicon files
- Use WebP format for better compression
- Ensure images are properly sized

**CSS/JS:**
- Minify files for production
- Consider using a CDN for Google Fonts
- Optimize animations for better performance

## 📝 Maintenance

### Regular Tasks
- Monitor email collection in Google Sheets
- Check for form submission errors
- Update content as needed
- Review analytics data

### Security Considerations
- Regularly review Apps Script permissions
- Monitor for spam email submissions
- Keep dependencies updated

## 🎯 Next Steps

1. Test the complete setup thoroughly
2. Monitor initial email signups
3. Consider adding email automation (welcome sequences)
4. Track conversion rates and optimize
5. Add more content sections as needed

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review browser console for JavaScript errors
3. Check Google Apps Script execution logs
4. Verify all URLs and IDs are correct

---

**Congratulations!** Your Business Evolution AI landing page is now live with professional email collection. The setup should provide a solid foundation for building your email list and engaging with your audience. 