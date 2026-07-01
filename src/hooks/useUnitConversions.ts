import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface UnitConversion {
  id: string;
  product_id: string;
  from_unit: string; // Tên đơn vị quy đổi (ví dụ: Thùng)
  to_unit: string;   // Tên đơn vị cơ bản (ví dụ: Cái)
  factor: number;    // Hệ số quy đổi (ví dụ: 24)
  is_active: boolean;
}

const LOCAL_CONVERSIONS_KEY = "erp-mini-local-unit-conversions";

// Seed default conversions if empty
const seedDefaultConversions = () => {
  const existing = localStorage.getItem(LOCAL_CONVERSIONS_KEY);
  if (!existing) {
    const defaults: UnitConversion[] = [
      {
        id: "conv-sticker-pack",
        product_id: "prod-sticker", // Default seed product for Sticker
        from_unit: "Hộp",
        to_unit: "Cái",
        factor: 50,
        is_active: true
      },
      {
        id: "conv-sticker-box",
        product_id: "prod-sticker",
        from_unit: "Thùng",
        to_unit: "Cái",
        factor: 500,
        is_active: true
      }
    ];
    localStorage.setItem(LOCAL_CONVERSIONS_KEY, JSON.stringify(defaults));
  }
};

export function useUnitConversions(productId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    seedDefaultConversions();
  }, []);

  const { data: conversions = [], isLoading } = useQuery<UnitConversion[]>({
    queryKey: ["unit-conversions", productId],
    queryFn: () => {
      seedDefaultConversions();
      const all: UnitConversion[] = JSON.parse(localStorage.getItem(LOCAL_CONVERSIONS_KEY) || "[]");
      if (productId) {
        return all.filter(c => c.product_id === productId);
      }
      return all;
    }
  });

  const saveConversions = (list: UnitConversion[]) => {
    localStorage.setItem(LOCAL_CONVERSIONS_KEY, JSON.stringify(list));
    queryClient.invalidateQueries({ queryKey: ["unit-conversions"] });
  };

  const addConversion = useMutation({
    mutationFn: async (newConv: Omit<UnitConversion, "id">) => {
      const all: UnitConversion[] = JSON.parse(localStorage.getItem(LOCAL_CONVERSIONS_KEY) || "[]");
      const created: UnitConversion = {
        ...newConv,
        id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      };
      all.push(created);
      saveConversions(all);
      return created;
    }
  });

  const updateConversion = useMutation({
    mutationFn: async (updated: UnitConversion) => {
      const all: UnitConversion[] = JSON.parse(localStorage.getItem(LOCAL_CONVERSIONS_KEY) || "[]");
      const idx = all.findIndex(c => c.id === updated.id);
      if (idx !== -1) {
        all[idx] = updated;
        saveConversions(all);
      }
      return updated;
    }
  });

  const deleteConversion = useMutation({
    mutationFn: async (id: string) => {
      const all: UnitConversion[] = JSON.parse(localStorage.getItem(LOCAL_CONVERSIONS_KEY) || "[]");
      const filtered = all.filter(c => c.id !== id);
      saveConversions(filtered);
      return id;
    }
  });

  return {
    conversions,
    isLoading,
    addConversion,
    updateConversion,
    deleteConversion
  };
}
