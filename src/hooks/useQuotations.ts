import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { invalidateOrderRelated } from "@/lib/queryInvalidation";

export function useQuotations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();
  const { user } = useAuthContext();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["quotations", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("quotations")
        .select("*, partners(*), quotation_items(*, products(*))")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createQuotation = useMutation({
    mutationFn: async ({ quotation, items }: { quotation: any; items: any[] }) => {
      const qNumber = `QT-${Date.now().toString(36).toUpperCase()}`;
      const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price - (i.discount || 0), 0);
      
      const { data, error } = await supabase
        .from("quotations")
        .insert({
          company_id: companyId,
          quotation_number: qNumber,
          partner_id: quotation.partner_id || null,
          status: "draft",
          valid_until: quotation.valid_until || null,
          subtotal,
          discount: quotation.discount || 0,
          total: subtotal - (quotation.discount || 0),
          notes: quotation.notes || null,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;

      if (items.length > 0) {
        const qItems = items.map(item => ({
          quotation_id: data.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount || 0,
          total: item.quantity * item.unit_price - (item.discount || 0),
        }));
        const { error: itemsError } = await supabase.from("quotation_items").insert(qItems);
        if (itemsError) throw itemsError;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({ title: "Tạo báo giá thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const updateQuotationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("quotations")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({ title: "Cập nhật trạng thái báo giá thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const convertToOrder = useMutation({
    mutationFn: async (quotationId: string) => {
      // A5 fix: Fetch fresh data from DB instead of using stale cache
      const { data: quotation, error: qError } = await supabase
        .from("quotations")
        .select("*, quotation_items(*)")
        .eq("id", quotationId)
        .single();
      if (qError || !quotation) throw new Error("Không tìm thấy báo giá");

      // C2 fix: Only allow conversion from accepted/draft status
      if (quotation.status === "converted") throw new Error("Báo giá đã được chuyển thành đơn hàng");
      if (quotation.status === "rejected") throw new Error("Không thể chuyển báo giá đã bị từ chối");

      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          company_id: companyId,
          order_number: orderNumber,
          partner_id: quotation.partner_id,
          status: "pending" as any,
          subtotal: quotation.subtotal,
          discount: quotation.discount,
          total: quotation.total,
          notes: `Chuyển từ báo giá ${quotation.quotation_number}`,
          created_by: user?.id,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      // Copy quotation items to order items
      const qItems = quotation.quotation_items || [];
      if (qItems.length > 0) {
        const orderItems = qItems.map((item: any) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          discount: item.discount || 0,
        }));
        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;
      }

      // Update quotation status
      await supabase
        .from("quotations")
        .update({ status: "converted", converted_order_id: order.id })
        .eq("id", quotationId);

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      invalidateOrderRelated(queryClient);
      toast({ title: "Chuyển báo giá thành đơn hàng thành công!" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const deleteQuotation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({ title: "Xóa báo giá thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  return { quotations, isLoading, createQuotation, updateQuotationStatus, convertToOrder, deleteQuotation };
}
