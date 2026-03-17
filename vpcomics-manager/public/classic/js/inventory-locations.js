// inventory-locations.js - Storage location management

let currentLocationId = null;

// Show add location modal
function showAddLocationModal() {
    currentLocationId = null;
    document.getElementById('locationName').value = '';
    document.getElementById('storageType').value = '';
    document.getElementById('locationDesc').value = '';
    document.getElementById('locationColor').value = '#4facfe';
    document.getElementById('locationModal').style.display = 'block';
}

// Show edit location modal
function showEditLocationModal(locationId) {
    const location = locationsData.locations.find(loc => loc.id === locationId);
    if (location) {
        currentLocationId = locationId;
        document.getElementById('locationName').value = location.name || '';
        document.getElementById('storageType').value = location.type || '';
        document.getElementById('locationDesc').value = location.description || '';
        document.getElementById('locationColor').value = location.color || '#4facfe';
        document.getElementById('locationModal').style.display = 'block';
    }
}

// Close location modal
function closeLocationModal() {
    document.getElementById('locationModal').style.display = 'none';
    currentLocationId = null;
}

// Save location
function saveLocation() {
    const name = document.getElementById('locationName').value.trim();
    const type = document.getElementById('storageType').value.trim();
    const description = document.getElementById('locationDesc').value.trim();
    const color = document.getElementById('locationColor').value;
    
    if (!name) {
        alert('Please enter a location name!');
        return;
    }
    
    const locationData = {
        name: name,
        type: type || 'General',
        description: description,
        color: color,
        active: true
    };
    
    if (currentLocationId) {
        // Update existing location
        const index = locationsData.locations.findIndex(loc => loc.id === currentLocationId);
        if (index !== -1) {
            locationsData.locations[index] = { ...locationsData.locations[index], ...locationData };
        }
    } else {
        // Add new location
        locationData.id = generateLocationId();
        locationData.createdAt = new Date().toISOString();
        locationsData.locations.push(locationData);
    }
    
    saveLocationsData();
    renderLocations();
    closeLocationModal();
}

// Delete location
function deleteLocation(locationId) {
    if (!confirm('Are you sure you want to delete this location? Items stored here will need to be updated.')) {
        return;
    }
    
    // Mark as inactive instead of deleting
    const location = locationsData.locations.find(loc => loc.id === locationId);
    if (location) {
        location.active = false;
        saveLocationsData();
        renderLocations();
    }
}

// Render locations grid
function renderLocations() {
    const locationsGrid = document.getElementById('locationsGrid');
    const activeLocations = getActiveLocations();
    
    if (activeLocations.length === 0) {
        locationsGrid.innerHTML = `
            <div class="empty-state">
                <p>📦 No storage locations yet!</p>
                <p>Add your first location to start organizing.</p>
            </div>
        `;
        return;
    }
    
    locationsGrid.innerHTML = activeLocations.map(location => {
        const stats = getLocationStats(location.id);
        return `
            <div class="location-card" style="--location-color: ${location.color}">
                <div class="location-header">
                    <h3>${location.name}</h3>
                    <span class="storage-type">${location.type}</span>
                </div>
                ${location.description ? `<p class="location-desc">${location.description}</p>` : ''}
                <div class="location-stats">
                    <span class="stat-item">📦 ${stats.itemCount} items</span>
                    <span class="stat-item">🔢 ${stats.totalQuantity} total</span>
                </div>
                <div class="location-actions">
                    <button class="btn-icon" onclick="showEditLocationModal('${location.id}')" title="Edit">🖊️</button>
                    <button class="btn-icon" onclick="showLocationItems('${location.id}')" title="View Items">👁️</button>
                    <button class="btn-icon btn-danger" onclick="deleteLocation('${location.id}')" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Show items in a specific location
function showLocationItems(locationId) {
    const location = locationsData.locations.find(loc => loc.id === locationId);
    if (!location) return;
    
    // Filter inventory to show only items in this location
    document.getElementById('inventorySearch').value = location.name;
    
    // Trigger the search/render
    if (typeof renderInventory === 'function') {
        renderInventory();
    }
    
    // Scroll to inventory section
    document.querySelector('.inventory-section').scrollIntoView({ behavior: 'smooth' });
    
    // Show notification if available
    if (typeof showNotification === 'function') {
        showNotification(`Showing items in: ${location.name}`, 'info');
    }
}

// Get stats for a specific location
function getLocationStats(locationId) {
    let itemCount = 0;
    let totalQuantity = 0;
    
    (window.inventoryData?.items || []).forEach(item => {
        if (item.locations) {
            const locationsInThisPlace = item.locations.filter(loc => loc.locationId === locationId);
            if (locationsInThisPlace.length > 0) {
                itemCount++;
                locationsInThisPlace.forEach(loc => {
                    totalQuantity += parseInt(loc.quantity) || 0;
                });
            }
        }
    });
    
    return { itemCount, totalQuantity };
}

// Add location entry in item modal
function addLocationEntry(locationId = '', quantity = '') {
    const container = document.getElementById('itemLocations');
    const locations = getActiveLocations();
    
    if (locations.length === 0) {
        alert('Please add storage locations first!');
        return;
    }
    
    const entryId = 'loc_entry_' + Date.now();
    const entry = document.createElement('div');
    entry.className = 'location-entry';
    entry.id = entryId;
    
    entry.innerHTML = `
        <select class="location-select" onchange="updateTotalQuantity()">
            <option value="">Select Location...</option>
            ${locations.map(loc => `
                <option value="${loc.id}" ${loc.id === locationId ? 'selected' : ''}>
                    ${loc.name} (${loc.type})
                </option>
            `).join('')}
        </select>
        <input type="number" class="quantity-input" placeholder="Qty" min="0" value="${quantity}" onchange="updateTotalQuantity()">
        <button class="btn-icon btn-danger" onclick="removeLocationEntry('${entryId}')">❌</button>
    `;
    
    container.appendChild(entry);
    updateTotalQuantity();
}

// Remove location entry
function removeLocationEntry(entryId) {
    const entry = document.getElementById(entryId);
    if (entry) {
        entry.remove();
        updateTotalQuantity();
    }
}

// Update total quantity display
function updateTotalQuantity() {
    const entries = document.querySelectorAll('.location-entry');
    let total = 0;
    
    entries.forEach(entry => {
        const quantity = entry.querySelector('.quantity-input').value;
        total += parseInt(quantity) || 0;
    });
    
    document.getElementById('totalQuantity').textContent = total;
}

// Make functions globally available
window.showAddLocationModal = showAddLocationModal;
window.showEditLocationModal = showEditLocationModal;
window.closeLocationModal = closeLocationModal;
window.saveLocation = saveLocation;
window.deleteLocation = deleteLocation;
window.renderLocations = renderLocations;
window.showLocationItems = showLocationItems;
window.addLocationEntry = addLocationEntry;
window.removeLocationEntry = removeLocationEntry;
window.updateTotalQuantity = updateTotalQuantity;
