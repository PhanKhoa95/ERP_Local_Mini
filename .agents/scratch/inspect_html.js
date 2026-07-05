import fs from 'fs';
import path from 'path';

const filePath = 'C:/Users/pkhoa/.gemini/antigravity/brain/e572c9fa-8149-43a3-940b-5456bbfcec6a/.system_generated/steps/574/content.md';

if (!fs.existsSync(filePath)) {
  console.log("File does not exist:", filePath);
  process.exit(1);
}

const html = fs.readFileSync(filePath, 'utf8');
console.log('File length:', html.length);

// Let's find some keywords
const keywords = ['"slug":"st-p1"', 'Tiềm năng', 'mô tả', 'cấu hình'];
keywords.forEach(kw => {
  const start = html.indexOf(kw);
  if (start !== -1) {
    console.log(`\n=== Keyword: "${kw}" found at index ${start} ===`);
    console.log(html.substring(start - 200, start + 800));
  } else {
    console.log(`Keyword: "${kw}" not found`);
  }
});
