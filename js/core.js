// Core Variables and Initialization
let currentArtist = null;
let currentCurrency = 'IDR';
let salesData = {};
let productImages = {};
let customPrices = {};
let customCosts = {};
let customTitles = {};
let productNotes = {};
let productAvailability = {}; // 'available', 'sold-out', 'not-brought'
let currentReportHTML = '';

// Session Management
let sessionData = {
    eventName: '',
    eventDate: '',
    eventLocation: '',
    currency: 'IDR',
    startTime: null,
    active: false
};
let activeSession = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, starting initialization...');
    
    // First check if artistsDatabase is loaded
    if (typeof artistsDatabase === 'undefined') {
        console.error('❌ artistsDatabase is not loaded! Check artists.js file.');
        const container = document.getElementById('artistGrid');
        if (container) {
            container.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">❌ Artists database not loaded. Please check console for errors.</p>';
        }
        return;
    }
    
    console.log('✅ artistsDatabase loaded with', Object.keys(artistsDatabase).length, 'artists');
    
    try {
        // Load the saved data first
        loadAllData();
        console.log('✅ Data loaded');
        
        // Load active session
        const savedSession = localStorage.getItem('vpcomics_active_session');
        if (savedSession) {
            try {
                activeSession = JSON.parse(savedSession);
                console.log('🔑 Active session loaded:', activeSession.name);
                // Update currency from session
                if (activeSession && activeSession.currency) {
                    currentCurrency = activeSession.currency;
                }
            } catch (e) {
                console.error('Failed to parse session:', e);
                activeSession = null;
            }
        }
        
        // Special handling for emergency direct access
        if (window.location.pathname.includes('emergency_access.html')) {
            console.log('⚠️ Using emergency access mode');
            return; // The rest will be handled by the emergency_access.html script
        }
        
        // Check if we have an active session
        if (!activeSession || !activeSession.active) {
            console.log('⚠️ No active session, showing modal');
            // Show session setup modal
            setTimeout(() => showSessionModal(), 100);
        } else {
            console.log('✅ Active session found, updating display');
            // Update session display
            setTimeout(() => updateSessionDisplay(), 100);
        }
        
        // Handle direct_access request if present
        const directAccessArtist = localStorage.getItem('vpcomics_direct_access');
        if (directAccessArtist && artistsDatabase[directAccessArtist]) {
            console.log('🔑 Direct access requested for:', directAccessArtist);
            localStorage.removeItem('vpcomics_direct_access'); // Clear the request
            
            // Directly select the artist and bypass the grid
            selectArtist(directAccessArtist);
            console.log('✅ Direct access complete!');
        } else {
            // Normal startup with artist grid
            renderArtistSelector();
            console.log('✅ Artist selector called');
        }
        
        console.log('🎉 Initialization complete!');
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Safety measure - force direct access to PESA21
        alert('❌ There was an error loading the application. Redirecting to emergency access...');
        window.location.href = 'emergency_access.html';
    }
});

// Currency and Formatting Functions
function setCurrency(currency) {
    currentCurrency = currency;
    document.querySelectorAll('.currency-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderItems();
    updateTotalDisplay();
}

function formatCurrency(amount) {
    if (currentCurrency === 'IDR') {
        return 'Rp' + amount.toLocaleString('id-ID');
    } else {
        return '$' + amount.toFixed(2);
    }
}

// Session Management Functions
function showSessionModal() {
    const modal = document.getElementById('sessionModal');
    const dateInput = document.getElementById('sessionEventDate');
    
    // Set today's date as default
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Force modal to use flex display for centering
    if (modal) {
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
    }
}

function hideSessionModal() {
    const modal = document.getElementById('sessionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setSessionCurrency(currency) {
    currentCurrency = currency;
    document.querySelectorAll('#sessionModal .currency-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.includes(currency));
    });
}

function startSession() {
    const eventName = document.getElementById('sessionEventName').value.trim();
    const eventDate = document.getElementById('sessionEventDate').value;
    const eventLocation = document.getElementById('sessionEventLocation').value.trim();
    
    if (!eventName || !eventDate) {
        alert('⚠️ Event name and date are required to start!');
        return;
    }
    
    // Create session object
    activeSession = {
        id: Date.now(),
        name: eventName,
        date: eventDate,
        location: eventLocation || 'Convention Center',
        currency: currentCurrency,
        startedAt: new Date().toISOString(),
        active: true
    };
    
    // Save session
    localStorage.setItem('vpcomics_active_session', JSON.stringify(activeSession));
    
    // Remove no-session warning if exists
    const warning = document.getElementById('noSessionWarning');
    if (warning) {
        warning.remove();
    }
    
    // Update display
    updateSessionDisplay();
    
    // Hide modal
    hideSessionModal();
}

function continueWithoutSession() {
    // Allow access without session for admin tasks
    hideSessionModal();
    
    // Show warning that sales won't be tracked properly
    const warningBanner = document.createElement('div');
    warningBanner.className = 'no-session-warning';
    warningBanner.innerHTML = `
        <span>⚠️ No Active Session - Sales tracking disabled</span>
        <button onclick="showSessionModal()" class="start-session-btn">Start Session</button>
    `;
    warningBanner.id = 'noSessionWarning';
    
    // Insert after header if not already there
    if (!document.getElementById('noSessionWarning')) {
        document.querySelector('.header').after(warningBanner);
    }
}

function updateSessionDisplay() {
    const sessionInfo = document.getElementById('sessionInfo');
    const sessionName = document.getElementById('sessionName');
    
    if (activeSession && activeSession.active) {
        sessionInfo.style.display = 'flex';
        sessionName.textContent = `${activeSession.name} - ${new Date(activeSession.date).toLocaleDateString()}`;
        
        // Remove any existing status badge first
        const existingStatus = document.querySelector('.session-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Add active indicator
        const statusBadge = document.createElement('span');
        statusBadge.className = 'session-status active';
        statusBadge.textContent = activeSession.restored ? '↻ RESTORED' : '● ACTIVE';
        document.querySelector('.session-badge').appendChild(statusBadge);
    } else {
        sessionInfo.style.display = 'none';
        // Remove any status badge
        const existingStatus = document.querySelector('.session-status');
        if (existingStatus) {
            existingStatus.remove();
        }
    }
}

function editSession() {
    alert('⚠️ Cannot edit an active session!\n\nTo change event details, please complete the current session first.');
}

// End Session function
function endSession() {
    if (!activeSession || !activeSession.active) {
        alert('⚠️ No active session to end!');
        return;
    }
    
    // Use the saveConventionSnapshot function to properly end the session
    if (typeof saveConventionSnapshot === 'function') {
        saveConventionSnapshot();
    } else {
        // Fallback if saveConventionSnapshot is not available
        if (confirm('🏁 End current session?\n\nThis will complete the session and prepare for the next event.')) {
            activeSession.active = false;
            activeSession.endedAt = new Date().toISOString();
            localStorage.setItem('vpcomics_active_session', JSON.stringify(activeSession));
            activeSession = null;
            updateSessionDisplay();
            alert('✅ Session ended successfully!');
        }
    }
}