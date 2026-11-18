import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const size = 48;
const badgeSize = 42;
const iconSize = 26;

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${size}px;
      height: ${size}px;
      overflow: hidden;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .badge {
      width: ${badgeSize}px;
      height: ${badgeSize}px;
      border-radius: 10px;
      background: linear-gradient(135deg, #f0f7ff 0%, #e0effe 100%);
      border: 1.5px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      width: ${iconSize}px;
      height: ${iconSize}px;
      color: #2563eb;
    }
  </style>
</head>
<body>
  <div class="badge">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
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

const tempHtml = path.join(process.cwd(), 'scripts', 'temp-fav.html');
const tempPng = path.join(process.cwd(), 'scripts', 'temp-fav.png');
fs.writeFileSync(tempHtml, html, 'utf8');

execSync(`"${CHROME_PATH}" --headless=new --screenshot="${tempPng}" --window-size=48,48 --default-background-color=00000000 "${tempHtml}"`);

const pngBuf = fs.readFileSync(tempPng);

// Build .ico buffer
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0); // Reserved
icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
icoHeader.writeUInt16LE(1, 4); // Count = 1 image

icoHeader.writeUInt8(48, 6);   // Width
icoHeader.writeUInt8(48, 7);   // Height
icoHeader.writeUInt8(0, 8);    // Color palette
icoHeader.writeUInt8(0, 9);    // Reserved
icoHeader.writeUInt16LE(1, 10); // Color planes
icoHeader.writeUInt16LE(32, 12); // Bits per pixel
icoHeader.writeUInt32LE(pngBuf.length, 14); // Image size in bytes
icoHeader.writeUInt32LE(22, 18); // Offset to image data

const icoBuf = Buffer.concat([icoHeader, pngBuf]);

fs.writeFileSync(path.join(process.cwd(), 'apps', 'web', 'public', 'favicon.ico'), icoBuf);
fs.writeFileSync(path.join(process.cwd(), 'apps', 'web', 'src', 'app', 'favicon.ico'), icoBuf);
console.log('Successfully generated favicon.ico (', icoBuf.length, 'bytes )');

fs.unlinkSync(tempHtml);
fs.unlinkSync(tempPng);
