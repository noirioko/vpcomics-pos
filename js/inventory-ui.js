// inventory-ui.js - UI initialization and event handlers

// This function is called by inventory-init.js after ensuring all modules are loaded
function initializeInventoryUI() {
    console.log('Initializing inventory UI...');
    
    // Set up modal close handlers
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            currentItemId = null;
            currentLocationId = null;
        }
        
        // Close shortcuts help when clicking outside
        const shortcutsHelp = document.getElementById('shortcutsHelp');
        const helpBtn = event.target.closest('.btn-help');
        if (shortcutsHelp && shortcutsHelp.style.display !== 'none' && 
            !shortcutsHelp.contains(event.target) && !helpBtn) {
            shortcutsHelp.style.display = 'none';
            // Reset button style
            const helpBtnElement = document.querySelector('.btn-help');
            if (helpBtnElement) helpBtnElement.style.background = '';
        }
    };
    
    // Set up keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // ESC to close modals and shortcuts help
        if (e.key === 'Escape') {
            closeItemModal();
            closeLocationModal();
            // Close bulk update modal if open
            const bulkModal = document.getElementById('bulkUpdateModal');
            if (bulkModal && bulkModal.style.display !== 'none') {
                closeBulkUpdateModal();
            }
            // Close shortcuts help
            const shortcutsHelp = document.getElementById('shortcutsHelp');
            if (shortcutsHelp && shortcutsHelp.style.display !== 'none') {
                shortcutsHelp.style.display = 'none';
                const helpBtn = document.querySelector('.btn-help');
                if (helpBtn) helpBtn.style.background = '';
            }
        }
        
        // Ctrl/Cmd+I for new item (I = Inventory)
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            showAddItemModal();
        }
        
        // Ctrl/Cmd+L for new location
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            showAddLocationModal();
        }
        
        // Ctrl/Cmd+F for search focus
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('inventorySearch').focus();
        }
        
        // Ctrl/Cmd+E for export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportInventoryToCSV();
        }
    });
    
    // Auto-save reminder
    setInterval(function() {
        // Data is already being saved on each operation
        // This is just a backup save
        saveInventoryData();
        saveLocationsData();
    }, 60000); // Every minute
    
    // Create artists compatibility reference
    if (typeof artistsDatabase !== 'undefined') {
        window.artists = artistsDatabase;
    }
}

// Make initialization function available globally
window.initializeInventoryUI = initializeInventoryUI;

// Filter functions are now handled by inventory-items.js
// Removed duplicate populateQuickFilters and filterByArtist functions to avoid conflicts

