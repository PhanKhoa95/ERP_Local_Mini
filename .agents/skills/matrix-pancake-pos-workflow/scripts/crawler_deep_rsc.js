import fs from 'fs';
import path from 'path';
import https from 'https';
import { URL } from 'url';

// Arguments
const START_URL = process.argv[2] || "https://docs.pancake.biz/pancakework/";
const OUT_FILE = process.argv[3] || ".agents/scratch/pancakework_deep_report.md";

console.log(`🚀 Bắt đầu quét sâu tài liệu từ URL: ${START_URL}`);

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

// Parse block to markdown
function parseBlock(block, depth = 0) {
  if (!block) return '';
  const indent = '  '.repeat(depth);
  let md = '';

  function getInnerText(contentArray) {
    if (!contentArray || !Array.isArray(contentArray)) return '';
    return contentArray.map(run => {
      let text = run.text || '';
      if (run.styles) {
        if (run.styles.bold) text = `**${text}**`;
        if (run.styles.italic) text = `*${text}*`;
        if (run.styles.code) text = `\`${text}\``;
      }
      return text;
    }).join('');
  }

  const innerText = getInnerText(block.content);

  switch (block.type) {
    case 'heading':
      const level = block.props?.level || 1;
      md += `${'#'.repeat(level)} ${innerText}\n\n`;
      break;
    case 'paragraph':
      if (innerText.trim().length > 0) {
        md += `${innerText}\n\n`;
      }
      break;
    case 'bulletListItem':
    case 'bullet-list-item':
      md += `${indent}- ${innerText}\n`;
      break;
    case 'numberedListItem':
    case 'numbered-list-item':
      md += `${indent}1. ${innerText}\n`;
      break;
    case 'block-quote':
    case 'blockQuote':
    case 'blockquote':
      md += `${indent}> ${innerText}\n\n`;
      break;
    case 'pageLink':
      const title = block.props?.title || 'Liên kết';
      md += `${indent}[📄 Hướng dẫn: ${title}](#)\n\n`;
      break;
    case 'image':
      const src = block.props?.url || '';
      const alt = block.props?.caption || block.props?.name || 'Hình ảnh hướng dẫn';
      md += `${indent}![${alt}](${src})\n\n`;
      break;
    default:
      if (innerText.trim().length > 0) {
        md += `${innerText}\n\n`;
      }
      break;
  }

  if (block.children && Array.isArray(block.children)) {
    block.children.forEach(child => {
      const nextDepth = (block.type === 'bulletListItem' || block.type === 'numberedListItem') ? depth + 1 : depth;
      md += parseBlock(child, nextDepth);
    });
  }

  return md;
}

function blocksListToMarkdown(blocks) {
  if (!blocks) return '';
  if (typeof blocks === 'string') {
    if (blocks.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(blocks);
        if (Array.isArray(parsed)) return blocksListToMarkdown(parsed);
      } catch {}
    }
    return blocks;
  }
  if (!Array.isArray(blocks)) {
    return JSON.stringify(blocks);
  }
  
  let md = '';
  blocks.forEach(block => {
    md += parseBlock(block);
  });
  return md;
}

