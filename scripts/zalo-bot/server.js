const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4500;

// Terminal Log Helper
const logs = [];
const addLog = (message) => {
  const timestamp = new Date().toLocaleTimeString("vi-VN");
  const logStr = `[${timestamp}] ${message}`;
  logs.push(logStr);
  if (logs.length > 100) logs.shift();
  io.emit("bot-console-log", logStr);
  console.log(logStr);
};

// Expose static assets from cloned repo if available
const staticPath = path.join(__dirname, "../../.matrix/reference-code/repos/Trinh_Quan_Ly_Zalo_Ca_Nhan");
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  addLog("[Server] Serving static Zalo Personal Dashboard web client.");
}

// API Routes
app.post("/api/send-message", (req, res) => {
  const { groupId, text } = req.body;
  addLog(`[API Action] Lệnh gửi tin nhắn tới nhóm "${groupId}": "${text}"`);
  res.json({ success: true, message: "Đã chuyển tiếp lệnh gửi tin nhắn thành công!" });
});

app.post("/api/approve-member", (req, res) => {
  const { groupId, userIds } = req.body;
  addLog(`[API Action] Phê duyệt thành viên mới [${userIds.join(", ")}] gia nhập nhóm "${groupId}"`);
  res.json({ success: true, message: "Đã duyệt thành viên thành công!" });
});

app.get("/api/config/google-sheets", (req, res) => {
  res.json({ spreadsheetId: "1X98DsaK-72Gfds7A", clientEmail: "zalo-bot@levera.iam.gserviceaccount.com", hasKey: true });
});

app.post("/api/config/google-sheets", (req, res) => {
  const { spreadsheetId } = req.body;
  addLog(`[Cấu hình] Cập nhật Spreadsheet ID Google Sheets thành: ${spreadsheetId}`);
  res.json({ success: true });
});

// Periodic mock scan daemon
setInterval(() => {
  const mockScans = [
    "Bot đang quét tin nhắn rác trong các nhóm...",
    "Không phát hiện link spam trong nhóm Đại Lý & CTV Toàn Quốc.",
    "Bot tự động phản hồi từ khóa 'VC20' cho khách hàng Nguyễn Hoàng Nam.",
    "Quét và ghi nhớ sở thích thành công (AI Long-Term Memory).",
    "Đồng bộ hóa hiệu suất chiến dịch lên Google Sheets..."
  ];
  const choice = mockScans[Math.floor(Math.random() * mockScans.length)];
  addLog(`[Trạng thái Bot] ${choice}`);
}, 15000);

io.on("connection", (socket) => {
  socket.emit("init-logs", logs);
  addLog("[Socket.io] Thiết bị kết nối quản trị real-time.");
});

server.listen(PORT, () => {
  addLog(`===================================================`);
  addLog(`Zalo Manager API Gateway chạy tại cổng ${PORT}`);
  addLog(`Địa chỉ local: http://localhost:${PORT}`);
  addLog(`Lắng nghe sự kiện Real-time thông qua Web Socket.`);
  addLog(`===================================================`);
});
