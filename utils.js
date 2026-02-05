// ── Configuration ──
const CONFIG = {
  PIE: {
    cx: 200,              // Pie center X
    cy: 200,              // Pie center Y
    outerRadius: 180,     // Outer radius
    innerRadius: 90,      // Inner radius (donut hole)
    minSlicePercent: 0.5, // Minimum slice size
  },
  COLOR: {
    topHue: 120,          // Top item color (green)
    bottomHue: 0,         // Bottom item color (red)
    baseSaturation: 75,   // Color saturation
    topLightness: 55,     // Top item brightness
    bottomLightness: 60,  // Bottom item brightness
  },
  DISTRIBUTION: {
    topRatio: 8,          // Top item weight (increased from 5)
    bottomRatio: 1,       // Bottom item weight
  },
  DEBOUNCE_MS: 500,       // Save delay in milliseconds
};

// ── ID Generation ──
function cryptoRandomId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ── Percentage Calculation ──
function recalcSlicesByRank(items) {
  if (!items || items.length === 0) return [];
  
  const n = items.length;
  
  // If only one item, it gets 100%
  if (n === 1) {
    return [{ ...items[0], percent: 100 }];
  }
  
  // Each item is worth 2x the next item
  // Item 1: 2^(n-1), Item 2: 2^(n-2), ..., Item n: 2^0
  // Total = 2^n - 1
  
  const weights = items.map((_, i) => {
    return Math.pow(2, n - 1 - i);
  });
  
  const totalWeight = Math.pow(2, n) - 1; // This equals sum of all weights
  
  // Convert weights to percentages
  const percentages = weights.map(w => (w / totalWeight) * 100);
  
  return items.map((item, i) => ({
    ...item,
    percent: percentages[i]
  }));
}

// ── Color Calculation ──
function colorForRank(index, total) {
  const { topHue, bottomHue, baseSaturation, topLightness, bottomLightness } = CONFIG.COLOR;
  
  if (total === 1) {
    return { h: topHue, s: baseSaturation, l: topLightness };
  }
  
  const t = index / (total - 1); // 0 to 1
  
  // Interpolate hue from green (120) through yellow (60) to red (0)
  // This gives us a natural traffic light gradient
  const hue = topHue * (1 - t) + bottomHue * t;
  
  const lightness = topLightness * (1 - t) + bottomLightness * t;
  
  return { h: hue, s: baseSaturation, l: lightness };
}

// ── Color Conversion ──
function hslToRgb(h, s, l) {
  s = s / 100;
  l = l / 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `rgb(${r}, ${g}, ${b})`;
}

// ── SVG Path Generation ──
function createDonutPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const degToRad = Math.PI / 180;
  
  // Convert angles to radians
  const startRad = startAngle * degToRad;
  const endRad = endAngle * degToRad;
  
  // Calculate outer arc points
  const outerStartX = cx + outerRadius * Math.cos(startRad);
  const outerStartY = cy + outerRadius * Math.sin(startRad);
  const outerEndX = cx + outerRadius * Math.cos(endRad);
  const outerEndY = cy + outerRadius * Math.sin(endRad);
  
  // Calculate inner arc points
  const innerStartX = cx + innerRadius * Math.cos(startRad);
  const innerStartY = cy + innerRadius * Math.sin(startRad);
  const innerEndX = cx + innerRadius * Math.cos(endRad);
  const innerEndY = cy + innerRadius * Math.sin(endRad);
  
  // Determine if we need a large arc
  const sweepAngle = endAngle - startAngle;
  const largeArc = sweepAngle > 180 ? 1 : 0;
  
  // Build the path
  const path = [
    `M ${outerStartX} ${outerStartY}`,                           // Move to outer start
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}`, // Outer arc
    `L ${innerEndX} ${innerEndY}`,                               // Line to inner end
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStartX} ${innerStartY}`, // Inner arc
    'Z'                                                           // Close path
  ].join(' ');
  
  return path;
}

