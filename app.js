// Focus Budget - Main Application Logic
// Manages focus items, pie chart visualization, and PDF export

let focusItems = [];
let selectedIndex = null;

// DOM elements
const focusForm = document.getElementById('focusForm');
const focusInput = document.getElementById('focusInput');
const focusList = document.getElementById('focusList');
const pieChart = document.getElementById('pieChart');
const itemCount = document.getElementById('itemCount');
const controlsSection = document.getElementById('controlsSection');
const controlsTitle = document.getElementById('controlsTitle');
const controlsPercent = document.getElementById('controlsPercent');
const emptyState = document.querySelector('.empty');

// Control buttons
const moveTopBtn = document.getElementById('moveTopBtn');
const moveUpBtn = document.getElementById('moveUpBtn');
const moveDownBtn = document.getElementById('moveDownBtn');
const moveBottomBtn = document.getElementById('moveBottomBtn');

// Footer buttons
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  loadFromStorage();
  render();
  attachEventListeners();
}

function attachEventListeners() {
  focusForm.addEventListener('submit', handleAdd);
  exportBtn.addEventListener('click', handleExport);
  clearBtn.addEventListener('click', handleClear);
  
  moveTopBtn.addEventListener('click', () => moveItem('top'));
  moveUpBtn.addEventListener('click', () => moveItem('up'));
  moveDownBtn.addEventListener('click', () => moveItem('down'));
  moveBottomBtn.addEventListener('click', () => moveItem('bottom'));
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
}

function handleAdd(e) {
  e.preventDefault();
  const text = focusInput.value.trim();
  if (!text) return;
  
  focusItems.push({ text, id: Date.now() });
  focusInput.value = '';
  saveToStorage();
  render();
}

function handleRemove(id) {
  focusItems = focusItems.filter(item => item.id !== id);
  if (selectedIndex >= focusItems.length) {
    selectedIndex = null;
  }
  saveToStorage();
  render();
}

function moveItem(direction) {
  if (selectedIndex === null || focusItems.length < 2) return;
  
  const newIndex = calculateNewIndex(selectedIndex, direction);
  if (newIndex === selectedIndex) return;
  
  const [item] = focusItems.splice(selectedIndex, 1);
  focusItems.splice(newIndex, 0, item);
  selectedIndex = newIndex;
  
  saveToStorage();
  render();
}

function calculateNewIndex(current, direction) {
  const max = focusItems.length - 1;
  switch(direction) {
    case 'top': return 0;
    case 'up': return Math.max(0, current - 1);
    case 'down': return Math.min(max, current + 1);
    case 'bottom': return max;
    default: return current;
  }
}

function handleKeyboard(e) {
  if (selectedIndex === null) return;
  
  const isMod = e.ctrlKey || e.metaKey;
  
  if (e.key === 'Escape') {
    selectedIndex = null;
    render();
    return;
  }
  
  if (isMod && e.key === 'ArrowUp') {
    e.preventDefault();
    moveItem('up');
  } else if (isMod && e.key === 'ArrowDown') {
    e.preventDefault();
    moveItem('down');
  }
}

function selectItem(index) {
  selectedIndex = selectedIndex === index ? null : index;
  render();
}

function handleClear() {
  if (!focusItems.length) return;
  if (confirm('Clear all focus items?')) {
    focusItems = [];
    selectedIndex = null;
    saveToStorage();
    render();
  }
}

function render() {
  renderList();
  renderPieChart();
  renderControls();
  updateItemCount();
  toggleEmptyState();
}

function renderList() {
  focusList.innerHTML = '';
  
  focusItems.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'list-item';
    if (index === selectedIndex) li.classList.add('selected');
    
    const percent = calculatePercent(index);
    const color = getColor(index);
    
    li.innerHTML = `
      <div class="item-content">
        <span class="item-color" style="background: ${color};"></span>
        <span class="item-text">${escapeHtml(item.text)}</span>
      </div>
      <div class="item-actions">
        <span class="item-percent">${percent}%</span>
        <button class="item-remove" aria-label="Remove ${escapeHtml(item.text)}">×</button>
      </div>
    `;
    
    li.querySelector('.item-content').addEventListener('click', () => selectItem(index));
    li.querySelector('.item-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      handleRemove(item.id);
    });
    
    focusList.appendChild(li);
  });
}

