/**
 * Business Evolution AI - Email Dashboard JavaScript
 * Handles all dashboard functionality including Google Sheets integration and email management
 */

// Configuration
const CONFIG = {
    GOOGLE_SHEETS_API_KEY: '', // Will be set from localStorage
    GOOGLE_SHEETS_ID: '', // Will be set from localStorage
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzRGhkbGNDS0FriLY965oVtvka2xNxWu1CsAFmM54cKkIb7zj-2dO39zvZR5MYu9Kmntg/exec', // Updated to your new Apps Script URL
    GMAIL_API_KEY: '', // Will be set from localStorage
    TEST_MODE: false, // Changed to false to try real data
    
    // Default settings
    DEFAULT_FROM_NAME: 'Business Evolution AI',
    DEFAULT_FROM_EMAIL: 'businessevolutionai@gmail.com',
    
    // Storage keys
    STORAGE_KEYS: {
        SHEETS_ID: 'bev_sheets_id',
        API_KEY: 'bev_api_key',
        FROM_NAME: 'bev_from_name',
        FROM_EMAIL: 'bev_from_email',
        REPLY_TO: 'bev_reply_to',
        EMAIL_SERVICE: 'bev_email_service',
        DRAFTS: 'bev_email_drafts'
    }
};

// State management
const state = {
    subscribers: [],
    filteredSubscribers: [],
    selectedRows: new Set(), // Changed from selectedEmails to selectedRows (using indices)
    currentTab: 'subscribers',
    sortColumn: null,
    sortDirection: 'asc', // 'asc' or 'desc'
    emailTemplates: {
        welcome: `Hi {{firstName}},

Welcome to Business Evolution AI! 🚀

We're thrilled to have you join our community of forward-thinking business leaders who are embracing AI to transform their operations.

Over the coming weeks, you'll receive:
- Practical AI implementation strategies
- Real-world case studies from businesses like yours
- Tools and resources to accelerate your AI journey
- Expert insights on emerging AI trends

Our next email will dive into "5 AI Tools Every Business Should Be Using in 2025" - practical solutions you can implement immediately.

If you have any questions or specific AI challenges you'd like us to address, just reply to this email.

Ready to evolve with AI?

Best regards,
The Business Evolution AI Team`,
        
        newsletter: `Hi {{firstName}},

This week in AI business evolution...

[Your newsletter content here]

Best regards,
The Business Evolution AI Team`,
        
        announcement: `Hi {{firstName}},

We have an important update to share with you...

[Your announcement here]

Best regards,
The Business Evolution AI Team`
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard script loaded, initializing app...');
    initializeApp();
});

// Main initialization
function initializeApp() {
    console.log('Initializing app...');
    
    // Check if key elements exist
    const navTabs = document.querySelectorAll('.nav-tab');
    const addBtn = document.getElementById('addSubscriberBtn');
    const panelActions = document.querySelector('.panel-actions');
    
    console.log('Found nav tabs:', navTabs.length);
    console.log('Found add subscriber button:', !!addBtn);
    console.log('Found panel actions:', !!panelActions);
    
    loadSettings();
    initializeTabs();
    initializeEventListeners();
    
    // Load subscribers if sheets ID is configured
    if (CONFIG.GOOGLE_SHEETS_ID) {
        loadSubscribers();
    } else {
        showTestData();
    }
}

// Load settings from localStorage
function loadSettings() {
    CONFIG.GOOGLE_SHEETS_ID = localStorage.getItem(CONFIG.STORAGE_KEYS.SHEETS_ID) || '';
    CONFIG.GOOGLE_SHEETS_API_KEY = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY) || '';
    
    // Load form settings
    document.getElementById('sheetsId').value = CONFIG.GOOGLE_SHEETS_ID;
    document.getElementById('fromName').value = localStorage.getItem(CONFIG.STORAGE_KEYS.FROM_NAME) || CONFIG.DEFAULT_FROM_NAME;
    document.getElementById('fromEmail').value = localStorage.getItem(CONFIG.STORAGE_KEYS.FROM_EMAIL) || CONFIG.DEFAULT_FROM_EMAIL;
    document.getElementById('replyTo').value = localStorage.getItem(CONFIG.STORAGE_KEYS.REPLY_TO) || '';
    document.getElementById('apiService').value = localStorage.getItem(CONFIG.STORAGE_KEYS.EMAIL_SERVICE) || 'gmail';
}

