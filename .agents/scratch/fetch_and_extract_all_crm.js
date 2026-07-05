import fs from 'fs';
import path from 'path';

const urls = [
  { id: 1, name: "Tiềm năng (Leads)", url: "https://docs.pancake.biz/crm/st-f2/st-p1?lang=vi" },
  { id: 2, name: "Liên hệ (Contacts)", url: "https://docs.pancake.biz/crm/st-f2/st-p2?lang=vi" },
  { id: 3, name: "Công ty (Companies)", url: "https://docs.pancake.biz/crm/st-f2/st-p3?lang=vi" },
  { id: 4, name: "Lịch hẹn (Appointments)", url: "https://docs.pancake.biz/crm/st-f2/st-p4?lang=vi" },
  { id: 5, name: "Cơ hội (Deals)", url: "https://docs.pancake.biz/crm/st-f2/st-p5?lang=vi" },
  { id: 6, name: "Bán hàng (Sales / Quotations)", url: "https://docs.pancake.biz/crm/st-f2/st-p6?lang=vi" },
  { id: 7, name: "Vấn đề (Tickets)", url: "https://docs.pancake.biz/crm/st-f2/st-p7?lang=vi" },
  { id: 8, name: "Nhiệm vụ (Tasks)", url: "https://docs.pancake.biz/crm/st-f2/st-p8?lang=vi" }
];

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) return await res.text();
    } catch (e) {
      if (i === retries - 1) throw e;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

function parseTextFromHTML(html) {
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
  return textBlocks.join('\n\n');
}

async function run() {
  console.log("🚀 Đang tiến hành quét sâu tài liệu Pancake CRM...");
  let report = `# Báo cáo quét sâu tài liệu Pancake CRM (8 Phân hệ Cốt lõi)\n\n`;
  report += `*Thời gian quét: ${new Date().toLocaleString('vi-VN')}*\n\n`;

  for (const item of urls) {
    console.log(`- Đang cào dữ liệu: ${item.name} (${item.url})...`);
    try {
      const html = await fetchWithRetry(item.url);
      const extractedText = parseTextFromHTML(html);
      
      report += `## ${item.id}. ${item.name}\n\n`;
      report += `**Nguồn tài liệu**: [Link](${item.url})\n\n`;
      report += `### Chi tiết nghiệp vụ:\n\n`;
      if (extractedText) {
        report += extractedText + `\n\n`;
      } else {
        report += `*Không trích xuất được dữ liệu nội dung dạng văn bản block, hoặc trang trống.*\n\n`;
      }
      report += `---\n\n`;
    } catch (err) {
      console.error(`Lỗi khi cào ${item.name}:`, err.message);
      report += `## ${item.id}. ${item.name}\n\n⚠️ Gặp lỗi khi tải tài liệu: ${err.message}\n\n---\n\n`;
    }
  }

  const outPath = 'e:/ERP_Local_Mini/.agents/crm_deep_scan_report.md';
  fs.writeFileSync(outPath, report, 'utf8');
  console.log(`🎉 Đã quét xong và xuất báo cáo tại: ${outPath}`);
}

run();