function renderPieChart() {
  pieChart.innerHTML = '';
  if (focusItems.length === 0) return;
  
  let currentAngle = -90;
  
  focusItems.forEach((item, index) => {
    const percent = calculatePercent(index);
    const angle = (percent / 100) * 360;
    const color = getColor(index);
    
    const slice = createPieSlice(currentAngle, angle, color, index);
    pieChart.appendChild(slice);
    
    const label = createPieLabel(currentAngle, angle, percent, index);
    pieChart.appendChild(label);
    
    currentAngle += angle;
  });
}

function createPieSlice(startAngle, sweepAngle, color, index) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  
  const start = polarToCartesian(200, 200, 180, startAngle);
  const end = polarToCartesian(200, 200, 180, startAngle + sweepAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;
  
  const d = [
    `M 200 200`,
    `L ${start.x} ${start.y}`,
    `A 180 180 0 ${largeArc} 1 ${end.x} ${end.y}`,
    `Z`
  ].join(' ');
  
  path.setAttribute('d', d);
  path.setAttribute('fill', color);
  path.setAttribute('class', 'pie-slice');
  if (index === selectedIndex) path.classList.add('selected');
  
  path.addEventListener('click', () => selectItem(index));
  
  return path;
}

function createPieLabel(startAngle, sweepAngle, percent, index) {
  const midAngle = startAngle + sweepAngle / 2;
  const pos = polarToCartesian(200, 200, 120, midAngle);
  
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', pos.x);
  text.setAttribute('y', pos.y);
  text.setAttribute('class', 'pie-label');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'middle');
  text.textContent = `${percent}%`;
  
  text.addEventListener('click', () => selectItem(index));
  
  return text;
}

function polarToCartesian(cx, cy, radius, angle) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad)
  };
}

function renderControls() {
  if (selectedIndex === null || focusItems.length === 0) {
    controlsSection.style.display = 'none';
    return;
  }
  
  controlsSection.style.display = 'block';
  const item = focusItems[selectedIndex];
  const percent = calculatePercent(selectedIndex);
  
  controlsTitle.textContent = item.text;
  controlsPercent.textContent = `${percent}%`;
  
  moveTopBtn.disabled = selectedIndex === 0;
  moveUpBtn.disabled = selectedIndex === 0;
  moveDownBtn.disabled = selectedIndex === focusItems.length - 1;
  moveBottomBtn.disabled = selectedIndex === focusItems.length - 1;
}

function calculatePercent(index) {
  const total = getTotalWeight();
  const weight = getWeight(index);
  return Math.round((weight / total) * 100 * 10) / 10;
}

function getWeight(index) {
  return Math.pow(2, focusItems.length - 1 - index);
}

function getTotalWeight() {
  return focusItems.reduce((sum, _, i) => sum + getWeight(i), 0);
}

function getColor(index) {
  const colors = [
    '#22c55e', // Green (highest priority)
    '#84cc16',
    '#eab308',
    '#f97316',
    '#ef4444', // Red (lowest priority)
  ];
  
  const ratio = focusItems.length > 1 ? index / (focusItems.length - 1) : 0;
  const colorIndex = Math.floor(ratio * (colors.length - 1));
  return colors[Math.min(colorIndex, colors.length - 1)];
}

function updateItemCount() {
  itemCount.textContent = focusItems.length;
}

