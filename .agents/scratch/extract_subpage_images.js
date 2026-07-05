import fs from 'fs';

async function run() {
  console.log("Fetching Leads subpage...");
  const res = await fetch("https://docs.pancake.biz/crm/st-f2/st-p1?lang=vi", { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();

  // Find <img src="..."> tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
  let matches = new Set();
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    matches.add(match[1]);
  }

  // Find markdown image syntax ![alt](url)
  const mdRegex = /!\[.*?\]\((.*?)\)/g;
  while ((match = mdRegex.exec(html)) !== null) {
    matches.add(match[1]);
  }

  // Find any string ending in .png or .jpg inside quotes
  const extRegex = /"([^"]+\.(?:png|jpg|jpeg|svg))"/gi;
  while ((match = extRegex.exec(html)) !== null) {
    matches.add(match[1]);
  }

  console.log(`\n=== DISCOVERED IMAGE PATTERNS (${matches.size}) ===\n`);
  console.log(Array.from(matches).join('\n'));
}

run();
