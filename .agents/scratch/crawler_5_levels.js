import fs from "fs";
import path from "path";
import https from "https";
import { URL } from "url";

// Configuration
const START_URL = process.argv[2] || "https://docs.pancake.biz/fintab";
const MAX_DEPTH = parseInt(process.argv[3], 10) || 5;
const OUT_FILE = process.argv[4] || ".agents/scratch/crawled_report.json";

const visited = new Set();
const results = [];
const domain = new URL(START_URL).hostname;

console.log(`🚀 Bắt đầu quét 5 cấp độ từ URL: ${START_URL}`);
console.log(`📂 File kết xuất dự kiến: ${OUT_FILE}`);

function fetchPage(urlStr) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Handle redirect
        const redirectUrl = new URL(res.headers.location, urlStr).toString();
        resolve(fetchPage(redirectUrl));
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP Status ${res.statusCode} for ${urlStr}`));
        return;
      }

      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => { resolve(data); });
    });

    req.on("error", (err) => { reject(err); });
    req.end();
  });
}

function extractLinks(html, currentUrl) {
  const links = [];
  const regex = /href="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const rawLink = match[1];
    try {
      const resolved = new URL(rawLink, currentUrl).toString();
      const resolvedUrlObj = new URL(resolved);
      
      // Only crawl same domain and avoid non-http links
      if (resolvedUrlObj.hostname === domain && resolvedUrlObj.protocol.startsWith("http")) {
        // Strip hashes to avoid duplicate crawling
        resolvedUrlObj.hash = "";
        links.push(resolvedUrlObj.toString());
      }
    } catch {
      // Ignore malformed URLs
    }
  }
  return [...new Set(links)];
}

function extractImages(html, currentUrl) {
  const images = [];
  const regex = /<img[^>]+src="([^"]+)"([^>]*)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1];
    const rest = match[2];
    const altMatch = /alt="([^"]*)"/.exec(rest);
    const alt = altMatch ? altMatch[1] : "";
    
    try {
      const resolvedSrc = new URL(src, currentUrl).toString();
      images.push({ src: resolvedSrc, alt });
    } catch {
      images.push({ src, alt });
    }
  }
  return images;
}

function extractTitle(html) {
  const match = /<title>([^<]*)<\/title>/i.exec(html);
  return match ? match[1].trim() : "";
}

async function crawl(url, depth) {
  if (depth > MAX_DEPTH) return;
  if (visited.has(url)) return;
  visited.add(url);

  console.log(`[Cấp ${depth}] Đang quét: ${url}`);

  try {
    const html = await fetchPage(url);
    const title = extractTitle(html);
    const images = extractImages(html, url);
    const links = extractLinks(html, url);

    results.push({
      url,
      depth,
      title,
      imageCount: images.length,
      images,
      linkCount: links.length
    });

    // Crawl subpages sequentially to avoid rate-limiting
    for (const link of links) {
      await crawl(link, depth + 1);
    }
  } catch (err) {
    console.error(`❌ Lỗi khi quét ${url}:`, err.message);
  }
}

(async () => {
  await crawl(START_URL, 1);
  
  // Ensure output directory exists
  const dir = path.dirname(OUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n✅ Quét hoàn tất! Đã lưu kết quả tại ${OUT_FILE}`);
  console.log(`📊 Tổng số trang đã quét thành công: ${results.length}`);
})();
