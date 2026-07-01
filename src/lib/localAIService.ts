import { toast } from "sonner";

interface AIConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
}

// Read active AI settings from localStorage
function getActiveAIConfig(): AIConfig | null {
  const rawRotationSettings = localStorage.getItem("erp-mini-ai-rotator-settings-v1");
  const activeId = localStorage.getItem("erp-mini-ai-rotator-settings-v1-active-id") || "gemini";
  
  if (rawRotationSettings) {
    try {
      const parsedProviders = JSON.parse(rawRotationSettings);
      const currentP = parsedProviders.find((p: any) => p.id === activeId) || parsedProviders[0];
      if (currentP && currentP.keys[currentP.activeKeyIndex]) {
        return {
          provider: currentP.id,
          model: currentP.selectedModel,
          apiKey: currentP.keys[currentP.activeKeyIndex] || "",
          baseUrl: currentP.baseUrl
        };
      }
    } catch (e) {
      console.error("Failed to parse rotator configuration in localAIService.ts:", e);
    }
  }
  return null;
}

// Extract live local storage database context to inject into LLM system prompt
function getLocalSystemContext(): string {
  let context = "\n[Dữ liệu thực tế hệ thống ERP đang vận hành]:\n";

  // 1. Products & Orders
  try {
    const rawProducts = localStorage.getItem("erp-mini-local-demo-products") || "[]";
    const rawOrders = localStorage.getItem("erp-mini-local-demo-orders") || "[]";
    const rawPartners = localStorage.getItem("erp-mini-local-demo-partners");
    
    const products = JSON.parse(rawProducts);
    const orders = JSON.parse(rawOrders);
    
    // Fallback default partner if not seeded yet
    const partners = rawPartners ? JSON.parse(rawPartners) : [
      { id: "partner-retail", name: "Chuỗi Trà Sữa X (Khách hàng dự án)", partner_type: "customer", debt_amount: 5000000 }
    ];

    const lowStock = products.filter((p: any) => !p.is_service && Number(p.stock_quantity ?? p.stock ?? p.quantity ?? 0) <= Number(p.min_stock ?? 5));
    const todayStr = new Date().toISOString().split("T")[0];
    const todayOrders = orders.filter((o: any) => o.created_at && o.created_at.startsWith(todayStr));
    const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + Number(o.total ?? o.total_amount ?? o.paid_amount ?? 0), 0);
    const debtors = partners.filter((p: any) => p.partner_type === "customer" && Number(p.debt_amount ?? p.debt ?? 0) > 0);

    context += `- Sản phẩm sắp hết hàng (cần nhập kho gấp): ${lowStock.map((p: any) => `${p.name} (còn ${p.stock_quantity ?? p.stock ?? 0} cái)`).join(", ") || "Không có sản phẩm nào chạm mức tối thiểu"}\n`;
    context += `- Đơn hàng hôm nay: ${todayOrders.length} đơn hàng, với tổng doanh số: ${new Intl.NumberFormat("vi-VN").format(todayRevenue)}đ\n`;
    context += `- Công nợ khách hàng chưa thu: ${debtors.map((d: any) => `${d.name} (nợ ${new Intl.NumberFormat("vi-VN").format(d.debt_amount ?? d.debt ?? 0)}đ)`).join(", ") || "Không có ai nợ"}\n`;
  } catch (e) {
    console.error("Failed to parse orders/products:", e);
  }

  // 2. Ledger Accounts
  try {
    const rawAccounts = localStorage.getItem("erp-mini-local-demo-accounts");
    const rawEntries = localStorage.getItem("erp-mini-local-demo-journal-entries") || "[]";
    const rawLines = localStorage.getItem("erp-mini-local-demo-journal-lines") || "[]";

    // Fallback default accounts matching exactly what useAccounting seeds
    const accounts = rawAccounts ? JSON.parse(rawAccounts) : [
      { id: "acc-1111", code: "1111", name: "Tiền mặt", account_type: "asset", balance: 50000000 },
      { id: "acc-1121", code: "1121", name: "Tiền gửi ngân hàng", account_type: "asset", balance: 150000000 },
      { id: "acc-131", code: "131", name: "Phải thu khách hàng", account_type: "asset", balance: 12000000 },
      { id: "acc-156", code: "156", name: "Hàng hóa", account_type: "asset", balance: 45000000 },
      { id: "acc-211", code: "211", name: "Tài sản cố định (CAPEX)", account_type: "asset", balance: 38500000 },
      { id: "acc-331", code: "331", name: "Phải trả người bán", account_type: "liability", balance: 25000000 },
      { id: "acc-4111", code: "4111", name: "Vốn góp chủ sở hữu", account_type: "equity", balance: 252500000 },
      { id: "acc-511", code: "511", name: "Doanh thu bán hàng", account_type: "revenue", balance: 75000000 },
      { id: "acc-632", code: "632", name: "Giá vốn bán hàng", account_type: "expense", balance: 42000000 },
      { id: "acc-642", code: "642", name: "Chi phí quản lý doanh nghiệp", account_type: "expense", balance: 15000000 }
    ];
    
    const entries = JSON.parse(rawEntries);
    const lines = JSON.parse(rawLines);

    const postedEntries = entries.filter((e: any) => e.status === "posted");
    const postedEntryIds = new Set(postedEntries.map((e: any) => e.id));
    const activeLines = lines.filter((l: any) => postedEntryIds.has(l.entry_id));

    const balances: Record<string, { name: string, code: string, balance: number }> = {};
    for (const acc of accounts) {
      balances[acc.id] = {
        name: acc.name,
        code: acc.code,
        balance: Number(acc.balance || 0)
      };
    }

    for (const line of activeLines) {
      const accId = line.account_id;
      if (!balances[accId]) continue;
      
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      const acc = accounts.find((a: any) => a.id === accId);
      if (!acc) continue;

      const isAssetOrExpense = acc.account_type === "asset" || acc.account_type === "expense";
      if (isAssetOrExpense) {
        balances[accId].balance += (debit - credit);
      } else {
        balances[accId].balance += (credit - debit);
      }
    }

    context += `- Số dư tài khoản kế toán sổ cái:\n${Object.values(balances).map(b => `  * ${b.code} - ${b.name}: ${new Intl.NumberFormat("vi-VN").format(b.balance)}đ`).join("\n")}\n`;
  } catch (e) {
    console.error("Failed to parse accounts:", e);
  }

  // 3. Employees
  try {
    const rawEmps = localStorage.getItem("erp-mini-local-demo-perf-employees");
    
    // Fallback default employee matching useEmployeeRecords
    const emps = rawEmps ? JSON.parse(rawEmps) : [
      { id: "emp-a", full_name: "Chủ shop (bạn)", role: "admin", is_active: true }
    ];

    context += `- Thông tin nhân sự: Tổng số ${emps.length} nhân viên. Danh sách: ${emps.map((e: any) => `${e.full_name || e.name || "Chủ shop"} (vai trò: ${e.role || "Nhân viên"})`).join(", ") || "Không có nhân viên"}\n`;
  } catch (e) {
    console.error("Failed to parse employees:", e);
  }

  // 4. Contracts
  try {
    const rawContracts = localStorage.getItem("erp-mini-local-demo-smart-contracts");
    
    // Fallback default contract matching useContracts
    const contracts = rawContracts ? JSON.parse(rawContracts) : [
      { id: "contract-1", contract_number: "HD-2026-NIN-001", title: "Hợp đồng thiết kế & in decal tem nhãn chuỗi Trà Sữa X", status: "signed", total_value: 15000000 }
    ];

    context += `- Thông tin hợp đồng: Tổng số ${contracts.length} hợp đồng. Danh sách: ${contracts.map((c: any) => `Hợp đồng ${c.contract_number} (Tên: ${c.title}, trạng thái: ${c.status || "chờ duyệt"}, trị giá: ${new Intl.NumberFormat("vi-VN").format(c.total_value ?? c.value ?? 0)}đ)`).join(", ") || "Không có hợp đồng"}\n`;
  } catch (e) {
    console.error("Failed to parse contracts:", e);
  }

  return context;
}

