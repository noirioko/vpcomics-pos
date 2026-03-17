// Data Persistence Functions

// Auto-save functionality
let saveTimeout = null;

function autoSave() {
    // Clear any existing timeout
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    
    // Save after a short delay to batch changes
    saveTimeout = setTimeout(() => {
        saveAllData();
        console.log('✅ Auto-saved at', new Date().toLocaleTimeString());
    }, 500);
}

// Save data to localStorage
function saveAllData() {
    try {
        const data = {
            salesData,
            productImages,
            customPrices,
            customCosts,
            customTitles,
            productNotes,
            productAvailability
        };
        
        localStorage.setItem('vpcomics_artist_manager_data', JSON.stringify(data));
        
        // Also save current artist and currency state
        if (currentArtist) {
            localStorage.setItem('vpcomics_last_artist', currentArtist);
        }
        localStorage.setItem('vpcomics_currency', currentCurrency);
        
    } catch (error) {
        console.error('Error saving data:', error);
        if (error.name === 'QuotaExceededError') {
            alert('🚫 Storage full! Try refreshing the page.');
        }
    }
}

function loadAllData() {
    const saved = localStorage.getItem('vpcomics_artist_manager_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            salesData = data.salesData || {};
            productImages = data.productImages || {};
            customPrices = data.customPrices || {};
            customCosts = data.customCosts || {};
            customTitles = data.customTitles || {};
            productNotes = data.productNotes || {};
            productAvailability = data.productAvailability || {};
        } catch (error) {
            console.error('Error loading saved data:', error);
            // Initialize empty if corrupted
            salesData = {};
            productImages = {};
            customPrices = {};
            customCosts = {};
            customTitles = {};
            productNotes = {};
            productAvailability = {};
        }
    }
    
    // Load last currency preference
    const savedCurrency = localStorage.getItem('vpcomics_currency');
    if (savedCurrency) {
        currentCurrency = savedCurrency;
    }
}

// Auto-save when window is about to close
window.addEventListener('beforeunload', () => {
    saveAllData();
    console.log('💾 Saved data before closing');
});

// Save when page visibility changes (mobile background, tab switch)
window.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        saveAllData();
        console.log('💾 Saved data on visibility change');
    }
});

function loadArtistData(artistId) {
    // With session system, we don't need to load individual artist event data anymore
    // The session applies to all artists
}

function saveCurrentState() {
    try {
        if (!currentArtist) {
            alert('⚠️ Please select an artist first!');
            return;
        }
        
        // Just save the data, session info is already saved separately
        saveAllData();
        alert('✅ Current state saved successfully!');
    } catch (error) {
        console.error('Error saving state:', error);
        alert('❌ Error saving state. Please try again.');
    }
}

function loadEventData() {
    // Compatibility function - no longer needed with session system
}