// Tab navigation
function initializeTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.tab-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding panel
            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            state.currentTab = tabName;
        });
    });
}

// Initialize all event listeners
function initializeEventListeners() {
    // Subscribers tab
    document.getElementById('refreshBtn').addEventListener('click', loadSubscribers);
    document.getElementById('addSubscriberBtn').addEventListener('click', openAddSubscriberModal);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('searchInput').addEventListener('input', filterSubscribers);
    document.getElementById('filterSelect').addEventListener('change', filterSubscribers);
    document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
    document.getElementById('bulkDeleteBtn').addEventListener('click', handleBulkDelete); // ADDED: Delete button handler
    
    // Compose tab
    document.getElementById('emailComposeForm').addEventListener('submit', handleEmailSubmit);
    document.getElementById('recipients').addEventListener('change', handleRecipientChange);
    document.getElementById('emailTemplate').addEventListener('change', handleTemplateChange);
    document.getElementById('testMode').addEventListener('change', updateSendButton);
    document.getElementById('saveDraftBtn').addEventListener('click', saveDraft);
    
    // Editor toolbar
    document.querySelectorAll('.editor-btn').forEach(btn => {
        btn.addEventListener('click', () => handleEditorAction(btn.getAttribute('data-action')));
    });
    
    // Settings tab
    document.getElementById('testConnectionBtn').addEventListener('click', testGoogleSheetsConnection);
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // Modal
    document.getElementById('closePreviewBtn').addEventListener('click', closePreviewModal);
    document.getElementById('closePreviewBtn2').addEventListener('click', closePreviewModal);
    document.getElementById('sendFromPreviewBtn').addEventListener('click', sendEmailFromPreview);
    
    // Add Subscriber Modal
    document.getElementById('closeAddSubscriberBtn').addEventListener('click', closeAddSubscriberModal);
    document.getElementById('cancelAddSubscriberBtn').addEventListener('click', closeAddSubscriberModal);
    document.getElementById('addSubscriberForm').addEventListener('submit', handleAddSubscriber);
    document.getElementById('saveSubscriberBtn').addEventListener('click', handleAddSubscriber);
}

// Initialize sortable table headers
function initializeSortableHeaders() {
    const headers = document.querySelectorAll('.subscribers-table th');
    
    headers.forEach((header, index) => {
        // Skip checkbox column and actions column
        if (index === 0 || index === 5) return;
        
        // Check if already initialized to prevent duplicates
        if (header.classList.contains('sortable-initialized')) return;
        
        header.style.cursor = 'pointer';
        header.classList.add('sortable');
        header.classList.add('sortable-initialized');
        
        // Add sort indicators only if not already present
        if (!header.querySelector('.sort-indicator')) {
            const sortIndicator = document.createElement('span');
            sortIndicator.className = 'sort-indicator';
            sortIndicator.innerHTML = '⬍'; // neutral sort icon
            header.appendChild(sortIndicator);
        }
        
        // Add click listener only if not already added
        if (!header.hasAttribute('data-sort-listener')) {
            header.setAttribute('data-sort-listener', 'true');
            header.addEventListener('click', () => {
                const columnMap = {
                    1: 'firstName',
                    2: 'email', 
                    3: 'timestamp',
                    4: 'source'
                };
                
                const column = columnMap[index];
                if (column) {
                    handleSort(column);
                }
            });
        }
    });
}

// Handle column sorting
function handleSort(column) {
    // If clicking the same column, toggle direction
    if (state.sortColumn === column) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // New column, default to ascending
        state.sortColumn = column;
        state.sortDirection = 'asc';
    }
    
    // Sort the filtered subscribers
    state.filteredSubscribers.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];
        
        // Handle different data types
        if (column === 'timestamp') {
            valueA = new Date(valueA);
            valueB = new Date(valueB);
        } else if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        let comparison = 0;
        if (valueA > valueB) {
            comparison = 1;
        } else if (valueA < valueB) {
            comparison = -1;
        }
        
        return state.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    // Update sort indicators
    updateSortIndicators();
    
    // Re-render table
    renderSubscribersTable();
}

