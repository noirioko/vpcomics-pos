// Product and Sales Management Functions

// Product Management Functions
function getPrice(product) {
    const customKey = `${currentArtist}_${product.code}_${currentCurrency}`;
    if (customPrices[customKey] !== undefined) {
        return parseFloat(customPrices[customKey]);
    }
    return currentCurrency === 'IDR' ? product.priceIDR : product.priceSGD;
}

function getCost(product) {
    const customKey = `${currentArtist}_${product.code}_${currentCurrency}`;
    if (customCosts[customKey] !== undefined) {
        return parseFloat(customCosts[customKey]);
    }
    return currentCurrency === 'IDR' ? product.costIDR : product.costSGD;
}

function getCustomTitle(product) {
    const customKey = `${currentArtist}_${product.code}`;
    return customTitles[customKey] || product.name;
}

function getProductNote(product) {
    const customKey = `${currentArtist}_${product.code}`;
    return productNotes[customKey] || '';
}

function getProductAvailability(product) {
    const customKey = `${currentArtist}_${product.code}`;
    return productAvailability[customKey] || 'available';
}

function updateProductPrice(productCode, newPrice) {
    const customKey = `${currentArtist}_${productCode}_${currentCurrency}`;
    customPrices[customKey] = parseFloat(newPrice);
    
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
    
    // Also refresh admin dashboard if we're on admin tab
    if (currentArtist === 'admin') {
        setTimeout(() => refreshSalesSummary(), 100);
    }
}

function updateProductCost(productCode, newCost) {
    const customKey = `${currentArtist}_${productCode}_${currentCurrency}`;
    customCosts[customKey] = parseFloat(newCost);
    
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
    
    // Also refresh admin dashboard if we're on admin tab
    if (currentArtist === 'admin') {
        setTimeout(() => refreshSalesSummary(), 100);
    }
}

function updateProductTitle(productCode, newTitle) {
    const customKey = `${currentArtist}_${productCode}`;
    customTitles[customKey] = newTitle;
    autoSave();
}

function updateProductNote(productCode, newNote) {
    const customKey = `${currentArtist}_${productCode}`;
    productNotes[customKey] = newNote;
    autoSave();
}

function updateProductAvailability(productCode, availability) {
    const customKey = `${currentArtist}_${productCode}`;
    productAvailability[customKey] = availability;
    
    autoSave();
    
    // Preserve search state
    const searchBox = document.getElementById('searchBox');
    const currentSearch = searchBox ? searchBox.value : '';
    
    renderItems();
    
    // Reapply search if there was one
    if (currentSearch && searchBox) {
        searchBox.value = currentSearch;
        searchProducts();
    }
}

// Sales Tracking Functions
function calculateItemTotals(product, quantity) {
    const price = getPrice(product);
    const cost = getCost(product);
    const grossProfit = price * quantity;
    const totalCost = cost * quantity;
    const netProfit = grossProfit - totalCost;
    const revenueShare = netProfit * artistsDatabase[currentArtist].revenueShare;

    return {
        grossProfit,
        totalCost,
        netProfit,
        revenueShare
    };
}

function updateQuantity(productCode, change) {
    // Check if we have an active session for sales tracking
    if (!activeSession || !activeSession.active) {
        if (change > 0) {
            alert('⚠️ No active session!\n\nPlease start a session to track sales.\n\nYou can still:\n• View products\n• Edit prices & costs\n• Access admin features\n• View reports');
            return;
        }
        // Allow decreasing quantity even without session (for corrections)
    }
    
    const salesKey = `${currentArtist}_${productCode}`;
    if (!salesData[salesKey]) {
        salesData[salesKey] = 0;
    }
    
    salesData[salesKey] = Math.max(0, salesData[salesKey] + change);
    
    // Auto-save the data after quantity change
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
    
    // Update tabs to show new sales count
    if (document.getElementById('artistTabs').style.display !== 'none') {
        renderArtistTabs();
    }
    
    // Also refresh admin dashboard summary to keep it in sync
    setTimeout(() => {
        if (document.getElementById('salesSummary')) {
            refreshSalesSummary();
        }
    }, 100);
}

function updateTotalDisplay() {
    if (!currentArtist || currentArtist === 'admin') {
        // Hide total display for admin
        const totalDisplay = document.querySelector('.total-display');
        if (totalDisplay) {
            totalDisplay.style.display = 'none';
        }
        return;
    }
    
    // Show total display for other artists
    const totalDisplay = document.querySelector('.total-display');
    if (totalDisplay) {
        totalDisplay.style.display = 'block';
    }
    
    const artist = artistsDatabase[currentArtist];
    const revenueSharePercentage = Math.round(artist.revenueShare * 100);
    
    // Update revenue share label
    const revenueLabel = document.getElementById('revenueShareLabel');
    if (revenueLabel) {
        revenueLabel.textContent = `Artist Revenue Share (${revenueSharePercentage}%)`;
    }
    
    let totalRevenue = 0;
    
    Object.entries(salesData).forEach(([salesKey, quantity]) => {
        if (quantity > 0 && salesKey.startsWith(currentArtist + '_')) {
            const productCode = salesKey.replace(currentArtist + '_', '');
            const product = findProduct(productCode);
            if (product) {
                const totals = calculateItemTotals(product, quantity);
                totalRevenue += totals.revenueShare;
            }
        }
    });
    
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
}

function findProduct(code) {
    if (!currentArtist) return null;
    
    const artist = artistsDatabase[currentArtist];
    for (const category of Object.values(artist.products)) {
        const product = category.find(p => p.code === code);
        if (product) return product;
    }
    return null;
}

function findProductByCode(code, artistId) {
    const artist = artistsDatabase[artistId];
    if (!artist) return null;
    
    for (const category of Object.values(artist.products)) {
        const product = category.find(p => p.code === code);
        if (product) return product;
    }
    return null;
}

// Search Function
function searchProducts() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const allCards = document.querySelectorAll('.item-card');
    const allHeaders = document.querySelectorAll('.category-header');
    
    if (searchTerm === '') {
        // Show all cards and headers
        allCards.forEach(card => {
            card.classList.remove('search-hidden', 'search-highlight');
        });
        allHeaders.forEach(header => {
            header.classList.remove('search-hidden');
        });
        return;
    }
    
    // Track which categories have visible cards
    const visibleCategories = new Set();
    
    allCards.forEach(card => {
        const productCode = card.querySelector('.item-code').textContent.toLowerCase();
        const productName = card.querySelector('.editable-title').value.toLowerCase();
        const productNote = card.querySelector('.note-input').value.toLowerCase();
        
        if (productCode.includes(searchTerm) || productName.includes(searchTerm) || productNote.includes(searchTerm)) {
            card.classList.remove('search-hidden');
            card.classList.add('search-highlight');
            
            // Find the category header for this card
            let prevElement = card.parentElement.previousElementSibling;
            while (prevElement) {
                if (prevElement.classList.contains('category-header')) {
                    visibleCategories.add(prevElement);
                    break;
                }
                prevElement = prevElement.previousElementSibling;
            }
        } else {
            card.classList.add('search-hidden');
            card.classList.remove('search-highlight');
        }
    });
    
    // Show/hide category headers based on whether they have visible cards
    allHeaders.forEach(header => {
        if (visibleCategories.has(header)) {
            header.classList.remove('search-hidden');
        } else {
            header.classList.add('search-hidden');
        }
    });
}
