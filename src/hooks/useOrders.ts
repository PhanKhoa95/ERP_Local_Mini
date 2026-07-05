import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { createLocalInventoryTransaction, logLocalAction } from "@/lib/localInventoryStore";
import { invalidateOrderRelated } from "@/lib/queryInvalidation";
import { getLocalPartners, saveLocalPartners, serializePartnerMetadata, parsePartnerMetadata, type Partner } from "./usePartners";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { checkPlanLimit } from "@/lib/saasLimits";
import { toast } from "sonner";
import { erpEventBus } from "@/lib/erpEventBus";

function triggerAutoMessageForStatusChange(order: Order, newStatus: string) {
  if (typeof window === "undefined") return;

  const triggerStatusMap: Record<string, string> = {
    pending: "Mới",
    confirmed: "Xác nhận đơn hàng",
    packing: "Đang đóng hàng",
    shipping: "Gửi hàng đi",
  };

  const triggerStatus = triggerStatusMap[newStatus];
  if (!triggerStatus) return;

  try {
    const rawTemplates = localStorage.getItem("erp-mini-auto-messages-templates");
    const templates = rawTemplates ? JSON.parse(rawTemplates) : [
      {
        id: "tpl-1",
        name: "Thông báo tạo đơn thành công",
        triggerStatus: "Xác nhận đơn hàng",
        source: "Tất cả",
        carrier: "Tất cả",
        content: "Chào {customer_name}, đơn hàng {order_number} của bạn đã được xác nhận. Tổng tiền: {total_amount}đ. Cảm ơn bạn đã mua sắm!",
        isActive: true
      },
      {
        id: "tpl-2",
        name: "Thông báo đang giao hàng",
        triggerStatus: "Gửi hàng đi",
        source: "Shopee",
        carrier: "Giao Hàng Tiết Kiệm",
        content: "Đơn hàng {order_number} đang được vận chuyển qua GHTK. Mã vận đơn của bạn: {tracking_number}. Theo dõi hành trình đơn tại link sau: {tracking_url}",
        isActive: true
      }
    ];

    const matchingTemplate = templates.find((t: any) => t.isActive && t.triggerStatus === triggerStatus);
    if (!matchingTemplate) return;

    let content = matchingTemplate.content;
    const orderNum = order.order_number || "";
    const customerName = order.customer_name || "Khách hàng";
    const totalVal = Number(order.total || 0).toLocaleString("vi-VN");
    const trackingCode = (order as any).tracking_code || order.platform_order_id || "VN-SHIP-992";
    const carrierName = "Giao Hàng Tiết Kiệm";
    const trackingUrl = `https://pancake.express/track/${trackingCode}`;
    const productsList = order.order_items?.map((i: any) => (i.products?.name || "Sản phẩm") + " x" + i.quantity).join(", ") || "";
    const shippingFee = Number(order.shipping_fee || 0).toLocaleString("vi-VN");
    const discount = Number(order.discount || 0).toLocaleString("vi-VN");
    const prepaid = Number((order as any).prepaid_amount || 0).toLocaleString("vi-VN");
    const cod = Number((order as any).cod_amount || 0).toLocaleString("vi-VN");
    const expectedDate = (order as any).expected_delivery_date || "";

    content = content
      .replace(/{customer_name}/g, customerName)
      .replace(/{order_number}/g, orderNum)
      .replace(/{total_amount}/g, totalVal)
      .replace(/{tracking_number}/g, trackingCode)
      .replace(/{tracking_url}/g, trackingUrl)
      .replace(/{products}/g, productsList)
      .replace(/{shipping_fee}/g, shippingFee)
      .replace(/{discount}/g, discount)
      .replace(/{prepaid_amount}/g, prepaid)
      .replace(/{cod_amount}/g, cod)
      .replace(/{expected_delivery_date}/g, expectedDate)
      .replace(/{carrier_name}/g, carrierName);

    const rawConvs = localStorage.getItem("erp-mini-cskh-conversations");
    if (rawConvs) {
      const conversations = JSON.parse(rawConvs);
      const targetPhone = order.customer_phone || "";
      const targetName = order.customer_name || "";
      
      let convIndex = conversations.findIndex((c: any) => c.customerPhone === targetPhone && targetPhone !== "");
      if (convIndex === -1 && targetName !== "") {
        convIndex = conversations.findIndex((c: any) => c.customerName === targetName);
      }

      if (convIndex !== -1) {
        const newMsg = {
          id: "bot-msg-" + Date.now(),
          sender: "bot" as const,
          content,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          status: "sent" as const
        };
        conversations[convIndex].messages.push(newMsg);
        conversations[convIndex].lastMessageTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        
        localStorage.setItem("erp-mini-cskh-conversations", JSON.stringify(conversations));
        window.dispatchEvent(new Event("storage"));
        toast.success(`Đã gửi tin nhắn tự động: "${matchingTemplate.name}"`);
      }
    }
  } catch (err) {
    console.error("Failed to trigger automated message:", err);
  }
}

function scheduleBuybackReminders(order: Order) {
  if (typeof window === "undefined") return;
  try {
    const rawLifecycles = localStorage.getItem("erp-mini-product-lifecycles");
    if (!rawLifecycles) return;
    const lifecycles = JSON.parse(rawLifecycles);

    const items = order.order_items || [];
    if (items.length === 0) return;

    const rawReminders = localStorage.getItem("erp-mini-scheduled-reminders");
    const reminders = rawReminders ? JSON.parse(rawReminders) : [];

    let scheduledCount = 0;
    items.forEach((item: any) => {
      const pId = item.product_id;
      if (!pId) return;

      const lc = lifecycles.find((l: any) => l.productId === pId && l.isActive);
      if (lc) {
        const durationDays = Number(lc.durationDays || 30);
        const leadTimeDays = Number(lc.leadTimeDays || 3);
        const daysToRemind = durationDays - leadTimeDays;
        
        const remindDate = new Date();
        remindDate.setDate(remindDate.getDate() + (daysToRemind > 0 ? daysToRemind : 1));

        const newRem = {
          id: "rem-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
          orderId: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name || "Khách hàng",
          customerPhone: order.customer_phone || "",
          productId: pId,
          productName: item.products?.name || lc.productName || "Sản phẩm",
          remindDate: remindDate.toISOString(),
          status: "pending" as const
        };
        reminders.push(newRem);
        scheduledCount++;
      }
    });

    if (scheduledCount > 0) {
      localStorage.setItem("erp-mini-scheduled-reminders", JSON.stringify(reminders));
      toast.success(`Đã lên lịch nhắc mua lại tự động cho ${scheduledCount} sản phẩm tiêu hao!`);
    }
  } catch (err) {
    console.error("Failed to schedule buyback reminders:", err);
  }
}

