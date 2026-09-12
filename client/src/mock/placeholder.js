/**
 * Local, network-free placeholder images for mock data (Phase 1).
 * Phase 3 replaces these with real files under /public/images.
 */
function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function placeholderImage(label, color = '#6d28d9') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <rect width="600" height="400" fill="${color}"/>
    <text x="50%" y="50%" fill="#ffffff" font-family="system-ui, sans-serif" font-size="28"
      text-anchor="middle" dominant-baseline="middle">${escapeXml(label)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