// Update sort indicator icons
function updateSortIndicators() {
    const headers = document.querySelectorAll('.subscribers-table th');
    
    headers.forEach((header, index) => {
        const indicator = header.querySelector('.sort-indicator');
        if (!indicator) return;
        
        const columnMap = {
            1: 'firstName',
            2: 'email', 
            3: 'timestamp',
            4: 'source'
        };
        
        const column = columnMap[index];
        
        if (column === state.sortColumn) {
            // Active column
            header.classList.add('sorted');
            indicator.innerHTML = state.sortDirection === 'asc' ? '▲' : '▼';
            indicator.classList.add('active');
        } else {
            // Inactive column
            header.classList.remove('sorted');
            indicator.innerHTML = '⬍';
            indicator.classList.remove('active');
        }
    });
}

// Load subscribers from Google Sheets or show test data
async function loadSubscribers() {
    console.log('Loading subscribers...');
    
    try {
        // Try to fetch real data from Google Sheets
        const formData = new FormData();
        formData.append('action', 'getSubscribers');
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response from Google Sheets:', data);
        
        if (data.success && data.subscribers) {
            // Process real subscriber data
            state.subscribers = data.subscribers.map(subscriber => ({
                firstName: subscriber.firstName || 'Unknown',
                email: subscriber.email,
                timestamp: subscriber.timestamp ? new Date(subscriber.timestamp) : new Date(),
                source: subscriber.source || 'Business Evolution AI',
                selected: false
            }));
            
            console.log(`Loaded ${state.subscribers.length} real subscribers`);
            showNotification(`Loaded ${state.subscribers.length} subscribers from Google Sheets`, 'success');
        } else {
            throw new Error(data.message || 'Failed to load subscribers');
        }
        
    } catch (error) {
        console.error('Error loading real data:', error);
        console.log('Falling back to test data');
        showNotification('Could not connect to Google Sheets, showing test data', 'info');
        showTestData();
        return;
    }
    
    // Update the display
    state.filteredSubscribers = [...state.subscribers];
    renderSubscribersTable();
    updateDashboardStats();
}

// Show test data for demonstration
function showTestData() {
    state.subscribers = [
        {
            firstName: 'John',
            email: 'john.doe@example.com',
            timestamp: new Date('2025-01-10T10:30:00'),
            source: 'Business Evolution AI',
            selected: false
        },
        {
            firstName: 'Sarah',
            email: 'sarah.smith@example.com',
            timestamp: new Date('2025-01-10T14:45:00'),
            source: 'Business Evolution AI',
            selected: false
        },
        {
            firstName: 'Michael',
            email: 'michael.jones@example.com',
            timestamp: new Date('2025-01-09T09:15:00'),
            source: 'Business Evolution AI',
            selected: false
        },
        {
            firstName: 'Emma',
            email: 'emma.wilson@example.com',
            timestamp: new Date('2025-01-09T16:20:00'),
            source: 'Business Evolution AI',
            selected: false
        },
        {
            firstName: 'David',
            email: 'david.brown@example.com',
            timestamp: new Date('2025-01-08T11:00:00'),
            source: 'Business Evolution AI',
            selected: false
        }
    ];
    
    state.filteredSubscribers = [...state.subscribers];
    renderSubscribersTable();
    updateDashboardStats();
}

