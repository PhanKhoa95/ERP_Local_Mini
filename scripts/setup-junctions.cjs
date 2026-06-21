#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const rootDirName = path.basename(rootDir);

const isInOneDrive = rootDir.toLowerCase().includes('onedrive');

if (!isInOneDrive) {
  process.exit(0);
}

console.log('\n\x1b[34m[OneDrive Optimizer] Phát hiện dự án nằm trong thư mục OneDrive.\x1b[0m');
console.log('\x1b[34m[OneDrive Optimizer] Tự động thiết lập Junction Point cho thư mục node_modules...\x1b[0m');

const localCacheBase = 'C:\\OneDriveLocalCache';
const nodeModulesPath = path.join(rootDir, 'node_modules');

try {
  if (!fs.existsSync(nodeModulesPath)) {
    process.exit(0);
  }

  const stat = fs.lstatSync(nodeModulesPath);
  if (stat.isSymbolicLink()) {
    process.exit(0);
  }

  const cachePath = path.join(localCacheBase, rootDirName, 'node_modules');

  console.log(`  -> Đang tối ưu hóa: node_modules`);

  if (!fs.existsSync(path.dirname(cachePath))) {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  }

  if (fs.existsSync(cachePath)) {
    fs.rmSync(cachePath, { recursive: true, force: true });
  }

  fs.renameSync(nodeModulesPath, cachePath);
  fs.symlinkSync(cachePath, nodeModulesPath, 'junction');
  console.log(`  \x1b[32m✓ Đã chuyển sang Junction Point -> ${cachePath}\x1b[0m`);
} catch (err) {
  console.error(`  \x1b[31m✗ Lỗi khi tối ưu hóa node_modules: ${err.message}\x1b[0m`);
}

console.log('\x1b[32m[OneDrive Optimizer] Hoàn tất tối ưu hóa cấu trúc thư mục!\x1b[0m\n');
