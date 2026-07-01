import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { createLocalInventoryTransaction, getLocalProductBom, logLocalAction } from "@/lib/localInventoryStore";

export type ErpEvent = "ORDER_CREATED" | "PAYMENT_RECORDED" | "CONTRACT_SIGNED" | "STOCK_TRANSACTION_RECORDED";

export interface ErpEventPayloads {
  ORDER_CREATED: {
    order: any;
    items?: any[];
  };
  PAYMENT_RECORDED: {
    transaction: any;
  };
  CONTRACT_SIGNED: {
    contract: any;
    companyId: string;
  };
  STOCK_TRANSACTION_RECORDED: {
    transaction: any;
    product: any;
  };
}

type Subscriber<T extends ErpEvent> = (payload: ErpEventPayloads[T]) => void;

export interface EventBusLogEntry {
  id: string;
  timestamp: string;
  event: string;
  payload_summary: string;
  status: "success" | "partial" | "error";
  subscribers_total: number;
  subscribers_ok: number;
  subscribers_failed: number;
  errors: string[];
  duration_ms: number;
}

const EVENT_BUS_LOGS_KEY = "erp-mini-local-demo-event-bus-logs";
const MAX_LOGS = 200;

class ErpEventBus {
  private subscribers: Record<string, { name: string; fn: any }[]> = {};