// Render subscribers table
function renderSubscribersTable() {
    const tbody = document.getElementById('subscribersTableBody');
    tbody.innerHTML = '';
    
    state.filteredSubscribers.forEach((subscriber, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="checkbox-col">
                <input type="checkbox" class="subscriber-checkbox" data-index="${index}" ${state.selectedRows.has(index) ? 'checked' : ''}>
            </td>
            <td>${subscriber.firstName}</td>
            <td>${subscriber.email}</td>
            <td>${formatDate(subscriber.timestamp)}</td>
            <td>${subscriber.source}</td>
            <td class="table-actions">
                <button class="btn action-btn btn-secondary" onclick="emailSubscriber('${subscriber.email}', '${subscriber.firstName}')">Email</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add checkbox listeners
    document.querySelectorAll('.subscriber-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleSubscriberSelection);
    });
    
    // Initialize sorting if not already done
    initializeSortableHeaders();
    
    updateBulkActions();
}

// Handle subscriber selection
function handleSubscriberSelection(e) {
    const index = parseInt(e.target.getAttribute('data-index'));
    
    if (e.target.checked) {
        state.selectedRows.add(index);
    } else {
        state.selectedRows.delete(index);
    }
    
    updateBulkActions();
}

// Toggle select all
function toggleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.subscriber-checkbox');
    
    state.selectedRows.clear(); // Clear previous selections
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
        const index = parseInt(checkbox.getAttribute('data-index'));
        
        if (e.target.checked) {
            state.selectedRows.add(index);
        }
    });
    
    updateBulkActions();
}

// Update bulk actions visibility
function updateBulkActions() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (state.selectedRows.size > 0) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = state.selectedRows.size;
    } else {
        bulkActions.style.display = 'none';
    }
}

// Filter subscribers
function filterSubscribers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterValue = document.getElementById('filterSelect').value;
    
    state.filteredSubscribers = state.subscribers.filter(subscriber => {
        // Search filter
        const matchesSearch = !searchTerm || 
            subscriber.firstName.toLowerCase().includes(searchTerm) ||
            subscriber.email.toLowerCase().includes(searchTerm);
        
        // Date filter
        let matchesDate = true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (filterValue === 'today') {
            matchesDate = subscriber.timestamp >= today;
        } else if (filterValue === 'week') {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesDate = subscriber.timestamp >= weekAgo;
        } else if (filterValue === 'month') {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesDate = subscriber.timestamp >= monthAgo;
        }
        
        return matchesSearch && matchesDate;
    });
    
    renderSubscribersTable();
}

// Export to CSV
function exportToCSV() {
    const headers = ['First Name', 'Email', 'Signup Date', 'Source'];
    const rows = state.filteredSubscribers.map(s => [
        s.firstName,
        s.email,
        formatDate(s.timestamp),
        s.source
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-evolution-ai-subscribers-${formatDate(new Date(), 'file')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Subscribers exported successfully!', 'success');
}

// Update dashboard statistics
function updateDashboardStats() {
    const totalSubscribers = document.getElementById('totalSubscribers');
    const todaySignups = document.getElementById('todaySignups');
    
    totalSubscribers.textContent = state.subscribers.length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = state.subscribers.filter(s => s.timestamp >= today).length;
    todaySignups.textContent = todayCount;
}

// Handle recipient change
function handleRecipientChange(e) {
    const customGroup = document.getElementById('customRecipientsGroup');
    const hasCustom = Array.from(e.target.selectedOptions).some(opt => opt.value === 'custom');
    
    customGroup.style.display = hasCustom ? 'block' : 'none';
}

// Handle template change
function handleTemplateChange(e) {
    const template = e.target.value;
    const emailContent = document.getElementById('emailContent');
    
    if (template !== 'custom' && state.emailTemplates[template]) {
        emailContent.value = state.emailTemplates[template];
    }
}

// Handle editor actions
function handleEditorAction(action) {
    const emailContent = document.getElementById('emailContent');
    
    switch (action) {
        case 'bold':
            wrapText(emailContent, '**', '**');
            break;
        case 'italic':
            wrapText(emailContent, '*', '*');
            break;
        case 'link':
            const url = prompt('Enter URL:');
            if (url) {
                wrapText(emailContent, '[', `](${url})`);
            }
            break;
        case 'preview':
            showEmailPreview();
            break;
    }
}

// Wrap selected text
function wrapText(textarea, before, after) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = before + selectedText + after;
    
    textarea.setRangeText(replacement);
    textarea.focus();
    textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
}

// Handle email form submission
async function handleEmailSubmit(e) {
    e.preventDefault();
    
    const formData = {
        recipients: Array.from(document.getElementById('recipients').selectedOptions).map(opt => opt.value),
        customRecipients: document.getElementById('customRecipients').value,
        subject: document.getElementById('emailSubject').value,
        content: document.getElementById('emailContent').value,
        testMode: document.getElementById('testMode').checked
    };
    
    if (formData.testMode) {
        showEmailPreview(formData);
    } else {
        await sendEmails(formData);
    }
}

// Show email preview
function showEmailPreview(formData) {
    const modal = document.getElementById('emailPreviewModal');
    const previewFrom = document.getElementById('previewFrom');
    const previewTo = document.getElementById('previewTo');
    const previewSubject = document.getElementById('previewSubject');
    const previewContent = document.getElementById('previewContent');
    
    // Get form data if not provided
    if (!formData) {
        formData = {
            recipients: Array.from(document.getElementById('recipients').selectedOptions).map(opt => opt.value),
            subject: document.getElementById('emailSubject').value,
            content: document.getElementById('emailContent').value
        };
    }
    
    // Set preview data
    const fromName = document.getElementById('fromName').value;
    const fromEmail = document.getElementById('fromEmail').value;
    previewFrom.textContent = `${fromName} <${fromEmail}>`;
    
    // Determine recipients
    let recipientCount = 0;
    if (formData.recipients.includes('all')) {
        recipientCount = state.subscribers.length;
    } else if (formData.recipients.includes('selected')) {
        recipientCount = state.selectedRows.size; // Changed from selectedEmails to selectedRows
    }
    
    previewTo.textContent = formData.testMode ? 
        fromEmail : 
        `${recipientCount} recipients`;
    
    previewSubject.textContent = formData.subject;
    
    // Process content with sample data
    const sampleData = { firstName: 'John' };
    const processedContent = processEmailContent(formData.content, sampleData);
    previewContent.innerHTML = processedContent.replace(/\n/g, '<br>');
    
    modal.style.display = 'flex';
}

// Process email content with variables
function processEmailContent(content, data) {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || match;
    });
}

