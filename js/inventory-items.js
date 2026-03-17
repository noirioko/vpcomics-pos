// inventory-items-excel.js - Excel-style inline editing for inventory

let currentItemId = null;
let currentSortField = 'name';
let currentSortOrder = 'asc';
let currentArtistFilter = '';

// Get unique artists from inventory for dropdown
function getUniqueArtists() {
    const artists = new Set();
    
    // Ensure inventoryData and items exist
    if (!window.inventoryData || !window.inventoryData.items || !Array.isArray(window.inventoryData.items)) {
        return [];
    }
    
    window.inventoryData.items.forEach(item => {
        if (item.artist) artists.add(item.artist);
    });
    // Also add artists from the POS system
    if (typeof artistsDatabase !== 'undefined') {
        Object.keys(artistsDatabase).forEach(key => {
            if (key !== 'admin') {
                artists.add(artistsDatabase[key].name);
            }
        });
    }
    return Array.from(artists).sort();
}

// Auto-save when field changes
function autoSaveField(itemId, field, value) {
    // Ensure inventoryData exists
    if (!window.inventoryData || !window.inventoryData.items) return;
    
    const item = window.inventoryData.items.find(i => i.id === itemId);
    if (!item) return;
    
    // Update the field
    item[field] = value;
    item.updatedAt = new Date().toISOString();
    
    // Save to localStorage
    localStorage.setItem('vpcomics_inventory', JSON.stringify(window.inventoryData));
    
    // Show quick save indicator
    showSaveIndicator();
}

// Auto-save location changes
function autoSaveLocation(itemId, locationIndex, locationId, quantity) {
    // Ensure inventoryData exists
    if (!window.inventoryData || !window.inventoryData.items) return;
    
    const item = window.inventoryData.items.find(i => i.id === itemId);
    if (!item) return;
    
    // Initialize locations if needed
    if (!item.locations) item.locations = [];
    
    // Get location name
    const location = window.locationsData?.locations?.find(loc => loc.id === locationId);
    
    if (locationId && location) {
        // Update or add location
        if (locationIndex < item.locations.length) {
            item.locations[locationIndex] = {
                locationId: locationId,
                locationName: location.name,
                quantity: parseInt(quantity) || 0
            };
        } else {
            item.locations.push({
                locationId: locationId,
                locationName: location.name,
                quantity: parseInt(quantity) || 0
            });
        }
    } else if (!locationId && locationIndex < item.locations.length) {
        // Remove location if empty
        item.locations.splice(locationIndex, 1);
    }
    
    item.updatedAt = new Date().toISOString();
    localStorage.setItem('vpcomics_inventory', JSON.stringify(window.inventoryData));
    
    // Update total quantity display
    updateTotalQuantity(itemId);
    showSaveIndicator();
}

// Update total quantity display
function updateTotalQuantity(itemId) {
    // Ensure inventoryData exists
    if (!window.inventoryData || !window.inventoryData.items) return;
    
    const item = window.inventoryData.items.find(i => i.id === itemId);
    if (!item) return;
    
    const total = calculateTotalQuantity(item);
    const totalSpan = document.querySelector(`#total-${itemId}`);
    if (totalSpan) {
        totalSpan.textContent = total;
    }
}

// Show save indicator
function showSaveIndicator() {
    // Remove existing indicator
    const existing = document.querySelector('.save-indicator');
    if (existing) existing.remove();
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = 'save-indicator';
    indicator.innerHTML = '✓ Saved';
    document.body.appendChild(indicator);
    
    // Remove after 2 seconds
    setTimeout(() => {
        indicator.remove();
    }, 2000);
}

