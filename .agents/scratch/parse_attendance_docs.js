import fs from 'fs';

const filePath = 'C:\\Users\\pkhoa\\.gemini\\antigravity\\brain\\e572c9fa-8149-43a3-940b-5456bbfcec6a\\.system_generated\\steps\\1639\\content.md';
let content = fs.readFileSync(filePath, 'utf8');

// Strip styles and scripts
content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
content = content.replace(/<svg[\s\S]*?<\/svg>/gi, '');

// Strip other html tags but keep text
let text = content.replace(/<[^>]*>/g, '\n');

// Clean lines
const lines = text.split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0 && !line.includes('css-') && !line.includes('ant-') && !line.startsWith('.') && !line.startsWith('#') && !line.includes('{') && !line.includes('}'));

console.log("EXTRACTED TEXT LINES:");
console.log(lines.slice(0, 150).join('\n'));
