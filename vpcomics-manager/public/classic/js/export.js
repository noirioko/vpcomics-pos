// Export Functions for Reports

function exportCSV() {
    if (!currentArtist) {
        alert('⚠️ Please generate a report first!');
        return;
    }
    
    const artist = artistsDatabase[currentArtist];
    const eventName = activeSession ? activeSession.name : 'Event';
    const eventDate = activeSession ? activeSession.date : new Date().toISOString().split('T')[0];
    
    let csvContent = 'Product Code,Item Name,Category,Quantity,Unit Price,Unit Cost,Gross Revenue,Net Profit,Artist Share\n';
    
    Object.entries(salesData).forEach(([salesKey, quantity]) => {
        if (quantity > 0 && salesKey.startsWith(currentArtist + '_')) {
            const productCode = salesKey.replace(currentArtist + '_', '');
            const product = findProduct(productCode);
            if (product) {
                const totals = calculateItemTotals(product, quantity);
                const category = findProductCategory(productCode);
                const customTitle = getCustomTitle(product);
                const price = getPrice(product);
                const cost = getCost(product);
                
                csvContent += `"${productCode}","${customTitle}","${category}",${quantity},${price},${cost},${totals.grossProfit},${totals.netProfit},${totals.revenueShare}\n`;
            }
        }
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artist.name.replace(/\s+/g, '_')}_${eventName.replace(/\s+/g, '_')}_${eventDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    alert('✅ CSV exported successfully!');
}

function exportPDF() {
    if (!currentReportHTML) {
        alert('⚠️ Please generate a report first!');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sales Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background-color: #f5f5f5;
                }
                .report-table-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .report-corrections {
                    background: #e8f5e8;
                    border: 2px solid #4caf50;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 0;
                }
                .report-corrections h3 {
                    color: #2e7d32;
                    margin-top: 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                th {
                    background-color: #4a5568;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: bold;
                    font-size: 11px;
                }
                td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 12px;
                }
                tr:hover {
                    background-color: #f7fafc;
                }
                .has-sales {
                    background-color: #e8f5e8 !important;
                    font-weight: bold;
                }
                .total-row {
                    background-color: #edf2f7;
                    font-weight: bold;
                }
                .currency {
                    text-align: right;
                }
                .report-table-footer {
                    margin-top: 0;
                    padding: 15px;
                    background: #2d3748;
                    color: white;
                    border-radius: 0 0 10px 10px;
                }
                @media print { 
                    body { margin: 0; }
                    .report-table-header { page-break-inside: avoid; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                }
            </style>
        </head>
        <body>
            ${currentReportHTML}
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() { window.close(); };
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function exportHTML() {
    if (!currentReportHTML) {
        alert('⚠️ Please generate a report first!');
        return;
    }
    
    const artist = artistsDatabase[currentArtist];
    const eventName = activeSession ? activeSession.name : 'Event';
    const eventDate = activeSession ? activeSession.date : new Date().toISOString().split('T')[0];
    
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>${artist.name} - ${eventName} Sales Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .report-table-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
            margin: 0;
        }
        .report-table-header h1 {
            margin: 0 0 10px 0;
            font-size: 1.8em;
            font-weight: bold;
        }
        .report-table-header p {
            margin: 5px 0;
            font-size: 1em;
        }
        .report-corrections {
            background: #e8f5e8;
            border: 2px solid #4caf50;
            padding: 15px;
            border-radius: 8px;
            margin: 0;
        }
        .report-corrections h3 {
            color: #2e7d32;
            margin-top: 0;
            margin-bottom: 10px;
        }
        .report-corrections ul {
            margin: 0;
            padding-left: 20px;
        }
        .report-corrections li {
            margin: 5px 0;
            color: #2e7d32;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 0;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin: 0;
        }
        th {
            background-color: #4a5568;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
            border-right: 1px solid #2d3748;
        }
        th:last-child {
            border-right: none;
        }
        td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
            border-right: 1px solid #f0f0f0;
        }
        td:last-child {
            border-right: none;
        }
        tr:hover {
            background-color: #f7fafc;
        }
        tr.has-sales {
            background-color: #f0fff4;
            font-weight: 500;
        }
        tr.has-sales:hover {
            background-color: #e8f5e8;
        }
        .currency {
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        tfoot .total-row {
            background-color: #edf2f7;
            font-weight: bold;
            font-size: 13px;
        }
        tfoot .total-row td {
            border-bottom: none;
            padding: 15px 8px;
        }
        .report-table-footer {
            margin: 0;
            padding: 15px 20px;
            background: #2d3748;
            color: white;
            border-radius: 0 0 10px 10px;
            text-align: left;
        }
        .report-table-footer p {
            margin: 0 0 10px 0;
            font-weight: bold;
        }
        .report-table-footer ul {
            margin: 0;
            padding-left: 20px;
        }
        .report-table-footer li {
            margin: 5px 0;
            font-size: 0.9em;
            line-height: 1.4;
        }
        @media print {
            body { margin: 10px; }
            .report-table-header { page-break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
        }
    </style>
</head>
<body>
    ${currentReportHTML}
</body>
</html>`;
    
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artist.name.replace(/\s+/g, '_')}_${eventName.replace(/\s+/g, '_')}_${eventDate}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    alert('✅ HTML report exported successfully!');
}