// Close preview modal
function closePreviewModal() {
    document.getElementById('emailPreviewModal').style.display = 'none';
}

// Send email from preview
async function sendEmailFromPreview() {
    closePreviewModal();
    
    const formData = {
        recipients: Array.from(document.getElementById('recipients').selectedOptions).map(opt => opt.value),
        customRecipients: document.getElementById('customRecipients').value,
        subject: document.getElementById('emailSubject').value,
        content: document.getElementById('emailContent').value,
        testMode: false
    };
    
    await sendEmails(formData);
}

// Send emails
async function sendEmails(formData) {
    const sendBtn = document.querySelector('#emailComposeForm button[type="submit"]');
    const sendBtnText = document.getElementById('sendBtnText');
    const spinner = sendBtn.querySelector('.loading-spinner');
    
    // Show loading state
    sendBtn.disabled = true;
    sendBtnText.textContent = 'Sending...';
    spinner.style.display = 'inline-block';
    
    try {
        // In test mode, just show success
        if (CONFIG.TEST_MODE) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
            showNotification('Test mode: Emails would be sent to recipients', 'info');
        } else {
            // Actual email sending would go here
            // This would integrate with Gmail API or chosen email service
        }
        
        // Reset form
        document.getElementById('emailComposeForm').reset();
        
    } catch (error) {
        console.error('Error sending emails:', error);
        showNotification('Failed to send emails', 'error');
    } finally {
        // Reset button state
        sendBtn.disabled = false;
        sendBtnText.textContent = formData.testMode ? 'Send Test Email' : 'Send Email';
        spinner.style.display = 'none';
    }
}

// Save draft
function saveDraft() {
    const draft = {
        subject: document.getElementById('emailSubject').value,
        content: document.getElementById('emailContent').value,
        timestamp: new Date().toISOString()
    };
    
    const drafts = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.DRAFTS) || '[]');
    drafts.push(draft);
    localStorage.setItem(CONFIG.STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    
    showNotification('Draft saved successfully!', 'success');
}

// Test Google Sheets connection
async function testGoogleSheetsConnection() {
    const sheetsId = document.getElementById('sheetsId').value;
    
    if (!sheetsId) {
        showNotification('Please enter a Google Sheets ID', 'error');
        return;
    }
    
    try {
        // In a real implementation, you would test the connection here
        showNotification('Connection successful! (Test mode)', 'success');
    } catch (error) {
        showNotification('Connection failed. Please check your Sheets ID.', 'error');
    }
}

