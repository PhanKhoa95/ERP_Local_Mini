import fs from 'fs';

const filePath = 'C:\\Users\\pkhoa\\.gemini\\antigravity\\brain\\e572c9fa-8149-43a3-940b-5456bbfcec6a\\.system_generated\\steps\\1639\\content.md';
let content = fs.readFileSync(filePath, 'utf8');

// Find all href matches
const matches = content.match(/href="([^"]+)"/g);
if (matches) {
  const links = matches.map(m => m.match(/href="([^"]+)"/)[1])
    .filter(l => l.includes('pancakework'))
    .filter((v, i, a) => a.indexOf(v) === i); // Unique list
  
  console.log("FOUND PANCAKEWORK LINKS:");
  console.log(links.join('\n'));
} else {
  console.log("No links found.");
}
