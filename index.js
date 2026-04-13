// Backend Configuration
const SCRIPT_URL = localStorage.getItem('gasScriptUrl') || 'https://script.google.com/macros/s/AKfycbyUUreMzgqOFhRe0iPXhYAsb893wAqeAJNrN3FZ8MpeiS-KjJqDVdvrXnbE3gvtQJvh/exec'; // Add your URL here for hardcoding

function updateCard() {
    // Get form values
    const name = document.getElementById('employeeName').value;
    const idNumber = document.getElementById('idNumber').value;
    const emergencyContact = document.getElementById('emergencyContact').value;
    const emergencyPhone = document.getElementById('emergencyPhone').value;

    // Update card displays
    document.getElementById('nameDisplay').textContent = name.toUpperCase();
    document.getElementById('idNumberDisplay').textContent = idNumber;
    document.getElementById('idNumberBarcode').textContent = idNumber;
    document.getElementById('emergencyContactDisplay').textContent = emergencyContact.toUpperCase();
    document.getElementById('emergencyPhoneDisplay').textContent = emergencyPhone;

    // Generate Barcode
    if (idNumber) {
        JsBarcode("#barcode", idNumber, {
            format: "CODE128",
            lineColor: "#000",
            width: 1.5,
            height: 25,
            displayValue: false,
            margin: 0,
            background: "transparent"
        });
    } else {
        // Clear barcode if no idNumber
        const barcodeElement = document.getElementById('barcode');
        if (barcodeElement) barcodeElement.innerHTML = '';
    }

    // Show success message
    // showNotification('Card updated successfully!'); // Commented out to avoid cluttering during typing
}

// Handle photo upload
document.getElementById('photoUpload').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;

                // Ensure white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.drawImage(img, 0, 0);

                document.getElementById('employeePhoto').src = canvas.toDataURL('image/png');
                showNotification('Photo uploaded with white background!');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Handle employee signature upload
document.getElementById('signatureUpload').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file for the signature.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Remove white/light background
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // If the pixel is close to white (lightest shades)
                    if (r > 200 && g > 200 && b > 200) {
                        data[i + 3] = 0; // Make transparent
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                document.getElementById('employeeSignature').src = canvas.toDataURL('image/png');
                showNotification('Employee signature background removed!');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});


// Handle branch head signature upload
document.getElementById('headSignatureUpload').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        if (file.type !== 'image/png') {
            alert('Please upload a PNG file for the signature.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (event) {
            document.getElementById('headSignature').src = event.target.result;
            showNotification('Branch Head signature uploaded successfully!');
        };
        reader.readAsDataURL(file);
    }
});

// Download card as images
async function downloadCard() {
    try {
        // Check if html2canvas is available
        if (typeof html2canvas === 'undefined') {
            // Load html2canvas dynamically
            await loadHtml2Canvas();
        }

        // Get name for filename
        const name = document.getElementById('nameDisplay').textContent.trim();
        const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'id-card';

        // Capture front side
        const frontCard = document.getElementById('cardFront');
        const frontCanvas = await html2canvas(frontCard, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true
        });

        // Download front
        const frontLink = document.createElement('a');
        frontLink.download = `${safeName}-front.png`;
        frontLink.href = frontCanvas.toDataURL('image/png');
        frontLink.click();

        // Small delay before capturing back
        await new Promise(resolve => setTimeout(resolve, 500));

        // Capture back side
        const backCard = document.getElementById('cardBack');
        const backCanvas = await html2canvas(backCard, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true
        });

        // Download back
        const backLink = document.createElement('a');
        backLink.download = `${safeName}-back.png`;
        backLink.href = backCanvas.toDataURL('image/png');
        backLink.click();

        showNotification('ID cards downloaded successfully!');
    } catch (error) {
        console.error('Error downloading card:', error);
        alert('Error downloading card. Please try again.');
    }
}

// Load html2canvas library dynamically
function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Table Management
let savedRecords = JSON.parse(localStorage.getItem('idRecords')) || [];

