import fs from 'fs';
import path from 'path';

const filePath = 'C:/Users/pkhoa/.gemini/antigravity/brain/e572c9fa-8149-43a3-940b-5456bbfcec6a/.system_generated/steps/732/content.md';

if (!fs.existsSync(filePath)) {
  console.log("File not found");
  process.exit(1);
}

const html = fs.readFileSync(filePath, 'utf8');

// Match JSON structures: \"text\":\"...\"
const regex = /\\"text\\":\\"(.*?)\\"/g;
let textBlocks = [];
let match;
while ((match = regex.exec(html)) !== null) {
  let text = match[1];
  text = text.replace(/\\\\n/g, '\n')
             .replace(/\\\\"/g, '"')
             .replace(/\\\\t/g, '\t')
             .replace(/\\n/g, '\n')
             .replace(/\\"/g, '"');
  
  if (text.trim().length > 0 && !textBlocks.includes(text)) {
    textBlocks.push(text);
  }
}

console.log(`\n=== EXTRACTED TEXT FROM CUSTOM FIELDS DOCS ===\n`);
console.log(textBlocks.join('\n\n').substring(0, 3000));
