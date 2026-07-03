import fs from 'fs';
import path from 'path';

console.log("=== CHƯƠNG TRÌNH KIỂM TRA MÔI TRƯỜNG SUPABASE (ERP MINI) ===");

const envPath = path.resolve(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error("❌ LỖI: Không tìm thấy file .env ở thư mục gốc!");
  process.exit(1);
}

// Đọc và parse file .env
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    // Bỏ dấu nháy kép hoặc nháy đơn nếu có
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[key] = value.trim();
  }
});

const url = envVars.VITE_SUPABASE_URL;
const key = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
const projectId = envVars.VITE_SUPABASE_PROJECT_ID;

console.log(`\nCấu hình tìm thấy:`);
console.log(`- Project ID: ${projectId || 'Chưa cấu hình'}`);
console.log(`- Supabase URL: ${url || '❌ Trống'}`);
console.log(`- Publishable Key: ${key ? '✔ Đã cấu hình' : '❌ Trống'}`);

if (!url || !key) {
  console.error("\n❌ LỖI: Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_PUBLISHABLE_KEY trong file .env!");
  process.exit(1);
}

// Thử kết nối tới API Supabase
console.log(`\nĐang kiểm tra kết nối tới Supabase API...`);

async function testConnection() {
  try {
    // 1. Kiểm tra kết nối API qua bảng companies
    const pingStart = Date.now();
    const pingRes = await fetch(`${url}/rest/v1/companies?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (!pingRes.ok && pingRes.status !== 406) {
      throw new Error(`Endpoint trả về status ${pingRes.status}`);
    }
    console.log(`✔ Kết nối thành công tới Supabase API! Thời gian phản hồi: ${Date.now() - pingStart}ms`);

    // 2. Kiểm tra xem các bảng chính đã được khởi tạo (migrations thành công) hay chưa
    console.log(`\nĐang kiểm tra các bảng dữ liệu trong Database...`);
    const tables = ['companies', 'profiles', 'products', 'orders', 'warehouses', 'sales_channels'];
    let migrationIssues = false;

    for (const table of tables) {
      try {
        const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
          method: 'GET',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
          }
        });
        
        if (res.ok) {
          console.log(`  - Bảng [${table}]: ✔ Sẵn sàng`);
        } else {
          migrationIssues = true;
          console.error(`  - Bảng [${table}]: ❌ Lỗi (Status: ${res.status}) - Có thể chưa chạy migration`);
        }
      } catch (e) {
        migrationIssues = true;
        console.error(`  - Bảng [${table}]: ❌ Lỗi kết nối - ${e.message}`);
      }
    }

    if (migrationIssues) {
      console.warn(`\n⚠️ CẢNH BÁO: Một số bảng dữ liệu chưa sẵn sàng. Vui lòng kiểm tra lại việc apply các file migration SQL trong thư mục 'supabase/migrations'.`);
    } else {
      console.log(`\n🎉 THÀNH CÔNG: Cơ sở dữ liệu Supabase đã được migrate đầy đủ và kết nối sẵn sàng 100% để chạy dữ liệu thật!`);
    }

  } catch (error) {
    console.error(`\n❌ LỖI: Không thể kết nối tới Supabase API.`);
    console.error(`Chi tiết lỗi: ${error.message}`);
    console.error(`Vui lòng kiểm tra lại kết nối mạng của bạn và độ chính xác của các biến môi trường trong file .env.`);
    process.exit(1);
  }
}

testConnection();
