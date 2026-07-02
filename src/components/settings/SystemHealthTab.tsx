import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, Database, Cpu, HardDrive, Play, Square, 
  AlertOctagon, Terminal, Copy, CheckCircle2, RefreshCw, 
  AlertTriangle, Loader2, Link2, CopyCheck, ShieldCheck
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { runSystemDataAudit, type SystemDataAuditReport } from "@/lib/systemDataAudit";
import { syncBomCostToProducts } from "@/lib/localInventoryStore";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { useQueryClient } from "@tanstack/react-query";

interface MetricHistoryItem {
  time: string;
  cpu: number;
  ram: number;
  dbLatency: number;
}

const apiDisplayNames = {
  database: "Cơ sở dữ liệu ERP",
  supabase_api: "Supabase Connection API",
  shopee_api: "Shopee Open API",
  lazada_api: "Lazada Partner API",
  tiktok_api: "TikTok Shop API",
  ai_api: "AI Assistants / Edge API",
  momo_api: "Momo Payment API",
  vnpay_api: "VNPay Payment API",
  ghn_api: "Giao Hàng Nhanh (GHN) API",
  ghtk_api: "Giao Hàng Tiết Kiệm (GHTK) API"
};

const apiDescriptions = {
  database: "Supabase PostgreSQL Database",
  supabase_api: "Dịch vụ Auth & REST của Supabase",
  shopee_api: "Đồng bộ đơn hàng từ Shopee",
  lazada_api: "Đồng bộ đơn hàng từ Lazada",
  tiktok_api: "Đồng bộ đơn hàng từ TikTok Shop",
  ai_api: "Trợ lý AI & Vector Search",
  momo_api: "Cổng thanh toán ví điện tử Momo",
  vnpay_api: "Cổng thanh toán VNPay",
  ghn_api: "API đối tác vận chuyển GHN",
  ghtk_api: "API đối tác vận chuyển GHTK"
};

const featureDisplayNames = {
  pos_sales: "Bán hàng POS",
  order_fulfillment: "Xử lý Đơn hàng",
  inventory_control: "Kiểm soát Tồn kho",
  accounting_ledger: "Sổ cái Kế toán",
  channel_sync: "Đồng bộ Kênh bán",
  performance_kpi: "KPI Hiệu suất",
  ai_chatbot: "Trợ lý AI ERP",
  workflow_engine: "Tự động hóa Workflows"
};

const featureDescriptions = {
  pos_sales: "Thanh toán hóa đơn & in QR tại quầy",
  order_fulfillment: "Xử lý, duyệt và giao đơn hàng",
  inventory_control: "Kiểm kho và cập nhật tồn kho thực",
  accounting_ledger: "Hạch toán kế toán và đối chiếu số liệu",
  channel_sync: "Đồng bộ sản phẩm/đơn đa kênh",
  performance_kpi: "Đánh giá KPI & phân cấp lộ trình",
  ai_chatbot: "Hỗ trợ trả lời tư vấn và tra cứu dữ liệu",
  workflow_engine: "Duyệt tự động hóa tài liệu & phê duyệt"
};

const formatAuditValue = (value: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 4 }).format(value);

const formatAuditTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export function SystemHealthTab() {
  const { toast } = useToast();
  const { companyId } = useCompanyContext();
  const [isInjecting, setIsInjecting] = useState(() => localStorage.getItem("system-integrity-injecting") === "true");
  const [dbStatus, setDbStatus] = useState<"up" | "down">(() => (localStorage.getItem("system-integrity-db-status") as "up" | "down") || "up");
  const [apiStatuses, setApiStatuses] = useState(() => ({
    database: (localStorage.getItem("system-integrity-db-status") as "up" | "down") || "up",
    supabase_api: (localStorage.getItem("system-integrity-supabase-api") as "up" | "down") || "up",
    shopee_api: (localStorage.getItem("system-integrity-shopee-api") as "up" | "down") || "up",
    lazada_api: (localStorage.getItem("system-integrity-lazada-api") as "up" | "down") || "up",
    tiktok_api: (localStorage.getItem("system-integrity-tiktok-api") as "up" | "down") || "up",
    ai_api: (localStorage.getItem("system-integrity-ai-api") as "up" | "down") || "up",
    momo_api: (localStorage.getItem("system-integrity-momo-api") as "up" | "down") || "up",
    vnpay_api: (localStorage.getItem("system-integrity-vnpay-api") as "up" | "down") || "up",
    ghn_api: (localStorage.getItem("system-integrity-ghn-api") as "up" | "down") || "up",
    ghtk_api: (localStorage.getItem("system-integrity-ghtk-api") as "up" | "down") || "up",
  }));
  const [featureStatuses, setFeatureStatuses] = useState(() => ({
    pos_sales: (localStorage.getItem("system-feature-status-pos-sales") as "up" | "down") || "up",
    order_fulfillment: (localStorage.getItem("system-feature-status-order-fulfillment") as "up" | "down") || "up",
    inventory_control: (localStorage.getItem("system-feature-status-inventory-control") as "up" | "down") || "up",
    accounting_ledger: (localStorage.getItem("system-feature-status-accounting-ledger") as "up" | "down") || "up",
    channel_sync: (localStorage.getItem("system-feature-status-channel-sync") as "up" | "down") || "up",
    performance_kpi: (localStorage.getItem("system-feature-status-performance-kpi") as "up" | "down") || "up",
    ai_chatbot: (localStorage.getItem("system-feature-status-ai-chatbot") as "up" | "down") || "up",
    workflow_engine: (localStorage.getItem("system-feature-status-workflow-engine") as "up" | "down") || "up",
  }));
  
  interface FeatureStats {
    totalRequests: number;
    successRequests: number;
    failedRequests: number;
  }

  const [featureStats, setFeatureStats] = useState<Record<string, FeatureStats>>(() => {
    const defaultStats = {
      pos_sales: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
      order_fulfillment: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
      inventory_control: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
      accounting_ledger: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
      channel_sync: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
      performance_kpi: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
      ai_chatbot: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
      workflow_engine: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
    };
    try {
      const stored = localStorage.getItem("system-feature-stats");
      return stored ? JSON.parse(stored) : defaultStats;
    } catch (e) {
      return defaultStats;
    }
  });

  const saveFeatureStats = (newStats: Record<string, FeatureStats>) => {
    setFeatureStats(newStats);
    localStorage.setItem("system-feature-stats", JSON.stringify(newStats));
  };

  const [cpuPercentage, setCpuPercentage] = useState(12.4);
  const [ramUsed, setRamUsed] = useState(245.8);
  const [dbLatency, setDbLatency] = useState(8);
  const [coping, setCoping] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<MetricHistoryItem[]>([]);
  const [terminusJson, setTerminusJson] = useState<string>("");

  const injectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateMetricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const consoleBottomRef = useRef<HTMLDivElement | null>(null);

  const [auditReport, setAuditReport] = useState<SystemDataAuditReport | null>(null);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);
  const [autoAuditEnabled, setAutoAuditEnabled] = useState(
    () => localStorage.getItem("system-data-auto-audit-enabled") === "true"
  );
  const auditIssueCount = auditReport ? auditReport.warningCount + auditReport.errorCount : 0;

  // Initialize Metric History
  useEffect(() => {
    const initHistory: MetricHistoryItem[] = [];
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 3000);
      initHistory.push({
        time: t.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        cpu: 8 + Math.random() * 5,
        ram: 210 + Math.random() * 20,
        dbLatency: 5 + Math.round(Math.random() * 5),
      });
    }
    setHistory(initHistory);
    addLog("[Terminus] Khởi động hệ thống giám sát sức khỏe.");
    addLog("[Terminus] Endpoint /health đã được đăng ký và sẵn sàng.");
  }, []);

  // Load initial statuses from server on mount to sync across different devices/users
  useEffect(() => {
    const fetchInitialStatuses = async () => {
      try {
        const res = await fetch("/health");
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.details) {
          const newApiStatuses: Record<string, "up" | "down"> = {};
          const newFeatureStatuses: Record<string, "up" | "down"> = {};
          
          Object.entries(data.details).forEach(([key, val]: [string, any]) => {
            if (key !== "features_health" && key !== "memory_heap" && key !== "cpu_load") {
              newApiStatuses[key] = val.status || "up";
              // Update local storage to match server state
              const storageKey = key === "database" ? "system-integrity-db-status" : `system-integrity-${key.replace(/_/g, "-")}`;
              localStorage.setItem(storageKey, val.status || "up");
            }
          });

          if (data.details.features_health) {
            Object.entries(data.details.features_health).forEach(([key, val]: [string, any]) => {
              if (key !== "status" && key !== "message") {
                newFeatureStatuses[key] = val.status || "up";
                // Update local storage to match server state
                const storageKey = `system-feature-status-${key.replace(/_/g, "-")}`;
                localStorage.setItem(storageKey, val.status || "up");
              }
            });
          }

          setApiStatuses(prev => ({ ...prev, ...newApiStatuses }));
          setFeatureStatuses(prev => ({ ...prev, ...newFeatureStatuses }));
          
          if (newApiStatuses.database) {
            setDbStatus(newApiStatuses.database);
          }
        }
      } catch (e) {
        // Ignore fetch errors
      }
    };
    fetchInitialStatuses();
  }, []);

  // Update backend state whenever states change
  useEffect(() => {
    const updateBackendState = async () => {
      try {
        await fetch("/api/health-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isInjecting,
            cpuPercentage,
            ramUsed,
            dbStatus,
            apiStatuses,
            featureStatuses
          })
        });
      } catch (e) {
        // Ignore API failures in production builds where dev middleware is absent
      }
    };
    updateBackendState();
    generateTerminusJson();
  }, [isInjecting, cpuPercentage, ramUsed, dbStatus, apiStatuses, featureStatuses, auditReport]);

  const isInjectingRef = useRef(isInjecting);
  const dbStatusRef = useRef(dbStatus);
  const featureStatusesRef = useRef(featureStatuses);

  useEffect(() => {
    isInjectingRef.current = isInjecting;
    dbStatusRef.current = dbStatus;
    featureStatusesRef.current = featureStatuses;
  }, [isInjecting, dbStatus, featureStatuses]);

  // Update real-time metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const injecting = isInjectingRef.current;
      const dbState = dbStatusRef.current;

      const nextCpu = (() => {
        const base = injecting ? 75 : 8;
        const variation = injecting ? Math.random() * 15 - 5 : Math.random() * 4 - 2;
        return Math.min(100, Math.max(1, Math.round((base + variation) * 10) / 10));
      })();

      const nextRam = (() => {
        const base = injecting ? 1150 : 220;
        const variation = injecting ? Math.random() * 80 - 30 : Math.random() * 10 - 5;
        return Math.min(2048, Math.max(50, Math.round((base + variation) * 10) / 10));
      })();

      const nextDbLatency = (() => {
        if (dbState === "down") return 0;
        const base = injecting ? 38 : 6;
        const variation = injecting ? Math.random() * 20 - 5 : Math.random() * 4 - 2;
        return Math.max(1, Math.round(base + variation));
      })();

      setCpuPercentage(nextCpu);
      setRamUsed(nextRam);
      setDbLatency(nextDbLatency);

      // Add to history list
      setHistory((prev) => {
        const next = [...prev];
        if (next.length >= 15) next.shift();
        const t = new Date();
        next.push({
          time: t.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          cpu: nextCpu,
          ram: nextRam,
          dbLatency: nextDbLatency,
        });
        return next;
      });
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString("vi-VN");
    setLogs((prev) => [...prev, `[${time}] ${msg}`].slice(-40)); // Keep last 40 logs
  }, []);

  const writeMockAuditLog = useCallback(async (action: string, details: string) => {
    try {
      const rawLogs = localStorage.getItem("erp-mini-local-demo-audit-logs");
      const logsList = rawLogs ? JSON.parse(rawLogs) : [];
      logsList.unshift({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        company_id: "demo-company",
        user_id: "user-admin",
        action: "DATA_INJECTION",
        table_name: action,
        old_data: null,
        new_data: { details },
        created_at: new Date().toISOString()
      });
      // Limit to 100 items
      if (logsList.length > 100) logsList.pop();
      localStorage.setItem("erp-mini-local-demo-audit-logs", JSON.stringify(logsList));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Handle continuous data injection loop covering all 8 features
  useEffect(() => {
    if (isInjecting) {
      addLog("[Locust] Khởi động Locust load test client...");
      addLog("[Locust] Tạo 15 target users bắn concurrent requests vào ERP API...");
      
      const interval = setInterval(() => {
        const currentFeatures = featureStatusesRef.current;
        const featuresKeys = Object.keys(currentFeatures) as Array<keyof typeof currentFeatures>;
        const users = ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D", "Khách lẻ VIP"];

        setFeatureStats((prev) => {
          const updated = { ...prev };

          featuresKeys.forEach((featureKey) => {
            const user = users[Math.floor(Math.random() * users.length)];
            const amount = (Math.floor(Math.random() * 50) + 1) * 10000;
            const orderId = Math.floor(100000 + Math.random() * 900000);
            const sku = `SKU-ERP-${Math.floor(1000 + Math.random() * 9000)}`;
            const responseTime = Math.round(150 + Math.random() * 150);
            const isUp = currentFeatures[featureKey] === "up";

            switch (featureKey) {
              case "pos_sales":
                if (isUp) {
                  addLog(`[POS] Giao dịch POS ${amount.toLocaleString()}đ của ${user} - 200 OK | Hóa đơn in thành công.`);
                  writeMockAuditLog("POST /pos/orders", `Tạo đơn hàng POS trị giá ${amount.toLocaleString()}đ cho ${user}`);
                } else {
                  addLog(`[POS/Lỗi] THẤT BẠI: Giao dịch POS của ${user} bị lỗi - Lỗi in hóa đơn hoặc lỗi cổng thanh toán QR code.`);
                  writeMockAuditLog("POST /pos/orders", `THẤT BẠI: Giao dịch POS ${amount.toLocaleString()}đ bị hủy do thiết bị in hóa đơn lỗi.`);
                }
                break;
              case "order_fulfillment":
                if (isUp) {
                  addLog(`[Xử lý Đơn] Đã duyệt và phân phối tự động đơn hàng #${orderId} - 200 OK.`);
                  writeMockAuditLog("POST /orders/fulfill", `Phân phối đơn hàng #${orderId} cho đơn vị vận chuyển.`);
                } else {
                  addLog(`[Xử lý Đơn/Lỗi] THẤT BẠI: Giao hàng #${orderId} lỗi - Lỗi phân vùng đơn hàng tự động do thiếu dữ liệu địa chỉ.`);
                  writeMockAuditLog("POST /orders/fulfill", `THẤT BẠI: Đơn #${orderId} không thể tự động xử lý.`);
                }
                break;
              case "inventory_control":
                if (isUp) {
                  addLog(`[Tồn kho] Cập nhật tồn kho thành công cho sản phẩm ${sku} - 200 OK.`);
                } else {
                  addLog(`[Tồn kho/Lỗi] CẢNH BÁO: Phát hiện chênh lệch kiểm kho tại Kho Q1 cho sản phẩm ${sku}.`);
                }
                break;
              case "accounting_ledger":
                if (isUp) {
                  addLog(`[Kế toán] Hạch toán tự động sổ cái đơn hàng POS - 200 OK.`);
                  writeMockAuditLog("POST /accounting/journals", `Hạch toán doanh thu và giá vốn đơn hàng.`);
                } else {
                  addLog(`[Kế toán/Lỗi] THẤT BẠI: Bút toán sổ cái không cân đối (Nợ khác Có) trong kỳ hạch toán.`);
                  writeMockAuditLog("POST /accounting/journals", `THẤT BẠI: Từ chối ghi sổ do mất cân đối tài khoản.`);
                }
                break;
              case "channel_sync":
                if (isUp) {
                  addLog(`[Đồng bộ] Đồng bộ thành công sản phẩm ${sku} sang Shopee/Lazada/TikTok - 200 OK.`);
                } else {
                  addLog(`[Đồng bộ/Lỗi] THẤT BẠI: Đồng bộ kênh bán lỗi - Lỗi xác thực khóa API Shopee (Token expired).`);
                }
                break;
              case "performance_kpi":
                if (isUp) {
                  addLog(`[KPI] Tính toán điểm hiệu suất định kỳ cho nhân viên ${user} - 200 OK.`);
                } else {
                  addLog(`[KPI/Lỗi] THẤT BẠI: Tính toán KPI của ${user} lỗi - Lộ trình thăng tiến nhân sự chưa cấu hình cấp bậc liên kết.`);
                }
                break;
              case "ai_chatbot":
                if (isUp) {
                  addLog(`[AI Trợ lý] Phản hồi câu hỏi khách hàng (${responseTime}ms) - 200 OK.`);
                } else {
                  addLog(`[AI Trợ lý/Lỗi] THẤT BẠI: Trợ lý AI không phản hồi - AI phản hồi chậm (>10s) hoặc lỗi Vector Database connection.`);
                }
                break;
              case "workflow_engine":
                if (isUp) {
                  addLog(`[Workflows] Kích hoạt luồng duyệt báo giá tự động thành công - 200 OK.`);
                } else {
                  addLog(`[Workflows/Lỗi] THẤT BẠI: Luồng duyệt báo giá lỗi - Lỗi vòng lặp vô hạn trong luồng tự động duyệt báo giá.`);
                }
                break;
            }

            const currentStat = updated[featureKey] || { totalRequests: 0, successRequests: 0, failedRequests: 0 };
            updated[featureKey] = {
              totalRequests: currentStat.totalRequests + 1,
              successRequests: currentStat.successRequests + (isUp ? 1 : 0),
              failedRequests: currentStat.failedRequests + (isUp ? 0 : 1),
            };
          });

          localStorage.setItem("system-feature-stats", JSON.stringify(updated));
          return updated;
        });
      }, 700);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isInjecting, addLog, writeMockAuditLog]);

  const handleToggleInjection = () => {
    if (isInjecting) {
      setIsInjecting(false);
      localStorage.setItem("system-integrity-injecting", "false");
      addLog("[Locust] Dừng nhồi dữ liệu. Máy chủ trở về chế độ nhàn rỗi (idle).");
      toast({ title: "Đã dừng giả lập", description: "Tải làm việc của hệ thống đã hạ nhiệt về mức bình thường." });
    } else {
      setIsInjecting(true);
      localStorage.setItem("system-integrity-injecting", "true");
      toast({
        title: "Bắt đầu nhồi dữ liệu!",
        description: "Hệ thống đang chịu tải nặng. RAM & CPU bắt đầu tăng vọt.",
      });
    }
  };

  // Auto scroll terminal to bottom
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Toggle Database Online/Offline
  const handleToggleApi = (apiKey: keyof typeof apiStatuses) => {
    const current = apiStatuses[apiKey];
    const next = current === "up" ? "down" : "up";
    setApiStatuses(prev => ({ ...prev, [apiKey]: next }));
    
    if (apiKey === "database") {
      setDbStatus(next);
    }
    
    // Save to local storage
    const storageKey = apiKey === "database" ? "system-integrity-db-status" : `system-integrity-${apiKey.replace("_", "-")}`;
    localStorage.setItem(storageKey, next);

    const displayName = apiDisplayNames[apiKey];
    if (next === "down") {
      addLog(`[Terminus] CẢNH BÁO: API ${displayName} đã bị ngắt kết nối!`);
      toast({
        variant: "destructive",
        title: `Đã ngắt kết nối ${displayName}`,
        description: "Terminus /health sẽ phản ánh trạng thái lỗi.",
      });
    } else {
      addLog(`[Terminus] API ${displayName} đã được phục hồi thành công.`);
      toast({
        title: `Đã kết nối lại ${displayName}`,
        description: `API ${displayName} đã hoạt động trở lại.`,
      });
    }
  };

  const handleToggleFeature = (featureKey: keyof typeof featureStatuses) => {
    const current = featureStatuses[featureKey];
    const next = current === "up" ? "down" : "up";
    setFeatureStatuses(prev => ({ ...prev, [featureKey]: next }));
    
    // Save to local storage
    const storageKey = `system-feature-status-${featureKey.replace(/_/g, "-")}`;
    localStorage.setItem(storageKey, next);

    const displayName = featureDisplayNames[featureKey];
    if (next === "down") {
      addLog(`[Terminus] CẢNH BÁO: Tính năng ${displayName} đã bị lỗi!`);
      toast({
        variant: "destructive",
        title: `Tính năng ${displayName} gặp lỗi`,
        description: "Hệ thống sẽ ghi nhận trạng thái lỗi trong Terminus /health.",
      });
    } else {
      addLog(`[Terminus] Tính năng ${displayName} đã phục hồi và hoạt động bình thường.`);
      toast({
        title: `Phục hồi tính năng ${displayName}`,
        description: `Tính năng ${displayName} đã hoạt động trở lại.`,
      });
    }
  };

  const handleRestoreAll = () => {
    const healthyApis = {
      database: "up" as const,
      supabase_api: "up" as const,
      shopee_api: "up" as const,
      lazada_api: "up" as const,
      tiktok_api: "up" as const,
      ai_api: "up" as const,
      momo_api: "up" as const,
      vnpay_api: "up" as const,
      ghn_api: "up" as const,
      ghtk_api: "up" as const,
    };
    setApiStatuses(healthyApis);
    setDbStatus("up");
    
    Object.keys(healthyApis).forEach(key => {
      const storageKey = key === "database" ? "system-integrity-db-status" : `system-integrity-${key.replace(/_/g, "-")}`;
      localStorage.setItem(storageKey, "up");
    });
    
    const healthyFeatures = {
      pos_sales: "up" as const,
      order_fulfillment: "up" as const,
      inventory_control: "up" as const,
      accounting_ledger: "up" as const,
      channel_sync: "up" as const,
      performance_kpi: "up" as const,
      ai_chatbot: "up" as const,
      workflow_engine: "up" as const,
    };
    setFeatureStatuses(healthyFeatures);
    
    Object.keys(healthyFeatures).forEach(key => {
      const storageKey = `system-feature-status-${key.replace(/_/g, "-")}`;
      localStorage.setItem(storageKey, "up");
    });

    localStorage.setItem("system-integrity-memory-status", "up");
    localStorage.setItem("system-integrity-cpu-status", "up");
    setAuditReport(null);

    addLog("[Terminus] Đã khôi phục toàn bộ dịch vụ và kết nối hệ thống về trạng thái khỏe mạnh.");
    toast({
      title: "Đã phục hồi hệ thống",
      description: "Tất cả các dịch vụ và API giả lập đã được khôi phục về trạng thái hoạt động bình thường.",
    });
  };

  const generateTerminusJson = () => {
    const memoryStatus = localStorage.getItem("system-integrity-memory-status") || "up";
    const cpuStatus = localStorage.getItem("system-integrity-cpu-status") || "up";

    const apis = {
      database: { status: apiStatuses.database, message: "Supabase Database connection timeout" },
      supabase_api: { status: apiStatuses.supabase_api, message: "Supabase auth/REST service is unreachable" },
      shopee_api: { status: apiStatuses.shopee_api, message: "Shopee Open API gateway timeout (504)" },
      lazada_api: { status: apiStatuses.lazada_api, message: "Lazada partner API authorization expired" },
      tiktok_api: { status: apiStatuses.tiktok_api, message: "TikTok Shop API connection refused (502)" },
      ai_api: { status: apiStatuses.ai_api, message: "Edge function 'chat-with-docs' failed to execute" },
      momo_api: { status: apiStatuses.momo_api, message: "Momo IPN callback timeout" },
      vnpay_api: { status: apiStatuses.vnpay_api, message: "VNPay secure hash validation failed" },
      ghn_api: { status: apiStatuses.ghn_api, message: "GHN delivery cost calculation API service down" },
      ghtk_api: { status: apiStatuses.ghtk_api, message: "GHTK order synchronization service down" }
    };

    const features = {
      pos_sales: { status: featureStatuses.pos_sales, message: "Lỗi in hóa đơn hoặc lỗi cổng thanh toán QR code" },
      order_fulfillment: { status: featureStatuses.order_fulfillment, message: "Lỗi phân vùng đơn hàng tự động do thiếu dữ liệu địa chỉ" },
      inventory_control: { status: featureStatuses.inventory_control, message: "Cảnh báo: Phát hiện chênh lệch kiểm kho tại Kho Q1" },
      accounting_ledger: { status: featureStatuses.accounting_ledger, message: "Bút toán sổ cái không cân đối (Nợ khác Có) trong kỳ hạch toán" },
      channel_sync: { status: featureStatuses.channel_sync, message: "Lỗi xác thực khóa API Shopee (Token expired)" },
      performance_kpi: { status: featureStatuses.performance_kpi, message: "Lộ trình thăng tiến nhân sự chưa cấu hình cấp bậc liên kết" },
      ai_chatbot: { status: featureStatuses.ai_chatbot, message: "AI phản hồi chậm (>10s) hoặc lỗi Vector Database connection" },
      workflow_engine: { status: featureStatuses.workflow_engine, message: "Lỗi vòng lặp vô hạn trong luồng tự động duyệt báo giá" }
    };

    const systemMetrics = {
      memory_heap: {
        status: memoryStatus,
        usedInMB: Math.round(ramUsed * 10) / 10,
        limitInMB: 2048,
        ...(memoryStatus === "down" ? { message: "Heap memory limit exceeded" } : {})
      },
      cpu_load: {
        status: cpuStatus,
        percentage: Math.round(cpuPercentage * 10) / 10,
        ...(cpuStatus === "down" ? { message: "CPU load exceeds 95%" } : {})
      }
    };

    const info: Record<string, any> = {};
    const error: Record<string, any> = {};
    const details: Record<string, any> = {};
    let overallStatus: "ok" | "error" = "ok";

    // Process APIs
    Object.entries(apis).forEach(([name, data]) => {
      const isUp = data.status === "up";
      if (isUp) {
        info[name] = { status: "up" };
      } else {
        overallStatus = "error";
        error[name] = { status: "down", message: data.message };
      }
      details[name] = { status: data.status, ...(isUp ? {} : { message: data.message }) };
    });

    // Process Features
    const featuresInfo: Record<string, any> = {};
    const featuresError: Record<string, any> = {};
    const featuresDetails: Record<string, any> = {};
    let featuresStatus: "up" | "down" = "up";

    Object.entries(features).forEach(([name, data]) => {
      const isUp = data.status === "up";
      if (isUp) {
        featuresInfo[name] = { status: "up" };
      } else {
        featuresStatus = "down";
        overallStatus = "error";
        featuresError[name] = { status: "down", message: data.message };
      }
      details[name] = { status: data.status, ...(isUp ? {} : { message: data.message }) };
    });

    if (featuresStatus === "up") {
      info["features_health"] = { status: "up", ...featuresInfo };
    } else {
      error["features_health"] = { status: "down", ...featuresError };
    }
    details["features_health"] = {
      status: featuresStatus,
      ...featuresDetails
    };

    // Process System Metrics
    Object.entries(systemMetrics).forEach(([name, data]) => {
      const isUp = data.status === "up";
      if (isUp) {
        info[name] = { status: "up" };
      } else {
        overallStatus = "error";
        error[name] = { status: "down", message: data.message };
      }
      details[name] = data;
    });

    if (auditReport) {
      const dataAuditStatus = auditIssueCount > 0 ? "down" : "up";
      const dataAuditPayload = {
        status: dataAuditStatus,
        score: auditReport.score,
        totalChecks: auditReport.totalChecks,
        issues: auditIssueCount,
        errors: auditReport.errorCount,
        warnings: auditReport.warningCount,
        scannedAt: auditReport.scannedAt,
        ...(auditIssueCount > 0
          ? { message: "Phát hiện sai lệch dữ liệu trong tồn kho, giá, đơn hàng, thanh toán, kế toán hoặc BOM" }
          : {}),
      };

      if (dataAuditStatus === "up") {
        info["data_consistency"] = dataAuditPayload;
      } else {
        overallStatus = "error";
        error["data_consistency"] = dataAuditPayload;
      }
      details["data_consistency"] = dataAuditPayload;
    }

    const healthData = {
      status: overallStatus,
      info,
      error,
      details
    };
    setTerminusJson(JSON.stringify(healthData, null, 2));
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(`${window.location.origin}/health`);
    setCoping(true);
    toast({ title: "Đã sao chép link /health", description: "Bạn có thể dán vào trình duyệt hoặc curl." });
    setTimeout(() => setCoping(false), 2000);
  };

  const runDataIntegrityCheck = useCallback(async (mode: "manual" | "auto" = "manual") => {
    setCheckingIntegrity(true);
    try {
      const report = await runSystemDataAudit(companyId);
      setAuditReport(report);
      setCheckingIntegrity(false);

      const issues = report.warningCount + report.errorCount;
      addLog(
        `[Audit] Đối soát ${report.totalChecks} phép kiểm: ${report.errorCount} lỗi, ${report.warningCount} cảnh báo, score ${report.score}%.`
      );

      if (mode === "manual") {
        toast({
          variant: report.errorCount > 0 ? "destructive" : "default",
          title: issues > 0 ? `Audit xong: ${issues} sai lệch` : "Dữ liệu đồng bộ",
          description: `Đã đối soát ${report.totalChecks} phép kiểm dữ liệu hệ thống.`,
        });
      }
    } catch (e: any) {
      setCheckingIntegrity(false);
      addLog(`[Audit/Lỗi] ${e.message}`);
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    }
  }, [addLog, companyId, toast]);

  useEffect(() => {
    localStorage.setItem("system-data-auto-audit-enabled", String(autoAuditEnabled));
    if (!autoAuditEnabled) return;

    runDataIntegrityCheck("auto");
    const interval = window.setInterval(() => {
      runDataIntegrityCheck("auto");
    }, 60000);

    return () => window.clearInterval(interval);
  }, [autoAuditEnabled, runDataIntegrityCheck]);

  const isAnyApiDown = Object.values(apiStatuses).some(s => s === "down");
  const isAnyFeatureDown = Object.values(featureStatuses).some(s => s === "down");
  const isOverallError = isAnyApiDown || isAnyFeatureDown || auditIssueCount > 0;

  return (
    <div className="space-y-6">
      {/* NestJS Terminus API integration card */}
      <Card className="overflow-hidden border border-primary/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100">
        <div className="bg-primary/10 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-primary/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30 animate-pulse">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-wide">NestJS Terminus Status</span>
                <Badge variant={isOverallError ? "destructive" : "default"} className="text-[10px] uppercase font-bold py-0.5 px-2">
                  {isOverallError ? "Error 503" : "Online 200"}
                </Badge>
                {isOverallError && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] bg-emerald-600/20 border-emerald-500/30 hover:bg-emerald-600 text-emerald-300 hover:text-white font-semibold px-2 py-0"
                    onClick={handleRestoreAll}
                  >
                    Khôi phục
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-400">Endpoint API sức khỏe hệ thống theo thời gian thực</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <span className="font-mono text-slate-400 select-all overflow-hidden text-ellipsis whitespace-nowrap px-1 max-w-[200px] sm:max-w-xs">
              /health
            </span>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-slate-100 hover:bg-slate-800 shrink-0" onClick={handleCopyEndpoint}>
              {coping ? <CopyCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <h4 className="text-xs font-semibold uppercase text-primary tracking-wider mb-3">Bảng Điều Khiển Giả Lập APIs</h4>
              <div className="space-y-4">
                {/* Simulated API status switches */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {Object.entries(apiStatuses).map(([key, value]) => {
                    const apiKey = key as keyof typeof apiStatuses;
                    const displayName = apiDisplayNames[apiKey];
                    const description = apiDescriptions[apiKey];
                    
                    return (
                      <div key={apiKey} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/80 text-xs">
                        <div className="space-y-0.5 flex-1 pr-2">
                          <Label className="text-[11px] font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer">
                            <span className={`h-1.5 w-1.5 rounded-full ${value === "up" ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
                            {displayName}
                          </Label>
                          <p className="text-[9px] text-slate-400 leading-tight">{description}</p>
                        </div>
                        <Switch 
                          checked={value === "up"} 
                          onCheckedChange={() => handleToggleApi(apiKey)}
                          className="scale-90"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Simulated load test switch */}
                <div className="flex flex-col p-3 rounded-xl bg-slate-950/50 border border-slate-800 gap-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-orange-500" />
                        Nhồi Dữ Liệu Liên Tục (Load Test)
                      </Label>
                      <p className="text-[10px] text-slate-400">Faker sinh data & Locust spam API</p>
                    </div>
                    <Button 
                      size="icon" 
                      variant={isInjecting ? "destructive" : "default"} 
                      className="h-8 w-8 rounded-full" 
                      onClick={handleToggleInjection}
                    >
                      {isInjecting ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
                    </Button>
                  </div>
                  {isInjecting && (
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-ping mr-1" />
                        Locust: 50 concurrent req/s
                      </span>
                      <span className="text-slate-400">Faker: 30 txn/s</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live gauges */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase text-primary tracking-wider mb-1">Tài Nguyên Hiện Thời</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/30 border border-slate-800 flex flex-col justify-between h-24">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium">CPU Usage</span>
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold font-mono text-slate-100">{cpuPercentage}%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          cpuPercentage > 80 ? "bg-red-500" : cpuPercentage > 50 ? "bg-yellow-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${cpuPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/30 border border-slate-800 flex flex-col justify-between h-24">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium">Memory Heap</span>
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold font-mono text-slate-100">{Math.round(ramUsed)}MB</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          ramUsed > 1600 ? "bg-red-500" : ramUsed > 800 ? "bg-yellow-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${(ramUsed / 2048) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time chart */}
          <div className="lg:col-span-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-850 pt-6 lg:pt-0 lg:pl-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold uppercase text-primary tracking-wider">Lịch Sử Biểu Đồ (Real-time Monitor)</h4>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-orange-500" /> CPU (%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> RAM (MB)
                  </span>
                </div>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ background: "#020617", border: "1px solid #1e293b", color: "#f8fafc" }}
                      itemStyle={{ color: "#f8fafc" }}
                    />
                    <Area type="monotone" dataKey="cpu" stroke="#f97316" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} name="CPU (%)" />
                    <Area type="monotone" dataKey="ram" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRam)" strokeWidth={2} name="RAM (MB)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Terminus Raw JSON Response */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Link2 className="h-3 w-3 text-slate-500" />
                  Terminus JSON Response
                </span>
                <span className="text-[9px] text-slate-500 font-mono">Status: {isOverallError ? "503 Service Unavailable" : "200 OK"}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-900 font-mono text-[11px] text-slate-300 max-h-36 overflow-y-auto whitespace-pre">
                {terminusJson}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log and Locust transaction console */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-slate-200 bg-card text-card-foreground">
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              Locust & Faker Console Logs
            </CardTitle>
            <CardDescription className="text-xs">Theo dõi luồng nhồi dữ liệu API ERP thời gian thực</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-[11px] h-72 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-550 italic text-center">
                  Nhấn bắt đầu nhồi dữ liệu để theo dõi log...
                </div>
              ) : (
                <>
                  {logs.map((log, index) => {
                    let colorClass = "text-slate-400";
                    if (log.includes("200 OK")) colorClass = "text-emerald-400";
                    if (log.includes("CẢNH BÁO") || log.includes("THẤT BẠI")) colorClass = "text-red-400 font-semibold";
                    if (log.includes("[Locust]")) colorClass = "text-sky-400";
                    if (log.includes("[Terminus]")) colorClass = "text-purple-400";

                    return (
                      <div key={index} className={`break-all leading-normal ${colorClass}`}>
                        {log}
                      </div>
                    );
                  })}
                  <div ref={consoleBottomRef} />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feature Status & Stats Monitor tabbed card */}
        <Card className="border border-slate-200 bg-card text-card-foreground flex flex-col justify-between">
          <CardHeader className="py-4 flex flex-row items-center justify-between border-b pb-3 shrink-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Tính năng & Thống kê (Feature Health)
              </CardTitle>
              <CardDescription className="text-xs">
                Giám sát và kiểm tra chi tiết trạng thái hoạt động của các phân hệ
              </CardDescription>
            </div>
          </CardHeader>
          
          <Tabs defaultValue="status" className="w-full flex-1 flex flex-col">
            <div className="px-6 py-2 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="status" className="text-xs">Bật/Tắt Lỗi</TabsTrigger>
                <TabsTrigger value="stats" className="text-xs">Thống kê</TabsTrigger>
                <TabsTrigger value="scan" className="text-xs">Audit lệch</TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-6 flex-1 h-72 overflow-y-auto">
              <TabsContent value="status" className="mt-0 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(featureStatuses).map(([key, value]) => {
                    const featureKey = key as keyof typeof featureStatuses;
                    const displayName = featureDisplayNames[featureKey];
                    const description = featureDescriptions[featureKey];
                    
                    return (
                      <div key={featureKey} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="space-y-0.5 flex-1 pr-2">
                          <Label className="text-[11px] font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
                            <span className={`h-1.5 w-1.5 rounded-full ${value === "up" ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
                            {displayName}
                          </Label>
                          <p className="text-[9px] text-muted-foreground leading-tight">{description}</p>
                        </div>
                        <Switch 
                          checked={value === "up"} 
                          onCheckedChange={() => handleToggleFeature(featureKey)}
                          className="scale-90"
                        />
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="stats" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Tỷ lệ thành công theo phân hệ</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs px-2.5 font-medium flex items-center gap-1.5"
                    onClick={() => {
                      const reseted = {
                        pos_sales: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
                        order_fulfillment: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
                        inventory_control: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
                        accounting_ledger: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
                        channel_sync: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
                        performance_kpi: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
                        ai_chatbot: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
                        workflow_engine: { totalRequests: 0, successRequests: 0, failedRequests: 0 },
                      };
                      saveFeatureStats(reseted);
                      addLog("[Terminus] Đã đặt lại toàn bộ thống kê hoạt động.");
                      toast({ title: "Đã đặt lại thống kê", description: "Bảng số liệu hiệu năng đã được làm mới." });
                    }}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Đặt lại
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b text-muted-foreground font-semibold">
                        <th className="pb-2">Tính năng</th>
                        <th className="pb-2 text-center">Trạng thái</th>
                        <th className="pb-2 text-right">Tổng req</th>
                        <th className="pb-2 text-right text-emerald-500">Thành công</th>
                        <th className="pb-2 text-right text-destructive">Lỗi</th>
                        <th className="pb-2 text-right pr-1">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(featureStats).map(([key, stats]) => {
                        const featureKey = key as keyof typeof featureStatuses;
                        const displayName = featureDisplayNames[featureKey];
                        const status = featureStatuses[featureKey];
                        const rate = stats.totalRequests > 0 
                          ? Math.round((stats.successRequests / stats.totalRequests) * 100) 
                          : 100;
                        
                        return (
                          <tr key={featureKey} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                            <td className="py-2 font-medium">{displayName}</td>
                            <td className="py-2 text-center">
                              <Badge variant={status === "up" ? "secondary" : "destructive"} className="text-[8px] py-0 px-1 font-semibold uppercase leading-none">
                                {status === "up" ? "Up" : "Down"}
                              </Badge>
                            </td>
                            <td className="py-2 text-right font-mono">{stats.totalRequests}</td>
                            <td className="py-2 text-right font-mono text-emerald-600 dark:text-emerald-400">{stats.successRequests}</td>
                            <td className="py-2 text-right font-mono text-destructive">{stats.failedRequests}</td>
                            <td className="py-2 text-right font-mono font-bold pr-1">
                              <span className={rate < 100 ? "text-amber-500" : "text-emerald-500"}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="scan" className="mt-0 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">Audit bất đồng bộ dữ liệu</span>
                      {auditReport && (
                        <Badge
                          variant={auditIssueCount > 0 ? "destructive" : "secondary"}
                          className="text-[8px] px-1.5 py-0 font-medium"
                        >
                          {auditIssueCount > 0 ? `${auditIssueCount} sai lệch` : "Đồng bộ"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      Đối soát tồn kho, giá, đơn hàng, thanh toán, sổ cái và định mức BOM.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 px-2 py-1">
                      <Switch
                        checked={autoAuditEnabled}
                        onCheckedChange={setAutoAuditEnabled}
                        className="scale-75"
                      />
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">Tự audit</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => runDataIntegrityCheck("manual")}
                      disabled={checkingIntegrity}
                      className="h-7 text-xs px-2.5"
                    >
                      {checkingIntegrity ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                      Audit ngay
                    </Button>
                    {isLocalDemoAuthEnabled() && auditReport && auditReport.issues.some((i: any) => i.title?.includes("BOM")) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const results = syncBomCostToProducts();
                          if (results.length > 0) {
                            toast({
                              title: `BOM Sync: Đã cập nhật ${results.length} sản phẩm`,
                              description: results.map(r => `${r.sku}: ${r.oldCost.toLocaleString()}đ → ${r.newCost.toLocaleString()}đ`).join(" | "),
                            });
                            // Re-run audit after sync
                            setTimeout(() => runDataIntegrityCheck("manual"), 500);
                          } else {
                            toast({ title: "BOM Sync: Không có sản phẩm nào cần cập nhật" });
                          }
                        }}
                        className="h-7 text-xs px-2.5 text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Link2 className="h-3 w-3 mr-1.5" />
                        BOM Sync
                      </Button>
                    )}
                  </div>
                </div>

                {auditReport ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-2">
                        <p className="text-[9px] uppercase text-muted-foreground font-semibold">Score</p>
                        <p className={auditIssueCount > 0 ? "text-sm font-bold text-destructive" : "text-sm font-bold text-emerald-600"}>
                          {auditReport.score}%
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-2">
                        <p className="text-[9px] uppercase text-muted-foreground font-semibold">Phép kiểm</p>
                        <p className="text-sm font-bold text-foreground">{auditReport.okChecks}/{auditReport.totalChecks}</p>
                      </div>
                      <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-2">
                        <p className="text-[9px] uppercase text-muted-foreground font-semibold">Lỗi</p>
                        <p className="text-sm font-bold text-destructive">{auditReport.errorCount}</p>
                      </div>
                      <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-2">
                        <p className="text-[9px] uppercase text-muted-foreground font-semibold">Cảnh báo</p>
                        <p className="text-sm font-bold text-amber-600">{auditReport.warningCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Lần audit cuối: {formatAuditTime(auditReport.scannedAt)}</span>
                      <span>{autoAuditEnabled ? "Tự audit mỗi 60 giây" : "Tự audit đang tắt"}</span>
                    </div>

                    {auditReport.issues.length > 0 ? (
                      <div className="space-y-2">
                        {auditReport.issues.map((issue) => (
                          <div key={issue.id} className="flex items-start gap-2.5 p-2 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30 text-xs">
                            {issue.severity === "warning" ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                            ) : (
                              <AlertOctagon className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-[11px] font-semibold text-foreground leading-snug">{issue.module} · {issue.title}</p>
                                <Badge variant={issue.severity === "warning" ? "secondary" : "destructive"} className="text-[8px] px-1 py-0 font-medium">
                                  {issue.severity === "warning" ? "Cảnh báo" : "Lỗi"}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-snug">{issue.detail}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                <span className="truncate">{issue.expectedLabel}: {formatAuditValue(issue.expectedValue)}</span>
                                <span className="truncate">{issue.actualLabel}: {formatAuditValue(issue.actualValue)}</span>
                                <span className={Math.abs(issue.delta) > 0 ? "text-destructive" : "text-emerald-600"}>
                                  Delta: {formatAuditValue(issue.delta)}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-snug">{issue.recommendation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-28 flex flex-col items-center justify-center text-center text-emerald-600 gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <CheckCircle2 className="h-6 w-6" />
                        <p className="text-xs font-semibold">0 sai lệch dữ liệu</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300">BOM, giá, tồn kho, đơn hàng và kế toán đang khớp.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-muted-foreground gap-2 pt-4">
                    <Database className="h-6 w-6 text-muted-foreground/40" />
                    <p className="text-xs italic">Chưa chạy audit dữ liệu</p>
                    <p className="text-[10px]">Bấm Audit ngay hoặc bật Tự audit để hệ thống tự đối soát sai lệch.</p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
