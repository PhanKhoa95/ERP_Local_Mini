import fs from 'fs';

const html = fs.readFileSync('e:/ERP_Local_Mini/.agents/scratch/crm_main_page.html', 'utf8');

// Find image blocks like "url":"https://files.gitbook.com/..."
const regex = /"url"\s*:\s*"(https:\/\/files\.gitbook\.com\/[^"]+)"/g;
let images = new Set();
let match;
while ((match = regex.exec(html)) !== null) {
  images.add(match[1]);
}

// Find standard HTML img tags or links to files.gitbook.com
const htmlRegex = /src="(https:\/\/files\.gitbook\.com\/[^"]+)"/g;
while ((match = htmlRegex.exec(html)) !== null) {
  images.add(match[1]);
}

console.log(`\n=== DISCOVERED DOCUMENTATION IMAGES (${images.size}) ===\n`);
console.log(Array.from(images).slice(0, 30).join('\n'));
if (images.size > 30) {
  console.log(`... and ${images.size - 30} more images.`);
}