// Render inventory grid with inline editing
function renderInventory() {
    // Ensure data is loaded first
    if (!window.inventoryData || !window.inventoryData.items) {
        loadInventoryData();
    }
    
    const searchBox = document.getElementById('inventorySearch');
    const searchQuery = searchBox ? searchBox.value : '';
    let items = searchInventory(searchQuery);
    
    // Ensure items is an array
    if (!items || !Array.isArray(items)) {
        items = [];
    }
    
    // Sort items
    items.sort((a, b) => {
        let aVal = a[currentSortField] || '';
        let bVal = b[currentSortField] || '';
        
        if (currentSortField === 'totalQuantity') {
            aVal = calculateTotalQuantity(a);
            bVal = calculateTotalQuantity(b);
        }
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (currentSortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    const inventoryGrid = document.getElementById('inventoryGrid');
    
    // Check if inventoryGrid exists
    if (!inventoryGrid) {
        console.warn('Inventory grid element not found');
        return;
    }
    
    if (items.length === 0) {
        inventoryGrid.innerHTML = `
            <div class="empty-state">
                <p>📦 No items found!</p>
                <p>${searchQuery ? 'Try a different search term.' : 'Add your first inventory item to get started.'}</p>
            </div>
        `;
        return;
    }
    
    // Create sortable header
    const sortIndicator = (field) => {
        if (currentSortField === field) {
            return `<span class="sort-indicator">${currentSortOrder === 'asc' ? '▲' : '▼'}</span>`;
        }
        return '';
    };
    
    inventoryGrid.innerHTML = `
        <div class="inventory-table excel-style">
            <div class="inventory-header-row">
                <div class="col-code clickable" onclick="sortInventory('code')">
                    <span>Icon</span>
                    ${sortIndicator('code')}
                </div>
                <div class="col-name clickable" onclick="sortInventory('name')">
                    <span>Name</span>
                    ${sortIndicator('name')}
                </div>
                <div class="col-artist clickable" onclick="sortInventory('artist')">
                    <span>Artist</span>
                    ${sortIndicator('artist')}
                </div>
                <div class="col-locations">
                    <span>Locations & Quantities</span>
                </div>
                <div class="col-quantity clickable" onclick="sortInventory('totalQuantity')">
                    <span>Total</span>
                    ${sortIndicator('totalQuantity')}
                </div>
                <div class="col-notes">
                    <span>Notes</span>
                </div>
                <div class="col-actions">
                    <span>⚙️</span>
                </div>
            </div>
            ${items.map(item => renderEditableInventoryItem(item)).join('')}
        </div>
    `;
}

// Render single inventory item with inline editing
function renderEditableInventoryItem(item) {
    const totalQty = calculateTotalQuantity(item);
    const artists = getUniqueArtists();
    
    // Get all active locations
    const activeLocations = (window.locationsData && window.locationsData.locations) 
        ? window.locationsData.locations.filter(loc => loc.active !== false)
        : [];
    
    // Ensure we have at least one location slot
    const locationSlots = Math.max(2, (item.locations?.length || 0) + 1);
    
    return `
        <div class="inventory-row editable-row" data-item-id="${item.id}">
            <div class="col-code">
                <div class="product-icon">📦</div>
            </div>
            <div class="col-name" style="display: flex; flex-direction: column; gap: 2px; padding-left: 8px;">
                <input type="text" 
                    class="inline-edit" 
                    value="${item.name || ''}" 
                    placeholder="Item name"
                    onblur="autoSaveField('${item.id}', 'name', this.value)"
                    style="padding-left: 4px;">
                <div class="product-code-display" style="font-size: 0.7em; color: #888; cursor: pointer; padding: 2px 4px; background: #f5f5f5; border-radius: 3px; text-align: left; align-self: flex-start; margin-left: 4px;" 
                     onclick="this.style.display='none'; this.nextElementSibling.style.display='block'; this.nextElementSibling.focus();">
                    ${item.code || 'Click to add code'}
                </div>
                <input type="text" 
                    class="inline-edit code-edit" 
                    value="${item.code || ''}" 
                    placeholder="Enter code"
                    onblur="autoSaveField('${item.id}', 'code', this.value); this.style.display='none'; this.previousElementSibling.textContent=this.value||'Click to add code'; this.previousElementSibling.style.display='block';"
                    style="font-size: 0.7em; display: none; padding-left: 4px; margin-left: 4px;">
            </div>
            <div class="col-artist">
                <select class="inline-edit artist-select" 
                    onchange="autoSaveField('${item.id}', 'artist', this.value)">
                    <option value="">-- Select --</option>
                    ${artists.map(artist => 
                        `<option value="${artist}" ${item.artist === artist ? 'selected' : ''}>${artist}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="col-locations">
                <div class="location-slots">
                    ${Array.from({length: locationSlots}).map((_, index) => {
                        const loc = item.locations?.[index];
                        return `
                            <div class="location-slot">
                                <select class="inline-edit location-select" 
                                    onchange="autoSaveLocation('${item.id}', ${index}, this.value, this.nextElementSibling.value)">
                                    <option value="">-- Select Location --</option>
                                    ${activeLocations.map(location => 
                                        `<option value="${location.id}" 
                                            ${loc?.locationId === location.id ? 'selected' : ''}
                                            style="color: ${location.color}">
                                            ${location.name}
                                        </option>`
                                    ).join('')}
                                </select>
                                <input type="number" 
                                    class="inline-edit qty-input" 
                                    value="${loc?.quantity || ''}" 
                                    placeholder="Qty"
                                    min="0"
                                    onchange="autoSaveLocation('${item.id}', ${index}, this.previousElementSibling.value, this.value)">
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="col-quantity">
                <strong id="total-${item.id}">${totalQty}</strong>
            </div>
            <div class="col-notes">
                <input type="text" 
                    class="inline-edit notes-input" 
                    value="${item.notes || ''}" 
                    placeholder="Notes"
                    onblur="autoSaveField('${item.id}', 'notes', this.value)">
            </div>
            <div class="col-actions">
                <button class="btn-icon btn-danger" onclick="deleteItem('${item.id}')" title="Delete">🗑️</button>
            </div>
        </div>
    `;
}

// Calculate total quantity for an item
function calculateTotalQuantity(item) {
    if (!item.locations) return 0;
    return item.locations.reduce((total, loc) => total + (parseInt(loc.quantity) || 0), 0);
}

// Add location entry to modal
function addLocationEntry(locationId = '', quantity = '') {
    const container = document.getElementById('itemLocations');
    if (!container) return;
    
    const entry = document.createElement('div');
    entry.className = 'location-entry';
    
    const activeLocations = (window.locationsData && window.locationsData.locations) 
        ? window.locationsData.locations.filter(loc => loc.active !== false)
        : [];
    
    entry.innerHTML = `
        <select class="location-select">
            <option value="">-- Select Location --</option>
            ${activeLocations.map(location => 
                `<option value="${location.id}" ${locationId === location.id ? 'selected' : ''}>${location.name}</option>`
            ).join('')}
        </select>
        <input type="number" class="quantity-input" value="${quantity}" placeholder="Quantity" min="0">
        <button class="btn-icon btn-danger" onclick="this.parentElement.remove()">🗑️</button>
    `;
    
    container.appendChild(entry);
}

// Filter by artist
function filterByArtist(artist) {
    currentArtistFilter = artist;
    
    // Update button states - check text content instead of onclick attribute
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (artist === '' && btn.textContent.includes('All')) {
            btn.classList.add('active');
        } else if (artist !== '' && btn.textContent.startsWith(artist)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderInventory();
}

function searchInventory(query) {
    // Ensure data is loaded from localStorage
    if (!window.inventoryData || !window.inventoryData.items) {
        loadInventoryData();
    }
    
    let items = getAllItems();
    
    if (currentArtistFilter) {
        items = items.filter(item => item.artist === currentArtistFilter);
    }
    
    if (!query) {
        return items;
    }
    
    const lowerQuery = query.toLowerCase();
    return items.filter(item => {
        return (
            item.code?.toLowerCase().includes(lowerQuery) ||
            item.name?.toLowerCase().includes(lowerQuery) ||
            item.artist?.toLowerCase().includes(lowerQuery) ||
            item.notes?.toLowerCase().includes(lowerQuery) ||
            item.locations?.some(loc => 
                loc.locationName?.toLowerCase().includes(lowerQuery)
            )
        );
    });
}

function showAddItemModal() {
    currentItemId = null;
    document.getElementById('itemCode').value = '';
    document.getElementById('itemName').value = '';
    document.getElementById('itemArtist').value = '';
    document.getElementById('itemNotes').value = '';
    document.getElementById('itemLocations').innerHTML = '';
    
    addLocationEntry();
    document.getElementById('itemModal').style.display = 'block';
}

function showEditItemModal(itemId) {
    const item = window.inventoryData.items.find(i => i.id === itemId);
    if (item) {
        currentItemId = itemId;
        document.getElementById('itemCode').value = item.code || '';
        document.getElementById('itemName').value = item.name || '';
        document.getElementById('itemArtist').value = item.artist || '';
        document.getElementById('itemNotes').value = item.notes || '';
        
        // Clear and add location entries
        document.getElementById('itemLocations').innerHTML = '';
        if (item.locations && item.locations.length > 0) {
            item.locations.forEach(loc => {
                addLocationEntry(loc.locationId, loc.quantity);
            });
        } else {
            addLocationEntry();
        }
        
        document.getElementById('itemModal').style.display = 'block';
    }
}

function closeItemModal() {
    document.getElementById('itemModal').style.display = 'none';
    currentItemId = null;
}

function saveItem() {
    const code = document.getElementById('itemCode').value.trim();
    const name = document.getElementById('itemName').value.trim();
    const artist = document.getElementById('itemArtist').value.trim();
    const notes = document.getElementById('itemNotes').value.trim();
    
    if (!name) {
        alert('Please enter an item name!');
        return;
    }
    
    const locations = [];
    const entries = document.querySelectorAll('.location-entry');
    
    entries.forEach(entry => {
        const locationId = entry.querySelector('.location-select').value;
        const quantity = entry.querySelector('.quantity-input').value;
        
        if (locationId && quantity) {
            const location = window.locationsData.locations.find(loc => loc.id === locationId);
            if (location) {
                locations.push({
                    locationId: locationId,
                    locationName: location.name,
                    quantity: parseInt(quantity) || 0
                });
            }
        }
    });
    
    const itemData = {
        code: code,
        name: name,
        artist: artist,
        notes: notes,
        locations: locations
    };
    
    if (currentItemId) {
        itemData.id = currentItemId;
    }
    
    saveInventoryItem(itemData);
    renderInventory();
    updateStats();
    closeItemModal();
}

function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item from inventory?')) {
        return;
    }
    
    deleteInventoryItem(itemId);
    renderInventory();
    updateStats();
}

function sortInventory(field) {
    if (currentSortField === field) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = field;
        currentSortOrder = 'asc';
    }
    
    renderInventory();
}

function updateStats() {
    const stats = getInventoryStats();
    const statsDiv = document.getElementById('inventoryStats');
    
    // Check if statsDiv exists
    if (!statsDiv) {
        console.warn('Stats div not found');
        return;
    }
    
    statsDiv.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.totalItems}</div>
            <div class="stat-label">Total Items</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalQuantity}</div>
            <div class="stat-label">Total Quantity</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalLocations}</div>
            <div class="stat-label">Storage Locations</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${Object.keys(stats.artistCounts).length}</div>
            <div class="stat-label">Artists/Categories</div>
        </div>
    `;
    
    updateArtistFilters();
}

function updateArtistFilters() {
    const stats = getInventoryStats();
    const quickFilters = document.getElementById('quickFilters');
    
    if (!quickFilters) return;
    
    // Clear existing content completely
    while (quickFilters.firstChild) {
        quickFilters.removeChild(quickFilters.firstChild);
    }
    
    // Add filter label
    const label = document.createElement('span');
    label.className = 'filter-label';
    label.textContent = 'Quick filters:';
    quickFilters.appendChild(label);
    
    // Add All button
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn' + (currentArtistFilter === '' ? ' active' : '');
    allBtn.textContent = '🌐 All';
    allBtn.onclick = () => filterByArtist('');
    quickFilters.appendChild(allBtn);
    
    // Add artist buttons
    const artists = Object.keys(stats.artistCounts).sort();
    
    artists.forEach(artist => {
        const count = stats.artistCounts[artist];
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        if (currentArtistFilter === artist) btn.classList.add('active');
        btn.textContent = `${artist} (${count})`;
        btn.onclick = () => filterByArtist(artist);
        quickFilters.appendChild(btn);
    });
}

// Make functions globally available
window.renderInventory = renderInventory;
window.showAddItemModal = showAddItemModal;
window.showEditItemModal = showEditItemModal;
window.closeItemModal = closeItemModal;
window.saveItem = saveItem;
window.deleteItem = deleteItem;
window.sortInventory = sortInventory;
window.filterByArtist = filterByArtist;
window.updateStats = updateStats;
window.searchInventory = searchInventory;
window.autoSaveField = autoSaveField;
window.autoSaveLocation = autoSaveLocation;
window.addLocationEntry = addLocationEntry;
window.calculateTotalQuantity = calculateTotalQuantity;

/* Commented out - this is already handled in inventory-init.js
// Set up search on DOM load
document.addEventListener('DOMContentLoaded', function() {
    const searchBox = document.getElementById('inventorySearch');
    if (searchBox) {
        searchBox.addEventListener('input', function() {
            renderInventory();
        });
    }
});
*/