// Action Functions (Clear, Reset, etc.)

// Action Functions
function clearAllSales() {
    if (!currentArtist) return;
    
    if (confirm('🗑️ Clear sales data?\n\n✅ Product images will be kept\n✅ Custom prices will be kept\n✅ Custom titles & notes will be kept\n❌ Only sales quantities will be cleared')) {
        // Only clear sales data for current artist
        Object.keys(salesData).forEach(key => {
            if (key.startsWith(currentArtist + '_')) {
                delete salesData[key];
            }
        });
        
        autoSave();
        
        // Preserve search state
        const searchBox = document.getElementById('searchBox');
        const currentSearch = searchBox ? searchBox.value : '';
        
        renderItems();
        updateTotalDisplay();
        
        // Reapply search if there was one (but not if we're clearing all sales)
        if (currentSearch && searchBox) {
            searchBox.value = currentSearch;
            searchProducts();
        }
        
        // Update tabs to reflect cleared sales
        if (document.getElementById('artistTabs').style.display !== 'none') {
            renderArtistTabs();
        }
    }
}

function resetCustomPrices() {
    if (!currentArtist) return;
    
    if (confirm('🔄 Reset all prices & costs to defaults?\n\n⚠️ This will remove all your custom pricing for this artist')) {
        Object.keys(customPrices).forEach(key => {
            if (key.startsWith(currentArtist + '_')) {
                delete customPrices[key];
            }
        });
        Object.keys(customCosts).forEach(key => {
            if (key.startsWith(currentArtist + '_')) {
                delete customCosts[key];
            }
        });
        
        autoSave();
        
        // Preserve search state
        const searchBox = document.getElementById('searchBox');
        const currentSearch = searchBox ? searchBox.value : '';
        
        renderItems();
        updateTotalDisplay();
        
        // Reapply search if there was one
        if (currentSearch && searchBox) {
            searchBox.value = currentSearch;
            searchProducts();
        }
    }
}

function clearAllSalesAdmin() {
    if (confirm('⚠️ DANGER: Clear ALL sales data for ALL artists?\n\nThis cannot be undone!')) {
        Object.keys(salesData).forEach(key => {
            delete salesData[key];
        });
        autoSave();
        alert('✅ All sales data cleared!');
        refreshSalesSummary();
    }
}

function resetAllPrices() {
    if (confirm('⚠️ Reset ALL custom prices for ALL artists?\n\nThis will restore default pricing.')) {
        Object.keys(customPrices).forEach(key => {
            delete customPrices[key];
        });
        Object.keys(customCosts).forEach(key => {
            delete customCosts[key];
        });
        saveAllData();
        alert('✅ All custom prices reset!');
    }
}

