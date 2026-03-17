// Menu and UI Functions

// Artist Menu Functions
function toggleArtistMenu() {
    const overlay = document.getElementById('artistMenuOverlay');
    const isVisible = overlay.style.display !== 'none';
    
    if (isVisible) {
        closeArtistMenu();
    } else {
        openArtistMenu();
    }
}

function openArtistMenu() {
    const overlay = document.getElementById('artistMenuOverlay');
    const menuContent = document.getElementById('menuContent');
    
    // Populate menu with non-priority artists
    const priorityArtists = ['admin', 'pesa21', 'gentlecat', 'limsera', 'discounted'];
    const otherArtists = Object.keys(artistsDatabase).filter(id => !priorityArtists.includes(id));
    
    menuContent.innerHTML = '';
    
    otherArtists.forEach(artistId => {
        const artist = artistsDatabase[artistId];
        const salesCount = getArtistSalesCount(artistId);
        
        const menuItem = document.createElement('div');
        menuItem.className = `menu-item ${artistId === currentArtist ? 'active' : ''} ${salesCount > 0 ? 'has-sales' : ''}`;
        menuItem.onclick = () => {
            switchToArtist(artistId);
            closeArtistMenu();
        };
        
        menuItem.innerHTML = `
            <div class="menu-item-icon">${artist.emoji}</div>
            <div class="menu-item-content">
                <div class="menu-item-name">${artist.name}</div>
                <div class="menu-item-desc">${artist.description}</div>
            </div>
            ${salesCount > 0 ? `<div class="menu-item-sales">${salesCount}</div>` : ''}
        `;
        
        menuContent.appendChild(menuItem);
    });
    
    overlay.style.display = 'block';
    // Add animation class after display
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
}

function closeArtistMenu() {
    const overlay = document.getElementById('artistMenuOverlay');
    if (!overlay) return; // Safety check
    
    overlay.classList.remove('show');
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

// Helper Functions
function getCategoryDisplayName(categoryKey) {
    const categoryNames = {
        'postcards': 'Postcards',
        'polaroids': 'Polaroids', 
        'prints': 'Prints',
        'books': 'Books',
        'stickers': 'Stickers',
        'keychains': 'Keychains',
        'standees': 'Standees',
        'photocards': 'Photocards',
        'catprints': 'Cat Prints',
        'omamori': 'Omamori',
        'desserts': 'Desserts',
        'clearance': 'Clearance Items',
        'blindbox': 'Blind Box',
        'accessories': 'Accessories',
        'bags': 'Bags & Storage'
    };
    return categoryNames[categoryKey] || categoryKey.toUpperCase();
}

function getArtistProductCount(artistId) {
    const artist = artistsDatabase[artistId];
    if (!artist || !artist.products) return 0;
    
    let count = 0;
    Object.values(artist.products).forEach(category => {
        count += category.length;
    });
    return count;
}

// Modal click handler
window.onclick = function(event) {
    const modal = document.getElementById('reportModal');
    if (event.target === modal) {
        closeReport();
    }
};