// Call direct LLM completion endpoint from browser
async function callDirectLLM(systemPrompt: string, userPrompt: string, jsonMode: boolean = false): Promise<string> {
  const config = getActiveAIConfig();
  if (!config || !config.apiKey) {
    throw new Error("Chưa cấu hình API Key");
  }

  const endpoint = `${config.baseUrl}/chat/completions`;
  const body = {
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.2,
    response_format: jsonMode ? { type: "json_object" } : undefined
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM Error: ${res.status} - ${errText || res.statusText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Mock local AI service function execution, upgraded to use actual AI calls when user configures API keys.
 */
export async function handleLocalFunctionInvoke(functionName: string, options?: any): Promise<any> {
  console.log(`[localAIService] Invoking local AI function "${functionName}" with options:`, options);

  const hasKeys = getActiveAIConfig() !== null;

  if (hasKeys) {
    try {
      switch (functionName) {
        case "ai-erp-assistant": {
          const history = options?.body?.messages || [];
          const userMessage = history[history.length - 1]?.content || "";
          
          const systemPrompt = `Bạn là trợ lý AI thông minh cho hệ thống ERP quản lý bán hàng đa kênh & nhân sự. Bạn hãy trả lời câu hỏi của người dùng dựa trên dữ liệu hệ thống được cung cấp dưới đây.
          Trả lời bằng tiếng Việt, ngắn gọn, chuyên nghiệp và có sử dụng emoji phù hợp.
          ${getLocalSystemContext()}
          `;
          
          const res = await callDirectLLM(systemPrompt, userMessage);
          return { data: { answer: res } };
        }

        case "parse-voice-report":
        case "parse-work-report-chat": {
          const text = options?.body?.text || options?.body?.notes || "";
          const systemPrompt = "Bạn là trợ lý phân tích báo cáo. Hãy chuyển đổi đoạn hội thoại/nội dung báo cáo công việc thô của nhân viên thành một danh sách công việc có cấu trúc JSON dạng: { tasks: [{ title: string, duration: number, status: string }] }";
          const res = await callDirectLLM(systemPrompt, text, true);
          return { data: JSON.parse(res) };
        }

        case "ai-cashflow-forecast": {
          const transactions = JSON.stringify(options?.body?.transactions || []);
          const systemPrompt = "Bạn là chuyên gia phân tích tài chính. Hãy lập dự báo dòng tiền ngắn hạn dựa trên lịch sử giao dịch này. Trả về cấu trúc JSON dạng: { forecastText: string, points: number[] }";
          const res = await callDirectLLM(systemPrompt, transactions, true);
          return { data: JSON.parse(res) };
        }

        case "ai-build-workflow": {
          const text = options?.body?.text || options?.body?.description || "";
          const systemPrompt = "Bạn là kiến trúc sư quy trình. Hãy chuyển mô tả văn bản thành quy trình công việc JSON dạng: { nodes: [{ id: string, label: string, type: string }], edges: [{ source: string, target: string }] }";
          const res = await callDirectLLM(systemPrompt, text, true);
          return { data: JSON.parse(res) };
        }

        case "chat-with-docs": {
          const history = JSON.stringify(options?.body?.messages || []);
          const systemPrompt = "Bạn là trợ lý hỗ trợ tra cứu tài liệu doanh nghiệp. Hãy trả lời câu hỏi của người dùng dựa trên thông tin lưu trữ.";
          const res = await callDirectLLM(systemPrompt, history);
          return { data: { answer: res } };
        }

        case "ai-auto-replenishment": {
          const products = JSON.stringify(options?.body?.products || []);
          const systemPrompt = "Bạn là quản lý kho thông minh. Hãy gợi ý kế hoạch nhập hàng dự kiến dựa trên danh sách sản phẩm này. Trả về JSON dạng: { recommendations: [{ productId: string, name: string, quantity: number, reason: string }] }";
          const res = await callDirectLLM(systemPrompt, products, true);
          return { data: JSON.parse(res) };
        }

        case "ai-finance-anomaly": {
          const transactions = JSON.stringify(options?.body?.transactions || []);
          const systemPrompt = "Bạn là kiểm toán viên AI. Hãy rà soát tìm các giao dịch bất thường từ danh sách này. Trả về JSON dạng: { anomalies: [{ id: string, amount: number, reason: string, risk_level: string }] }";
          const res = await callDirectLLM(systemPrompt, transactions, true);
          return { data: JSON.parse(res) };
        }

        case "ai-screen-cv": {
          const text = options?.body?.cvText || "";
          const systemPrompt = "Bạn là chuyên viên nhân sự. Hãy đánh giá CV ứng viên dựa trên văn bản thô. Trả về JSON dạng: { score: number, feedback: string, matchedSkills: string[] }";
          const res = await callDirectLLM(systemPrompt, text, true);
          return { data: JSON.parse(res) };
        }

        case "ai-strategic-report": {
          const metrics = JSON.stringify(options?.body?.metrics || {});
          const systemPrompt = "Bạn là giám đốc chiến lược (CSO). Hãy lập báo cáo định hướng chiến lược kinh doanh từ các chỉ số tài chính/kpi này. Trả về JSON dạng: { report: string, recommendations: string[] }";
          const res = await callDirectLLM(systemPrompt, metrics, true);
          return { data: JSON.parse(res) };
        }

        default:
          break;
      }
    } catch (e: any) {
      console.error(`[localAIService API Error] for ${functionName}:`, e);
      toast.error(`Lỗi API Key khi gọi tính năng AI (${functionName}): ` + e.message);
      // Fallback to mock when real LLM call fails
    }
  }

  // Fallback / Default simulated static data (original mock behavior)
  switch (functionName) {
    case "ai-erp-assistant":
      return {
        data: {
          answer: "Dữ liệu trợ lý ERP: Hôm nay hệ thống ghi nhận doanh thu ổn định. Có một số mặt hàng cần chú ý nhập kho sớm. Vui lòng thiết lập API Key thật trong phần Cấu hình AI để tôi có thể trò chuyện trực tiếp và trả lời chi tiết hơn."
        }
      };

    case "parse-voice-report":
    case "parse-work-report-chat":
      return {
        data: {
          tasks: [
            { title: "Kiểm tra và gia công decal sữa đơn POS-ORD-001", duration: 1.5, status: "completed" },
            { title: "Hỗ trợ thiết kế file in ấn cho khách hàng mới", duration: 2.0, status: "completed" }
          ]
        }
      };
    
    case "ai-cashflow-forecast":
      return {
        data: {
          forecastText: "Dựa trên lịch sử giao dịch thực tế, dòng tiền dự báo tăng trưởng tốt nhờ doanh thu POS ổn định. Khuyến nghị duy trì số dư tối thiểu 50.000.000đ để thanh toán công nợ nhà cung cấp đúng hạn.",
          points: [150, 155, 158, 162, 168, 175, 182]
        }
      };

    case "ai-build-workflow":
      return {
        data: {
          nodes: [
            { id: "1", label: "Tiếp nhận đơn hàng in", type: "input" },
            { id: "2", label: "Thiết kế & Cắt decal thử", type: "default" },
            { id: "3", label: "In decal hàng loạt", type: "default" },
            { id: "4", label: "Bàn giao & Thu tiền", type: "output" }
          ],
          edges: [
            { source: "1", target: "2" },
            { source: "2", target: "3" },
            { source: "3", target: "4" }
          ]
        }
      };

    case "chat-with-docs":
      return {
        data: {
          answer: "Dữ liệu chính sách in ấn: Thời gian hoàn thiện trung bình là 24-48 giờ kể từ khi duyệt file thiết kế. Khách hàng thân thiết được chiết khấu gối đầu 5% cho đơn hàng trên 5 triệu đồng."
        }
      };

    case "ai-auto-replenishment":
      return {
        data: {
          recommendations: [
            { productId: "prod-decal-sua", name: "Decal sữa PP", quantity: 50, reason: "Sắp chạm ngưỡng tối thiểu 20m² trong kho." },
            { productId: "prod-muc-in-epson", name: "Mực Epson chính hãng", quantity: 12, reason: "Lượng tiêu thụ in ấn tăng cao 30 ngày qua." }
          ]
        }
      };

    case "ai-finance-anomaly":
      return {
        data: {
          anomalies: []
        }
      };

    default:
      return {
        data: {
          text: "Simulated AI response",
          status: "success",
          details: `Mock execution for function: ${functionName}`
        }
      };
  }
}
