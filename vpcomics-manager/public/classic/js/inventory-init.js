// Inventory System Initialization
// This ensures all modules are loaded in the correct order

// Wait for DOM and all scripts to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Inventory System...');
    
    // Verify all required modules are loaded
    const requiredModules = {
        'artistsDatabase': typeof artistsDatabase !== 'undefined',
        'inventoryData': typeof window.inventoryData !== 'undefined',
        'locationsData': typeof window.locationsData !== 'undefined',
        'loadInventoryData': typeof loadInventoryData === 'function',
        'loadLocationsData': typeof loadLocationsData === 'function',
        'renderInventory': typeof renderInventory === 'function',
        'renderLocations': typeof renderLocations === 'function',
        'showImportModal': typeof showImportModal === 'function'
    };
    
    // Check if all modules are loaded
    let allLoaded = true;
    for (const [module, loaded] of Object.entries(requiredModules)) {
        if (!loaded) {
            console.error(`❌ Module not loaded: ${module}`);
            allLoaded = false;
        } else {
            console.log(`✅ Module loaded: ${module}`);
        }
    }
    
    if (!allLoaded) {
        console.error('❌ Some modules failed to load. Please refresh the page.');
        alert('Error loading inventory system. Please refresh the page.');
        return;
    }
    
    // Initialize the inventory system
    try {
        // Load saved data
        loadInventoryData();
        loadLocationsData();
        
        // IMPORTANT: Ensure global references are set
        if (!window.inventoryData) {
            window.inventoryData = inventoryData;
        }
        if (!window.locationsData) {
            window.locationsData = locationsData;
        }
        
        // Render the UI - check if elements exist first
        if (document.getElementById('locationsGrid')) {
            renderLocations();
        }
        
        if (document.getElementById('inventoryGrid')) {
            renderInventory();
        }
        
        if (document.getElementById('inventoryStats')) {
            updateStats();
        }
        
        // Don't call populateQuickFilters - updateStats already calls updateArtistFilters
        // if (document.getElementById('quickFilters')) {
        //     populateQuickFilters();
        // }
        
        // Update import button state
        updateImportButtonState();
        
        // Initialize the UI components
        if (typeof initializeInventoryUI === 'function') {
            initializeInventoryUI();
        } else {
            console.error('❌ initializeInventoryUI function not found!');
        }
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('✅ Inventory system initialized successfully!');
        
        // Debug info
        console.log(`📦 Total items: ${window.inventoryData?.items ? window.inventoryData.items.length : 0}`);
        console.log(`📍 Total locations: ${window.locationsData?.locations ? window.locationsData.locations.length : 0}`);
        console.log(`🎨 Artists available: ${Object.keys(artistsDatabase).length}`);
        
    } catch (error) {
        console.error('❌ Error initializing inventory system:', error);
        alert('Error initializing inventory system. Check console for details.');
    }
});

// Set up event listeners
function setupEventListeners() {
    // Search functionality
    const searchBox = document.getElementById('inventorySearch');
    if (searchBox) {
        searchBox.addEventListener('input', function() {
            renderInventory();
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + N: Add new item
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            showAddItemModal();
        }
        
        // Ctrl/Cmd + L: Add new location
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            showAddLocationModal();
        }
        
        // Ctrl/Cmd + F: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchBox = document.getElementById('inventorySearch');
            if (searchBox) searchBox.focus();
        }
        
        // Ctrl/Cmd + E: Export to CSV
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportToCSV();
        }
        
        // ESC: Close modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Click outside modals to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Make debug function available
window.inventorySystemStatus = function() {
    console.log('=== Inventory System Status ===');
    console.log('Artists loaded:', typeof artistsDatabase !== 'undefined');
    if (typeof artistsDatabase !== 'undefined') {
        console.log('Artists count:', Object.keys(artistsDatabase).length);
        console.log('Artists:', Object.keys(artistsDatabase));
    }
    console.log('Inventory items:', window.inventoryData?.items?.length || 0);
    console.log('Locations:', window.locationsData?.locations?.length || 0);
    console.log('=============================');
};