// Search inventory DOM elements (different from data search)
function searchInventoryDOM() {
    const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
    const items = document.querySelectorAll('.inventory-row');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (searchTerm === '' || text.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Export to CSV wrapper
function exportToCSV() {
    if (typeof exportInventoryToCSV === 'function') {
        exportInventoryToCSV();
    } else {
        console.error('Export function not found');
    }
}

// Remove the conflicting searchInventory global assignment
// window.searchInventory = searchInventory; // REMOVED - was overriding the correct function
window.exportToCSV = exportToCSV;

// updateStats is defined in inventory-items.js, no need to duplicate

// Auto-import POS items on first load
function autoImportPOSItems() {
    const items = getAllItems();
    
    // Only import if inventory is empty
    if (items.length === 0 && typeof window.artists !== 'undefined') {
        console.log('First time setup - importing all POS items...');
        
        let imported = 0;
        const defaultLocationId = 'loc_1'; // Convention Box A
        
        // Count total items first
        let totalItems = 0;
        Object.keys(window.artists).forEach(artistKey => {
            if (window.artists[artistKey] && window.artists[artistKey].products) {
                totalItems += window.artists[artistKey].products.length;
            }
        });
        
        // Show loading notification
        showNotification(`Importing ${totalItems} items from POS catalog... 📦`, 'info');
        
        // Import all artists' products
        Object.keys(window.artists).forEach(artistKey => {
            if (window.artists[artistKey] && window.artists[artistKey].products) {
                window.artists[artistKey].products.forEach(product => {
                    const itemData = {
                        code: product.code || '',
                        name: product.name,
                        artist: artistKey,
                        notes: product.description || product.variations || '',
                        locations: [{
                            locationId: defaultLocationId,
                            locationName: 'Convention Box A',
                            quantity: 0 // Start with 0, user can update later
                        }]
                    };
                    
                    saveInventoryItem(itemData);
                    imported++;
                });
            }
        });
        
        if (imported > 0) {
            console.log(`Successfully imported ${imported} items from POS!`);
            // Refresh the display
            renderInventory();
            updateStats();
            
            // Show success notification with helpful message
            setTimeout(() => {
                showNotification(`✅ Successfully imported ${imported} items! Use the "📦 Bulk Update" button to add quantities.`, 'success');
                
                // Add pulse effect to bulk update button
                const bulkBtn = document.querySelector('.btn-success[onclick="showBulkUpdateModal()"]');
                if (bulkBtn) {
                    bulkBtn.style.animation = 'pulse 2s ease-in-out 3';
                    setTimeout(() => {
                        bulkBtn.style.animation = '';
                    }, 6000);
                }
            }, 500);
        }
    }
}

// Toggle shortcuts help
function toggleShortcutsHelp() {
    const helpDiv = document.getElementById('shortcutsHelp');
    const helpBtn = document.querySelector('.btn-help');
    
    if (helpDiv) {
        if (helpDiv.style.display === 'none' || helpDiv.style.display === '') {
            helpDiv.style.display = 'block';
            // Scroll to help section
            helpDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            // Update button style
            if (helpBtn) helpBtn.style.background = '#4a5568';
        } else {
            helpDiv.style.display = 'none';
            // Reset button style
            if (helpBtn) helpBtn.style.background = '';
        }
    }
}

// Make functions globally available
window.toggleShortcutsHelp = toggleShortcutsHelp;
window.showNotification = showNotification;
// Import functions are now handled by inventory-import.js

// Set up export button
function setupExportButton() {
    const inventoryHeader = document.querySelector('.inventory-header');
    if (inventoryHeader && !document.getElementById('exportToCSV')) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'exportToCSV';
        exportBtn.className = 'btn-secondary';
        exportBtn.innerHTML = '📥 Export to Excel';
        exportBtn.onclick = exportInventoryToCSV;
        
        const controls = inventoryHeader.querySelector('.inventory-controls');
        if (controls) {
            controls.appendChild(exportBtn);
        }
    }
}

// Export inventory to CSV (Excel compatible)
function exportInventoryToCSV() {
    const items = getAllItems();
    const locations = getActiveLocations();
    
    // Create CSV header
    let csv = 'Product Code,Product Name,Artist/Category,Location(s),Quantity,Notes\n';
    
    // Add items
    items.forEach(item => {
        const code = item.code || '';
        const name = item.name || '';
        const artist = item.artist || '';
        const notes = (item.notes || '').replace(/"/g, '""'); // Escape quotes
        
        // Format locations
        let locationStr = '';
        let totalQty = 0;
        
        if (item.locations && item.locations.length > 0) {
            locationStr = item.locations.map(loc => {
                totalQty += parseInt(loc.quantity) || 0;
                return `${loc.locationName} (${loc.quantity})`;
            }).join('; ');
        } else {
            locationStr = 'No location';
        }
        
        // Add row
        csv += `"${code}","${name}","${artist}","${locationStr}",${totalQty},"${notes}"\n`;
    });
    
    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    showNotification('Inventory exported successfully! 🎉', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 2000;
            transition: all 0.3s;
            transform: translateX(400px);
        `;
        document.body.appendChild(notification);
    }
    
    // Set color based on type
    const colors = {
        success: 'linear-gradient(135deg, #48bb78, #38a169)',
        error: 'linear-gradient(135deg, #f56565, #e53e3e)',
        info: 'linear-gradient(135deg, #4299e1, #3182ce)'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.transform = 'translateX(0)';
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
    }, 3000);
}

// Set up import from POS functionality
function setupImportFromPOS() {
    // The import button is already in the HTML, we don't need to add it again
    console.log('Import from POS functionality ready');
    // Ensure the import button calls the right function from inventory-import.js
    const importBtn = document.querySelector('button[onclick="showImportModal()"]');
    if (importBtn && typeof showImportModal === 'function') {
        console.log('Import button connected to showImportModal from inventory-import.js');
    }
}

// The showImportModal function is now defined in inventory-import.js
// Remove this duplicate to avoid conflicts

// These functions are now defined in inventory-import.js
// Remove duplicates to avoid conflicts

// Export inventory data
function exportInventoryData() {
    const data = {
        inventory: window.inventoryData,
        locations: window.locationsData,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vpcomics_inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Quick stats tooltip
function showLocationDetails(locationId) {
    const items = (window.inventoryData?.items || []).filter(item => 
        item.locations && item.locations.some(loc => loc.locationId === locationId)
    );
    
    if (items.length === 0) {
        alert('No items in this location yet!');
        return;
    }
    
    const itemsList = items.map(item => {
        const locData = item.locations.find(loc => loc.locationId === locationId);
        return `• ${item.name} (${locData.quantity})`;
    }).join('\n');
    
    alert(`Items in this location:\n\n${itemsList}`);
}