function toggleEmptyState() {
  emptyState.style.display = focusItems.length === 0 ? 'flex' : 'none';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Storage functions
function saveToStorage() {
  try {
    localStorage.setItem('focus-budget:items', JSON.stringify(focusItems));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

function loadFromStorage() {
  try {
    const stored = localStorage.getItem('focus-budget:items');
    if (stored) {
      focusItems = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
    focusItems = [];
  }
}

// PDF Export with professional layout
async function handleExport() {
  if (focusItems.length === 0) {
    alert('Add some focus items first!');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Draw pie chart at the top
    await drawPieChartToPDF(doc, margin, margin, contentWidth, 80);

    // Add title
    let yPos = margin + 90;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Focus Budget Interpretation & Use', margin, yPos);

    // Add subtitle
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const subtitle = 'This chart represents our current allocation of attention, not a wishlist.';
    doc.text(subtitle, margin, yPos);

    yPos += 5;
    const subtitle2 = 'Each slice reflects the relative amount of focus a workstream, initiative, or obligation';
    doc.text(subtitle2, margin, yPos);

    yPos += 5;
    const subtitle3 = 'is expected to receive during this period.';
    doc.text(subtitle3, margin, yPos);

    // Add "How to apply this:" section
    yPos += 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('How to apply this:', margin, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const bullets = [
      'Begin work with the largest green slices. These are our highest priorities.',
      'Time, energy, and decision-making should be spent in proportion to slice size.',
      'Smaller slices are intentionally smaller. They are not ignored, but they do not',
      'receive focus until higher-priority areas are covered.',
      'Requests, new work, or scope changes should be evaluated against this budget.',
      'Increasing focus in one area requires reducing it elsewhere.',
      'This focus budget is a snapshot in time. It can be revisited and adjusted, but until it is,',
      'it represents the agreed-upon order of operations.'
    ];

    const bulletGroups = [
      [bullets[0]],
      [bullets[1]],
      [bullets[2], bullets[3]],
      [bullets[4]],
      [bullets[5]],
      [bullets[6], bullets[7]]
    ];

    bulletGroups.forEach(group => {
      doc.circle(margin + 1.5, yPos - 1, 0.8, 'F');
      
      group.forEach((line, idx) => {
        doc.text(line, margin + 4, yPos + (idx * 5));
      });
      
      yPos += (group.length * 5) + 3;
    });

    // Add support section
    yPos += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Support & best practices (optional)', margin, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const support1 = 'Teams that want guidance on creating, revisiting, and maintaining effective focus';
    const support2 = 'budgets can explore Sheety memberships for best-practice use.';
    doc.text(support1, margin, yPos);
    yPos += 5;
    doc.text(support2, margin, yPos);

    // Save the PDF
    const filename = `focus-budget-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error('PDF export failed:', error);
    alert('Failed to export PDF. Please try again.');
  }
}

async function drawPieChartToPDF(doc, x, y, width, height) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius = Math.min(width, height) / 2 - 5;

  let currentAngle = -90;

  focusItems.forEach((item, index) => {
    const percent = calculatePercent(index);
    const sweepAngle = (percent / 100) * 360;
    const color = getColor(index);

    // Convert hex color to RGB
    const rgb = hexToRgb(color);
    doc.setFillColor(rgb.r, rgb.g, rgb.b);

    // Draw pie slice
    drawPieSlicePDF(doc, centerX, centerY, radius, currentAngle, sweepAngle);

    // Add percentage label
    const midAngle = currentAngle + sweepAngle / 2;
    const labelRadius = radius * 0.65;
    const labelPos = polarToCartesianPDF(centerX, centerY, labelRadius, midAngle);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${percent}%`, labelPos.x, labelPos.y, { align: 'center' });

    currentAngle += sweepAngle;
  });

  // Add legend below the pie
  let legendY = y + height + 10;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  focusItems.forEach((item, index) => {
    const color = getColor(index);
    const rgb = hexToRgb(color);
    const percent = calculatePercent(index);

    // Color box
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(x, legendY - 3, 4, 4, 'F');

    // Item text
    doc.setFont('helvetica', 'bold');
    doc.text(`Item ${index + 1}`, x + 6, legendY);
    
    // Percentage
    const textWidth = doc.getTextWidth(`Item ${index + 1}`);
    doc.setFont('helvetica', 'normal');
    doc.text(` - ${percent}%`, x + 6 + textWidth, legendY);

    legendY += 6;
  });
}

function drawPieSlicePDF(doc, cx, cy, radius, startAngle, sweepAngle) {
  const steps = Math.max(20, Math.ceil(sweepAngle / 5));
  const angleStep = sweepAngle / steps;

  doc.moveTo(cx, cy);

  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + (i * angleStep);
    const pos = polarToCartesianPDF(cx, cy, radius, angle);
    doc.lineTo(pos.x, pos.y);
  }

  doc.lineTo(cx, cy);
  doc.fill();
}

function polarToCartesianPDF(cx, cy, radius, angle) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad)
  };
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}
