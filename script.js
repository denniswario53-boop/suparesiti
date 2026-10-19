// Global State Management
let vendorData = JSON.parse(localStorage.getItem('suparesiti_vendor')) || null;
let currentSerial = parseInt(localStorage.getItem('suparesiti_serial')) || 1001;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkVendorSetup();
  initFormListeners();
  renderSerial();
  addInitialItemRow();
  updateReceiptPreview();
});

// Check if Vendor account exists in localStorage
function checkVendorSetup() {
  const modal = document.getElementById('setupModal');
  const badge = document.getElementById('vendorStatusBadge');

  if (!vendorData) {
    modal.classList.remove('hidden');
    badge.classList.add('hidden');
    badge.classList.remove('flex');
  } else {
    modal.classList.add('hidden');
    badge.classList.remove('hidden');
    badge.classList.add('flex');

    document.getElementById('badgeBizName').innerText = vendorData.name;
    document.getElementById('badgeBizPhone').innerText = vendorData.phone;
  }
}

// Setup Event Listeners
function initFormListeners() {
  // One-time Setup Form Submission
  document.getElementById('setupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    vendorData = {
      name: document.getElementById('setupName').value.trim(),
      phone: document.getElementById('setupPhone').value.trim(),
      location: document.getElementById('setupLocation').value.trim()
    };
    localStorage.setItem('suparesiti_vendor', JSON.stringify(vendorData));
    checkVendorSetup();
    updateReceiptPreview();
  });

  // Edit Business Info Button
  document.getElementById('editBizBtn').addEventListener('click', () => {
    if (vendorData) {
      document.getElementById('setupName').value = vendorData.name;
      document.getElementById('setupPhone').value = vendorData.phone;
      document.getElementById('setupLocation').value = vendorData.location;
    }
    document.getElementById('setupModal').classList.remove('hidden');
  });

  // Next Serial Number Button
  document.getElementById('nextSerialBtn').addEventListener('click', () => {
    currentSerial++;
    localStorage.setItem('suparesiti_serial', currentSerial);
    renderSerial();
    updateReceiptPreview();
  });

  // Add Item Button
  document.getElementById('addItemBtn').addEventListener('click', () => {
    addItemRow();
    updateReceiptPreview();
  });

  // Static Inputs Change Listener
  ['mpesaCode', 'clientName', 'brandColor'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateReceiptPreview);
  });

  // Download PDF Button
  document.getElementById('downloadBtn').addEventListener('click', downloadPDF);
}

// Render Serial Number
function renderSerial() {
  const formattedSerial = `SR-2026-${currentSerial}`;
  document.getElementById('serialNo').value = formattedSerial;
  document.getElementById('prevSerial').innerText = formattedSerial;
}

// Item Row Management
function addInitialItemRow() {
  const container = document.getElementById('itemsContainer');
  container.innerHTML = '';
  addItemRow("Custom Wall Cabinet Setup", 4500);
}

function addItemRow(desc = "", price = "") {
  const container = document.getElementById('itemsContainer');
  const rowId = `item_row_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  const row = document.createElement('div');
  row.className = 'flex items-center gap-2 item-row';
  row.id = rowId;
  row.innerHTML = `
    <input type="text" placeholder="Item description" value="${desc}" class="item-desc w-3/5 bg-slate-800 border border-slate-700 p-2 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500">
    <input type="number" placeholder="Amt" value="${price}" class="item-amt w-2/5 bg-slate-800 border border-slate-700 p-2 rounded-lg text-xs font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500">
    <button type="button" onclick="removeItemRow('${rowId}')" class="text-slate-500 hover:text-red-400 p-1 text-sm">✕</button>
  `;

  container.appendChild(row);

  // Attach dynamic input listeners
  row.querySelector('.item-desc').addEventListener('input', updateReceiptPreview);
  row.querySelector('.item-amt').addEventListener('input', updateReceiptPreview);
}

function removeItemRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    updateReceiptPreview();
  }
}

// Live Receipt Preview Update Engine
function updateReceiptPreview() {
  // Business Info
  const bizName = vendorData ? vendorData.name : "YOUR BUSINESS NAME";
  const bizPhone = vendorData ? vendorData.phone : "+254 7XX XXX XXX";
  const bizLocation = vendorData ? vendorData.location : "Mombasa, Kenya";

  document.getElementById('prevBiz').innerText = bizName;
  document.getElementById('prevPhone').innerText = bizPhone;
  document.getElementById('prevLocation').innerText = bizLocation;

  // Transaction Info
  document.getElementById('prevRef').innerText = (document.getElementById('mpesaCode').value || "QX000000").toUpperCase();
  document.getElementById('prevClient').innerText = document.getElementById('clientName').value || "Customer Name";
  document.getElementById('prevDate').innerText = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // Calculate Items & Total
  const itemRows = document.querySelectorAll('.item-row');
  const prevItemsList = document.getElementById('prevItemsList');
  prevItemsList.innerHTML = '';

  let grandTotal = 0;

  itemRows.forEach(row => {
    const desc = row.querySelector('.item-desc').value || "Unspecified Item";
    const amt = parseFloat(row.querySelector('.item-amt').value || 0);
    grandTotal += amt;

    const listRow = document.createElement('div');
    listRow.className = 'flex justify-between items-center py-0.5 border-b border-slate-50 text-slate-700';
    listRow.innerHTML = `
      <span class="font-medium">${desc}</span>
      <span class="font-bold">KSh ${amt.toLocaleString()}</span>
    `;
    prevItemsList.appendChild(listRow);
  });

  const formattedTotal = `KSh ${grandTotal.toLocaleString()}`;
  document.getElementById('prevTotal').innerText = formattedTotal;

  // Interactive Color Accent Application
  const colorHex = document.getElementById('brandColor').value;
  document.getElementById('hexLabel').innerText = colorHex;

  // Apply outer border frame color
  document.getElementById('receiptFrame').style.borderColor = colorHex;
  document.getElementById('prevTotal').style.color = colorHex;
  document.getElementById('brandDot').style.backgroundColor = colorHex;

  const statusBadge = document.getElementById('statusBadge');
  statusBadge.style.color = colorHex;
  statusBadge.style.backgroundColor = hexToRgba(colorHex, 0.12);
}

// Convert Hex to RGBA Helper
function hexToRgba(hex, alpha) {
  let r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// PDF Export Function
function downloadPDF() {
  const element = document.getElementById('receiptFrame');
  const bizNameClean = vendorData ? vendorData.name.replace(/\s+/g, '_') : 'Receipt';
  const serialClean = document.getElementById('serialNo').value;

  const opt = {
    margin:       0.3,
    filename:     `${bizNameClean}_${serialClean}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'a5', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}