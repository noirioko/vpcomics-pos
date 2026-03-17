// Artist Management Functions

// Artist Selection Functions
function renderArtistSelector() {
    console.log('🎨 renderArtistSelector starting...');
    
    const container = document.getElementById('artistGrid');
    if (!container) {
        console.error('❌ artistGrid element not found!');
        return;
    }
    console.log('✅ Found artistGrid container');
    
    if (typeof artistsDatabase === 'undefined') {
        console.error('❌ artistsDatabase is undefined!');
        container.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">❌ Artists database not loaded. Please refresh the page.</p>';
        return;
    }
    console.log('✅ artistsDatabase is available with', Object.keys(artistsDatabase).length, 'artists');
    
    container.innerHTML = '';
    
    let cardCount = 0;
    Object.entries(artistsDatabase).forEach(([artistId, artist]) => {
        console.log('💼 Processing artist:', artistId, '-', artist.name);
        const productCount = getArtistProductCount(artistId);
        
        const artistCard = document.createElement('div');
        artistCard.className = 'artist-card';
        artistCard.onclick = () => {
            console.log('💆 Artist card clicked:', artistId);
            selectArtist(artistId);
        };
        
        artistCard.innerHTML = `
            <div class="artist-avatar">${artist.emoji}</div>
            <div class="artist-name">${artist.name}</div>
            <div class="artist-stats">
                ${productCount} products<br>
                ${artist.description}
            </div>
        `;
        
        container.appendChild(artistCard);
        cardCount++;
        console.log('✅ Added card for', artist.name);
    });
    
    console.log('🎉 renderArtistSelector complete! Added', cardCount, 'cards');
}

function selectArtist(artistId) {
    currentArtist = artistId;
    const artist = artistsDatabase[artistId];
    
    // Hide artist selector, show POS interface
    document.querySelector('.artist-selector').style.display = 'none';
    document.getElementById('artistTabs').style.display = 'block';
    document.getElementById('artistInfoBar').style.display = 'block'; // Always show, just change content
    document.getElementById('searchContainer').style.display = artistId === 'admin' ? 'none' : 'block';
    document.getElementById('posSection').style.display = 'block';
    
    // Hide revenue display for admin
    const totalDisplay = document.querySelector('.total-display');
    if (totalDisplay) {
        totalDisplay.style.display = artistId === 'admin' ? 'none' : 'block';
    }
    
    // Render artist tabs
    renderArtistTabs();
    
    // Update artist info display
    const infoBar = document.getElementById('artistInfoBar');
    if (artistId === 'admin') {
        if (infoBar) infoBar.classList.add('admin-info');
        document.getElementById('artistInfo').innerHTML = `
            <h3>⚙️ Administrator Tools</h3>
            <p>Manage all artists • Generate reports • Track sales • Convention management</p>
        `;
    } else {
        if (infoBar) infoBar.classList.remove('admin-info');
        document.getElementById('artistInfo').innerHTML = `
            <h3>🎨 Currently Managing: ${artist.name} ${artist.emoji}</h3>
            <p>${artist.description} • ${getArtistProductCount(artistId)} products • ${Math.round(artist.revenueShare * 100)}% revenue sharing</p>
        `;
    }
    
    // Render items
    renderItems();
    updateTotalDisplay();
}

function backToArtistSelection() {
    try {
        // Save current data before switching (but don't show alert)
        if (currentArtist) {
            saveAllData(); // Keep all sales data!
        }
        
        // Reset current artist (but keep sales data!)
        currentArtist = null;
        
        // Show artist selector, hide POS interface and tabs
        document.querySelector('.artist-selector').style.display = 'block';
        document.getElementById('artistTabs').style.display = 'none';
        document.getElementById('artistInfoBar').style.display = 'none';
        document.getElementById('searchContainer').style.display = 'none';
        document.getElementById('posSection').style.display = 'none';
        
        // Clear search
        document.getElementById('searchBox').value = '';
        
        updateTotalDisplay();
    } catch (error) {
        console.error('Error in backToArtistSelection:', error);
        alert('⚠️ Error going back to artist selection. Please refresh the page.');
    }
}