  subscribe<T extends ErpEvent>(event: T, subscriber: Subscriber<T>, name?: string) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    const subscriberName = name || `subscriber-${this.subscribers[event].length + 1}`;
    this.subscribers[event].push({ name: subscriberName, fn: subscriber });
    return () => this.unsubscribe(event, subscriber);
  }

  unsubscribe<T extends ErpEvent>(event: T, subscriber: Subscriber<T>) {
    if (!this.subscribers[event]) return;
    this.subscribers[event] = this.subscribers[event].filter(s => s.fn !== subscriber);
  }

  publish<T extends ErpEvent>(event: T, payload: ErpEventPayloads[T]) {
    const startTime = performance.now();
    console.log(`[EventBus] Publishing event: ${event}`, payload);
    const eventSubscribers = this.subscribers[event] || [];

    const logEntry: EventBusLogEntry = {
      id: `ev-log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      event: event,
      payload_summary: this.summarizePayload(event, payload),
      status: "success",
      subscribers_total: eventSubscribers.length,
      subscribers_ok: 0,
      subscribers_failed: 0,
      errors: [],
      duration_ms: 0,
    };

    // Execute each subscriber and track results
    for (const sub of eventSubscribers) {
      try {
        sub.fn(payload);
        logEntry.subscribers_ok++;
      } catch (error: any) {
        logEntry.subscribers_failed++;
        const errorMsg = `[${sub.name}] ${error?.message || String(error)}`;
        logEntry.errors.push(errorMsg);
        console.error(`[EventBus] Error in ${sub.name} for event ${event}:`, error);
      }
    }

    logEntry.duration_ms = Math.round(performance.now() - startTime);

    if (logEntry.subscribers_failed > 0 && logEntry.subscribers_ok > 0) {
      logEntry.status = "partial";
    } else if (logEntry.subscribers_failed > 0 && logEntry.subscribers_ok === 0) {
      logEntry.status = "error";
    }

    // Persist to localStorage
    this.persistLog(logEntry);

    // Also keep in-memory for DevTools
    if (typeof window !== "undefined") {
      if (!(window as any).__erpEventBusLogs) {
        (window as any).__erpEventBusLogs = [];
      }
      (window as any).__erpEventBusLogs.unshift(logEntry);
      if ((window as any).__erpEventBusLogs.length > MAX_LOGS) {
        (window as any).__erpEventBusLogs.pop();
      }
    }
  }

  private summarizePayload(event: string, payload: any): string {
    try {
      if (event === "ORDER_CREATED") {
        const o = payload.order;
        return `Đơn ${o?.order_number || o?.id} - ${(o?.total || 0).toLocaleString()}đ - ${(payload.items || o?.order_items || []).length} SP`;
      }
      if (event === "PAYMENT_RECORDED") {
        const t = payload.transaction;
        return `${t?.transaction_type} - ${(t?.amount || 0).toLocaleString()}đ - ${t?.payment_method || "N/A"}`;
      }
      if (event === "CONTRACT_SIGNED") {
        return `Hợp đồng ${payload.contract?.contract_number || payload.contract?.id}`;
      }
      return JSON.stringify(payload).substring(0, 120);
    } catch {
      return "[payload error]";
    }
  }

  private persistLog(entry: EventBusLogEntry) {
    try {
      const raw = localStorage.getItem(EVENT_BUS_LOGS_KEY);
      const logs: EventBusLogEntry[] = raw ? JSON.parse(raw) : [];
      logs.unshift(entry);
      if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
      localStorage.setItem(EVENT_BUS_LOGS_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error("[EventBus] Failed to persist log:", e);
    }
  }

  /** Read persisted logs */
  getPersistedLogs(): EventBusLogEntry[] {
    try {
      const raw = localStorage.getItem(EVENT_BUS_LOGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Clear all persisted logs */
  clearLogs() {
    localStorage.removeItem(EVENT_BUS_LOGS_KEY);
    if (typeof window !== "undefined") {
      (window as any).__erpEventBusLogs = [];
    }
  }

  /** Get registered subscriber info for diagnostics */
  getSubscriberInfo(): Record<string, string[]> {
    const info: Record<string, string[]> = {};
    for (const [event, subs] of Object.entries(this.subscribers)) {
      info[event] = subs.map(s => s.name);
    }
    return info;
  }
}

export const erpEventBus = new ErpEventBus();
if (typeof window !== "undefined") {
  (window as any).erpEventBus = erpEventBus;
}

// --- Helper: BOM-based COGS calculation ---
function calculateOrderCOGS(order: any): number {
  const orderItems = order.order_items || [];
  if (orderItems.length === 0) {
    return Math.round(Number(order.total || 0) * 0.47);
  }
  const rawProducts = localStorage.getItem("erp-mini-local-demo-products");
  const products = rawProducts ? JSON.parse(rawProducts) : [];
  return Math.round(orderItems.reduce((sum: number, item: any) => {
    const bomItems = getLocalProductBom(item.product_id);
    if (bomItems && bomItems.length > 0) {
      const bomCost = bomItems.reduce((bs: number, b: any) => bs + ((b.material?.cost_price || 0) * b.quantity), 0);
      return sum + bomCost * (item.quantity || 1);
    }
    const prod = products.find((p: any) => p.id === item.product_id);
    return sum + ((prod?.cost_price || item.products?.cost_price || 0) * (item.quantity || 1));
  }, 0));
}

// --- Local Demo Mode Handler Registrations ---

if (typeof window !== "undefined") {

  // 1. Inventory Handler
  erpEventBus.subscribe("ORDER_CREATED", (payload) => {
    if (!isLocalDemoAuthEnabled()) return;
    const { order, items } = payload;
    const orderItems = items || order.order_items || [];
    const orderNumber = order.order_number || order.id;

    for (const item of orderItems) {
      if (!item.product_id) continue;
      try {
        const bomItems = getLocalProductBom(item.product_id);
        if (bomItems && bomItems.length > 0) {
          for (const bomItem of bomItems) {
            createLocalInventoryTransaction({
              product_id: bomItem.material_id,
              transaction_type: "out",
              quantity: bomItem.quantity * (item.quantity || 1),
              notes: `Trừ vật tư ${bomItem.material?.name || bomItem.material_id} cho đơn hàng ${orderNumber}`,
            });
          }
        } else {
          createLocalInventoryTransaction({
            product_id: item.product_id,
            transaction_type: "out",
            quantity: item.quantity || 1,
            notes: `Trừ tồn kho - Đơn hàng ${orderNumber}`,
          });
        }
      } catch (err: any) {
        console.warn(`[EventBus-Inventory] Không thể trừ tồn kho cho ${item.product_id}:`, err);
        throw new Error(`Inventory deduction failed for ${item.product_id}: ${err?.message}`);
      }
    }

    // Audit log
    logLocalAction("EventBus: Trừ kho theo đơn hàng", "inventory_transactions", order.id,
      null, { orderNumber, items_count: orderItems.length });
  }, "InventoryHandler");

  // Helper for Accounting Store
  const ACCOUNTS_KEY = "erp-mini-local-demo-accounts";
  const ENTRIES_KEY = "erp-mini-local-demo-journal-entries";
  const LINES_KEY = "erp-mini-local-demo-journal-lines";

  const getLocalAccounts = (companyId: string): any[] => {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };

  const getLocalEntries = (): any[] => {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };

  const getLocalLines = (): any[] => {
    const raw = localStorage.getItem(LINES_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };

  const saveLocalAccountingData = (accounts: any[], entries: any[], lines: any[]) => {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    localStorage.setItem(LINES_KEY, JSON.stringify(lines));
  };

  // 2. Accounting Handler
  erpEventBus.subscribe("ORDER_CREATED", (payload) => {
    if (!isLocalDemoAuthEnabled()) return;
    const { order } = payload;
    const companyId = order.company_id || "local-demo-company";
    const orderNum = order.order_number || order.id;
    const entryDate = (order.created_at || new Date().toISOString()).split("T")[0];
    const orderTotal = Number(order.total || 0);

    const accounts = getLocalAccounts(companyId);
    if (accounts.length === 0) return; // Not initialized yet

    const entries = getLocalEntries();
    const lines = getLocalLines();

    // Determine debit account based on payment method
    const isMembershipWallet = order.payment_method === "membership_wallet";
    const salesDrAccId = isMembershipWallet ? "acc-3387" : "acc-131";
    const salesDrAccCode = isMembershipWallet ? "3387" : "131";
    const salesDrMemo = isMembershipWallet
      ? `Trừ ví thành viên đơn ${orderNum}`
      : `Ghi nhận phải thu đơn ${orderNum}`;

    // Sales Entry
    const salesEntryId = `ent-sales-${order.id}-${Date.now()}`;
    const salesEntry = {
      id: salesEntryId,
      company_id: companyId,
      entry_date: entryDate,
      description: isMembershipWallet
        ? `Doanh thu đơn ${orderNum} (thanh toán ví thành viên)`
        : `Doanh thu đơn hàng ${orderNum}`,
      status: "posted",
      source_type: "order",
      source_id: order.id,
      created_by: "system",
      posted_by: "system",
      created_at: order.created_at || new Date().toISOString(),
      updated_at: order.updated_at || new Date().toISOString()
    };

    const salesLines = [
      {
        id: `line-sales-dr-${order.id}-${Date.now()}`,
        entry_id: salesEntryId,
        account_id: salesDrAccId,
        debit: orderTotal,
        credit: 0,
        memo: salesDrMemo,
        created_at: order.created_at || new Date().toISOString()
      },
      {
        id: `line-sales-cr-${order.id}-${Date.now()}`,
        entry_id: salesEntryId,
        account_id: "acc-511", // Doanh thu bán hàng
        debit: 0,
        credit: orderTotal,
        memo: `Doanh thu bán hàng đơn ${orderNum}`,
        created_at: order.created_at || new Date().toISOString()
      }
    ];

    entries.unshift(salesEntry);
    lines.push(...salesLines);

    // COGS Entry — BOM-based calculation
    const costAmount = calculateOrderCOGS(order);
    if (costAmount > 0) {
      const cogsEntryId = `ent-cogs-${order.id}-${Date.now()}`;
      const cogsEntry = {
        id: cogsEntryId,
        company_id: companyId,
        entry_date: entryDate,
        description: `Giá vốn đơn hàng ${orderNum}`,
        status: "posted",
        source_type: "order",
        source_id: order.id,
        created_by: "system",
        posted_by: "system",
        created_at: order.created_at || new Date().toISOString(),
        updated_at: order.updated_at || new Date().toISOString()
      };

      const cogsLines = [
        {
          id: `line-cogs-dr-${order.id}-${Date.now()}`,
          entry_id: cogsEntryId,
          account_id: "acc-632", // Giá vốn bán hàng
          debit: costAmount,
          credit: 0,
          memo: `Ghi nhận giá vốn đơn ${orderNum}`,
          created_at: order.created_at || new Date().toISOString()
        },
        {
          id: `line-cogs-cr-${order.id}-${Date.now()}`,
          entry_id: cogsEntryId,
          account_id: "acc-156", // Hàng hóa
          debit: 0,
          credit: costAmount,
          memo: `Xuất kho hàng hóa đơn ${orderNum}`,
          created_at: order.created_at || new Date().toISOString()
        }
      ];

      entries.unshift(cogsEntry);
      lines.push(...cogsLines);
    }

    // Update balances
    accounts.forEach((acc: any) => {
      if (acc.code === salesDrAccCode) {
        // For membership wallet (3387 liability): debit decreases balance
        // For receivable (131 asset): debit increases balance
        if (isMembershipWallet) {
          acc.balance = (acc.balance || 0) - orderTotal;
        } else {
          acc.balance = (acc.balance || 0) + orderTotal;
        }
      } else if (acc.code === "511") {
        acc.balance = (acc.balance || 0) + orderTotal;
      } else if (acc.code === "632") {
        acc.balance = (acc.balance || 0) + costAmount;
      } else if (acc.code === "156") {
        acc.balance = (acc.balance || 0) - costAmount;
      }
    });

    saveLocalAccountingData(accounts, entries, lines);

    // Audit log
    logLocalAction("EventBus: Ghi bút toán tự động", "journal_entries", salesEntryId,
      null, { orderNum, revenue: orderTotal, cogs: costAmount });
  }, "AccountingHandler");

  erpEventBus.subscribe("PAYMENT_RECORDED", (payload) => {
    if (!isLocalDemoAuthEnabled()) return;
    const { transaction } = payload;
    if (
      transaction.transaction_type !== "payment_in" &&
      transaction.transaction_type !== "receivable" &&
      transaction.transaction_type !== "payment_out"
    ) {
      return;
    }

    const companyId = transaction.company_id || "local-demo-company";
    const entryDate = (transaction.transaction_date || new Date().toISOString()).split("T")[0];
    const txAmount = Number(transaction.amount || 0);

    const accounts = getLocalAccounts(companyId);
    if (accounts.length === 0) return;

    const entries = getLocalEntries();
    const lines = getLocalLines();

    const isMemberWallet = transaction.payment_method === "membership_wallet";
    const isBank = transaction.payment_method === "vietqr" || transaction.payment_method === "bank_transfer";
    const payAccCode = isMemberWallet ? "3387" : (isBank ? "1121" : "1111");
    const payAccId = isMemberWallet ? "acc-3387" : (isBank ? "acc-1121" : "acc-1111");
    const payMethodName = isMemberWallet ? "ví thành viên" : (isBank ? "tiền gửi ngân hàng" : "tiền mặt");

    const entryId = `ent-pay-${transaction.id}-${Date.now()}`;

    if (transaction.transaction_type === "payment_out") {
      const partners = getLocalPartners();
      const partner = partners.find((p: any) => p.id === transaction.partner_id);
      const isSupplier = (transaction.partner_id && transaction.partner_id.includes("supplier")) || (partner && partner.partner_type === "supplier");
      const isCapex = transaction.notes && transaction.notes.toLowerCase().includes("capex");
      const isEmployeeAdvance = (transaction.partner_id && (transaction.partner_id.includes("employee") || transaction.partner_id.includes("emp-"))) || 
                                (partner && partner.partner_type === "employee") || 
                                (transaction.notes && (transaction.notes.toLowerCase().includes("tạm ứng") || transaction.notes.toLowerCase().includes("ứng tiền") || transaction.notes.toLowerCase().includes("advance")));

      const drAccId = isCapex ? "acc-211" : (isEmployeeAdvance ? "acc-141" : (isSupplier ? "acc-331" : "acc-642"));
      const drAccCode = isCapex ? "211" : (isEmployeeAdvance ? "141" : (isSupplier ? "331" : "642"));

      const paymentEntry = {
        id: entryId,
        company_id: companyId,
        entry_date: entryDate,
        description: transaction.notes || `Chi tiền thanh toán (giao dịch ${transaction.id})`,
        status: "posted",
        source_type: "payment",
        source_id: transaction.id,
        created_by: "system",
        posted_by: "system",
        created_at: transaction.created_at || new Date().toISOString(),
        updated_at: transaction.created_at || new Date().toISOString()
      };

      const paymentLines = [
        {
          id: `line-payout-dr-${transaction.id}-${Date.now()}`,
          entry_id: entryId,
          account_id: drAccId,
          debit: txAmount,
          credit: 0,
          memo: transaction.notes || `Chi phí hạch toán`,
          created_at: transaction.created_at || new Date().toISOString()
        },
        {
          id: `line-payout-cr-${transaction.id}-${Date.now()}`,
          entry_id: entryId,
          account_id: payAccId,
          debit: 0,
          credit: txAmount,
          memo: `Chi tiền bằng ${payMethodName}`,
          created_at: transaction.created_at || new Date().toISOString()
        }
      ];

      entries.unshift(paymentEntry);
      lines.push(...paymentLines);

      // Update balances
      accounts.forEach((acc: any) => {
        if (acc.code === payAccCode) {
          acc.balance = (acc.balance || 0) - txAmount;
        } else if (acc.code === drAccCode) {
          if (drAccCode === "331") {
            acc.balance = (acc.balance || 0) - txAmount;
          } else {
            acc.balance = (acc.balance || 0) + txAmount;
          }
        }
      });
    } else {
      const partners = getLocalPartners();
      const partner = partners.find((p: any) => p.id === transaction.partner_id);
      const isEmployeeRefund = (transaction.partner_id && (transaction.partner_id.includes("employee") || transaction.partner_id.includes("emp-"))) || 
                               (partner && partner.partner_type === "employee") || 
                               (transaction.notes && (transaction.notes.toLowerCase().includes("hoàn ứng") || transaction.notes.toLowerCase().includes("hoàn trả") || transaction.notes.toLowerCase().includes("repay") || transaction.notes.toLowerCase().includes("refund")));

      const crAccId = isEmployeeRefund ? "acc-141" : "acc-131";
      const crAccCode = isEmployeeRefund ? "141" : "131";

      const paymentEntry = {
        id: entryId,
        company_id: companyId,
        entry_date: entryDate,
        description: transaction.notes || `Thu tiền khách hàng (giao dịch ${transaction.id})`,
        status: "posted",
        source_type: "payment",
        source_id: transaction.id,
        created_by: "system",
        posted_by: "system",
        created_at: transaction.created_at || new Date().toISOString(),
        updated_at: transaction.created_at || new Date().toISOString()
      };

      const paymentLines = [
        {
          id: `line-payin-dr-${transaction.id}-${Date.now()}`,
          entry_id: entryId,
          account_id: payAccId,
          debit: txAmount,
          credit: 0,
          memo: transaction.notes || `Thu tiền bằng ${payMethodName}`,
          created_at: transaction.created_at || new Date().toISOString()
        },
        {
          id: `line-payin-cr-${transaction.id}-${Date.now()}`,
          entry_id: entryId,
          account_id: crAccId,
          debit: 0,
          credit: txAmount,
          memo: isEmployeeRefund ? `Giảm tạm ứng từ giao dịch hoàn ứng` : `Giảm phải thu từ giao dịch thu tiền`,
          created_at: transaction.created_at || new Date().toISOString()
        }
      ];

      entries.unshift(paymentEntry);
      lines.push(...paymentLines);

      // Update balances
      accounts.forEach((acc: any) => {
        if (acc.code === payAccCode) {
          acc.balance = (acc.balance || 0) + txAmount;
        } else if (acc.code === crAccCode) {
          acc.balance = (acc.balance || 0) - txAmount;
        }
      });
    }

    saveLocalAccountingData(accounts, entries, lines);

    // Audit log
    logLocalAction("EventBus: Ghi bút toán thanh toán", "journal_entries", entryId,
      null, { type: transaction.transaction_type, amount: txAmount, method: transaction.payment_method });
  }, "PaymentAccountingHandler");

  // Helper for Partners
  const PARTNERS_KEY = "erp-mini-local-demo-partners";

  const getLocalPartners = (): any[] => {
    const raw = localStorage.getItem(PARTNERS_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };

  const saveLocalPartners = (partners: any[]) => {
    localStorage.setItem(PARTNERS_KEY, JSON.stringify(partners));
  };

  // 3. Partner Debt Handler
  erpEventBus.subscribe("ORDER_CREATED", (payload) => {
    if (!isLocalDemoAuthEnabled()) return;
    const { order } = payload;
    if (!order.partner_id) return;

    const partners = getLocalPartners();
    const partnerIdx = partners.findIndex((p: any) => p.id === order.partner_id);
    if (partnerIdx > -1) {
      const orderTotal = Number(order.total || 0);
      partners[partnerIdx].debt_amount = (partners[partnerIdx].debt_amount || 0) + orderTotal;
      partners[partnerIdx].total_spent = (partners[partnerIdx].total_spent || 0) + orderTotal;
      saveLocalPartners(partners);
    }
  }, "PartnerDebtHandler");

  erpEventBus.subscribe("PAYMENT_RECORDED", (payload) => {
    if (!isLocalDemoAuthEnabled()) return;
    const { transaction } = payload;
    if (!transaction.partner_id) return;
    if (
      transaction.transaction_type !== "payment_in" &&
      transaction.transaction_type !== "receivable" &&
      transaction.transaction_type !== "payment_out"
    ) {
      return;
    }

    const partners = getLocalPartners();
    const partnerIdx = partners.findIndex((p: any) => p.id === transaction.partner_id);
    if (partnerIdx > -1) {
      const txAmount = Number(transaction.amount || 0);
      partners[partnerIdx].debt_amount = Math.max(0, (partners[partnerIdx].debt_amount || 0) - txAmount);
      saveLocalPartners(partners);
    }
  }, "PartnerPaymentHandler");

  // 4. Contract-to-Order Handler
  erpEventBus.subscribe("CONTRACT_SIGNED", (payload) => {
    if (!isLocalDemoAuthEnabled()) return;
    const { contract, companyId } = payload;

    const ORDERS_KEY = "erp-mini-local-demo-orders";
    const localOrdersRaw = localStorage.getItem(ORDERS_KEY) || "[]";
    const localOrders = JSON.parse(localOrdersRaw);

    const productsRaw = localStorage.getItem("erp-mini-local-demo-products") || "[]";
    const products = JSON.parse(productsRaw);
    const finishedProd = products.find((p: any) => p.sku === "SP001") || products[0];

    const partnersRaw = localStorage.getItem("erp-mini-local-demo-partners") || "[]";
    const partners = JSON.parse(partnersRaw);
    const distPartner = partners.find((p: any) => p.id === contract.partner_id) || partners.find((p: any) => p.name.includes("Nhà phân phối miền Nam")) || partners[0];

    const channelsRaw = localStorage.getItem("erp-mini-local-demo-sales-channels") || "[]";
    const channels = JSON.parse(channelsRaw);
    const retailChannel = channels.find((c: any) => c.platform_type === "vieterp") || channels[0];

    const orderId = `ord-${Date.now()}`;
    
    const orderItems = finishedProd ? [{
      id: `item-${Date.now()}`,
      order_id: orderId,
      product_id: finishedProd.id,
      quantity: 30,
      unit_price: 120000,
      total: 3600000,
      discount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      products: {
        id: finishedProd.id,
        sku: finishedProd.sku,
        name: finishedProd.name,
        cost_price: finishedProd.cost_price || 100000,
        selling_price: finishedProd.selling_price || 150000,
        stock_quantity: finishedProd.stock_quantity || 190,
        unit: finishedProd.unit || "Cái",
      }
    }] : [];

    const newOrder = {
      id: orderId,
      company_id: companyId,
      order_number: `ORD-${Date.now().toString().slice(-6)}`,
      customer_name: distPartner ? distPartner.name : "Nhà phân phối miền Nam",
      customer_phone: distPartner ? distPartner.phone : "0900000000",
      shipping_address: distPartner ? distPartner.address : "Hồ Chí Minh",
      payment_method: "Ghi nợ",
      payment_status: "pending",
      status: "pending",
      total: 3600000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      channel_id: retailChannel ? retailChannel.id : null,
      warehouse_id: null,
      notes: `Tạo từ hợp đồng ${contract.contract_number}`,
      discount: 0,
      shipping_fee: 0,
      order_items: orderItems,
      partner_id: contract.partner_id || (distPartner ? distPartner.id : null),
    };

    localStorage.setItem(ORDERS_KEY, JSON.stringify([newOrder, ...localOrders]));

    // Audit log
    logLocalAction("EventBus: Tạo đơn hàng từ hợp đồng", "orders", orderId,
      null, { contract_number: contract.contract_number, total: 3600000 });

    // Publish ORDER_CREATED event
    erpEventBus.publish("ORDER_CREATED", { order: newOrder, items: orderItems });
  }, "ContractToOrderHandler");

  // 4. Stock Journal Entries Auto Posting
  erpEventBus.subscribe("STOCK_TRANSACTION_RECORDED", (payload) => {
    if (!isLocalDemoAuthEnabled()) return;

    const { transaction, product } = payload;
    const companyId = product.company_id || "local-demo-company";
    const entryDate = (transaction.created_at || new Date().toISOString()).split("T")[0];
    
    const costPrice = Number(product.cost_price || 0);
    const quantity = Math.abs(Number(transaction.quantity || 0));
    const txAmount = quantity * costPrice;
    if (txAmount <= 0) return;

    const accounts = getLocalAccounts(companyId);
    if (accounts.length === 0) return;

    const entries = getLocalEntries();
    const lines = getLocalLines();

    const entryId = `ent-stock-${transaction.id}-${Date.now()}`;
    const isInput = transaction.transaction_type === "in";

    const stockEntry = {
      id: entryId,
      company_id: companyId,
      entry_date: entryDate,
      description: transaction.notes || `${isInput ? "Nhập kho" : "Xuất kho"} vật tư ${product.name} (SL: ${quantity})`,
      status: "posted",
      source_type: "inventory",
      source_id: transaction.id,
      created_by: "system",
      posted_by: "system",
      created_at: transaction.created_at || new Date().toISOString(),
      updated_at: transaction.created_at || new Date().toISOString()
    };

    const drAccId = isInput ? "acc-156" : "acc-632";
    const drAccCode = isInput ? "156" : "632";
    const crAccId = isInput ? "acc-331" : "acc-156";
    const crAccCode = isInput ? "331" : "156";

    const stockLines = [
      {
        id: `line-stock-dr-${transaction.id}-${Date.now()}`,
        entry_id: entryId,
        account_id: drAccId,
        debit: txAmount,
        credit: 0,
        memo: isInput ? "Tăng giá trị hàng tồn kho" : "Ghi nhận giá vốn hàng bán",
        created_at: transaction.created_at || new Date().toISOString()
      },
      {
        id: `line-stock-cr-${transaction.id}-${Date.now()}`,
        entry_id: entryId,
        account_id: crAccId,
        debit: 0,
        credit: txAmount,
        memo: isInput ? "Tăng phải trả người bán" : "Giảm giá trị hàng tồn kho",
        created_at: transaction.created_at || new Date().toISOString()
      }
    ];

    entries.unshift(stockEntry);
    lines.push(...stockLines);

    // Update balances
    accounts.forEach((acc: any) => {
      if (acc.code === drAccCode) {
        if (drAccCode === "331") {
          acc.balance = (acc.balance || 0) - txAmount;
        } else {
          acc.balance = (acc.balance || 0) + txAmount;
        }
      }
      if (acc.code === crAccCode) {
        if (crAccCode === "331") {
          acc.balance = (acc.balance || 0) - txAmount;
        } else {
          acc.balance = (acc.balance || 0) - txAmount;
        }
      }
    });

    saveLocalAccountingData(accounts, entries, lines);

    // Audit log
    logLocalAction("EventBus: Ghi bút toán kho", "journal_entries", entryId,
      null, { type: transaction.transaction_type, amount: txAmount, product_id: product.id });
  }, "StockAccountingHandler");
}