async function updatePartnerPoints(companyId: string, partnerId: string | null, usedPoints: number, orderTotal: number) {
  if (!partnerId) return;

  let isEnabled = true;
  let pointRatioMoney = 10000;
  let pointRatioPoints = 1;

  if (isLocalDemoAuthEnabled()) {
    const rawSettings = localStorage.getItem("erp-mini-loyalty-settings");
    if (rawSettings) {
      const settings = JSON.parse(rawSettings);
      isEnabled = settings.is_enabled;
      pointRatioMoney = settings.point_ratio_money;
      pointRatioPoints = settings.point_ratio_points;
    }
  }

  const pointsEarned = isEnabled ? Math.floor(orderTotal / pointRatioMoney) * pointRatioPoints : 0;
  
  if (isLocalDemoAuthEnabled()) {
    const partners = getLocalPartners(companyId);
    const idx = partners.findIndex(p => p.id === partnerId);
    if (idx !== -1) {
      const p = partners[idx];
      const currentPoints = p.loyalty_points || 0;
      const nextPoints = Math.max(0, currentPoints - usedPoints + pointsEarned);
      const nextSpent = (p.total_spent || 0) + orderTotal;
      const lifetimePoints = Math.floor(nextSpent / 100000);
      
      let promo_segment = p.promo_segment;
      if (lifetimePoints >= 300) {
        promo_segment = "loyalty"; 
      }
      
      partners[idx] = {
        ...p,
        loyalty_points: nextPoints,
        total_spent: nextSpent,
        promo_segment,
      };
      saveLocalPartners(partners);

      const txsRaw = localStorage.getItem("erp-mini-loyalty-transactions");
      const txs = txsRaw ? JSON.parse(txsRaw) : [];
      
      if (usedPoints > 0) {
        txs.unshift({
          id: `tx-${Math.random().toString(36).substr(2, 9)}`,
          partner_id: partnerId,
          order_id: null,
          points: -usedPoints,
          transaction_type: "redeem",
          notes: "Tiêu điểm tại đơn hàng",
          created_at: new Date().toISOString()
        });
      }
      
      if (pointsEarned > 0) {
        txs.unshift({
          id: `tx-${Math.random().toString(36).substr(2, 9)}`,
          partner_id: partnerId,
          order_id: null,
          points: pointsEarned,
          transaction_type: "earn",
          notes: "Tích điểm đơn hàng",
          created_at: new Date().toISOString()
        });
      }
      
      localStorage.setItem("erp-mini-loyalty-transactions", JSON.stringify(txs));
    }
  } else {
    try {
      const { data: partner } = await supabase.from("partners").select("*").eq("id", partnerId).single();
      if (partner) {
        const p = parsePartnerMetadata(partner);
        const currentPoints = p.loyalty_points || 0;
        const nextPoints = Math.max(0, currentPoints - usedPoints + pointsEarned);
        const nextSpent = (p.total_spent || 0) + orderTotal;
        const lifetimePoints = Math.floor(nextSpent / 100000);
        
        let promo_segment = p.promo_segment;
        if (lifetimePoints >= 300) {
          promo_segment = "loyalty";
        }
        
        const serialized = serializePartnerMetadata({
          ...p,
          loyalty_points: nextPoints,
          total_spent: nextSpent,
          promo_segment,
        });
        
        await supabase.from("partners").update(serialized).eq("id", partnerId);
      }
    } catch (err) {
      console.warn("Failed to update partner loyalty points in Supabase:", err);
    }
  }
}