// Artist Tabs Functions
function renderArtistTabs() {
    const container = document.getElementById('tabsContainer');
    container.innerHTML = '';
    
    // Define priority artists that always show in top tabs - FORCED ORDER
    const priorityArtists = ['admin', 'pesa21', 'gentlecat', 'limsera', 'discounted'];
    
    console.log('🔍 Priority artists:', priorityArtists);
    console.log('🔍 Available artists:', Object.keys(artistsDatabase));
    console.log('🔍 Discounted artist exists:', !!artistsDatabase.discounted);
    if (artistsDatabase.discounted) {
        console.log('🔍 Discounted product count:', getArtistProductCount('discounted'));
    }
    
    // Add priority tabs first
    priorityArtists.forEach(artistId => {
        if (artistsDatabase[artistId]) {
            const artist = artistsDatabase[artistId];
            const salesCount = getArtistSalesCount(artistId);
            
            const tab = document.createElement('button');
            tab.className = `artist-tab ${artistId === currentArtist ? 'active' : ''} ${salesCount > 0 ? 'has-sales' : ''}`;
            tab.onclick = () => switchToArtist(artistId);
            
            tab.innerHTML = `
                <span class="tab-emoji">${artist.emoji}</span>
                <span class="tab-name">${artist.name}</span>
                ${salesCount > 0 ? `<span class="tab-sales">${salesCount}</span>` : ''}
            `;
            
            container.appendChild(tab);
        }
    });
    
    // Add menu button for other artists
    const otherArtists = Object.keys(artistsDatabase).filter(id => !priorityArtists.includes(id));
    if (otherArtists.length > 0) {
        const menuTab = document.createElement('button');
        menuTab.className = 'artist-tab menu-toggle';
        menuTab.onclick = () => toggleArtistMenu();
        
        const hasOtherSales = otherArtists.some(id => getArtistSalesCount(id) > 0);
        const totalOtherSales = otherArtists.reduce((sum, id) => sum + getArtistSalesCount(id), 0);
        
        menuTab.innerHTML = `
            <span class="tab-emoji">☰</span>
            <span class="tab-name">MORE</span>
            ${totalOtherSales > 0 ? `<span class="tab-sales">${totalOtherSales}</span>` : ''}
        `;
        
        if (hasOtherSales) {
            menuTab.classList.add('has-sales');
        }
        
        container.appendChild(menuTab);
    }
    
    // Update floating menu button badge
    updateFloatingMenuBadge();
}

function switchToArtist(artistId) {
    if (artistId === currentArtist) return; // Already on this artist
    
    // Save current data before switching
    if (currentArtist) {
        saveAllData();
    }
    
    // Switch to new artist
    currentArtist = artistId;
    const artist = artistsDatabase[artistId];
    
    // Update tabs
    renderArtistTabs();
    
    // Update artist info display
    const infoBar = document.getElementById('artistInfoBar');
    if (artistId === 'admin') {
        if (infoBar) infoBar.classList.add('admin-info');
        document.getElementById('artistInfo').innerHTML = `
            <h3>⚙️ Administrator Tools</h3>
            <p>Manage all artists • Generate reports • Track sales • Convention management</p>
        `;
    } else {
        if (infoBar) infoBar.classList.remove('admin-info');
        document.getElementById('artistInfo').innerHTML = `
            <h3>🎨 Currently Managing: ${artist.name} ${artist.emoji}</h3>
            <p>${artist.description} • ${getArtistProductCount(artistId)} products • ${Math.round(artist.revenueShare * 100)}% revenue sharing</p>
        `;
    }
    
    // Always show artist info bar, just change content
    document.getElementById('artistInfoBar').style.display = 'block';
    document.getElementById('searchContainer').style.display = artistId === 'admin' ? 'none' : 'block';
    
    // Hide revenue display for admin
    const totalDisplay = document.querySelector('.total-display');
    if (totalDisplay) {
        totalDisplay.style.display = artistId === 'admin' ? 'none' : 'block';
    }
    
    // Clear search
    document.getElementById('searchBox').value = '';
    
    // Re-render items and update display
    renderItems();
    updateTotalDisplay();
}

function getArtistSalesCount(artistId) {
    let totalSales = 0;
    Object.entries(salesData).forEach(([salesKey, quantity]) => {
        if (quantity > 0 && salesKey.startsWith(artistId + '_')) {
            totalSales += quantity;
        }
    });
    return totalSales;
}

function updateFloatingMenuBadge() {
    const priorityArtists = ['admin', 'pesa21', 'gentlecat', 'limsera', 'discounted'];
    const otherArtists = Object.keys(artistsDatabase).filter(id => !priorityArtists.includes(id));
    const totalOtherSales = otherArtists.reduce((sum, id) => sum + getArtistSalesCount(id), 0);
    
    const badge = document.getElementById('floatingBadge');
    if (badge) {
        if (totalOtherSales > 0) {
            badge.textContent = totalOtherSales > 99 ? '99+' : totalOtherSales;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}
