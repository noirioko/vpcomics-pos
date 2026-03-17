// inventory-core.js - Core inventory management functionality

// Initialize inventory system
const INVENTORY_KEY = 'vpcomics_inventory';
const LOCATIONS_KEY = 'vpcomics_locations';

// Default storage locations
const DEFAULT_LOCATIONS = [
    { id: 'loc_1', name: 'Convention Box A', type: 'Box', description: 'Large plastic box for conventions', color: '#FF6B6B', active: true },
    { id: 'loc_2', name: 'Display Shelf', type: 'Shelf', description: 'Main display area', color: '#4ECDC4', active: true },
    { id: 'loc_3', name: 'Storage Drawer 1', type: 'Drawer', description: 'Small items and accessories', color: '#45B7D1', active: true }
];

// Inventory state
let inventoryData = {
    items: [],
    lastUpdated: new Date().toISOString()
};

let locationsData = {
    locations: DEFAULT_LOCATIONS,
    lastUpdated: new Date().toISOString()
};

// Load inventory data from localStorage
function loadInventoryData() {
    const saved = localStorage.getItem(INVENTORY_KEY);
    if (saved) {
        try {
            inventoryData = JSON.parse(saved);
            // Ensure items array exists
            if (!inventoryData.items || !Array.isArray(inventoryData.items)) {
                inventoryData.items = [];
            }
        } catch (e) {
            console.error('Error loading inventory data:', e);
            inventoryData = { items: [], lastUpdated: new Date().toISOString() };
        }
    } else {
        // Initialize with default structure if no saved data
        inventoryData = { items: [], lastUpdated: new Date().toISOString() };
    }
    // Update the global reference
    window.inventoryData = inventoryData;
}

// Save inventory data to localStorage
function saveInventoryData() {
    inventoryData.lastUpdated = new Date().toISOString();
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventoryData));
    // Ensure global reference is updated
    window.inventoryData = inventoryData;
}

// Load locations data from localStorage
function loadLocationsData() {
    const saved = localStorage.getItem(LOCATIONS_KEY);
    if (saved) {
        try {
            locationsData = JSON.parse(saved);
            // Ensure locations array exists
            if (!locationsData.locations || !Array.isArray(locationsData.locations)) {
                locationsData.locations = DEFAULT_LOCATIONS;
            }
        } catch (e) {
            console.error('Error loading locations data:', e);
            locationsData = { locations: DEFAULT_LOCATIONS, lastUpdated: new Date().toISOString() };
        }
    } else {
        // Initialize with default structure if no saved data
        locationsData = { locations: DEFAULT_LOCATIONS, lastUpdated: new Date().toISOString() };
    }
    // Update the global reference
    window.locationsData = locationsData;
}

// Save locations data to localStorage
function saveLocationsData() {
    locationsData.lastUpdated = new Date().toISOString();
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locationsData));
    // Ensure global reference is updated
    window.locationsData = locationsData;
}

// Generate unique ID
function generateId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate location ID
function generateLocationId() {
    return 'loc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get all items
function getAllItems() {
    // Always use window.inventoryData to ensure we're getting the latest data
    if (!window.inventoryData || !window.inventoryData.items) {
        return inventoryData.items || [];
    }
    return window.inventoryData.items || [];
}

// Get all active locations
function getActiveLocations() {
    return locationsData.locations.filter(loc => loc.active !== false);
}

// Add or update an item
function saveInventoryItem(itemData) {
    if (!itemData.id) {
        itemData.id = generateId();
        itemData.createdAt = new Date().toISOString();
    }
    
    itemData.updatedAt = new Date().toISOString();
    
    const existingIndex = inventoryData.items.findIndex(item => item.id === itemData.id);
    if (existingIndex !== -1) {
        inventoryData.items[existingIndex] = itemData;
    } else {
        inventoryData.items.push(itemData);
    }
    
    saveInventoryData();
    return itemData;
}

// Delete an item
function deleteInventoryItem(itemId) {
    inventoryData.items = inventoryData.items.filter(item => item.id !== itemId);
    saveInventoryData();
}

// Get inventory statistics
function getInventoryStats() {
    const items = getAllItems();
    const locations = getActiveLocations();
    
    let totalQuantity = 0;
    let locationCounts = {};
    let artistCounts = {};
    
    items.forEach(item => {
        if (item.locations) {
            item.locations.forEach(loc => {
                totalQuantity += parseInt(loc.quantity) || 0;
                locationCounts[loc.locationId] = (locationCounts[loc.locationId] || 0) + (parseInt(loc.quantity) || 0);
            });
        }
        
        if (item.artist) {
            artistCounts[item.artist] = (artistCounts[item.artist] || 0) + 1;
        }
    });
    
    return {
        totalItems: items.length,
        totalQuantity: totalQuantity,
        totalLocations: locations.length,
        locationCounts: locationCounts,
        artistCounts: artistCounts
    };
}

// This initialization is now handled by inventory-init.js

// Function to check if items have already been imported
function hasImportedItems() {
    const items = getAllItems();
    if (!items || items.length === 0) return false;
    
    // Check if any item in inventory matches POS artists
    if (typeof artistsDatabase === 'undefined') return false;
    
    const posArtists = Object.values(artistsDatabase)
        .filter(artist => artist.name && artist.name !== 'ADMIN')
        .map(artist => artist.name);
    
    return items.some(item => posArtists.includes(item.artist));
}

// Debug function to check what's loaded
function debugInventorySystem() {
    console.log('=== Inventory System Debug ===');
    console.log('1. Artists database loaded:', typeof artistsDatabase !== 'undefined');
    if (typeof artistsDatabase !== 'undefined') {
        console.log('   Artists available:', Object.keys(artistsDatabase));
    }
    console.log('2. Inventory data:', inventoryData);
    console.log('3. Total items:', inventoryData.items ? inventoryData.items.length : 0);
    console.log('4. Locations data:', locationsData);
    console.log('5. Total locations:', locationsData.locations ? locationsData.locations.length : 0);
    console.log('=============================');
}

// Make debug function available globally
window.debugInventorySystem = debugInventorySystem;

// Update import button state based on whether items exist
function updateImportButtonState() {
    const importBtn = document.querySelector('button[onclick="showImportModal()"]');
    if (!importBtn) return;
    
    if (hasImportedItems()) {
        importBtn.innerHTML = '📥 Import More from POS';
        importBtn.title = 'Import additional items from POS';
    } else {
        importBtn.innerHTML = '📥 Import from POS';
        importBtn.title = 'Import from POS';
    }
}

// Make core functions globally available
window.getAllItems = getAllItems;
window.getActiveLocations = getActiveLocations;
window.saveInventoryItem = saveInventoryItem;
window.deleteInventoryItem = deleteInventoryItem;
window.getInventoryStats = getInventoryStats;
window.hasImportedItems = hasImportedItems;
window.updateImportButtonState = updateImportButtonState;
window.loadInventoryData = loadInventoryData;
window.loadLocationsData = loadLocationsData;
window.saveInventoryData = saveInventoryData;
window.saveLocationsData = saveLocationsData;
window.generateId = generateId;
window.generateLocationId = generateLocationId;

// Also make data objects globally available
window.inventoryData = inventoryData;
window.locationsData = locationsData;
