// inventory-bulk.js - Bulk update functionality

// Show bulk update modal
function showBulkUpdateModal() {
    // Populate artist filter
    const artistFilter = document.getElementById('bulkArtistFilter');
    if (artistFilter && artistFilter.options.length <= 1) {
        const stats = getInventoryStats();
        const artists = Object.keys(stats.artistCounts).sort();
        
        artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist;
            option.textContent = `${artist} (${stats.artistCounts[artist]})`;
            artistFilter.appendChild(option);
        });
    }
    
    // Load and display items
    renderBulkUpdateList();
    
    // Show modal
    document.getElementById('bulkUpdateModal').style.display = 'block';
}

// Close bulk update modal
function closeBulkUpdateModal() {
    document.getElementById('bulkUpdateModal').style.display = 'none';
}

// Render bulk update list
function renderBulkUpdateList() {
    const container = document.getElementById('bulkUpdateList');
    const searchQuery = document.getElementById('bulkSearchBox').value.toLowerCase();
    const artistFilter = document.getElementById('bulkArtistFilter').value;
    
    let items = getAllItems();
    
    // Apply filters
    if (artistFilter) {
        items = items.filter(item => item.artist === artistFilter);
    }
    
    if (searchQuery) {
        items = items.filter(item => 
            item.name.toLowerCase().includes(searchQuery) ||
            item.code?.toLowerCase().includes(searchQuery) ||
            item.artist?.toLowerCase().includes(searchQuery)
        );
    }
    
    // Sort by artist and name
    items.sort((a, b) => {
        if (a.artist !== b.artist) {
            return (a.artist || '').localeCompare(b.artist || '');
        }
        return (a.name || '').localeCompare(b.name || '');
    });
    
    const locations = getActiveLocations();
    
    // Generate HTML
    let html = `
        <div class="bulk-header-row">
            <div>Product</div>
            ${locations.map(loc => `<div>${loc.name}</div>`).join('')}
            <div>Total</div>
        </div>
    `;
    
    let currentArtist = '';
    
    items.forEach(item => {
        // Add artist header if changed
        if (item.artist !== currentArtist) {
            currentArtist = item.artist;
            html += `<div class="bulk-artist-header">${currentArtist}</div>`;
        }
        
        // Get current quantities
        const quantities = {};
        if (item.locations) {
            item.locations.forEach(loc => {
                quantities[loc.locationId] = loc.quantity || 0;
            });
        }
        
        const totalQty = calculateTotalQuantity(item);
        
        html += `
            <div class="bulk-item-row" data-item-id="${item.id}">
                <div class="bulk-item-info">
                    <strong>${item.name}</strong>
                    ${item.code ? `<span class="item-code">${item.code}</span>` : ''}
                </div>
                ${locations.map(loc => `
                    <div>
                        <input type="number" 
                               class="bulk-qty-input" 
                               data-location-id="${loc.id}"
                               value="${quantities[loc.id] || 0}"
                               min="0"
                               onchange="updateBulkTotal('${item.id}')">
                    </div>
                `).join('')}
                <div class="bulk-total" id="total-${item.id}">${totalQty}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Filter bulk items
function filterBulkItems() {
    renderBulkUpdateList();
}

// Update total for a single item in bulk view
function updateBulkTotal(itemId) {
    const row = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!row) return;
    
    let total = 0;
    row.querySelectorAll('.bulk-qty-input').forEach(input => {
        total += parseInt(input.value) || 0;
    });
    
    document.getElementById(`total-${itemId}`).textContent = total;
}

// Save all bulk updates
function saveBulkUpdate() {
    const locations = getActiveLocations();
    let updatedCount = 0;
    
    // Process each item row
    document.querySelectorAll('.bulk-item-row').forEach(row => {
        const itemId = row.dataset.itemId;
        const item = inventoryData.items.find(i => i.id === itemId);
        
        if (!item) return;
        
        // Collect new quantities
        const newLocations = [];
        let hasChanges = false;
        
        row.querySelectorAll('.bulk-qty-input').forEach(input => {
            const locationId = input.dataset.locationId;
            const quantity = parseInt(input.value) || 0;
            
            const location = locations.find(loc => loc.id === locationId);
            if (location && quantity > 0) {
                newLocations.push({
                    locationId: locationId,
                    locationName: location.name,
                    quantity: quantity
                });
            }
            
            // Check if value changed
            const oldQty = item.locations?.find(loc => loc.locationId === locationId)?.quantity || 0;
            if (oldQty !== quantity) {
                hasChanges = true;
            }
        });
        
        // Update item if there are changes
        if (hasChanges) {
            item.locations = newLocations;
            item.updatedAt = new Date().toISOString();
            updatedCount++;
        }
    });
    
    // Save to localStorage
    if (updatedCount > 0) {
        saveInventoryData();
        
        // Show success notification
        showNotification(`✅ Updated ${updatedCount} items successfully!`, 'success');
        
        // Refresh main inventory display
        renderInventory();
        updateStats();
        
        // Close modal
        closeBulkUpdateModal();
    } else {
        showNotification('No changes were made.', 'info');
    }
}

// Add CSS for bulk update
const style = document.createElement('style');
style.textContent = `
    /* Bulk Update Modal Styles */
    .bulk-update-filters {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        align-items: center;
    }
    
    .bulk-update-filters select {
        padding: 10px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        background: white;
        min-width: 200px;
    }
    
    .bulk-update-info {
        background: #f7fafc;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        border: 1px solid #e2e8f0;
    }
    
    .bulk-update-info p {
        margin: 0;
        color: #4a5568;
    }
    
    .bulk-update-list {
        max-height: 500px;
        overflow-y: auto;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        background: white;
    }
    
    .bulk-header-row {
        display: grid;
        grid-template-columns: 2fr repeat(auto-fit, minmax(100px, 1fr)) 80px;
        gap: 10px;
        padding: 15px;
        background: #f7fafc;
        font-weight: 600;
        color: #4a5568;
        position: sticky;
        top: 0;
        z-index: 10;
        border-bottom: 2px solid #e2e8f0;
    }
    
    .bulk-artist-header {
        grid-column: 1 / -1;
        padding: 10px 15px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        font-weight: 600;
        font-size: 0.9em;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .bulk-item-row {
        display: grid;
        grid-template-columns: 2fr repeat(auto-fit, minmax(100px, 1fr)) 80px;
        gap: 10px;
        padding: 10px 15px;
        border-bottom: 1px solid #f0f0f0;
        align-items: center;
        transition: background 0.2s;
    }
    
    .bulk-item-row:hover {
        background: #f9fafb;
    }
    
    .bulk-item-info {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    
    .bulk-item-info strong {
        font-size: 0.95em;
        color: #2d3748;
    }
    
    .bulk-item-info .item-code {
        font-size: 0.8em;
        color: #718096;
        font-family: monospace;
    }
    
    .bulk-qty-input {
        width: 100%;
        padding: 6px;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        text-align: center;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s;
    }
    
    .bulk-qty-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .bulk-qty-input:hover {
        border-color: #cbd5e0;
    }
    
    .bulk-total {
        text-align: center;
        font-weight: 700;
        color: #2d3748;
        font-size: 1.1em;
    }
    
    @media (max-width: 768px) {
        .bulk-header-row,
        .bulk-item-row {
            font-size: 0.85em;
        }
        
        .bulk-qty-input {
            padding: 4px;
            font-size: 12px;
        }
    }
`;
document.head.appendChild(style);

// Make functions globally available
window.showBulkUpdateModal = showBulkUpdateModal;
window.closeBulkUpdateModal = closeBulkUpdateModal;
window.saveBulkUpdate = saveBulkUpdate;
window.filterBulkItems = filterBulkItems;
window.updateBulkTotal = updateBulkTotal;
