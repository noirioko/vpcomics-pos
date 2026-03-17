function findProductCategory(productCode) {
    if (!currentArtist) return 'Unknown';
    
    const artist = artistsDatabase[currentArtist];
    for (const [categoryKey, products] of Object.entries(artist.products)) {
        if (products.some(p => p.code === productCode)) {
            return getCategoryDisplayName(categoryKey);
        }
    }
    return 'Unknown';
}

function generateReportHTML(data) {
    const {
        artist,
        eventName,
        eventDate,
        eventLocation,
        totalGross,
        totalNet,
        totalRevenue,
        totalItems,
        salesByCategory,
        currency
    } = data;
    
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    const generateTimestamp = () => {
        return new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Get ALL products for this artist, including zero sales
    const allProducts = [];
    Object.entries(artistsDatabase[currentArtist].products).forEach(([categoryKey, products]) => {
        products.forEach(product => {
            const salesKey = `${currentArtist}_${product.code}`;
            const quantity = salesData[salesKey] || 0;
            const price = getPrice(product);
            const cost = getCost(product);
            const customTitle = getCustomTitle(product);
            
            const grossProfit = price * quantity;
            const totalCost = cost * quantity;
            const netProfit = grossProfit - totalCost;
            const artistShare = netProfit * artist.revenueShare;
            
            allProducts.push({
                code: product.code,
                name: customTitle,
                price: price,
                quantity: quantity,
                grossProfit: grossProfit,
                unitCost: cost,
                totalCost: totalCost,
                netProfit: netProfit,
                artistShare: artistShare
            });
        });
    });
    
    let html = `
        <div class="report-table-header">
            <h1>🎨 ${artist.name} Sales Report</h1>
            <p>Event: ${eventName}</p>
            <p>Date: ${formatDate(eventDate)} • Location: ${eventLocation}</p>
            <p>Currency: ${currency === 'IDR' ? 'Indonesian Rupiah (IDR)' : 'Singapore Dollars (SGD)'}</p>
            <p class="report-timestamp">Generated: ${generateTimestamp()}</p>
        </div>
        
        <div class="report-corrections">
            <h3>📊 FINANCIAL SUMMARY:</h3>
            <ul>
                <li><strong>Total Items Sold:</strong> ${totalItems}</li>
                <li><strong>Artist Revenue Share:</strong> ${Math.round(artist.revenueShare * 100)}% of net profit</li>
                <li><strong>Total Artist Share:</strong> ${formatCurrency(totalRevenue)}</li>
            </ul>
        </div>
        
        <table class="report-table">
            <thead>
                <tr>
                    <th>PRODUCT CODE</th>
                    <th>ITEM NAME</th>
                    <th>PRICE</th>
                    <th>SALES</th>
                    <th>GROSS PROFIT</th>
                    <th>UNIT COST</th>
                    <th>TOTAL COST</th>
                    <th>NET PROFIT</th>
                    <th>ARTIST SHARE<br/>${Math.round(artist.revenueShare * 100)}% (NET × ${artist.revenueShare})</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add all products to table
    allProducts.forEach(item => {
        const rowClass = item.quantity > 0 ? 'has-sales' : '';
        html += `
            <tr class="${rowClass}">
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td class="currency">${formatCurrency(item.price)}</td>
                <td class="currency">${item.quantity}</td>
                <td class="currency">${formatCurrency(item.grossProfit)}</td>
                <td class="currency">${formatCurrency(item.unitCost)}</td>
                <td class="currency">${formatCurrency(item.totalCost)}</td>
                <td class="currency">${formatCurrency(item.netProfit)}</td>
                <td class="currency">${formatCurrency(item.artistShare)}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td colspan="8" style="text-align: right; font-weight: bold;">TOTAL ARTIST SHARE:</td>
                    <td class="currency" style="font-weight: bold;">${formatCurrency(totalRevenue)}</td>
                </tr>
            </tfoot>
        </table>
        
        <div class="report-table-footer">
            <p><strong>TRANSPARENCY NOTES:</strong></p>
            <ul>
                <li>🔍 All products are shown including zero sales for complete transparency</li>
                <li>💰 Artist receives ${Math.round(artist.revenueShare * 100)}% of net profit (gross profit minus costs)</li>
                <li>📅 Report generated on ${generateTimestamp()} using VPCOMICS Artist Manager</li>
                <li>📦 Items with zero sales indicate products not brought or unsold</li>
            </ul>
        </div>
    `;
    
    return html;
}

// Rendering Functions

// Utility Functions
function getCategoryDisplayName(categoryKey) {
    const categoryNames = {
        postcards: '📬 Postcards',
        postcard_sets: '📦 Postcard Sets',
        polaroids: '📸 Polaroids',
        prints: '🖼️ Prints',
        books: '📚 Books',
        standees: '🎭 Standees',
        photocards: '🃏 Photocards',
        photocards_hsr: '🃏 HSR Photocards',
        photocards_gi: '🃏 GI Photocards',
        keychains: '🔑 Keychains',
        keychains_hsr: '🔑 HSR Keychains',
        stickers: '🌟 Stickers',
        stickers_hsr: '🌟 HSR Stickers',
        stickers_gi: '🌟 GI Stickers',
        cat_prints: '🐱 Cat Prints',
        omamori: '🌸 Omamori',
        accessories: '👜 Accessories',
        clearance: '💸 Clearance Items',
        blindbox: '📦 Blind Box',
        candy_bags: '🍰 Candy Bags',
        dessert_standees: '🍰 Dessert Standees',
        desserts: '🍰 Dessert Items'
    };
    return categoryNames[categoryKey] || categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
}

function getArtistProductCount(artistId) {
    const artist = artistsDatabase[artistId];
    if (!artist || !artist.products) return 0;
    
    let count = 0;
    Object.values(artist.products).forEach(category => {
        if (Array.isArray(category)) {
            count += category.length;
        }
    });
    return count;
}

function renderItems() {
    if (!currentArtist) return;
    
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    
    const artist = artistsDatabase[currentArtist];
    
    // Handle admin interface
    if (currentArtist === 'admin') {
        renderAdminInterface(container);
        return;
    }
    
    container.innerHTML = '';
    
    Object.entries(artist.products).forEach(([categoryKey, products]) => {
        if (products.length === 0) return;
        
        // Create category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.textContent = getCategoryDisplayName(categoryKey);
        container.appendChild(categoryHeader);
        
        // Create products grid
        const productsGrid = document.createElement('div');
        productsGrid.className = 'items-grid';
        
        products.forEach(product => {
            const salesKey = `${currentArtist}_${product.code}`;
            const quantity = salesData[salesKey] || 0;
            const price = getPrice(product);
            const cost = getCost(product);
            const customTitle = getCustomTitle(product);
            const availability = getProductAvailability(product);
            const note = getProductNote(product);
            
            // Calculate totals
            const totals = calculateItemTotals(product, quantity);
            
            const productCard = document.createElement('div');
            let cardClass = 'item-card';
            if (quantity > 0) cardClass += ' has-sales';
            if (availability === 'sold-out' || availability === 'not-brought') cardClass += ' not-available';
            productCard.className = cardClass;
            
            // Product image
            const imagePath = `/images/${product.code}.png`;
            const jpgImagePath = `/images/${product.code}.jpg`;
            
            productCard.innerHTML = `
                <div class="item-header">
                    <div class="item-code">${product.code}</div>
                </div>
                
                <div class="item-image has-image" style="background-image: url('${imagePath}'), url('${jpgImagePath}'), url('/images/${product.code.toLowerCase()}.png')"></div>
                
                <input type="text" class="editable-title" value="${customTitle}" 
                       onblur="updateProductTitle('${product.code}', this.value)" 
                       onkeypress="if(event.key==='Enter') this.blur()">
                
                <div class="item-notes">
                    <input type="text" class="note-input" placeholder="Notes (sold out, not brought, etc.)" 
                           value="${note}" 
                           onblur="updateProductNote('${product.code}', this.value)">
                </div>
                
                <div class="availability-toggle">
                    <button class="availability-btn ${availability === 'available' ? 'active available' : ''}" 
                            onclick="updateProductAvailability('${product.code}', 'available')">✅ Available</button>
                    <button class="availability-btn ${availability === 'sold-out' ? 'active sold-out' : ''}" 
                            onclick="updateProductAvailability('${product.code}', 'sold-out')">❌ Sold Out</button>
                    <button class="availability-btn ${availability === 'not-brought' ? 'active not-brought' : ''}" 
                            onclick="updateProductAvailability('${product.code}', 'not-brought')">📦 Not Brought</button>
                </div>
                
                <div class="item-details">
                    <div class="detail-item">
                        <span class="detail-label">Price:</span>
                        <input type="number" class="editable-value" value="${price}" 
                               onblur="updateProductPrice('${product.code}', this.value)">
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Cost:</span>
                        <input type="number" class="editable-value" value="${cost}" 
                               onblur="updateProductCost('${product.code}', this.value)">
                    </div>
                </div>
                
                <div class="quantity-control">
                    <button class="qty-btn" onclick="updateQuantity('${product.code}', -1)" ${quantity <= 0 ? 'disabled' : ''}>-</button>
                    <span class="qty-display">${quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity('${product.code}', 1)" ${availability !== 'available' ? 'disabled' : ''}>+</button>
                </div>
                
                ${quantity > 0 ? `
                <div class="item-totals">
                    <div class="total-row">
                        <span>Gross:</span>
                        <span>${formatCurrency(totals.grossProfit)}</span>
                    </div>
                    <div class="total-row">
                        <span>Net:</span>
                        <span>${formatCurrency(totals.netProfit)}</span>
                    </div>
                    <div class="total-row main">
                        <span>Artist Share:</span>
                        <span>${formatCurrency(totals.revenueShare)}</span>
                    </div>
                </div>
                ` : ''}
            `;
            
            productsGrid.appendChild(productCard);
        });
        
        container.appendChild(productsGrid);
    });
}

// Admin Interface Functions  
function renderAdminInterface(container) {
    container.innerHTML = `
        <div class="admin-panel">
            <div class="admin-section">
                <h3>📝 Event Notes & Planning</h3>
                <textarea id="adminNotes" class="admin-textarea" 
                         placeholder="Write your event notes here...

• Artist contact info
• Event schedule  
• Important reminders
• Inventory notes
• Payment tracking
• Booth setup notes"
                         onchange="saveAdminNotes(this.value)"></textarea>
                <p class="admin-help">Notes are automatically saved as you type!</p>
            </div>
            
            <div class="admin-section">
                <h3>📈 Bulk Report Generation</h3>
                <div class="admin-buttons">
                    <button class="admin-btn btn-primary" onclick="generateAllReports()">
                        📄 Generate All Artist Reports
                    </button>
                    <button class="admin-btn btn-secondary" onclick="exportAllData()">
                        💾 Export All Sales Data (CSV)
                    </button>
                </div>
                <p class="admin-help">Generate reports for all artists with sales data.</p>
            </div>
            
            <div class="admin-section convention-complete">
                <h3>🏁 Complete Convention & End Session</h3>
                <div class="convention-info">
                    ${activeSession && activeSession.active ? `
                        <p><strong>Current Session:</strong> ${activeSession.name}</p>
                        <p><strong>Started:</strong> ${new Date(activeSession.startedAt).toLocaleString()}</p>
                    ` : `
                        <p style="color: #dc3545;">⚠️ No active session</p>
                        <p>Start a session to track sales and complete conventions</p>
                    `}
                </div>
                ${activeSession && activeSession.active ? `
                    <button class="admin-btn btn-success" onclick="saveConventionSnapshot()">
                        🏁 Complete & End Session
                    </button>
                ` : `
                    <button class="admin-btn btn-secondary" onclick="showSessionModal()">
                        🚀 Start New Session
                    </button>
                `}
                <p class="admin-help">${activeSession && activeSession.active ? 'This will archive all data and end the current session' : 'You can still edit prices, view history, and manage products without a session'}</p>
            </div>
            
            <div class="admin-section">
                <h3>📚 Convention History</h3>
                <div id="conventionHistory" class="convention-history">
                    Loading history...
                </div>
                <p class="admin-help">View and restore data from previous conventions</p>
            </div>
            
            <div class="admin-section">
                <h3>⚠️ Bulk Operations</h3>
                <div class="admin-buttons">
                    <button class="admin-btn btn-warning" onclick="clearAllSalesAdmin()">
                        🗑️ Clear All Sales Data
                    </button>
                    <button class="admin-btn btn-warning" onclick="resetAllPrices()">
                        🔄 Reset All Custom Prices
                    </button>
                </div>
                <p class="admin-help">⚠️ These operations affect ALL artists!</p>
            </div>
            
            <div class="admin-section">
                <h3>📊 Sales Summary</h3>
                <div id="salesSummary" class="sales-summary">
                    Loading sales data...
                </div>
                <button class="admin-btn btn-info" onclick="refreshSalesSummary()">
                    🔄 Refresh Summary
                </button>
            </div>
        </div>
    `;
    
    loadAdminNotes();
    refreshSalesSummary();
    loadConventionHistory();
}

function saveAdminNotes(notes) {
    localStorage.setItem('vpcomics_admin_notes', notes);
}

function loadAdminNotes() {
    const saved = localStorage.getItem('vpcomics_admin_notes');
    if (saved) {
        document.getElementById('adminNotes').value = saved;
    }
}

function refreshSalesSummary() {
    const summaryDiv = document.getElementById('salesSummary');
    if (!summaryDiv) return;
    
    const artistSales = {};
    let totalRevenue = 0;
    
    Object.keys(artistsDatabase).forEach(artistId => {
        const artist = artistsDatabase[artistId];
        if (artist.isSpecialTab) return;
        
        let artistRevenue = 0;
        let artistSalesCount = 0;
        
        Object.keys(salesData).forEach(salesKey => {
            if (salesKey.startsWith(artistId + '_') && salesData[salesKey] > 0) {
                artistSalesCount += salesData[salesKey];
                const productCode = salesKey.replace(artistId + '_', '');
                const product = findProductByCode(productCode, artistId);
                if (product) {
                    const savedArtist = currentArtist;
                    currentArtist = artistId;
                    
                    const price = getPrice(product);
                    const cost = getCost(product);
                    const revenue = (price - cost) * salesData[salesKey] * artist.revenueShare;
                    artistRevenue += revenue;
                    
                    currentArtist = savedArtist;
                }
            }
        });
        
        if (artistSalesCount > 0) {
            artistSales[artistId] = { revenue: artistRevenue, sales: artistSalesCount, name: artist.name };
            totalRevenue += artistRevenue;
        }
    });
    
    let html = `<div class="summary-total">Total Revenue: ${formatCurrency(totalRevenue)}</div>`;
    
    if (Object.keys(artistSales).length === 0) {
        html += '<p>No sales data found.</p>';
    } else {
        html += '<div class="artist-sales">';
        Object.entries(artistSales).forEach(([artistId, data]) => {
            html += `<div class="artist-summary">
                        <strong>${data.name}:</strong> ${formatCurrency(data.revenue)} (${data.sales} items)
                     </div>`;
        });
        html += '</div>';
    }
    
    summaryDiv.innerHTML = html;
}

function generateAllReports() {
    const artists = Object.keys(artistsDatabase).filter(id => {
        const artist = artistsDatabase[id];
        return !artist.isSpecialTab && hasArtistSales(id);
    });
    
    if (artists.length === 0) {
        alert('⚠️ No artists with sales data found!');
        return;
    }
    
    alert(`📄 Generate reports for ${artists.length} artists?\n\n${artists.map(id => '• ' + artistsDatabase[id].name).join('\n')}\n\n⚠️ This will open ${artists.length} new tabs/windows.`);
}

function exportAllData() {
    let csvContent = 'Artist,Product Code,Item Name,Price,Sales,Revenue Share\n';
    
    Object.keys(artistsDatabase).forEach(artistId => {
        const artist = artistsDatabase[artistId];
        if (artist.isSpecialTab) return;
        
        Object.values(artist.products).forEach(category => {
            category.forEach(product => {
                const salesKey = `${artistId}_${product.code}`;
                const quantity = salesData[salesKey] || 0;
                if (quantity > 0) {
                    const savedArtist = currentArtist;
                    currentArtist = artistId;
                    
                    const price = getPrice(product);
                    const cost = getCost(product);
                    const revenue = (price - cost) * quantity * artist.revenueShare;
                    
                    currentArtist = savedArtist;
                    
                    csvContent += `"${artist.name}","${product.code}","${product.name}",${price},${quantity},${revenue}\n`;
                }
            });
        });
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_sales_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function hasArtistSales(artistId) {
    return Object.keys(salesData).some(key => key.startsWith(artistId + '_') && salesData[key] > 0);
}

function generateReport() {
    if (!currentArtist) {
        alert('⚠️ Please select an artist first!');
        return;
    }
    
    const artist = artistsDatabase[currentArtist];
    const eventName = activeSession?.name || 'No Session';
    const eventDate = activeSession?.date || new Date().toISOString().split('T')[0];
    const eventLocation = activeSession?.location || 'Location';
    
    // Check if there's any sales data
    const hasSalesData = Object.entries(salesData).some(([key, qty]) => 
        key.startsWith(currentArtist + '_') && qty > 0
    );
    
    if (!hasSalesData) {
        alert('⚠️ No sales data found for this artist!\n\nMake some sales first to generate a report.');
        return;
    }
    
    // Calculate totals
    let totalGross = 0;
    let totalNet = 0;
    let totalRevenue = 0;
    let totalItems = 0;
    const salesByCategory = {};
    
    // Process all sales for this artist
    Object.entries(salesData).forEach(([salesKey, quantity]) => {
        if (quantity > 0 && salesKey.startsWith(currentArtist + '_')) {
            const productCode = salesKey.replace(currentArtist + '_', '');
            const product = findProduct(productCode);
            if (product) {
                const totals = calculateItemTotals(product, quantity);
                totalGross += totals.grossProfit;
                totalNet += totals.netProfit;
                totalRevenue += totals.revenueShare;
                totalItems += quantity;
                
                // Group by category
                const category = findProductCategory(productCode);
                if (!salesByCategory[category]) {
                    salesByCategory[category] = {
                        items: [],
                        totalGross: 0,
                        totalNet: 0,
                        totalRevenue: 0,
                        totalQuantity: 0
                    };
                }
                
                salesByCategory[category].items.push({
                    product,
                    quantity,
                    totals
                });
                salesByCategory[category].totalGross += totals.grossProfit;
                salesByCategory[category].totalNet += totals.netProfit;
                salesByCategory[category].totalRevenue += totals.revenueShare;
                salesByCategory[category].totalQuantity += quantity;
            }
        }
    });
    
    // Generate HTML report
    const reportHTML = generateReportHTML({
        artist,
        eventName,
        eventDate,
        eventLocation,
        totalGross,
        totalNet,
        totalRevenue,
        totalItems,
        salesByCategory,
        currency: currentCurrency
    });
    
    // Store the report HTML for export functions
    currentReportHTML = reportHTML;
    
    // Show in modal
    document.getElementById('generatedReport').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

function closeReport() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
