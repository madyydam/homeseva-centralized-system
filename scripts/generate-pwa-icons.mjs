import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SIZES = [
  { name: 'icon-512x512.png', size: 512, iconSize: 260, strokeWidth: 2.2, radius: 120 },
  { name: 'icon-192x192.png', size: 192, iconSize: 98, strokeWidth: 2.2, radius: 46 },
  { name: 'apple-touch-icon.png', size: 180, iconSize: 92, strokeWidth: 2.2, radius: 42 },
];

const TARGET_DIR = path.join(process.cwd(), 'apps', 'web', 'public', 'icons');
const TEMP_HTML = path.join(process.cwd(), 'scripts', 'temp-icon.html');
const ARTIFACT_DIR = path.join(
  process.env.USERPROFILE || 'C:\\Users\\madhu',
  '.gemini',
  'antigravity',
  'brain',
  '59a73d5d-7c79-4b3c-a622-08c38c079203'
);

for (const item of SIZES) {
  const badgeSize = Math.round(item.size * 0.88);
  const borderWidth = Math.max(2, Math.round(item.size * 0.024));

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${item.size}px;
      height: ${item.size}px;
      overflow: hidden;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .badge {
      width: ${badgeSize}px;
      height: ${badgeSize}px;
      border-radius: ${item.radius}px;
      background: linear-gradient(135deg, #f0f7ff 0%, #e0effe 100%);
      border: ${borderWidth}px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 ${Math.round(item.size * 0.04)}px ${Math.round(item.size * 0.08)}px -${Math.round(item.size * 0.02)}px rgba(37, 99, 235, 0.22);
    }
    svg {
      width: ${item.iconSize}px;
      height: ${item.iconSize}px;
      color: #2563eb;
    }
  </style>
</head>
<body>
  <div class="badge">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${item.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
      <path d="M10 6h4"/>
      <path d="M10 10h4"/>
      <path d="M10 14h4"/>
      <path d="M10 18h4"/>
    </svg>
  </div>
</body>
</html>`;

  fs.writeFileSync(TEMP_HTML, html, 'utf8');
  const targetPath = path.join(TARGET_DIR, item.name);

  const cmd = `"${CHROME_PATH}" --headless=new --screenshot="${targetPath}" --window-size=${item.size},${item.size} --default-background-color=00000000 "${TEMP_HTML}"`;
  execSync(cmd, { stdio: 'pipe' });

  console.log(`Generated: ${item.name} (${item.size}x${item.size}) -> ${fs.statSync(targetPath).size} bytes`);
}

// Copy 512x512 to artifact directory for embedding in response
const artifactPreview = path.join(ARTIFACT_DIR, 'pwa-installed-app-icon.png');
fs.copyFileSync(path.join(TARGET_DIR, 'icon-512x512.png'), artifactPreview);
console.log(`Copied preview to: ${artifactPreview}`);

// Clean up temp
if (fs.existsSync(TEMP_HTML)) fs.unlinkSync(TEMP_HTML);
if (fs.existsSync('test-out.png')) fs.unlinkSync('test-out.png');
if (fs.existsSync('scripts/render-icon-512.html')) fs.unlinkSync('scripts/render-icon-512.html');