async function saveRecord() {
    const record = {
        name: document.getElementById('employeeName').value,
        idNumber: document.getElementById('idNumber').value,
        emergencyContact: document.getElementById('emergencyContact').value,
        emergencyPhone: document.getElementById('emergencyPhone').value,
        photo: document.getElementById('employeePhoto').src,
        signature: document.getElementById('employeeSignature').src,
        managerSignature: document.getElementById('managerSignature').src,
        headSignature: document.getElementById('headSignature').src
    };

    if (!record.name || !record.idNumber) {
        alert('Please enter at least the Name and ID Number.');
        return;
    }

    // 1. Save Locally
    const index = savedRecords.findIndex(r => r.idNumber === record.idNumber);
    if (index !== -1) {
        if (!confirm('ID Number already exists. Update record?')) {
            return;
        }
        savedRecords[index] = record;
    } else {
        savedRecords.push(record);
    }

    localStorage.setItem('idRecords', JSON.stringify(savedRecords));
    updateTable();
    showNotification('Record saved locally!');

    // 1.1 Auto-increment ID Number
    const nextId = incrementIdNumber(record.idNumber);

    // 2. Save to Cloud (if URL provided)
    if (SCRIPT_URL) {
        showNotification('Syncing to Cloud...');
        try {
            const cloudData = { ...record, action: 'save' };
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cloudData)
            });
            showNotification('Successfully synced to Cloud!');
        } catch (error) {
            console.error('Cloud save error:', error);
            showNotification('Cloud sync failed.');
        }
    }

    // 3. Clear form for next entry
    resetForm();

    // Set the auto-incremented ID
    document.getElementById('idNumber').value = nextId;
    updateCard(); // Refresh barcode
    document.getElementById('employeeName').focus(); // Ready for next name
}

function incrementIdNumber(id) {
    // Matches patterns like GF-LDN-00004 or simply 00004
    return id.replace(/(\d+)$/, (match) => {
        const val = parseInt(match, 10) + 1;
        return val.toString().padStart(match.length, '0');
    });
}

function resetForm() {
    // Clear text inputs
    document.getElementById('employeeName').value = '';
    document.getElementById('idNumber').value = '';
    document.getElementById('emergencyContact').value = '';
    document.getElementById('emergencyPhone').value = '';

    // Clear file inputs
    document.getElementById('photoUpload').value = '';
    document.getElementById('signatureUpload').value = '';

    document.getElementById('headSignatureUpload').value = '';

    // Reset Images to placeholders
    document.getElementById('employeePhoto').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23ffffff'/%3E%3C/svg%3E";
    document.getElementById('employeeSignature').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='60' viewBox='0 0 200 60'%3E%3Ctext x='100' y='30' font-family='Arial' font-size='12' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3E%3C/text%3E%3C/svg%3E";
    document.getElementById('managerSignature').src = "Jennifer Compania signature.png";
    document.getElementById('headSignature').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='40' viewBox='0 0 150 40'%3E%3Ctext x='75' y='20' font-family='Arial' font-size='10' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3E%3C/text%3E%3C/svg%3E";

    // Refresh card with empty/placeholder values
    updateCard();
    showNotification('Form cleared for new entry.');
}

