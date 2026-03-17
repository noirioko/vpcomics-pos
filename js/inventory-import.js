// inventory-import.js - Import functionality from POS to Inventory

// Show import modal
function showImportModal() {
    console.log('Opening import modal...');
    
    // Ensure inventory data is loaded
    loadInventoryData();
    loadLocationsData();
    
    if (typeof artistsDatabase === 'undefined') {
        alert('❌ Artists database not loaded! Please refresh the page.');
        return;
    }
    
    console.log('Artists database:', artistsDatabase);
    
    // Populate artist checkboxes
    const checkboxContainer = document.getElementById('artistCheckboxes');
    checkboxContainer.innerHTML = '';
    
    let hasArtists = false;
    
    Object.keys(artistsDatabase).forEach(artistKey => {
        console.log(`Checking artist: ${artistKey}`);
        
        if (artistKey !== 'admin') {
            const artist = artistsDatabase[artistKey];
            let productCount = 0;
            
            // Count products in all categories
            if (artist.products && typeof artist.products === 'object') {
                Object.keys(artist.products).forEach(categoryKey => {
                    const category = artist.products[categoryKey];
                    if (Array.isArray(category)) {
                        productCount += category.length;
                        console.log(`  Category ${categoryKey}: ${category.length} products`);
                    }
                });
            }
            
            console.log(`  Total products for ${artist.name}: ${productCount}`);
            
            if (productCount > 0) {
                hasArtists = true;
                const label = document.createElement('label');
                label.innerHTML = `
                    <input type="checkbox" value="${artistKey}" class="artist-checkbox">
                    <span>${artist.name} (${productCount} items)</span>
                `;
                checkboxContainer.appendChild(label);
            }
        }
    });
    
    if (!hasArtists) {
        checkboxContainer.innerHTML = '<p style="color: #666; text-align: center;">No artists with products found. Please check if artists.js is loaded correctly.</p>';
    }
    
    // Populate location dropdown
    const locationSelect = document.getElementById('defaultImportLocation');
    locationSelect.innerHTML = '<option value="">-- No Default Location --</option>';
    
    if (window.locationsData && window.locationsData.locations) {
        window.locationsData.locations.forEach(location => {
            if (location.active !== false) {
                const option = document.createElement('option');
                option.value = location.id;
                option.textContent = location.name;
                option.style.color = location.color;
                locationSelect.appendChild(option);
            }
        });
    }
    
    // Update import stats
    updateImportStats();
    
    // Show modal with proper centering
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
    }
}

// Close import modal
function closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
}

// Toggle all artist checkboxes
function toggleAllArtists() {
    const selectAll = document.getElementById('selectAllArtists').checked;
    document.querySelectorAll('.artist-checkbox').forEach(checkbox => {
        checkbox.checked = selectAll;
    });
    updateImportStats();
}

// Update import statistics
function updateImportStats() {
    const selectedArtists = Array.from(document.querySelectorAll('.artist-checkbox:checked')).map(cb => cb.value);
    const statsDiv = document.getElementById('importStats');
    
    if (selectedArtists.length === 0) {
        statsDiv.innerHTML = '<p style="color: #666;">Select artists to see import preview</p>';
        return;
    }
    
    let totalItems = 0;
    let existingItems = 0;
    let newItems = 0;
    
    selectedArtists.forEach(artistKey => {
        const artist = artistsDatabase[artistKey];
        if (artist && artist.products) {
            Object.values(artist.products).forEach(category => {
                if (Array.isArray(category)) {
                    category.forEach(product => {
                        totalItems++;
                        
                        // Check if item already exists
                        const exists = window.inventoryData.items.find(item => 
                            item.code === product.code || 
                            (item.name === product.name && item.artist === artist.name)
                        );
                        
                        if (exists) {
                            existingItems++;
                        } else {
                            newItems++;
                        }
                    });
                }
            });
        }
    });
    
    statsDiv.innerHTML = `
        <div class="import-preview">
            <h4>Import Preview:</h4>
            <ul>
                <li>Total items to process: <strong>${totalItems}</strong></li>
                <li>New items to import: <strong style="color: #48bb78">${newItems}</strong></li>
                <li>Already exists (will skip): <strong style="color: #f6ad55">${existingItems}</strong></li>
            </ul>
        </div>
    `;
}

// Add event listeners for checkboxes
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('artist-checkbox')) {
        updateImportStats();
    }
});