// Convention Archive Functions
function saveConventionSnapshot() {
    // Check for active session
    if (!activeSession || !activeSession.active) {
        alert('⚠️ No active session!\n\nPlease start a session first.');
        return;
    }
    
    // Check if there's any sales data
    const hasSales = Object.values(salesData).some(qty => qty > 0);
    if (!hasSales) {
        alert('⚠️ No sales data to archive!\n\nMake some sales before completing the session.');
        return;
    }
    
    const sessionDuration = ((new Date() - new Date(activeSession.startedAt)) / 1000 / 60 / 60).toFixed(1);
    
    if (confirm(`🏁 Complete ${activeSession.name}?\n\nSession Duration: ${sessionDuration} hours\n\nThis will:\n✅ Archive all sales data\n✅ Save final reports\n🏁 End the current session\n🗑️ Clear for next event`)) {
        // Create snapshot object
        const snapshot = {
            id: Date.now(),
            name: activeSession.name,
            date: activeSession.date,
            location: activeSession.location,
            savedAt: new Date().toISOString(),
            currency: activeSession.currency,
            sessionDuration: sessionDuration,
            salesData: { ...salesData },
            customPrices: { ...customPrices },
            customCosts: { ...customCosts },
            customTitles: { ...customTitles },
            productNotes: { ...productNotes },
            productAvailability: { ...productAvailability },
            adminNotes: localStorage.getItem('vpcomics_admin_notes') || '',
            // Calculate totals
            totals: calculateConventionTotals()
        };
        
        // Get existing history
        const history = JSON.parse(localStorage.getItem('vpcomics_convention_history') || '[]');
        
        // Add new snapshot
        history.unshift(snapshot); // Add to beginning
        
        // Keep only last 50 conventions
        if (history.length > 50) {
            history.pop();
        }
        
        // Save history
        localStorage.setItem('vpcomics_convention_history', JSON.stringify(history));
        
        // Generate all reports before clearing
        const artistsWithSales = Object.keys(artistsDatabase).filter(id => 
            hasArtistSales(id) && !artistsDatabase[id].isSpecialTab
        );
        
        alert(`✅ Convention completed successfully!\n\n📊 Final Summary:\n• Duration: ${sessionDuration} hours\n• Total Revenue: ${formatCurrency(snapshot.totals.totalRevenue)}\n• Artists with sales: ${artistsWithSales.length}\n• Total items sold: ${snapshot.totals.totalItems}\n\n🏁 Session ended. Ready for next event!`);
        
        // Clear all current data
        Object.keys(salesData).forEach(key => delete salesData[key]);
        Object.keys(customPrices).forEach(key => delete customPrices[key]);
        Object.keys(customCosts).forEach(key => delete customCosts[key]);
        Object.keys(customTitles).forEach(key => delete customTitles[key]);
        Object.keys(productNotes).forEach(key => delete productNotes[key]);
        Object.keys(productAvailability).forEach(key => delete productAvailability[key]);
        localStorage.removeItem('vpcomics_admin_notes');
        
        // Clear active session
        activeSession = null;
        localStorage.removeItem('vpcomics_active_session');
        updateSessionDisplay();
        
        // Save cleared state
        saveAllData();
        
        // Refresh admin interface
        if (currentArtist === 'admin') {
            renderAdminInterface(document.getElementById('itemsContainer'));
        }
        
        // Show session setup for next convention
        setTimeout(() => {
            showSessionModal();
        }, 1500);
    }
}

function calculateConventionTotals() {
    let totalRevenue = 0;
    let totalItems = 0;
    const artistTotals = {};
    
    Object.keys(salesData).forEach(salesKey => {
        const quantity = salesData[salesKey];
        if (quantity > 0) {
            totalItems += quantity;
            const parts = salesKey.split('_');
            const artistId = parts[0];
            const productCode = parts.slice(1).join('_');
            
            const artist = artistsDatabase[artistId];
            if (artist && !artist.isSpecialTab) {
                const product = findProductByCode(productCode, artistId);
                if (product) {
                    const savedArtist = currentArtist;
                    currentArtist = artistId;
                    
                    const price = getPrice(product);
                    const cost = getCost(product);
                    const revenue = (price - cost) * quantity * artist.revenueShare;
                    
                    currentArtist = savedArtist;
                    
                    totalRevenue += revenue;
                    if (!artistTotals[artistId]) {
                        artistTotals[artistId] = { revenue: 0, items: 0 };
                    }
                    artistTotals[artistId].revenue += revenue;
                    artistTotals[artistId].items += quantity;
                }
            }
        }
    });
    
    return { totalRevenue, totalItems, artistTotals };
}

function loadConventionHistory() {
    const historyDiv = document.getElementById('conventionHistory');
    if (!historyDiv) return;
    
    const history = JSON.parse(localStorage.getItem('vpcomics_convention_history') || '[]');
    
    if (history.length === 0) {
        historyDiv.innerHTML = '<p class="no-history">No convention history yet. Complete your first convention to see it here!</p>';
        return;
    }
    
    let html = '<div class="history-list">';
    
    history.forEach(convention => {
        const date = new Date(convention.date);
        const savedDate = new Date(convention.savedAt);
        const duration = convention.sessionDuration || 'N/A';
        
        html += `
            <div class="history-item">
                <div class="history-header">
                    <h4>🎪 ${convention.name}</h4>
                    <span class="history-date">${date.toLocaleDateString()}</span>
                </div>
                <div class="history-stats">
                    <span>💰 ${convention.currency} ${convention.totals.totalRevenue.toLocaleString()}</span>
                    <span>📦 ${convention.totals.totalItems} items</span>
                    <span>🎨 ${Object.keys(convention.totals.artistTotals).length} artists</span>
                    ${duration !== 'N/A' ? `<span>⏱️ ${duration}h</span>` : ''}
                </div>
                <div class="history-actions">
                    <button class="history-btn btn-view" onclick="viewConvention(${convention.id})">
                        👁️ View Details
                    </button>
                    <button class="history-btn btn-restore" onclick="restoreConvention(${convention.id})">
                        🔄 Restore
                    </button>
                    <button class="history-btn btn-delete" onclick="deleteConvention(${convention.id})">
                        🗑️ Delete
                    </button>
                </div>
                <div class="history-saved">Completed: ${savedDate.toLocaleString()}</div>
            </div>
        `;
    });
    
    html += '</div>';
    historyDiv.innerHTML = html;
}

