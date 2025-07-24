const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const iconsDir = path.join(__dirname, '../public/icons');
  
  // icons 디렉토리가 없으면 생성
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // 기본 SVG 생성
  const svgIcon = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1D4ED8;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="64" fill="url(#grad)"/>
      <text x="256" y="200" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="120" font-weight="bold">🧮</text>
      <text x="256" y="300" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="bold">수학학습</text>
    </svg>
  `;

  const sizes = [144, 192, 256, 384, 512];
  
  try {
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      await sharp(Buffer.from(svgIcon))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ 생성됨: icon-${size}x${size}.png`);
    }
    
    console.log('🎉 모든 아이콘이 성공적으로 생성되었습니다!');
  } catch (error) {
    console.error('❌ 아이콘 생성 중 오류:', error);
  }
}

generateIcons();
