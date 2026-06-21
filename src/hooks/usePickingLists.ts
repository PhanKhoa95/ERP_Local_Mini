import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";

export interface PickingList {
  id: string;
  company_id: string;
  warehouse_id: string;
  status: "pending" | "picking" | "packed" | "completed" | "cancelled";
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  warehouses?: {
    id: string;
    code: string;
    name: string;
  };
  assignee_profile?: {
    full_name: string | null;
  };
  items?: PickingListItem[];
}

export interface PickingListItem {
  id: string;
  picking_list_id: string;
  order_item_id: string | null;
  product_id: string;
  quantity_requested: number;
  quantity_picked: number;
  status: "pending" | "picked" | "short";
  location_id: string | null;
  products?: {
    sku: string;
    name: string;
    unit: string | null;
  };
  warehouse_locations?: {
    name: string;
    zone: string | null;
  };
}

export function usePickingLists() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: pickingLists = [], isLoading } = useQuery({
    queryKey: ["picking_lists", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("picking_lists" as any)
        .select(`
          *,
          warehouses(id, code, name),
          items:picking_list_items(
            id,
            picking_list_id,
            order_item_id,
            product_id,
            quantity_requested,
            quantity_picked,
            status,
            location_id,
            products(sku, name, unit),
            warehouse_locations(name, zone)
          )
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch assignee profiles separately since users table is in auth schema
      const listsWithProfiles = [];
      const typedData = (data as any) || [];
      for (const list of typedData) {
        let assigneeProfile = null;
        if (list.assigned_to) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", list.assigned_to)
            .maybeSingle();
          assigneeProfile = profile;
        }
        listsWithProfiles.push({
          ...list,
          assignee_profile: assigneeProfile,
        });
      }

      return listsWithProfiles as unknown as PickingList[];
    },
    enabled: !!companyId,
  });

  const createPickingList = useMutation({
    mutationFn: async (payload: {
      warehouse_id: string;
      notes?: string;
      assigned_to?: string;
      items: Array<{ product_id: string; quantity_requested: number; order_item_id?: string; location_id?: string }>;
    }) => {
      // 1. Create list
      const { data: list, error: listError } = await supabase
        .from("picking_lists" as any)
        .insert({
          company_id: companyId,
          warehouse_id: payload.warehouse_id,
          notes: payload.notes || null,
          assigned_to: payload.assigned_to || null,
          status: "pending",
        })
        .select()
        .single();
      
      if (listError) throw listError;

      const typedList = list as any;

      // 2. Create items
      const itemsPayload = payload.items.map(i => ({
        picking_list_id: typedList.id,
        product_id: i.product_id,
        quantity_requested: i.quantity_requested,
        order_item_id: i.order_item_id || null,
        location_id: i.location_id || null,
        status: "pending",
      }));

      const { error: itemsError } = await supabase
        .from("picking_list_items" as any)
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      return list;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["picking_lists", companyId] });
      toast({ title: "Tạo phiếu nhặt hàng thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateItemPicked = useMutation({
    mutationFn: async (payload: { itemId: string; quantity_picked: number; status: "pending" | "picked" | "short" }) => {
      const { data, error } = await supabase
        .from("picking_list_items" as any)
        .update({
          quantity_picked: payload.quantity_picked,
          status: payload.status,
        })
        .eq("id", payload.itemId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["picking_lists", companyId] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PickingList["status"] }) => {
      const { data, error } = await supabase
        .from("picking_lists" as any)
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["picking_lists", companyId] });
      toast({ title: "Cập nhật trạng thái phiếu nhặt hàng thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return { pickingLists, isLoading, createPickingList, updateItemPicked, updateStatus };
}