// ── HTML Escaping ──
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ── Export/Import Functions ──
function exportData(focusItems) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Helper to convert HSL to RGB
  function hslToRgb(h, s, l) {
    s = s / 100;
    l = l / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  
  const pageWidth = 210;
  const margin = 20;
  
  // Draw donut chart at top
  const centerX = pageWidth / 2;
  const centerY = 60;
  const outerRadius = 35;
  const innerRadius = 18;
  
  let currentAngle = -90;
  
  focusItems.forEach((item, index) => {
    const sweepAngle = (item.percent / 100) * 360;
    const endAngle = currentAngle + sweepAngle;
    
    const t = focusItems.length > 1 ? index / (focusItems.length - 1) : 0;
    const hue = 120 * (1 - t);
    const [r, g, b] = hslToRgb(hue, 75, 55);
    
    doc.setFillColor(r, g, b);
    doc.setDrawColor(11, 13, 18);
    doc.setLineWidth(0.3);
    
    const segments = Math.max(8, Math.ceil(Math.abs(sweepAngle) / 15));
    const points = [];
    
    for (let i = 0; i <= segments; i++) {
      const angle = (currentAngle + (sweepAngle * i / segments)) * Math.PI / 180;
      points.push([centerX + outerRadius * Math.cos(angle), centerY + outerRadius * Math.sin(angle)]);
    }
    for (let i = segments; i >= 0; i--) {
      const angle = (currentAngle + (sweepAngle * i / segments)) * Math.PI / 180;
      points.push([centerX + innerRadius * Math.cos(angle), centerY + innerRadius * Math.sin(angle)]);
    }
    
    doc.path(points.map((p, i) => ({ op: i === 0 ? 'm' : 'l', c: p })).concat([{ op: 's' }]));
    doc.fillStroke();
    
    // Add percentage label
    if (sweepAngle > 15) {
      const midAngle = (currentAngle + endAngle) / 2;
      const labelRadius = (innerRadius + outerRadius) / 2;
      const labelX = centerX + labelRadius * Math.cos(midAngle * Math.PI / 180);
      const labelY = centerY + labelRadius * Math.sin(midAngle * Math.PI / 180);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${item.percent.toFixed(0)}%`, labelX, labelY, { align: 'center' });
    }
    
    currentAngle = endAngle;
  });
  
  // Center circle with white background
  doc.setFillColor(255, 255, 255);
  doc.circle(centerX, centerY, innerRadius, 'F');
  
  // Legend below pie chart
  let legendY = centerY + outerRadius + 12;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  focusItems.forEach((item, index) => {
    const t = focusItems.length > 1 ? index / (focusItems.length - 1) : 0;
    const hue = 120 * (1 - t);
    const [r, g, b] = hslToRgb(hue, 75, 55);
    
    // Color box
    doc.setFillColor(r, g, b);
    doc.rect(margin, legendY - 3, 4, 4, 'F');
    
    // Item text
    doc.setFont('helvetica', 'normal');
    const displayText = item.text.length > 70 ? item.text.substring(0, 67) + '...' : item.text;
    doc.text(`Item ${index + 1}`, margin + 6, legendY);
    
    // Percentage
    doc.setFont('helvetica', 'normal');
    const textWidth = doc.getTextWidth(`Item ${index + 1}`);
    doc.text(` ${item.percent.toFixed(1)}%`, margin + 6 + textWidth, legendY);
    
    legendY += 6;
  });
  
  // Add spacing before title section
  let yPos = legendY + 15;
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Focus Budget Interpretation & Use', margin, yPos);
  
  // Subtitle
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('This chart represents our current allocation of attention, not a wishlist.', margin, yPos);
  
  yPos += 5;
  doc.text('Each slice reflects the relative amount of focus a workstream, initiative, or obligation', margin, yPos);
  
  yPos += 5;
  doc.text('is expected to receive during this period.', margin, yPos);
  
  // "How to apply this:" section
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
  
  // Support section
  yPos += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Support & best practices (optional)', margin, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Teams that want guidance on creating, revisiting, and maintaining effective focus', margin, yPos);
  yPos += 5;
  doc.text('budgets can explore Sheety memberships for best-practice use.', margin, yPos);
  
  // Save
  doc.save(`focus-budget-${new Date().toISOString().split('T')[0]}.pdf`);
}
