import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";

interface CustomerNote {
  id: string;
  partner_id: string;
  user_id: string;
  note_type: string;
  content: string;
  follow_up_date: string | null;
  is_resolved: boolean;
  created_at: string;
}

export function usePartnerDetail(partnerId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const enabled = !!partnerId && !!companyId;

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["partner-orders", partnerId, companyId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("partner_id", partnerId!)
        .eq("company_id", companyId!)
        .order("order_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["partner-transactions", partnerId, companyId],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("payment_transactions") as any)
        .select("*")
        .eq("partner_id", partnerId!)
        .eq("company_id", companyId!)
        .order("transaction_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: topProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["partner-top-products", partnerId, companyId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          product_id,
          quantity,
          total,
          products(id, name, sku, image_url),
          orders!inner(partner_id, company_id)
        `)
        .eq("orders.partner_id", partnerId!)
        .eq("orders.company_id", companyId!);
      if (error) throw error;

      // Aggregate by product
      const productMap = new Map<string, { product: any; totalQty: number; totalAmount: number; orderCount: number }>();
      for (const item of data || []) {
        const pid = item.product_id;
        const existing = productMap.get(pid);
        if (existing) {
          existing.totalQty += item.quantity;
          existing.totalAmount += item.total;
          existing.orderCount += 1;
        } else {
          productMap.set(pid, {
            product: item.products,
            totalQty: item.quantity,
            totalAmount: item.total,
            orderCount: 1,
          });
        }
      }
      return Array.from(productMap.values()).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 20);
    },
  });

  const { data: purchasedItems = [], isLoading: purchasedItemsLoading } = useQuery({
    queryKey: ["partner-purchased-items", partnerId, companyId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          id,
          product_id,
          quantity,
          unit_price,
          total,
          products(id, name, sku),
          orders!inner(partner_id, company_id, order_date)
        `)
        .eq("orders.partner_id", partnerId!)
        .eq("orders.company_id", companyId!);
      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.products?.name || "Sản phẩm không tên",
        sku: item.products?.sku || "N/A",
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        order_date: item.orders?.order_date || new Date().toISOString(),
      }));
    },
  });

  // customer_notes không có company_id — bảo vệ qua partner_id (đã được lọc theo company qua RLS partners)
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["customer-notes", partnerId, companyId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_notes")
        .select("*, partners!inner(company_id)")
        .eq("partner_id", partnerId!)
        .eq("partners.company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(({ partners, ...n }: any) => n) as CustomerNote[];
    },
  });

  const createNote = useMutation({
    mutationFn: async (note: { partner_id: string; note_type: string; content: string; follow_up_date?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");
      const { data, error } = await supabase
        .from("customer_notes")
        .insert({ ...note, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-notes", partnerId] });
      toast({ title: "Thêm ghi chú thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; content?: string; note_type?: string; is_resolved?: boolean; follow_up_date?: string | null }) => {
      const { data, error } = await supabase
        .from("customer_notes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-notes", partnerId] });
      toast({ title: "Cập nhật ghi chú thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-notes", partnerId] });
      toast({ title: "Xóa ghi chú thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const stats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    pendingOrders: orders.filter(o => o.status === "pending").length,
    confirmedOrders: orders.filter(o => o.status === "confirmed").length,
  };

  return {
    orders,
    transactions,
    topProducts,
    purchasedItems,
    notes,
    stats,
    isLoading: ordersLoading || transactionsLoading || productsLoading || notesLoading || purchasedItemsLoading,
    createNote,
    updateNote,
    deleteNote,
  };
}
