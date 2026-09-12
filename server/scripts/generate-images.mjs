import sharp from 'sharp';
import { mkdir, writeFile, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'images');

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Abstract geometric banner — gradient background, a few translucent
 * shapes, and a title. Generated locally (no external image APIs) so
 * the demo has zero network dependency and stays ₹0.
 */
function bannerSvg({ title, from, to, shapes }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  ${shapes}
  <text x="60" y="700" fill="#ffffff" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="56" font-weight="600">${escapeXml(title)}</text>
</svg>`;
}

const specs = [
  {
    file: 'ai-ml-workshop.webp',
    title: 'AI & ML Workshop',
    from: '#7c3aed',
    to: '#4c1d95',
    shapes: `
      <circle cx="980" cy="220" r="180" fill="#ffffff" opacity="0.08"/>
      <circle cx="1080" cy="380" r="90" fill="#ffffff" opacity="0.1"/>
      <g stroke="#ffffff" stroke-width="3" opacity="0.35" fill="none">
        <circle cx="900" cy="300" r="14"/>
        <circle cx="1000" cy="220" r="14"/>
        <circle cx="1080" cy="330" r="14"/>
        <circle cx="960" cy="420" r="14"/>
        <line x1="900" y1="300" x2="1000" y2="220"/>
        <line x1="1000" y1="220" x2="1080" y2="330"/>
        <line x1="900" y1="300" x2="960" y2="420"/>
        <line x1="1080" y1="330" x2="960" y2="420"/>
      </g>`,
  },
  {
    file: 'innovate-tech-fest.webp',
    title: 'Annual Tech Fest — Innovate',
    from: '#2563eb',
    to: '#1e3a8a',
    shapes: `
      <rect x="820" y="120" width="320" height="320" rx="24" fill="#ffffff" opacity="0.08" transform="rotate(18 980 280)"/>
      <circle cx="1050" cy="500" r="70" fill="#ffffff" opacity="0.12"/>
      <g fill="#ffffff" opacity="0.3">
        <polygon points="950,200 970,260 1030,260 982,296 1000,356 950,320 900,356 918,296 870,260 930,260"/>
      </g>`,
  },
  {
    file: 'career-fair.webp',
    title: 'Career Fair',
    from: '#059669',
    to: '#064e3b',
    shapes: `
      <circle cx="950" cy="250" r="150" fill="#ffffff" opacity="0.1"/>
      <g fill="none" stroke="#ffffff" stroke-width="4" opacity="0.3">
        <rect x="880" y="340" width="220" height="150" rx="12"/>
        <line x1="880" y1="400" x2="1100" y2="400"/>
        <line x1="960" y1="340" x2="960" y2="320"/>
        <line x1="1020" y1="340" x2="1020" y2="320"/>
      </g>`,
  },
  {
    file: 'central-library.webp',
    title: 'Central Library',
    from: '#b45309',
    to: '#78350f',
    shapes: `
      <circle cx="1000" cy="260" r="160" fill="#ffffff" opacity="0.08"/>
      <g fill="#ffffff" opacity="0.28">
        <rect x="870" y="260" width="30" height="160"/>
        <rect x="915" y="230" width="30" height="190"/>
        <rect x="960" y="280" width="30" height="140"/>
        <rect x="1005" y="245" width="30" height="175"/>
        <rect x="1050" y="270" width="30" height="150"/>
      </g>`,
  },
];

async function main() {
  await mkdir(outDir, { recursive: true });

  for (const spec of specs) {
    const svg = bannerSvg(spec);
    const outPath = path.join(outDir, spec.file);
    await sharp(Buffer.from(svg))
      .resize(1200, 800)
      .webp({ quality: 72 })
      .toFile(outPath);
    const { size } = await stat(outPath);
    console.log(`${spec.file}: ${(size / 1024).toFixed(1)} KB`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