// Save settings
function saveSettings() {
    const settings = {
        [CONFIG.STORAGE_KEYS.SHEETS_ID]: document.getElementById('sheetsId').value,
        [CONFIG.STORAGE_KEYS.FROM_NAME]: document.getElementById('fromName').value,
        [CONFIG.STORAGE_KEYS.FROM_EMAIL]: document.getElementById('fromEmail').value,
        [CONFIG.STORAGE_KEYS.REPLY_TO]: document.getElementById('replyTo').value,
        [CONFIG.STORAGE_KEYS.EMAIL_SERVICE]: document.getElementById('apiService').value
    };
    
    // Save to localStorage
    Object.entries(settings).forEach(([key, value]) => {
        localStorage.setItem(key, value);
    });
    
    // Update config
    loadSettings();
    
    showNotification('Settings saved successfully!', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--white);
                border-radius: 8px;
                padding: 1rem 1.5rem;
                box-shadow: var(--shadow-lg);
                z-index: 2000;
                animation: slideIn 0.3s ease;
            }
            
            .notification-success {
                border-left: 4px solid var(--success);
            }
            
            .notification-error {
                border-left: 4px solid var(--danger);
            }
            
            .notification-info {
                border-left: 4px solid var(--info);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.25rem;
                cursor: pointer;
                color: var(--gray-600);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Utility function to email a single subscriber
function emailSubscriber(email, firstName) {
    // Switch to compose tab
    document.querySelector('[data-tab="compose"]').click();
    
    // Set custom recipients
    document.getElementById('recipients').value = 'custom';
    handleRecipientChange({ target: document.getElementById('recipients') });
    document.getElementById('customRecipients').value = email;
    
    // Focus on subject
    document.getElementById('emailSubject').focus();
}

// Update send button text
function updateSendButton() {
    const testMode = document.getElementById('testMode').checked;
    const sendBtnText = document.getElementById('sendBtnText');
    sendBtnText.textContent = testMode ? 'Send Test Email' : 'Send Email';
}

// Format date
function formatDate(date, format = 'display') {
    const d = new Date(date);
    
    if (format === 'file') {
        return d.toISOString().split('T')[0];
    }
    
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
} 

// ADDED: Handle bulk delete functionality
async function handleBulkDelete() {
    if (state.selectedRows.size === 0) {
        showNotification('No subscribers selected', 'warning');
        return;
    }
    
    const confirmed = confirm(`Are you sure you want to delete ${state.selectedRows.size} selected subscriber(s)? This action cannot be undone.`);
    
    if (!confirmed) {
        return;
    }
    
    try {
        // Get the selected subscribers to delete
        const subscribersToDelete = Array.from(state.selectedRows).map(index => state.filteredSubscribers[index]);
        
        // Send delete requests to Google Apps Script
        const deletePromises = subscribersToDelete.map(subscriber => {
            const formData = new FormData();
            formData.append('action', 'deleteSubscriber');
            formData.append('email', subscriber.email);
            formData.append('timestamp', subscriber.timestamp.toISOString());
            
            return fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: formData
            });
        });
        
        showNotification('Deleting subscribers...', 'info');
        
        const responses = await Promise.all(deletePromises);
        
        // Check if all deletions were successful
        let successCount = 0;
        for (const response of responses) {
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    successCount++;
                }
            }
        }
        
        if (successCount === subscribersToDelete.length) {
            showNotification(`Successfully deleted ${successCount} subscriber(s)`, 'success');
        } else {
            showNotification(`Deleted ${successCount} of ${subscribersToDelete.length} subscriber(s). Some deletions may have failed.`, 'warning');
        }
        
        // Clear selections and reload data
        state.selectedRows.clear();
        await loadSubscribers();
        
    } catch (error) {
        console.error('Error deleting subscribers:', error);
        showNotification('Error deleting subscribers. Please try again.', 'error');
    }
} 

