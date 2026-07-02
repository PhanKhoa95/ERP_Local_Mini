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

// In-Memory Omnichannel Conversation Database
let conversations = [
  {
    id: "conv-1",
    customerName: "Lê Văn Cường",
    customerPhone: "0982738492",
    customerAddress: "125 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. HCM",
    lastMessage: "Cảm ơn shop đã tư vấn nhiệt tình nhé!",
    status: "open",
    unread: false,
    messages: [
      { id: "m1", sender: "customer", senderName: "Lê Văn Cường", content: "Shop ơi, mẫu túi đeo chéo đen còn hàng ở chi nhánh Hà Nội không?", timestamp: "10:30" },
      { id: "m2", sender: "agent", senderName: "Hải Yến", content: "Dạ dạ, mẫu đó chi nhánh Hà Nội còn 2 chiếc ạ. Anh qua xem hay muốn em ship COD luôn?", timestamp: "10:32" },
      { id: "m3", sender: "customer", senderName: "Lê Văn Cường", content: "Cảm ơn shop đã tư vấn nhiệt tình nhé!", timestamp: "10:35" }
    ]
  },
  {
    id: "conv-2",
    customerName: "Nguyễn Thị Mai",
    customerPhone: "0912345678",
    customerAddress: "45 Lê Lợi, Quận Hải Châu, Đà Nẵng",
    lastMessage: "Báo giá sỉ mẫu ví da nam nhé shop.",
    status: "open",
    unread: true,
    messages: [
      { id: "m4", sender: "customer", senderName: "Nguyễn Thị Mai", content: "Báo giá sỉ mẫu ví da nam nhé shop.", timestamp: "11:02" }
    ]
  }
];

// Serving static Zalo Personal Dashboard if exists
const staticPath = path.join(__dirname, "../../.matrix/reference-code/repos/Trinh_Quan_Ly_Zalo_Ca_Nhan");
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  addLog("[Server] Serving static Zalo Personal Dashboard web client.");
}

// Zalo Personal Group Manager API Routes
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

// Omnichannel Chat Engine Native API Routes
app.get("/api/chat/conversations", (req, res) => {
  res.json(conversations);
});

app.post("/api/chat/conversations/:id/messages", (req, res) => {
  const { id } = req.params;
  const { sender, senderName, content } = req.body;
  
  const conv = conversations.find(c => c.id === id);
  if (!conv) {
    return res.status(404).json({ success: false, error: "Hội thoại không tồn tại" });
  }

  const newMsg = {
    id: `m-new-${Date.now()}`,
    sender,
    senderName,
    content,
    timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  };

  conv.messages.push(newMsg);
  conv.lastMessage = content;
  conv.unread = sender === "customer";

  io.emit("chat-update", conversations);
  addLog(`[Chat Engine] Tin nhắn mới từ ${senderName}: "${content}"`);
  res.json({ success: true, data: newMsg });
});

// Webhook endpoints for Zalo and Facebook simulation
app.post("/api/chat/webhooks/:channel", (req, res) => {
  const { channel } = req.params;
  const { event, sender, message } = req.body;

  addLog(`[Webhook Router] Nhận POST Webhook từ kênh ${channel.toUpperCase()}...`);
  
  const senderName = sender?.name || "Khách hàng ẩn danh";
  const messageText = message?.text || "";
  const senderPhone = sender?.phone || "";

  // Search existing or create conversation
  let conv = conversations.find(c => c.customerPhone === senderPhone);
  if (!conv) {
    conv = {
      id: `${channel}-${Date.now()}`,
      customerName: `${senderName} (${channel === "zalo" ? "Zalo" : "Facebook"})`,
      customerPhone: senderPhone,
      customerAddress: "Chưa cung cấp",
      lastMessage: messageText,
      status: "open",
      unread: true,
      messages: []
    };
    conversations.unshift(conv);
  }

  const newMsg = {
    id: `m-webhook-${Date.now()}`,
    sender: "customer",
    senderName,
    content: messageText,
    timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  };

  conv.messages.push(newMsg);
  conv.lastMessage = messageText;
  conv.unread = true;

  io.emit("chat-update", conversations);
  addLog(`[Webhook Router] [${channel.toUpperCase()}] Đã thêm tin nhắn mới vào cuộc chat và phát Socket.io event.`);
  res.json({ success: true, message: "Webhook processed" });
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
}, 30000);

io.on("connection", (socket) => {
  socket.emit("init-logs", logs);
  socket.on("agent-send-message", ({ convId, message }) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      conv.messages.push(message);
      conv.lastMessage = message.content;
      conv.unread = false;
      io.emit("chat-update", conversations);
      addLog(`[Chat Socket] Agent phản hồi chat: "${message.content}"`);
    }
  });
  addLog("[Socket.io] Thiết bị kết nối quản trị real-time.");
});

server.listen(PORT, () => {
  addLog(`===================================================`);
  addLog(`Zalo Manager API Gateway chạy tại cổng ${PORT}`);
  addLog(`Địa chỉ local: http://localhost:${PORT}`);
  addLog(`Lắng nghe sự kiện Real-time thông qua Web Socket.`);
  addLog(`===================================================`);
});