function viewConvention(conventionId) {
    const history = JSON.parse(localStorage.getItem('vpcomics_convention_history') || '[]');
    const convention = history.find(c => c.id === conventionId);
    
    if (!convention) {
        alert('⚠️ Convention not found!');
        return;
    }
    
    // Create detailed view
    let details = `🎪 ${convention.name} - ${new Date(convention.date).toLocaleDateString()}\n`;
    details += `Currency: ${convention.currency}\n`;
    const currencySymbol = convention.currency === 'IDR' ? 'Rp' : '$';
    details += `Total Revenue: ${currencySymbol}${convention.totals.totalRevenue.toLocaleString()}\n`;
    details += `Total Items Sold: ${convention.totals.totalItems}\n\n`;
    
    details += 'Artist Breakdown:\n';
    Object.entries(convention.totals.artistTotals).forEach(([artistId, data]) => {
        const artist = artistsDatabase[artistId];
        if (artist) {
            details += `• ${artist.name}: ${currencySymbol}${data.revenue.toLocaleString()} (${data.items} items)\n`;
        }
    });
    
    if (convention.adminNotes) {
        details += `\nEvent Notes:\n${convention.adminNotes.substring(0, 200)}...`;
    }
    
    alert(details);
}

function restoreConvention(conventionId) {
    const history = JSON.parse(localStorage.getItem('vpcomics_convention_history') || '[]');
    const convention = history.find(c => c.id === conventionId);
    
    if (!convention) {
        alert('⚠️ Convention not found!');
        return;
    }
    
    if (confirm(`🔄 Restore data from ${convention.name}?\n\n⚠️ This will replace ALL current data!`)) {
        // Restore all data
        salesData = { ...convention.salesData };
        customPrices = { ...convention.customPrices };
        customCosts = { ...convention.customCosts };
        customTitles = { ...convention.customTitles };
        productNotes = { ...convention.productNotes };
        productAvailability = { ...convention.productAvailability };
        currentCurrency = convention.currency;
        
        if (convention.adminNotes) {
            localStorage.setItem('vpcomics_admin_notes', convention.adminNotes);
        }
        
        // Save restored data
        saveAllData();
        
        // Restore session
        activeSession = {
            id: Date.now(),
            name: convention.name,
            date: convention.date,
            location: convention.location || '',
            currency: convention.currency,
            startedAt: new Date().toISOString(),
            active: true,
            restored: true
        };
        localStorage.setItem('vpcomics_active_session', JSON.stringify(activeSession));
        updateSessionDisplay();
        
        // Update UI
        if (currentArtist === 'admin') {
            renderAdminInterface(document.getElementById('itemsContainer'));
        }
        
        // Update currency buttons
        document.querySelectorAll('.currency-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.includes(convention.currency));
        });
        
        alert(`✅ Convention data restored successfully!\n\n${convention.name} is now active again.\n\n⚠️ Note: This is a restored session. Complete it when done.`);
    }
}

function deleteConvention(conventionId) {
    if (confirm('⚠️ Are you sure you want to delete this convention from history?\n\nThis cannot be undone!')) {
        const history = JSON.parse(localStorage.getItem('vpcomics_convention_history') || '[]');
        const index = history.findIndex(c => c.id === conventionId);
        
        if (index > -1) {
            const convention = history[index];
            history.splice(index, 1);
            localStorage.setItem('vpcomics_convention_history', JSON.stringify(history));
            
            alert(`✅ ${convention.name} deleted from history.`);
            loadConventionHistory(); // Refresh the display
        }
    }
}