// Consider adding to your form validation:
function sanitizeInput(input) {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

// ==========================================
// MANUAL SUBSCRIBER ADDITION FUNCTIONALITY
// ==========================================

// Open the add subscriber modal
function openAddSubscriberModal() {
    const modal = document.getElementById('addSubscriberModal');
    const form = document.getElementById('addSubscriberForm');
    
    // Reset form
    form.reset();
    
    // Hide any previous messages
    hideAddSubscriberMessage();
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus on first input
    document.getElementById('manualFirstName').focus();
}

// Close the add subscriber modal
function closeAddSubscriberModal() {
    const modal = document.getElementById('addSubscriberModal');
    modal.style.display = 'none';
}

// Handle add subscriber form submission
async function handleAddSubscriber(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('manualFirstName').value.trim();
    const email = document.getElementById('manualEmail').value.trim();
    const source = document.getElementById('manualSource').value;
    
    // Validate inputs
    if (!firstName) {
        showAddSubscriberMessage('Please enter a first name.', 'error');
        return;
    }
    
    if (!email) {
        showAddSubscriberMessage('Please enter an email address.', 'error');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAddSubscriberMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    // Check if email already exists (client-side check)
    const existingSubscriber = state.subscribers.find(sub => 
        sub.email.toLowerCase() === email.toLowerCase()
    );
    
    if (existingSubscriber) {
        showAddSubscriberMessage('This email address is already subscribed.', 'error');
        return;
    }
    
    // Show loading state
    setAddSubscriberLoadingState(true);
    
    try {
        // Submit to Google Sheets via the enhanced script
        const formData = new FormData();
        formData.append('firstName', firstName);
        formData.append('email', email);
        formData.append('timestamp', new Date().toISOString());
        formData.append('source', source);
        formData.append('ipAddress', 'Dashboard - Manual Entry');
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Success - add to local state immediately for instant feedback
            const newSubscriber = {
                firstName: firstName,
                email: email,
                timestamp: new Date(),
                source: source,
                selected: false
            };
            
            state.subscribers.unshift(newSubscriber); // Add to beginning of array
            state.filteredSubscribers = [...state.subscribers];
            
            // Re-render table
            renderSubscribersTable();
            updateDashboardStats();
            
            // Show success message
            showAddSubscriberMessage('Subscriber added successfully!', 'success');
            showNotification(`${firstName} has been added to your subscriber list!`, 'success');
            
            // Close modal after a short delay
            setTimeout(() => {
                closeAddSubscriberModal();
            }, 1500);
            
        } else {
            throw new Error(data.message || 'Failed to add subscriber');
        }
        
    } catch (error) {
        console.error('Error adding subscriber:', error);
        
        let errorMessage = 'Failed to add subscriber. Please try again.';
        if (error.message.includes('already subscribed')) {
            errorMessage = 'This email address is already subscribed.';
        }
        
        showAddSubscriberMessage(errorMessage, 'error');
    } finally {
        setAddSubscriberLoadingState(false);
    }
}

// Show message in add subscriber modal
function showAddSubscriberMessage(message, type) {
    const messageElement = document.getElementById('addSubscriberMessage');
    messageElement.textContent = message;
    messageElement.className = `form-message ${type}`;
    messageElement.style.display = 'block';
}

// Hide message in add subscriber modal
function hideAddSubscriberMessage() {
    const messageElement = document.getElementById('addSubscriberMessage');
    messageElement.style.display = 'none';
}

// Set loading state for add subscriber form
function setAddSubscriberLoadingState(isLoading) {
    const saveBtn = document.getElementById('saveSubscriberBtn');
    const saveBtnText = document.getElementById('saveSubscriberBtnText');
    const spinner = saveBtn.querySelector('.loading-spinner');
    const form = document.getElementById('addSubscriberForm');
    
    if (isLoading) {
        saveBtn.disabled = true;
        saveBtnText.textContent = 'Adding...';
        spinner.style.display = 'inline-block';
        
        // Disable form inputs
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => input.disabled = true);
    } else {
        saveBtn.disabled = false;
        saveBtnText.textContent = 'Add Subscriber';
        spinner.style.display = 'none';
        
        // Re-enable form inputs
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => input.disabled = false);
    }
} 