async function rewardReferrer(companyId: string, referrerId: string | null, refereeName: string, refereeId: string | null) {
  if (!referrerId) return;
  
  let rewardPoints = 50;
  if (isLocalDemoAuthEnabled()) {
    const rawSettings = localStorage.getItem("erp-mini-referral-settings");
    if (rawSettings) {
      const settings = JSON.parse(rawSettings);
      rewardPoints = settings.referrer_reward_points;
    }
  }

  if (isLocalDemoAuthEnabled()) {
    const partners = getLocalPartners(companyId);
    const idx = partners.findIndex(p => p.id === referrerId);
    if (idx !== -1) {
      const p = partners[idx];
      partners[idx] = {
        ...p,
        loyalty_points: (p.loyalty_points || 0) + rewardPoints,
      };
      
      // Update referred_by_id on the referee
      const refereeIdx = partners.findIndex(p => p.id === refereeId);
      if (refereeIdx !== -1) {
        partners[refereeIdx] = {
          ...partners[refereeIdx],
          referred_by_id: referrerId
        };
      }
      
      saveLocalPartners(partners);

      const txsRaw = localStorage.getItem("erp-mini-loyalty-transactions");
      const txs = txsRaw ? JSON.parse(txsRaw) : [];
      txs.unshift({
        id: `tx-${Math.random().toString(36).substr(2, 9)}`,
        partner_id: referrerId,
        order_id: null,
        points: rewardPoints,
        transaction_type: "earn",
        notes: `Thưởng giới thiệu khách hàng mới ${refereeName}`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem("erp-mini-loyalty-transactions", JSON.stringify(txs));

      const rawNotes = localStorage.getItem("erp-mini-local-demo-partner-notes");
      const notes = rawNotes ? JSON.parse(rawNotes) : [];
      const newNote = {
        id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        partner_id: referrerId,
        note_type: "general",
        content: `[GIỚI THIỆU KHÁCH MỚI] Giới thiệu thành công khách hàng mới ${refereeName} (ID: ${refereeId || "N/A"}) mua đơn hàng đầu tiên. Hệ thống tự động thưởng +${rewardPoints} điểm tích lũy!`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      notes.unshift(newNote);
      localStorage.setItem("erp-mini-local-demo-partner-notes", JSON.stringify(notes));
    }
  } else {
    try {
      const { data: partner } = await supabase.from("partners").select("*").eq("id", referrerId).single();
      if (partner) {
        const p = parsePartnerMetadata(partner);
        const serialized = serializePartnerMetadata({
          ...p,
          loyalty_points: (p.loyalty_points || 0) + rewardPoints,
        });
        await supabase.from("partners").update(serialized).eq("id", referrerId);

        // Update referred_by_id on the referee
        if (refereeId) {
          await supabase.from("partners").update({ referred_by_id: referrerId }).eq("id", refereeId);
        }

        await supabase.from("partner_notes").insert({
          partner_id: referrerId,
          note_type: "general",
          content: `[GIỚI THIỆU KHÁCH MỚI] Giới thiệu thành công khách hàng mới ${refereeName} mua đơn hàng đầu tiên. Hệ thống tự động thưởng +${rewardPoints} điểm tích lũy!`,
        });
      }
    } catch (err) {
      console.warn("Failed to reward referrer in Supabase mode:", err);
    }
  }
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  total_price?: number;
  total?: number;
  products?: {
    id: string;
    name: string;
    sku: string | null;
    price?: number;
    is_service?: boolean;
  } | null;
}

export interface Order {
  id: string;
  company_id?: string | null;
  order_number: string;
  status: "pending" | "confirmed" | "processing" | "shipping" | "delivered" | "cancelled" | "returned" | "duplicate" | "waiting_goods" | "priority_ship" | "waiting_print" | "printed" | "ordered" | "packing" | "waiting_transfer" | "deleted" | "returned_partial" | "exchanging";
  total?: number | null;
  discount?: number | null;
  shipping_fee?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  shipping_address?: string | null;
  shipping_province?: string | null;
  shipping_district?: string | null;
  shipping_ward?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  priority?: string;
  source_type: string;
  order_type?: string | null;
  platform_order_id?: string | null;
  partner_id?: string | null;
  channel_id?: string | null;
  delivered_at?: string | null;
  notes?: string | null;
  subtotal?: number | null;
  paid_amount?: number | null;
  warehouse_id?: string | null;
  shipping_zone_id?: string | null;
  voucher_id?: string | null;
  created_at: string;
  updated_at: string;
  tags?: string | null;
  assigned_to_name?: string | null;
  fulfillment_type?: string | null;
  sales_channels?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  partners?: {
    id: string;
    name: string;
  } | null;
  order_items?: OrderItem[];
  referrer_id?: string | null;
  referral_discount?: number | null;
}

const LOCAL_ORDERS_KEY = "erp-mini-local-demo-orders";

function getLocalOrders(companyId: string): Order[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
  if (!raw) {
    const subMonthsDate = (months: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      return d.toISOString();
    };

    const defaultOrders: Order[] = [
      {
        id: "ord-1",
        company_id: companyId,
        order_number: "POS-ORD-001",
        status: "delivered",
        total: 198000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 198000,
        customer_name: "Nguyễn Văn An",
        customer_phone: "0912345678",
        customer_email: "an.nguyen@gmail.com",
        customer_address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
        shipping_address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "pos",
        platform_order_id: null,
        channel_id: "channel-retail",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        order_items: [
          {
            id: "oi-1",
            order_id: "ord-1",
            product_id: "local-prod-sticker",
            quantity: 2,
            unit_price: 99000,
            total_price: 198000,
            products: { id: "local-prod-sticker", name: "Sticker logo decal giấy", sku: "PRD-STICKER" }
          }
        ]
      },
      {
        id: "ord-2",
        company_id: companyId,
        order_number: "ORD-WS-002",
        status: "processing",
        total: 349000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 0,
        customer_name: "Phan Văn Khoa",
        customer_phone: "0987654321",
        customer_email: "khoa.phan@gmail.com",
        customer_address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
        shipping_address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
        payment_method: "cod",
        payment_status: "unpaid",
        priority: "high",
        source_type: "facebook",
        platform_order_id: null,
        channel_id: "channel-facebook",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        order_items: [
          {
            id: "oi-2",
            order_id: "ord-2",
            product_id: "local-prod-combo-new",
            quantity: 1,
            unit_price: 349000,
            total_price: 349000,
            products: { id: "local-prod-combo-new", name: "Combo Shop Mới Khởi Nghiệp", sku: "PRD-COMBO-NEW" }
          }
        ]
      },
      {
        id: "ord-3",
        company_id: companyId,
        order_number: "ORD-WS-003",
        status: "pending",
        total: 540000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 0,
        customer_name: "Trần Thị Bé",
        customer_phone: "0905123456",
        customer_email: "be.tran@gmail.com",
        customer_address: "789 Đường Điện Biên Phủ, Bình Thạnh, TP.HCM",
        shipping_address: "789 Đường Điện Biên Phủ, Bình Thạnh, TP.HCM",
        payment_method: "vietqr",
        payment_status: "unpaid",
        priority: "medium",
        source_type: "shopee",
        platform_order_id: "SHP7732894729",
        channel_id: "channel-shopee",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_items: [
          {
            id: "oi-3",
            order_id: "ord-3",
            product_id: "local-prod-card",
            quantity: 4,
            unit_price: 135000,
            total_price: 540000,
            products: { id: "local-prod-card", name: "Card cảm ơn / Thank you card", sku: "PRD-CARD" }
          }
        ]
      },
      // Historical Orders
      {
        id: "ord-h1",
        company_id: companyId,
        order_number: "HIST-001",
        status: "delivered",
        total: 198000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 198000,
        customer_name: "Nguyễn Văn Hùng",
        customer_phone: "0911222333",
        customer_email: "hung@gmail.com",
        customer_address: "Q1, TP.HCM",
        shipping_address: "Q1, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "pos",
        platform_order_id: null,
        channel_id: "channel-retail",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(5),
        updated_at: subMonthsDate(5),
        order_items: [
          {
            id: "oi-h1",
            order_id: "ord-h1",
            product_id: "local-prod-sticker",
            quantity: 2,
            unit_price: 99000,
            total_price: 198000,
            products: { id: "local-prod-sticker", name: "Sticker logo decal giấy", sku: "PRD-STICKER" }
          }
        ]
      },
      {
        id: "ord-h2",
        company_id: companyId,
        order_number: "HIST-002",
        status: "delivered",
        total: 349000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 349000,
        customer_name: "Trần Thị Lan",
        customer_phone: "0922333444",
        customer_email: "lan@gmail.com",
        customer_address: "Q3, TP.HCM",
        shipping_address: "Q3, TP.HCM",
        payment_method: "cod",
        payment_status: "paid",
        priority: "medium",
        source_type: "zalo",
        platform_order_id: null,
        channel_id: "channel-zalo",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(5),
        updated_at: subMonthsDate(5),
        order_items: [
          {
            id: "oi-h2",
            order_id: "ord-h2",
            product_id: "local-prod-combo-new",
            quantity: 1,
            unit_price: 349000,
            total_price: 349000,
            products: { id: "local-prod-combo-new", name: "Combo Shop Mới Khởi Nghiệp", sku: "PRD-COMBO-NEW" }
          }
        ]
      },
      {
        id: "ord-h3",
        company_id: companyId,
        order_number: "HIST-003",
        status: "delivered",
        total: 540000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 540000,
        customer_name: "Phan Văn Minh",
        customer_phone: "0933444555",
        customer_email: "minh@gmail.com",
        customer_address: "Cầu Giấy, Hà Nội",
        shipping_address: "Cầu Giấy, Hà Nội",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "shopee",
        platform_order_id: "SHP001",
        channel_id: "channel-shopee",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(4),
        updated_at: subMonthsDate(4),
        order_items: [
          {
            id: "oi-h3",
            order_id: "ord-h3",
            product_id: "local-prod-card",
            quantity: 4,
            unit_price: 135000,
            total_price: 540000,
            products: { id: "local-prod-card", name: "Card cảm ơn / Thank you card", sku: "PRD-CARD" }
          }
        ]
      },
      {
        id: "ord-h4",
        company_id: companyId,
        order_number: "HIST-004",
        status: "delivered",
        total: 109000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 109000,
        customer_name: "Lê Thị Thảo",
        customer_phone: "0944555666",
        customer_email: "thao@gmail.com",
        customer_address: "Đống Đa, Hà Nội",
        shipping_address: "Đống Đa, Hà Nội",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "low",
        source_type: "facebook",
        platform_order_id: null,
        channel_id: "channel-facebook",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(4),
        updated_at: subMonthsDate(4),
        order_items: [
          {
            id: "oi-h4",
            order_id: "ord-h4",
            product_id: "local-prod-qr-board",
            quantity: 1,
            unit_price: 109000,
            total_price: 109000,
            products: { id: "local-prod-qr-board", name: "Bảng QR để bàn mica", sku: "PRD-QR-BOARD" }
          }
        ]
      },
      {
        id: "ord-h5",
        company_id: companyId,
        order_number: "HIST-005",
        status: "delivered",
        total: 396000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 396000,
        customer_name: "Hoàng Văn Tuấn",
        customer_phone: "0955666777",
        customer_email: "tuan@gmail.com",
        customer_address: "Q10, TP.HCM",
        shipping_address: "Q10, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "pos",
        platform_order_id: null,
        channel_id: "channel-retail",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(3),
        updated_at: subMonthsDate(3),
        order_items: [
          {
            id: "oi-h5",
            order_id: "ord-h5",
            product_id: "local-prod-sticker",
            quantity: 4,
            unit_price: 99000,
            total_price: 396000,
            products: { id: "local-prod-sticker", name: "Sticker logo decal giấy", sku: "PRD-STICKER" }
          }
        ]
      },
      {
        id: "ord-h6",
        company_id: companyId,
        order_number: "HIST-006",
        status: "delivered",
        total: 698000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 698000,
        customer_name: "Ngô Thị Vân",
        customer_phone: "0966777888",
        customer_email: "van@gmail.com",
        customer_address: "Q5, TP.HCM",
        shipping_address: "Q5, TP.HCM",
        payment_method: "cod",
        payment_status: "paid",
        priority: "medium",
        source_type: "zalo",
        platform_order_id: null,
        channel_id: "channel-zalo",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(3),
        updated_at: subMonthsDate(3),
        order_items: [
          {
            id: "oi-h6",
            order_id: "ord-h6",
            product_id: "local-prod-combo-new",
            quantity: 2,
            unit_price: 349000,
            total_price: 698000,
            products: { id: "local-prod-combo-new", name: "Combo Shop Mới Khởi Nghiệp", sku: "PRD-COMBO-NEW" }
          }
        ]
      },
      {
        id: "ord-h7",
        company_id: companyId,
        order_number: "HIST-007",
        status: "delivered",
        total: 1080000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 1080000,
        customer_name: "Vũ Văn Hải",
        customer_phone: "0977888999",
        customer_email: "hai@gmail.com",
        customer_address: "Thanh Xuân, Hà Nội",
        shipping_address: "Thanh Xuân, Hà Nội",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "shopee",
        platform_order_id: "SHP002",
        channel_id: "channel-shopee",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(2),
        updated_at: subMonthsDate(2),
        order_items: [
          {
            id: "oi-h7",
            order_id: "ord-h7",
            product_id: "local-prod-card",
            quantity: 8,
            unit_price: 135000,
            total_price: 1080000,
            products: { id: "local-prod-card", name: "Card cảm ơn / Thank you card", sku: "PRD-CARD" }
          }
        ]
      },
      {
        id: "ord-h8",
        company_id: companyId,
        order_number: "HIST-008",
        status: "delivered",
        total: 218000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 218000,
        customer_name: "Đỗ Thị Quỳnh",
        customer_phone: "0988999000",
        customer_email: "quynh@gmail.com",
        customer_address: "Hai Bà Trưng, Hà Nội",
        shipping_address: "Hai Bà Trưng, Hà Nội",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "low",
        source_type: "facebook",
        platform_order_id: null,
        channel_id: "channel-facebook",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(2),
        updated_at: subMonthsDate(2),
        order_items: [
          {
            id: "oi-h8",
            order_id: "ord-h8",
            product_id: "local-prod-qr-board",
            quantity: 2,
            unit_price: 109000,
            total_price: 218000,
            products: { id: "local-prod-qr-board", name: "Bảng QR để bàn mica", sku: "PRD-QR-BOARD" }
          }
        ]
      },
      {
        id: "ord-h9",
        company_id: companyId,
        order_number: "HIST-009",
        status: "delivered",
        total: 792000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 792000,
        customer_name: "Bùi Văn Nam",
        customer_phone: "0999000111",
        customer_email: "nam@gmail.com",
        customer_address: "Q7, TP.HCM",
        shipping_address: "Q7, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "pos",
        platform_order_id: null,
        channel_id: "channel-retail",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(1),
        updated_at: subMonthsDate(1),
        order_items: [
          {
            id: "oi-h9",
            order_id: "ord-h9",
            product_id: "local-prod-sticker",
            quantity: 8,
            unit_price: 99000,
            total_price: 792000,
            products: { id: "local-prod-sticker", name: "Sticker logo decal giấy", sku: "PRD-STICKER" }
          }
        ]
      },
      {
        id: "ord-h10",
        company_id: companyId,
        order_number: "HIST-010",
        status: "delivered",
        total: 1047000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 1047000,
        customer_name: "Đặng Thị Hoa",
        customer_phone: "0911333555",
        customer_email: "hoa@gmail.com",
        customer_address: "Q2, TP.HCM",
        shipping_address: "Q2, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "high",
        source_type: "zalo",
        platform_order_id: null,
        channel_id: "channel-zalo",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(1),
        updated_at: subMonthsDate(1),
        order_items: [
          {
            id: "oi-h10",
            order_id: "ord-h10",
            product_id: "local-prod-combo-new",
            quantity: 3,
            unit_price: 349000,
            total_price: 1047000,
            products: { id: "local-prod-combo-new", name: "Combo Shop Mới Khởi Nghiệp", sku: "PRD-COMBO-NEW" }
          }
        ]
      },
      {
        id: "ord-h11",
        company_id: companyId,
        order_number: "HIST-011",
        status: "delivered",
        total: 540000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 540000,
        customer_name: "Lâm Văn Tuấn",
        customer_phone: "0922444666",
        customer_email: "lamtuan@gmail.com",
        customer_address: "Tây Hồ, Hà Nội",
        shipping_address: "Tây Hồ, Hà Nội",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "shopee",
        platform_order_id: "SHP003",
        channel_id: "channel-shopee",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(1),
        updated_at: subMonthsDate(1),
        order_items: [
          {
            id: "oi-h11",
            order_id: "ord-h11",
            product_id: "local-prod-card",
            quantity: 4,
            unit_price: 135000,
            total_price: 540000,
            products: { id: "local-prod-card", name: "Card cảm ơn / Thank you card", sku: "PRD-CARD" }
          }
        ]
      },
      {
        id: "ord-h12",
        company_id: companyId,
        order_number: "HIST-012",
        status: "delivered",
        total: 149000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 149000,
        customer_name: "Nguyễn Thị Hương",
        customer_phone: "0933555777",
        customer_email: "huong@gmail.com",
        customer_address: "Q Bình Thạnh, TP.HCM",
        shipping_address: "Q Bình Thạnh, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "low",
        source_type: "zalo",
        platform_order_id: null,
        channel_id: "channel-zalo",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(1),
        updated_at: subMonthsDate(1),
        order_items: [
          {
            id: "oi-h12",
            order_id: "ord-h12",
            product_id: "local-prod-design-qr",
            quantity: 1,
            unit_price: 149000,
            total_price: 149000,
            products: { id: "local-prod-design-qr", name: "Dịch vụ thiết kế Avatar & QR", sku: "PRD-DESIGN-QR" }
          }
        ]
      }
    ];
    const populatedDefaults = defaultOrders.map((o: any) => {
      if (!o.shipping_province) {
        const address = o.shipping_address || o.customer_address || "";
        if (address.includes("Hà Nội") || address.includes("HN")) o.shipping_province = "Hà Nội";
        else if (address.includes("TP.HCM") || address.includes("Hồ Chí Minh") || address.includes("Sài Gòn") || address.includes("SG")) o.shipping_province = "Hồ Chí Minh";
        else if (address.includes("Đà Nẵng") || address.includes("ĐN")) o.shipping_province = "Đà Nẵng";
        else o.shipping_province = "Hồ Chí Minh";
      }
      return o;
    });
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(populatedDefaults));
    return populatedDefaults;
  }

  try {
    const list = JSON.parse(raw) as Order[];
    const rawVariants = localStorage.getItem("erp-mini-local-demo-product-variants");
    const variantsList = rawVariants ? JSON.parse(rawVariants) : [];

    return list.map((o: any) => {
      if (!o.shipping_province) {
        const address = o.shipping_address || o.customer_address || "";
        if (address.includes("Hà Nội") || address.includes("HN")) o.shipping_province = "Hà Nội";
        else if (address.includes("TP.HCM") || address.includes("Hồ Chí Minh") || address.includes("Sài Gòn") || address.includes("SG")) o.shipping_province = "Hồ Chí Minh";
        else if (address.includes("Đà Nẵng") || address.includes("ĐN")) o.shipping_province = "Đà Nẵng";
        else o.shipping_province = "Hồ Chí Minh";
      }

      if (o.order_items && Array.isArray(o.order_items)) {
        o.order_items = o.order_items.map((item: any) => {
          if (item.variant_id && !item.product_variants) {
            const varObj = variantsList.find((v: any) => v.id === item.variant_id);
            if (varObj) {
              item.product_variants = { id: varObj.id, name: varObj.name, sku: varObj.sku };
            }
          }
          return item;
        });
      }

      return o;
    });
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: Order[]) {
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

/** Deduct stock for order items (local demo mode) */
function deductLocalStock(items: any[], orderNumber: string) {
  const rawProducts = localStorage.getItem("erp-mini-local-demo-products");
  const products = rawProducts ? JSON.parse(rawProducts) : [];
  const rawVariants = localStorage.getItem("erp-mini-local-demo-product-variants");
  const variants = rawVariants ? JSON.parse(rawVariants) : [];
  const rawComponents = localStorage.getItem("erp-mini-local-demo-product-variant-components");
  const components = rawComponents ? JSON.parse(rawComponents) : [];

  for (const item of items) {
    if (!item.product_id) continue;
    const prod = products.find((p: any) => p.id === item.product_id);
    if (prod && prod.is_service) continue;

    if (item.variant_id) {
      const compositeComponents = components.filter((c: any) => c.parent_variant_id === item.variant_id);
      if (compositeComponents.length > 0) {
        for (const comp of compositeComponents) {
          const qtyToSubtract = (item.quantity || 1) * (comp.quantity || 1);
          const childVarIdx = variants.findIndex((v: any) => v.id === comp.child_variant_id);
          if (childVarIdx !== -1) {
            variants[childVarIdx].stock_quantity = Math.max(0, (variants[childVarIdx].stock_quantity || 0) - qtyToSubtract);
            const childProdIdx = products.findIndex((p: any) => p.id === variants[childVarIdx].product_id);
            if (childProdIdx !== -1) {
              products[childProdIdx].stock_quantity = Math.max(0, (products[childProdIdx].stock_quantity || 0) - qtyToSubtract);
            }
            
            createLocalInventoryTransaction({
              product_id: variants[childVarIdx].product_id,
              variant_id: comp.child_variant_id,
              transaction_type: "out",
              quantity: -qtyToSubtract,
              notes: `Tieu hao thanh phan Combo - Don ${orderNumber}`,
            });
          }
        }
      } else {
        const varIdx = variants.findIndex((v: any) => v.id === item.variant_id);
        if (varIdx !== -1) {
          variants[varIdx].stock_quantity = Math.max(0, (variants[varIdx].stock_quantity || 0) - (item.quantity || 1));
        }
        const prodIdx = products.findIndex((p: any) => p.id === item.product_id);
        if (prodIdx !== -1) {
          products[prodIdx].stock_quantity = Math.max(0, (products[prodIdx].stock_quantity || 0) - (item.quantity || 1));
        }

        createLocalInventoryTransaction({
          product_id: item.product_id,
          variant_id: item.variant_id,
          transaction_type: "out",
          quantity: -(item.quantity || 1),
          notes: `Tr tn kho bien the - Don ${orderNumber}`,
        });
      }
    } else {
      const prodIdx = products.findIndex((p: any) => p.id === item.product_id);
      if (prodIdx !== -1) {
        products[prodIdx].stock_quantity = Math.max(0, (products[prodIdx].stock_quantity || 0) - (item.quantity || 1));
      }

      createLocalInventoryTransaction({
        product_id: item.product_id,
        transaction_type: "out",
        quantity: -(item.quantity || 1),
        notes: `Tr tn kho - Don ${orderNumber}`,
      });
    }
  }

  localStorage.setItem("erp-mini-local-demo-products", JSON.stringify(products));
  localStorage.setItem("erp-mini-local-demo-product-variants", JSON.stringify(variants));
}

/** Restore stock for order items (local demo mode) */
function restoreLocalStock(items: OrderItem[], orderNumber: string, reason: string) {
  const rawProducts = localStorage.getItem("erp-mini-local-demo-products");
  const products = rawProducts ? JSON.parse(rawProducts) : [];
  const rawVariants = localStorage.getItem("erp-mini-local-demo-product-variants");
  const variants = rawVariants ? JSON.parse(rawVariants) : [];
  const rawComponents = localStorage.getItem("erp-mini-local-demo-product-variant-components");
  const components = rawComponents ? JSON.parse(rawComponents) : [];

  for (const item of items) {
    if (!item.product_id) continue;
    const prod = products.find((p: any) => p.id === item.product_id);
    if (prod && prod.is_service) continue;

    if (item.variant_id) {
      const compositeComponents = components.filter((c: any) => c.parent_variant_id === item.variant_id);
      if (compositeComponents.length > 0) {
        for (const comp of compositeComponents) {
          const qtyToAdd = (item.quantity || 1) * (comp.quantity || 1);
          const childVarIdx = variants.findIndex((v: any) => v.id === comp.child_variant_id);
          if (childVarIdx !== -1) {
            variants[childVarIdx].stock_quantity = (variants[childVarIdx].stock_quantity || 0) + qtyToAdd;
            const childProdIdx = products.findIndex((p: any) => p.id === variants[childVarIdx].product_id);
            if (childProdIdx !== -1) {
              products[childProdIdx].stock_quantity = (products[childProdIdx].stock_quantity || 0) + qtyToAdd;
            }

            createLocalInventoryTransaction({
              product_id: variants[childVarIdx].product_id,
              variant_id: comp.child_variant_id,
              transaction_type: "in",
              quantity: qtyToAdd,
              notes: `Hoan tra thanh phan Combo (${reason}) - Don ${orderNumber}`,
            });
          }
        }
      } else {
        const varIdx = variants.findIndex((v: any) => v.id === item.variant_id);
        if (varIdx !== -1) {
          variants[varIdx].stock_quantity = (variants[varIdx].stock_quantity || 0) + (item.quantity || 1);
        }
        const prodIdx = products.findIndex((p: any) => p.id === item.product_id);
        if (prodIdx !== -1) {
          products[prodIdx].stock_quantity = (products[prodIdx].stock_quantity || 0) + (item.quantity || 1);
        }

        createLocalInventoryTransaction({
          product_id: item.product_id,
          variant_id: item.variant_id,
          transaction_type: "in",
          quantity: item.quantity || 1,
          notes: `Hoan tra bien the (${reason}) - Don ${orderNumber}`,
        });
      }
    } else {
      const prodIdx = products.findIndex((p: any) => p.id === item.product_id);
      if (prodIdx !== -1) {
        products[prodIdx].stock_quantity = (products[prodIdx].stock_quantity || 0) + (item.quantity || 1);
      }

      createLocalInventoryTransaction({
        product_id: item.product_id,
        transaction_type: "in",
        quantity: item.quantity || 1,
        notes: `Hon tn kho (${reason}) - n hng ${orderNumber}`,
      });
    }
  }

  localStorage.setItem("erp-mini-local-demo-products", JSON.stringify(products));
  localStorage.setItem("erp-mini-local-demo-product-variants", JSON.stringify(variants));
}

/** Deduct stock for order items (Supabase mode) */
async function deductSupabaseStock(items: any[], orderNumber: string) {
  for (const item of items) {
    if (!item.product_id) continue;
    try {
      const { data: prod } = await supabase.from("products").select("is_service").eq("id", item.product_id).single();
      if (prod && prod.is_service) continue;

      if (item.variant_id) {
        const { data: components } = await supabase
          .from("product_variant_components")
          .select("child_variant_id, quantity, product_variants!product_variant_components_child_variant_id_fkey(product_id)")
          .eq("parent_variant_id", item.variant_id);

        if (components && components.length > 0) {
          for (const comp of components) {
            const qtyToDeduct = (item.quantity || 1) * Number(comp.quantity);
            const childProductId = (comp as any).product_variants?.product_id;

            await supabase.rpc("increment_variant_stock_quantity" as any, {
              p_variant_id: comp.child_variant_id,
              p_quantity: -qtyToDeduct
            });

            if (childProductId) {
              await supabase.rpc("increment_stock_quantity" as any, {
                p_product_id: childProductId,
                p_quantity: -qtyToDeduct
              });
            }

            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from("inventory_transactions").insert({
              product_id: childProductId,
              variant_id: comp.child_variant_id,
              transaction_type: "out",
              quantity: -qtyToDeduct,
              reference_type: "composite_consumption",
              reference_id: orderNumber,
              notes: `Tieu hao thanh phan Combo - Don ${orderNumber}`,
              created_by: user?.id,
            });
          }
        } else {
          await supabase.rpc("increment_variant_stock_quantity" as any, {
            p_variant_id: item.variant_id,
            p_quantity: -(item.quantity || 1)
          });
          await supabase.rpc("increment_stock_quantity" as any, {
            p_product_id: item.product_id,
            p_quantity: -(item.quantity || 1)
          });

          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from("inventory_transactions").insert({
            product_id: item.product_id,
            variant_id: item.variant_id,
            transaction_type: "out",
            quantity: -(item.quantity || 1),
            reference_type: "order",
            reference_id: orderNumber,
            notes: `Tr tn kho bien the - Don ${orderNumber}`,
            created_by: user?.id,
          });
        }
      } else {
        await supabase.rpc("increment_stock_quantity" as any, {
          p_product_id: item.product_id,
          p_quantity: -(item.quantity || 1),
        });
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("inventory_transactions").insert({
          product_id: item.product_id,
          transaction_type: "out",
          quantity: -(item.quantity || 1),
          reference_type: "order",
          reference_id: orderNumber,
          notes: `Tr tn kho - n hng ${orderNumber}`,
          created_by: user?.id,
        });
      }
    } catch (err) {
      console.warn(`[Stock] Khng th tr tn kho cho ${item.product_id}:`, err);
    }
  }
}

/** Restore stock for order items (Supabase mode) */
async function restoreSupabaseStock(items: OrderItem[], orderNumber: string, reason: string) {
  for (const item of items) {
    if (!item.product_id) continue;
    try {
      const { data: prod } = await supabase.from("products").select("is_service").eq("id", item.product_id).single();
      if (prod && prod.is_service) continue;

      if (item.variant_id) {
        const { data: components } = await supabase
          .from("product_variant_components")
          .select("child_variant_id, quantity, product_variants!product_variant_components_child_variant_id_fkey(product_id)")
          .eq("parent_variant_id", item.variant_id);

        if (components && components.length > 0) {
          for (const comp of components) {
            const qtyToAdd = (item.quantity || 1) * Number(comp.quantity);
            const childProductId = (comp as any).product_variants?.product_id;

            await supabase.rpc("increment_variant_stock_quantity" as any, {
              p_variant_id: comp.child_variant_id,
              p_quantity: qtyToAdd
            });

            if (childProductId) {
              await supabase.rpc("increment_stock_quantity" as any, {
                p_product_id: childProductId,
                p_quantity: qtyToAdd
              });
            }

            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from("inventory_transactions").insert({
              product_id: childProductId,
              variant_id: comp.child_variant_id,
              transaction_type: "in",
              quantity: qtyToAdd,
              reference_type: `order-${reason}`,
              reference_id: orderNumber,
              notes: `Hon tra thanh phan Combo (${reason}) - Don ${orderNumber}`,
              created_by: user?.id,
            });
          }
        } else {
          await supabase.rpc("increment_variant_stock_quantity" as any, {
            p_variant_id: item.variant_id,
            p_quantity: item.quantity || 1
          });
          await supabase.rpc("increment_stock_quantity" as any, {
            p_product_id: item.product_id,
            p_quantity: item.quantity || 1
          });

          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from("inventory_transactions").insert({
            product_id: item.product_id,
            variant_id: item.variant_id,
            transaction_type: "in",
            quantity: item.quantity || 1,
            reference_type: `order-${reason}`,
            reference_id: orderNumber,
            notes: `Hon tra bien the (${reason}) - Don ${orderNumber}`,
            created_by: user?.id,
          });
        }
      } else {
        await supabase.rpc("increment_stock_quantity" as any, {
          p_product_id: item.product_id,
          p_quantity: item.quantity || 1,
        });
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("inventory_transactions").insert({
          product_id: item.product_id,
          transaction_type: "in",
          quantity: item.quantity || 1,
          reference_type: `order-${reason}`,
          reference_id: orderNumber,
          notes: `Hon tn kho (${reason}) - n hng ${orderNumber}`,
          created_by: user?.id,
        });
      }
    } catch (err) {
      console.warn(`[Stock] Khng th hon tn kho cho ${item.product_id}:`, err);
    }
  }
}

export function useOrders() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const { subscription } = useSubscriptions();

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["orders", companyId] });
    };
    window.addEventListener("local-orders-updated", handleUpdate);
    return () => window.removeEventListener("local-orders-updated", handleUpdate);
  }, [companyId, queryClient]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalOrders(companyId);
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          sales_channels(*),
          partners(*),
          order_items(*, products(*), product_variants(*))
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Order[];
    },
    enabled: !!companyId,
  });

  const createOrder = useMutation({
    mutationFn: async (payload: { order: Omit<Order, "id" | "created_at" | "updated_at">; items?: any[] }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");

      // Check SaaS plan limits for orders
      const planType = subscription?.plan_type || "starter";
      const currentMonthOrdersCount = orders.filter(o => {
        const d = o.created_at ? new Date(o.created_at) : new Date();
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;

      if (!checkPlanLimit(planType, "orders", currentMonthOrdersCount)) {
        throw new Error(`Đã đạt giới hạn tối đa ${currentMonthOrdersCount} đơn hàng trong tháng cho gói ${planType.toUpperCase()}. Vui lòng nâng cấp gói cước.`);
      }
      
      const { items, order: orderData } = payload;

      // Background Customer Auto-Profiling & Omni-channel Resolution
      let resolvedPartnerId = orderData.partner_id;

      if (!resolvedPartnerId && (orderData.customer_phone || orderData.customer_email)) {
        const phone = orderData.customer_phone?.trim();
        const email = orderData.customer_email?.trim();
        
        if (isLocalDemoAuthEnabled()) {
          const localPartners = getLocalPartners(companyId);
          const existing = localPartners.find(p => 
            (phone && p.phone === phone) || 
            (email && p.email?.toLowerCase() === email.toLowerCase())
          );
          
          if (existing) {
            resolvedPartnerId = existing.id;
          } else if (orderData.customer_name) {
            // Auto-create partner profile in background!
            const newPartner: Partner = {
              id: `partner-${Date.now()}`,
              company_id: companyId,
              name: orderData.customer_name,
              phone: phone || "",
              email: email || "",
              partner_type: "customer",
              code: phone ? `KH-${phone}` : `KH-${Date.now().toString().slice(-6)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              debt_amount: 0,
              loyalty_points: 0,
              total_spent: 0,
              promo_segment: "all",
              referrer_id: orderData.referrer_id || null,
              address: "",
              tax_id: "",
              notes: JSON.stringify({ referrer_id: orderData.referrer_id || null }),
              is_active: true,
              group_id: null
            };
            localPartners.unshift(newPartner);
            saveLocalPartners(localPartners);
            resolvedPartnerId = newPartner.id;
            logLocalAction("Tạo đối tác tự động (Đa kênh)", "partners", newPartner.id, newPartner, null);
          }
        } else {
          // Supabase mode lookup
          let query = supabase.from("partners").select("id");
          if (phone && email) {
            query = query.or(`phone.eq.${phone},email.eq.${email}`);
          } else if (phone) {
            query = query.eq("phone", phone);
          } else {
            query = query.eq("email", email);
          }
          const { data: existing } = await query.limit(1);
          if (existing && existing.length > 0) {
            resolvedPartnerId = existing[0].id;
          } else if (orderData.customer_name) {
            // Auto-create partner profile in background
            const serialized = serializePartnerMetadata({
              name: orderData.customer_name,
              phone: phone || "",
              email: email || "",
              partner_type: "customer",
              code: phone ? `KH-${phone}` : `KH-${Date.now().toString().slice(-6)}`,
              promo_segment: "all",
              referrer_id: orderData.referrer_id || null
            });
            const { data: newP, error: pErr } = await supabase
              .from("partners")
              .insert({
                ...serialized,
                company_id: companyId,
              })
              .select()
              .single();
            if (!pErr && newP) {
              resolvedPartnerId = newP.id;
            }
          }
        }
      }

      const totalAmount = orderData.total || 0;
      const paidAmt = orderData.paid_amount || 0;
      let finalPaymentStatus = orderData.payment_status || "unpaid";

      if (finalPaymentStatus === "paid" && paidAmt < totalAmount) {
        finalPaymentStatus = paidAmt === 0 ? "unpaid" : "partial";
      } else if (paidAmt >= totalAmount && totalAmount > 0) {
        finalPaymentStatus = "paid";
      }

      const resolvedOrderData = {
        ...orderData,
        partner_id: resolvedPartnerId,
        payment_status: finalPaymentStatus,
      };
      
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalOrders(companyId);
        const orderId = `ord-${Date.now()}`;
        const orderNumber = resolvedOrderData.order_number || orderId;
        
        const rawProducts = localStorage.getItem("erp-mini-local-demo-products");
        const productsList = rawProducts ? JSON.parse(rawProducts) : [];

        const newOrder: Order = {
          ...resolvedOrderData,
          id: orderId,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          order_items: (items || []).map((item, idx) => {
            const prod = productsList.find((p: any) => p.id === item.product_id);
            return {
              id: `oi-${Date.now()}-${idx}`,
              order_id: orderId,
              product_id: item.product_id || null,
              variant_id: item.variant_id || null,
              quantity: item.quantity || 1,
              unit_price: item.unit_price || 0,
              total_price: (item.quantity || 1) * (item.unit_price || 0),
              category: prod?.category || null,
              products: prod 
                ? { id: prod.id, name: prod.name, sku: prod.sku } 
                : item.product_name 
                ? { id: item.product_id, name: item.product_name, sku: item.sku || null } 
                : null
            };
          })
        } as any;
        
        all.unshift(newOrder);
        saveLocalOrders(all);

        // Audit log
        logLocalAction("Tạo đơn hàng mới", "orders", orderId, null, {
          order_number: newOrder.order_number,
          total: newOrder.total,
          items_count: (items || []).length,
          customer: newOrder.customer_name,
        });

        // Update partner loyalty points and LTV
        await updatePartnerPoints(companyId, resolvedPartnerId, (resolvedOrderData as any).used_points || 0, totalAmount);

        // Reward referrer if present
        if ((resolvedOrderData as any).referrer_id) {
          await rewardReferrer(companyId, (resolvedOrderData as any).referrer_id, newOrder.customer_name || "Khách mới", resolvedPartnerId);
        }

        // Publish event instead of direct local deduction
        erpEventBus.publish("ORDER_CREATED", { order: newOrder, items: items });

        return newOrder;
      }

      // Create Order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          ...resolvedOrderData,
          company_id: companyId,
        } as any)
        .select()
        .single();
      
      if (orderErr) throw orderErr;

      // Create Order Items if present
      if (items && items.length > 0) {
        const itemsPayload = items.map(item => ({
          order_id: order.id,
          product_id: item.product_id || null,
          variant_id: item.variant_id || null,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total: item.total ?? ((item.quantity || 1) * (item.unit_price || 0)),
        }));
        
        const { error: itemsErr } = await supabase
          .from("order_items")
          .insert(itemsPayload);
        
        if (itemsErr) throw itemsErr;

        // Deduct stock for Supabase mode
        await deductSupabaseStock(items, order.order_number || order.id);
      }

      // Update partner loyalty points and LTV in Supabase mode
      await updatePartnerPoints(companyId, resolvedPartnerId, (resolvedOrderData as any).used_points || 0, totalAmount);

      // Reward referrer if present in Supabase mode
      if ((resolvedOrderData as any).referrer_id) {
        await rewardReferrer(companyId, (resolvedOrderData as any).referrer_id, order.customer_name || "Khách mới", resolvedPartnerId);
      }

      return order;
    },
    onSuccess: () => {
      invalidateOrderRelated(queryClient);
      toast.success("Tạo đơn hàng thành công");
    },
    onError: (e: any) => {
      toast.error("Lỗi tạo đơn hàng: " + e.message);
    }
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order["status"] }) => {
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalOrders(companyId || "");
        const idx = all.findIndex(o => o.id === id);
        if (idx !== -1) {
          const order = all[idx];
          const prevStatus = order.status;

          // Status transition guard supporting all Pancake statuses
          const allowedTransitions: Record<string, string[]> = {
            pending: ["confirmed", "cancelled", "duplicate", "waiting_goods", "priority_ship", "waiting_print", "printed", "ordered", "packing", "waiting_transfer", "shipping", "deleted"],
            duplicate: ["pending", "confirmed", "cancelled", "deleted"],
            waiting_goods: ["pending", "confirmed", "cancelled", "deleted", "priority_ship", "packing"],
            priority_ship: ["pending", "confirmed", "cancelled", "deleted", "packing", "shipping"],
            waiting_print: ["pending", "confirmed", "cancelled", "deleted", "printed", "packing"],
            printed: ["pending", "confirmed", "cancelled", "deleted", "ordered", "packing", "shipping"],
            ordered: ["pending", "confirmed", "cancelled", "deleted", "packing", "shipping"],
            confirmed: ["pending", "cancelled", "processing", "packing", "waiting_transfer", "shipping", "duplicate", "deleted"],
            packing: ["pending", "confirmed", "cancelled", "deleted", "waiting_transfer", "shipping"],
            waiting_transfer: ["pending", "confirmed", "cancelled", "deleted", "shipping"],
            shipping: ["pending", "confirmed", "cancelled", "deleted", "delivered", "returned", "returned_partial", "exchanging", "paid_completed"],
            processing: ["shipping", "cancelled", "deleted"],
            delivered: ["returned", "returned_partial", "exchanging", "paid_completed"],
            paid_completed: ["returned", "returned_partial"],
            exchanging: ["pending", "confirmed", "shipping", "received_exchange"],
            received_exchange: ["returned", "returned_partial", "paid_completed"],
            cancelled: ["pending", "confirmed"],
            returned: [],
            returned_partial: [],
          };
          const allowed = allowedTransitions[prevStatus] || [];
          if (allowed.length > 0 && !allowed.includes(status)) {
            throw new Error(`Không thể chuyển trạng thái từ "${prevStatus}" sang "${status}"`);
          }

          // Restore stock when cancelling or returning (if previously deducted)
          if ((status === "cancelled" || status === "returned") && prevStatus !== "cancelled" && prevStatus !== "returned") {
            if (order.order_items && order.order_items.length > 0) {
              restoreLocalStock(order.order_items, order.order_number, status === "cancelled" ? "hủy đơn" : "trả hàng");
            }
          }

          // Auto create local payment transaction if paid_completed
          if (status === "paid_completed" && prevStatus !== "paid_completed") {
            all[idx].payment_status = "paid";
            all[idx].paid_amount = order.total || 0;
            
            const rawTx = localStorage.getItem("erp-mini-local-demo-payment-transactions");
            const txList = rawTx ? JSON.parse(rawTx) : [];
            const newTx = {
              id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              partner_id: order.partner_id || "partner-retail",
              order_id: id,
              transaction_type: "payment_in",
              amount: order.total || 0,
              payment_method: order.payment_method || "cod",
              reference_number: order.order_number ? `PAY-${order.order_number}` : null,
              notes: `Thu tiền tự động cho đơn hàng ${order.order_number || id}`,
              transaction_date: new Date().toISOString(),
              created_by: "admin",
              created_at: new Date().toISOString()
            };
            txList.unshift(newTx);
            localStorage.setItem("erp-mini-local-demo-payment-transactions", JSON.stringify(txList));
            
            logLocalAction("Ghi nhận thanh toán (Tự động chuyển Đã thu tiền)", "payment_transactions", newTx.id, null, {
              amount: newTx.amount,
              type: newTx.transaction_type,
              order_id: id
            });
          }

          all[idx].status = status;
          all[idx].updated_at = new Date().toISOString();
          saveLocalOrders(all);

          // Log all order status changes
          logLocalAction(
            `Chuyển trạng thái đơn hàng: ${prevStatus} → ${status}`,
            "orders",
            id,
            { status: prevStatus },
            { status }
          );

          // Log order cancellation or return
          if (status === "cancelled" || status === "returned") {
            logLocalAction(
              status === "cancelled" ? "Hủy đơn hàng" : "Trả hàng",
              "orders",
              id,
              { status: prevStatus },
              { status }
            );
          }
        }
        return;
      }

      // Fetch order with items to handle stock restoration
      const { data: order, error: fetchErr } = await supabase
        .from("orders")
        .select("*, order_items(*, products(id, name, sku, is_service))")
        .eq("id", id)
        .single();

      if (fetchErr) throw fetchErr;

      const prevStatus = order.status;

      // Restore stock when cancelling or returning
      if ((status === "cancelled" || status === "returned") && prevStatus !== "cancelled" && prevStatus !== "returned") {
        const orderItems = (order.order_items || []) as OrderItem[];
        if (orderItems.length > 0) {
          await restoreSupabaseStock(orderItems, order.order_number, status === "cancelled" ? "cancel" : "return");
        }
      }

      // Auto create payment transaction in Supabase if paid_completed
      if (status === "paid_completed" && prevStatus !== "paid_completed") {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            paid_amount: order.total || 0,
            status: "paid_completed" as any,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
          
        await supabase
          .from("payment_transactions")
          .insert({
            company_id: order.company_id,
            partner_id: order.partner_id || "partner-retail",
            order_id: id,
            transaction_type: "payment_in",
            amount: order.total || 0,
            payment_method: order.payment_method || "cod",
            reference_number: order.order_number ? `PAY-${order.order_number}` : null,
            notes: `Thu tiền tự động cho đơn hàng ${order.order_number || id}`,
            transaction_date: new Date().toISOString()
          });
      } else {
        const { error } = await supabase
          .from("orders")
          .update({
            status: status as any,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);

        if (error) throw error;
      }
    },
    onSuccess: (data, variables) => {
      invalidateOrderRelated(queryClient);
      toast.success("Cập nhật trạng thái đơn hàng thành công");
      try {
        const all = getLocalOrders(companyId || "");
        const matched = all.find(o => o.id === variables.id);
        if (matched) {
          triggerAutoMessageForStatusChange(matched, variables.status);
          if (variables.status === "delivered") {
            scheduleBuybackReminders(matched);
          }
        }
      } catch (err) {
        console.warn("Failed to trigger automated message or schedule buyback reminder on status update success:", err);
      }
    },
    onError: (e: any) => {
      toast.error("Lỗi cập nhật: " + e.message);
    }
  });

  return {
    orders,
    isLoading,
    createOrder,
    updateOrderStatus
  };
}