// Import items from POS
function importFromPOS() {
    const selectedArtists = Array.from(document.querySelectorAll('.artist-checkbox:checked')).map(cb => cb.value);
    
    if (selectedArtists.length === 0) {
        alert('Please select at least one artist to import!');
        return;
    }
    
    const defaultLocationId = document.getElementById('defaultImportLocation').value;
    let defaultLocation = null;
    
    if (defaultLocationId && window.locationsData && window.locationsData.locations) {
        defaultLocation = window.locationsData.locations.find(loc => loc.id === defaultLocationId);
    }
    
    let imported = 0;
    let skipped = 0;
    
    // Make sure we're loading the current inventory data
    loadInventoryData();
    loadLocationsData();
    
    // Ensure inventoryData is initialized
    if (!window.inventoryData || !window.inventoryData.items) {
        window.inventoryData = { items: [], lastUpdated: new Date().toISOString() };
    }
    
    selectedArtists.forEach(artistKey => {
        const artist = artistsDatabase[artistKey];
        if (artist && artist.products) {
            Object.values(artist.products).forEach(category => {
                if (Array.isArray(category)) {
                    category.forEach(product => {
                        // Check if already exists
                        const exists = window.inventoryData.items.find(item => 
                            item.code === product.code || 
                            (item.name === product.name && item.artist === artist.name)
                        );
                        
                        if (!exists) {
                            const itemData = {
                                id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                                code: product.code || '',
                                name: product.name,
                                artist: artist.name,
                                notes: product.notes || product.description || product.variations || '',
                                locations: defaultLocation ? [{
                                    locationId: defaultLocation.id,
                                    locationName: defaultLocation.name,
                                    quantity: 0
                                }] : [],
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            };
                            
                            // Add to inventory
                            window.inventoryData.items.push(itemData);
                            imported++;
                        } else {
                            skipped++;
                        }
                    });
                }
            });
        }
    });
    
    // Save to localStorage
    saveInventoryData();
    
    // Show results
    alert(`✅ Import Complete!\n\nImported: ${imported} items\nSkipped: ${skipped} items (already existed)`);
    
    // Close modal and refresh display
    closeImportModal();
    
    // Ensure the table is properly rendered
    if (typeof renderInventory === 'function') {
        console.log('Rendering inventory after import...');
        renderInventory();
    } else {
        console.error('renderInventory function not found!');
    }
    
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    if (typeof updateImportButtonState === 'function') {
        updateImportButtonState();
    }
}

// Add CSS for import modal
const importStyles = `
<style>
/* Import Modal Specific Styles */
#importModal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.import-info {
    background: #f7fafc;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 25px;
    border: 1px solid #e2e8f0;
}

.import-info p {
    margin: 5px 0;
    color: #4a5568;
}

.import-options {
    margin: 25px 0;
}

.import-options h3 {
    margin-bottom: 15px;
    color: #2d3748;
}

.artist-checkboxes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    padding: 15px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    max-height: 300px;
    overflow-y: auto;
}

.artist-checkboxes label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;
    transition: all 0.2s;
    font-weight: 500;
    color: #4a5568;
}

.artist-checkboxes label:hover {
    background: #edf2f7;
    color: #2d3748;
}

.artist-checkboxes input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.import-actions {
    margin-top: 15px;
    padding: 15px;
    background: #f7fafc;
    border-radius: 8px;
}

.import-actions label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    color: #2d3748;
    cursor: pointer;
}

.import-location {
    margin: 25px 0;
}

.import-location label {
    display: block;
    margin-bottom: 10px;
    font-weight: 600;
    color: #4a5568;
}

.import-location select {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 15px;
    background: white;
    cursor: pointer;
}

.import-stats {
    margin: 25px 0;
    padding: 20px;
    background: #f7fafc;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
}

.import-preview h4 {
    margin: 0 0 15px 0;
    color: #2d3748;
}

.import-preview ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.import-preview li {
    padding: 8px 0;
    color: #4a5568;
    display: flex;
    justify-content: space-between;
}

.import-preview strong {
    font-weight: 600;
}
</style>
`;

// Add styles to the page if not already present
if (!document.getElementById('importStyles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'importStyles';
    styleElement.innerHTML = importStyles;
    document.head.appendChild(styleElement);
}

// Ensure artistsDatabase is loaded when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Import module ready. Artists loaded:', typeof artistsDatabase !== 'undefined');
        if (typeof artistsDatabase !== 'undefined') {
            console.log('Artists available:', Object.keys(artistsDatabase));
        }
    });
} else {
    console.log('Import module ready. Artists loaded:', typeof artistsDatabase !== 'undefined');
    if (typeof artistsDatabase !== 'undefined') {
        console.log('Artists available:', Object.keys(artistsDatabase));
    }
}