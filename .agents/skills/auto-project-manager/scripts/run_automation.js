import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const runAll = args.includes('--all') || args.length === 0;
const runVitest = args.includes('--vitest') || runAll;
const runPlaywright = args.includes('--playwright') || runAll;
const runBuild = args.includes('--build') || runAll;

const reportPath = path.join(process.cwd(), '.agents', 'auto_report.md');
let reportContent = `# BÁO CÁO KIỂM THỬ VÀ ĐỒNG BỘ DỰ ÁN TỰ ĐỘNG\n\n`;
reportContent += `*Thời gian thực hiện:* ${new Date().toLocaleString('vi-VN')}\n`;
let hasFailures = false;

function runCommand(name, cmd) {
  console.log(`\n==================================================`);
  console.log(`🚀 Đang chạy: ${name} (${cmd})...`);
  console.log(`==================================================\n`);
  
  const start = Date.now();
  try {
    const stdout = execSync(cmd, { stdio: 'inherit', encoding: 'utf8' });
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`\n✅ ${name} THÀNH CÔNG (${duration} giây)\n`);
    return { success: true, duration, error: null };
  } catch (error) {
    hasFailures = true;
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.error(`\n❌ ${name} THẤT BẠI (${duration} giây)\n`);
    return { success: false, duration, error: error.message };
  }
}

// 1. Git Status Check
console.log("🔍 Đang kiểm tra nhánh Git hiện tại...");
let currentBranch = "Unknown";
try {
  currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
} catch (e) {
  currentBranch = "main (fallback)";
}
reportContent += `*Nhánh hiện tại:* \`${currentBranch}\`\n\n`;
reportContent += `## 📊 Kết quả kiểm tra từng phần:\n\n`;
reportContent += `| Tính năng kiểm tra | Trạng thái | Thời gian chạy | Chi tiết lỗi |\n`;
reportContent += `| --- | --- | --- | --- |\n`;

// 2. Run Vitest
if (runVitest) {
  const result = runCommand("Unit & Integration Tests (Vitest)", "npx vitest run");
  const statusStr = result.success ? "🟢 THÀNH CÔNG" : "🔴 THẤT BẠI";
  const errorStr = result.success ? "-" : `Xem log chi tiết phía dưới`;
  reportContent += `| **Vitest Unit Tests** | ${statusStr} | ${result.duration}s | ${errorStr} |\n`;
}

// 3. Run Playwright
if (runPlaywright) {
  const result = runCommand("End-to-End Tests (Playwright)", "npx playwright test");
  const statusStr = result.success ? "🟢 THÀNH CÔNG" : "🔴 THẤT BẠI";
  const errorStr = result.success ? "-" : `Lỗi E2E flows hoặc không kết nối được cổng`;
  reportContent += `| **Playwright E2E** | ${statusStr} | ${result.duration}s | ${errorStr} |\n`;
}

// 4. Run Build
if (runBuild) {
  const result = runCommand("Vite & TypeScript Build", "npm run build");
  const statusStr = result.success ? "🟢 THÀNH CÔNG" : "🔴 THẤT BẠI";
  const errorStr = result.success ? "-" : `Lỗi biên dịch kiểu hoặc cấu hình Vite`;
  reportContent += `| **Vite Production Build** | ${statusStr} | ${result.duration}s | ${errorStr} |\n`;
}

reportContent += `\n**Kết quả tổng:** ${hasFailures ? "🔴 THẤT BẠI" : "🟢 THÀNH CÔNG"}\n`;
reportContent += `\n---\n*Báo cáo được tạo tự động bởi hệ thống Quản lý Dự án tự động 100% (auto-project-manager).*`;

try {
  // Ensure .agents folder exists
  const agentsDir = path.dirname(reportPath);
  if (!fs.existsSync(agentsDir)) {
    fs.mkdirSync(agentsDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, reportContent, 'utf8');
  console.log(`\n🎉 Đã xuất file báo cáo tại: ${reportPath}\n`);
} catch (err) {
  console.error("Lỗi khi lưu file báo cáo:", err.message);
  hasFailures = true;
}

if (hasFailures) {
  process.exitCode = 1;
}