function updateTable() {
    const tbody = document.getElementById('idRecordsBody');
    tbody.innerHTML = '';

    savedRecords.forEach((record, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${record.idNumber}</td>
            <td>${record.name}</td>
            <td>${record.emergencyContact}</td>
            <td>${record.emergencyPhone}</td>
            <td>
                <button class="btn-load" onclick="loadRecord(${index})">Load</button>
                <button class="btn-print-item" onclick="printSingle(${index}, 'front')">P. Front</button>
                <button class="btn-print-item" onclick="printSingle(${index}, 'back')">P. Back</button>
                <button class="btn-download-record" onclick="downloadRecordFromTable(${index})">DL</button>
                <button class="btn-delete" onclick="deleteRecord(${index})">Del</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterRecords() {
    const query = document.getElementById('searchRecords').value.toLowerCase();
    const rows = document.querySelectorAll('#idRecordsBody tr');

    rows.forEach(row => {
        const idText = row.cells[0].textContent.toLowerCase();
        const nameText = row.cells[1].textContent.toLowerCase();
        if (idText.includes(query) || nameText.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

async function downloadRecordFromTable(index) {
    // Load first to ensure preview is correct
    loadRecord(index);
    // Give a tiny moment for image src updates
    await new Promise(resolve => setTimeout(resolve, 100));
    await downloadCard();
}

async function batchDownload() {
    if (savedRecords.length === 0) {
        alert('No records to download.');
        return;
    }

    if (!confirm(`Are you sure you want to download all ${savedRecords.length} records? This may take a while.`)) {
        return;
    }

    try {
        const zip = new JSZip();
        showNotification('Starting batch download... Please wait.');

        // Check if html2canvas is available
        if (typeof html2canvas === 'undefined') {
            await loadHtml2Canvas();
        }

        const frontCard = document.getElementById('cardFront');
        const backCard = document.getElementById('cardBack');

        for (let i = 0; i < savedRecords.length; i++) {
            const record = savedRecords[i];
            showNotification(`Capturing record ${i + 1} of ${savedRecords.length}: ${record.name}`);

            // Load record and wait for images
            loadRecord(i);
            await new Promise(resolve => setTimeout(resolve, 300));

            // Sanitize name for file names
            const safeName = record.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

            // Capture Front
            const frontCanvas = await html2canvas(frontCard, { scale: 2, backgroundColor: '#ffffff', logging: false });
            const frontBlob = await new Promise(resolve => frontCanvas.toBlob(resolve, 'image/png'));
            zip.file(`${safeName}_front.png`, frontBlob);

            // Capture Back
            const backCanvas = await html2canvas(backCard, { scale: 2, backgroundColor: '#ffffff', logging: false });
            const backBlob = await new Promise(resolve => backCanvas.toBlob(resolve, 'image/png'));
            zip.file(`${safeName}_back.png`, backBlob);
        }

        showNotification('Generating ZIP file...');
        const content = await zip.generateAsync({ type: 'blob' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `id_cards_batch_${new Date().toISOString().slice(0, 10)}.zip`;
        link.click();

        showNotification('Batch download complete!');
    } catch (error) {
        console.error('Batch download error:', error);
        alert('An error occurred during batch download. Check console for details.');
        showNotification('Batch download failed.');
    }
}

function loadRecord(index) {
    const record = savedRecords[index];
    document.getElementById('employeeName').value = record.name;
    document.getElementById('idNumber').value = record.idNumber;
    document.getElementById('emergencyContact').value = record.emergencyContact;
    document.getElementById('emergencyPhone').value = record.emergencyPhone;
    document.getElementById('employeePhoto').src = record.photo;
    document.getElementById('employeeSignature').src = record.signature;
    if (record.managerSignature) document.getElementById('managerSignature').src = record.managerSignature;
    if (record.headSignature) document.getElementById('headSignature').src = record.headSignature;

    updateCard();
    showNotification('Record loaded!');
}

async function deleteRecord(index) {
    if (confirm('Delete this record? This will also remove it from the Cloud if connected.')) {
        const recordToDelete = savedRecords[index];
        const idNum = recordToDelete.idNumber;

        // 1. Delete Locally
        savedRecords.splice(index, 1);
        localStorage.setItem('idRecords', JSON.stringify(savedRecords));
        updateTable();
        showNotification('Record deleted locally!');

        // 2. Delete from Cloud
        if (SCRIPT_URL) {
            showNotification('Deleting from Cloud...');
            try {
                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    cache: 'no-cache',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', idNumber: idNum })
                });
                showNotification('Successfully deleted from Cloud!');
            } catch (error) {
                console.error('Cloud delete error:', error);
                showNotification('Cloud delete failed.');
            }
        }
    }
}

// Auto-update card on input change
document.getElementById('employeeName').addEventListener('input', updateCard);
document.getElementById('idNumber').addEventListener('input', updateCard);
document.getElementById('emergencyContact').addEventListener('input', updateCard);
document.getElementById('emergencyPhone').addEventListener('input', updateCard);

// Handle Enter key for quick saving
['employeeName', 'idNumber', 'emergencyContact', 'emergencyPhone'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveRecord();
        }
    });
});

// Google Apps Script URL is now handled in the backend variable SCRIPT_URL

// Initialize with default values
window.addEventListener('load', function () {
    // SCRIPT_URL is managed at the top of the file
    if (!SCRIPT_URL) {
        console.warn('Google Apps Script URL is not set in the backend (index.js).');
    }

    updateCard();
    updateTable();
    applyPrintSettings();
    showNotification('Welcome! Start editing your ID card.');
});

// Print Settings Functionality
function applyPrintSettings() {
    const width = document.getElementById('cardWidth').value;
    const height = document.getElementById('cardHeight').value;
    const margins = document.getElementById('pageMargins').value;
    const paper = document.getElementById('paperSize').value;
    const orientation = document.getElementById('pageOrientation').value;

    const root = document.documentElement;
    root.style.setProperty('--card-width', `${width}in`);
    root.style.setProperty('--card-height', `${height}in`);
    root.style.setProperty('--page-margin', `${margins}in`);
    root.style.setProperty('--page-size', paper);
    root.style.setProperty('--page-orientation', orientation);

    showNotification('Print settings applied!');
}

// Print Current record from form (even if unsaved)
function printCurrent(side) {
    const record = {
        name: document.getElementById('employeeName').value,
        idNumber: document.getElementById('idNumber').value,
        emergencyContact: document.getElementById('emergencyContact').value,
        emergencyPhone: document.getElementById('emergencyPhone').value,
        photo: document.getElementById('employeePhoto').src,
        signature: document.getElementById('employeeSignature').src,
        managerSignature: document.getElementById('managerSignature').src,
        headSignature: document.getElementById('headSignature').src
    };

    if (!record.idNumber) {
        alert('Please enter an ID Number.');
        return;
    }

    if (!record.name) {
        // Allow blank name for stock cards
        record.name = " ";
    }

    // Temporary mock for printSingle logic
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = '';
    const page = document.createElement('div');
    page.className = 'print-page';

    if (side === 'front') {
        for (let i = 0; i < 4; i++) {
            const fCard = createPrintCard(record, 'front', `current-${i}`);
            page.appendChild(fCard);
        }
        printArea.appendChild(page);
        setTimeout(() => {
            for (let i = 0; i < 4; i++) {
                const el = document.querySelector(`.print-barcode-current-${i}`);
                if (el) {
                    JsBarcode(el, record.idNumber, {
                        format: "CODE128", lineColor: "#000", width: 1.5, height: 25, displayValue: false, margin: 0, background: "transparent"
                    });
                }
            }
            window.print();
        }, 500);
    } else {
        for (let i = 0; i < 4; i++) {
            const bCard = createPrintCard(record, 'back', `current-back-${i}`);
            page.appendChild(bCard);
        }
        printArea.appendChild(page);
        setTimeout(() => { window.print(); }, 500);
    }
}

// Bulk Incremental Printing Logic
async function printBulk(side) {
    const startId = document.getElementById('idNumber').value;
    const count = parseInt(document.getElementById('bulkCount').value, 10);

    if (!startId) {
        alert('Please enter a starting ID Number.');
        return;
    }

    if (isNaN(count) || count <= 0) {
        alert('Please enter a valid number of IDs to print.');
        return;
    }

    const printArea = document.getElementById('print-area');
    printArea.innerHTML = '';

    const recordTemplate = {
        name: document.getElementById('employeeName').value || " ",
        emergencyContact: document.getElementById('emergencyContact').value || " ",
        emergencyPhone: document.getElementById('emergencyPhone').value || " ",
        photo: document.getElementById('employeePhoto').src,
        signature: document.getElementById('employeeSignature').src,
        managerSignature: document.getElementById('managerSignature').src,
        headSignature: document.getElementById('headSignature').src
    };

    let currentId = startId;
    const idList = [];
    for (let i = 0; i < count; i++) {
        idList.push(currentId);
        currentId = incrementIdNumber(currentId);
    }

    // Process in chunks of 4
    for (let i = 0; i < count; i += 4) {
        const pageIds = idList.slice(i, i + 4);
        const page = document.createElement('div');
        page.className = 'print-page';

        if (side === 'front') {
            pageIds.forEach((id, index) => {
                const record = { ...recordTemplate, idNumber: id };
                const card = createPrintCard(record, 'front', `bulk-${i + index}`);
                page.appendChild(card);
            });
            // Fill remaining blanks
            for (let j = pageIds.length; j < 4; j++) {
                const empty = document.createElement('div');
                empty.className = 'id-card empty';
                empty.style.visibility = 'hidden';
                page.appendChild(empty);
            }
        } else {
            // Mirroring logic for back side: [1, 0, 3, 2]
            const backIndices = [1, 0, 3, 2];
            backIndices.forEach(idx => {
                if (idx < pageIds.length) {
                    const record = { ...recordTemplate, idNumber: pageIds[idx] };
                    const card = createPrintCard(record, 'back', `bulk-back-${i + idx}`);
                    page.appendChild(card);
                } else if (idx < 4) {
                    const empty = document.createElement('div');
                    empty.className = 'id-card empty';
                    empty.style.visibility = 'hidden';
                    page.appendChild(empty);
                }
            });
        }
        printArea.appendChild(page);
    }

    // Handle Barcode Generation for Fronts
    if (side === 'front') {
        setTimeout(() => {
            idList.forEach((id, index) => {
                const el = document.querySelector(`.print-barcode-bulk-${index}`);
                if (el) {
                    JsBarcode(el, id, {
                        format: "CODE128", lineColor: "#000", width: 1.5, height: 25, displayValue: false, margin: 0, background: "transparent"
                    });
                }
            });
            window.print();
        }, 800);
    } else {
        setTimeout(() => { window.print(); }, 500);
    }
}

// Print Single Record Functionality
function printSingle(index, side) {
    const record = savedRecords[index];
    if (!record) return;

    // Create a virtual batch of 1
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = '';

    const page = document.createElement('div');
    page.className = 'print-page';

    if (side === 'front') {
        // Fill 4 copies of the front on one A4 page
        for (let i = 0; i < 4; i++) {
            const fCard = createPrintCard(record, 'front', `single-${i}`);
            page.appendChild(fCard);
        }
        printArea.appendChild(page);

        // Finalize barcodes
        setTimeout(() => {
            for (let i = 0; i < 4; i++) {
                const el = document.querySelector(`.print-barcode-single-${i}`);
                if (el) {
                    JsBarcode(el, record.idNumber, {
                        format: "CODE128",
                        lineColor: "#000",
                        width: 1.5,
                        height: 40,
                        displayValue: false,
                        margin: 0,
                        background: "transparent"
                    });
                }
            }
            window.print();
        }, 500);
    } else {
        // Fill 4 copies of the back on one A4 page
        for (let i = 0; i < 4; i++) {
            const bCard = createPrintCard(record, 'back', `single-back-${i}`);
            page.appendChild(bCard);
        }
        printArea.appendChild(page);
        setTimeout(() => { window.print(); }, 500);
    }
}

// Print Batch Functionality (front, back)
function printBatch(side) {
    if (savedRecords.length === 0) {
        alert('No saved records to print.');
        return;
    }

    const printArea = document.getElementById('print-area');
    printArea.innerHTML = '';

    // Process in chunks of 4 (2x2 grid per A4 page)
    for (let i = 0; i < savedRecords.length; i += 4) {
        const chunk = savedRecords.slice(i, i + 4);

        if (side === 'front') {
            const frontPage = document.createElement('div');
            frontPage.className = 'print-page';
            chunk.forEach((record, index) => {
                const fCard = createPrintCard(record, 'front', i + index);
                frontPage.appendChild(fCard);
            });
            // Fill remaining slots
            for (let j = chunk.length; j < 4; j++) {
                const emptyFront = document.createElement('div');
                emptyFront.className = 'id-card empty';
                emptyFront.style.visibility = 'hidden';
                frontPage.appendChild(emptyFront);
            }
            printArea.appendChild(frontPage);
        }

        if (side === 'back') {
            const backPage = document.createElement('div');
            backPage.className = 'print-page';
            // Reorder for horizontal mirroring: 0->1, 1->0, 2->3, 3->2
            const backIndices = [1, 0, 3, 2];
            backIndices.forEach(idx => {
                if (idx < chunk.length) {
                    const bCard = createPrintCard(chunk[idx], 'back', i + idx);
                    backPage.appendChild(bCard);
                } else if (idx < 4) {
                    const emptyBack = document.createElement('div');
                    emptyBack.className = 'id-card empty';
                    emptyBack.style.visibility = 'hidden';
                    backPage.appendChild(emptyBack);
                }
            });
            printArea.appendChild(backPage);
        }
    }

    // Finalize barcodes for batch fronts
    if (side === 'front') {
        setTimeout(() => {
            savedRecords.forEach((record, index) => {
                const elements = document.querySelectorAll(`.print-barcode-${index}`);
                elements.forEach(el => {
                    JsBarcode(el, record.idNumber, {
                        format: "CODE128",
                        lineColor: "#000",
                        width: 1.5,
                        height: 25,
                        displayValue: false,
                        margin: 0,
                        background: "transparent"
                    });
                });
            });
            window.print();
        }, 600);
    } else {
        setTimeout(() => {
            window.print();
        }, 500);
    }
}

function createPrintCard(record, side, uniqueId) {
    const card = document.createElement('div');
    card.className = `id-card ${side}`;

    if (side === 'front') {
        card.innerHTML = `
            <div class="card-header">
                <img src="pcso1.png" alt="" class="logo">
                <img src="glowing.png" alt="" class="logo-center">
                <img src="STL_256p.png" alt="" class="logo">
            </div>
            <div class="company-name">GLOWING FORTUNE OPC</div>
            <div class="company-subtitle">PCSO STL Authorized Agent Corporation</div>
            <div class="company-location">PROVINCE OF LANAO DEL NORTE including ILIGAN CITY</div>
            <div class="photo-container">
                <img src="${record.photo}" alt="">
                <div class="barcode">
                    <svg class="print-barcode-${uniqueId}"></svg>
                </div>
                <div class="id-number-barcode">${record.idNumber}</div>
            </div>
            <div class="name-section">
                <div class="name-value">${record.name.toUpperCase()}</div>
                <div class="label">NAME</div>
            </div>
            <div class="signature-section">
                <img src="${record.signature}" alt="">
                <div class="signature-label">SIGNATURE</div>
            </div>
            <div class="position-badge">SALES REPRESENTATIVE</div>
        `;
    } else {
        card.innerHTML = `
            <div class="back-header">
                <span class="id-label">ID NO.:</span>
                <span class="id-value">${record.idNumber}</span>
            </div>
            <div class="notice-section">
                <h3>NOTICE</h3>
                <p>This card is <span class="bold-text">NON-TRANSFERABLE;</span></p>
                <p class="bold-text">IN CASE OF LOSS, finder is requested to surrender this card to:</p>
            </div>
            <div class="branch-info">
                <h4>PCSO LANAO DEL NORTE BRANCH</h4>
                <p class="address-line">
                    <span class="address-label">Address:</span>
                    <span class="address-text">OSCA Building, zone 3B, Lanao, Chung Hua Road, Iligan City, 9200 Lanao Del Norte, Philippines</span>
                </p>
                <p class="operation-line">
                    <span class="operation-label">Area of Operation:</span>
                    <span class="operation-text">PROVINCE OF LANAO DEL NORTE/ILIGAN CITY</span>
                </p>
            </div>
            <div class="emergency-section">
                <p class="emergency-label">In case of emergency, please contact:</p>
                <div class="emergency-contact">${record.emergencyContact.toUpperCase()}</div>
                <div class="emergency-phone">${record.emergencyPhone}</div>
            </div>
            <div class="certification-section">
                <div class="cert-item">
                    <p class="cert-label">Certified by:</p>
                    <img src="${record.managerSignature || 'Jennifer Compania signature.png'}" alt="">
                    <div class="cert-name">JENNIFER S. COMPANIA</div>
                    <div class="cert-title">OPERATING MANAGER</div>
                </div>
                <div class="cert-item">
                    <p class="cert-label">Confirmed by:</p>
                    <img src="${record.headSignature || ''}" alt="">
                    <div class="cert-name">CHILBETH JEAN B. SAYA-ANG</div>
                    <div class="cert-title">Branch Head</div>
                    <div class="cert-subtitle">PCSO Lanao del Norte/Iligan City</div>
                </div>
            </div>
        `;
    }
    return card;
}