(async () => {
  try {
    const html = await fetchPage(START_URL);
    
    // Extract next_f push chunks
    const regex = /self\.__next_f\.push\(\[1,\s*"([\s\S]*?)"\]\)/g;
    let match;
    let jsStream = "";
    while ((match = regex.exec(html)) !== null) {
      try {
        jsStream += JSON.parse('"' + match[1] + '"');
      } catch (e) {
        // Ignore unescape issues for minor script lines
      }
    }

    if (jsStream.length === 0) {
      throw new Error("Không tìm thấy dữ liệu self.__next_f.push trong HTML. Trang này có thể không sử dụng NextJS RSC.");
    }

    const buffer = Buffer.from(jsStream, 'utf8');
    let pos = 0;
    const refMap = {};

    const COLON = 0x3a; // ':'
    const COMMA = 0x2c; // ','
    const NEWLINE = 0x0a; // '\n'

    while (pos < buffer.length) {
      let colonIndex = -1;
      for (let i = pos; i < buffer.length; i++) {
        if (buffer[i] === COLON) {
          colonIndex = i;
          break;
        }
      }
      if (colonIndex === -1) break;
      
      const keyCandidate = buffer.toString('utf8', pos, colonIndex).trim();
      
      if (keyCandidate.length > 10 || keyCandidate.includes('\n')) {
        pos++;
        continue;
      }
      
      pos = colonIndex + 1;
      const typeChar = String.fromCharCode(buffer[pos]);
      
      if (typeChar === 'T') {
        let commaIndex = -1;
        for (let i = pos; i < buffer.length; i++) {
          if (buffer[i] === COMMA) {
            commaIndex = i;
            break;
          }
        }
        if (commaIndex === -1) break;
        
        const hexLen = buffer.toString('utf8', pos + 1, commaIndex);
        const len = parseInt(hexLen, 16);
        pos = commaIndex + 1;
        
        const valueSlice = buffer.subarray(pos, pos + len);
        const valueStr = valueSlice.toString('utf8');
        pos = pos + len;
        
        try {
          refMap[keyCandidate] = JSON.parse(valueStr);
        } catch (e) {
          refMap[keyCandidate] = valueStr;
        }
      } else {
        let newlineIndex = -1;
        for (let i = pos; i < buffer.length; i++) {
          if (buffer[i] === NEWLINE) {
            newlineIndex = i;
            break;
          }
        }
        
        let valueStr;
        if (newlineIndex === -1) {
          valueStr = buffer.toString('utf8', pos);
          pos = buffer.length;
        } else {
          valueStr = buffer.toString('utf8', pos, newlineIndex);
          pos = newlineIndex + 1;
        }
        
        try {
          refMap[keyCandidate] = JSON.parse(valueStr);
        } catch (e) {
          refMap[keyCandidate] = valueStr;
        }
      }
    }

    function resolveRef(val) {
      if (typeof val === 'string' && val.startsWith('$')) {
        const key = val.substring(1);
        if (refMap[key] !== undefined) {
          return resolveRef(refMap[key]);
        }
      }
      if (Array.isArray(val)) {
        return val.map(item => resolveRef(item));
      }
      if (val && typeof val === 'object') {
        const resolved = {};
        for (const k in val) {
          resolved[k] = resolveRef(val[k]);
        }
        return resolved;
      }
      return val;
    }

    // Root is usually key '7' for standard GitBook pages
    const root = refMap['7'];
    if (!root) {
      throw new Error("Không tìm thấy cấu trúc cây tài liệu gốc (key '7') trong stream.");
    }

    const resolvedRoot = resolveRef(root);
    const payload = resolvedRoot[3];
    const folders = payload?.folders;

    if (!folders || !Array.isArray(folders)) {
      throw new Error("Cấu trúc payload không khớp hoặc không tìm thấy danh mục folders.");
    }

    let markdown = `# TÀI LIỆU CHI TIẾT NGHIỆP VỤ PANCAKE WORK\n\n`;
    markdown += `*Tài liệu nghiệp vụ được trích xuất tự động và biên dịch đầy đủ chi tiết từ docs.pancake.biz.*\n\n`;
    markdown += `*Nguồn: ${START_URL}*\n\n`;

    folders.forEach((folder, fIndex) => {
      markdown += `# 📂 Phân hệ ${fIndex + 1}: ${folder.name}\n\n`;
      
      if (folder.pages && folder.pages.length > 0) {
        folder.pages.forEach((page, pIndex) => {
          markdown += `## 📄 ${fIndex + 1}.${pIndex + 1}. ${page.custom_name || page.name}\n\n`;
          
          if (page.description) {
            markdown += `> **Mô tả ngắn**: ${page.description}\n\n`;
          }
          
          if (page.contents) {
            markdown += `### Hướng dẫn chi tiết:\n\n`;
            markdown += blocksListToMarkdown(page.contents);
            markdown += `\n`;
          }
          
          if (page.images_info && page.images_info.length > 0) {
            markdown += `### Ảnh chụp màn hình:\n\n`;
            page.images_info.forEach(img => {
              const src = img.url || img.src;
              if (src) {
                markdown += `![${img.alt || 'Ảnh chụp màn hình'}](${src})\n\n`;
              }
            });
          }
          
          markdown += `\n---\n\n`;
        });
      } else {
        markdown += `*Không có tài liệu chi tiết cho phân hệ này.*\n\n---\n\n`;
      }
    });

    // Ensure output dir exists
    const resolvedOut = path.resolve(OUT_FILE);
    const dir = path.dirname(resolvedOut);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(resolvedOut, markdown, 'utf8');
    console.log(`\n✅ Đã trích xuất và lưu báo cáo chi tiết thành công tại: ${resolvedOut}`);

  } catch (err) {
    console.error(`❌ Gặp lỗi trong quá trình quét sâu:`, err.message);
    process.exit(1);
  }
})();
