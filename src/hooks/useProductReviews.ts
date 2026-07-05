import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";

export interface ProductReview {
  id: string;
  company_id?: string | null;
  platform: "shopee" | "lazada" | "tiktok" | "manual";
  customer_name: string;
  customer_phone?: string | null;
  rating: number;
  comment: string;
  reply_content: string | null;
  product_name: string;
  product_sku: string;
  product_image?: string | null;
  order_number: string;
  images?: string[] | null;
  created_at: string;
  updated_at?: string;
}

const LOCAL_REVIEWS_KEY = "erp-mini-local-demo-reviews";

const DEFAULT_SEED_REVIEWS: ProductReview[] = [
  {
    id: "rev-1",
    platform: "shopee",
    customer_name: "Nguyễn Minh Thuận",
    customer_phone: "0901122334",
    rating: 5,
    comment: "Sản phẩm chất lượng cực kỳ tốt, sticker in hình rất sắc nét, chống nước tốt. Đóng gói rất cẩn thận và giao hàng siêu nhanh. Sẽ tiếp tục ủng hộ shop lâu dài ạ!",
    reply_content: "Dạ cảm ơn anh Thuận đã ủng hộ shop ạ! Chúc anh một ngày tốt lành và hy vọng được phục vụ anh trong đơn hàng tiếp theo nhé ạ. ❤️",
    product_name: "Sticker logo decal giấy",
    product_sku: "PRD-STICKER",
    product_image: "https://images.unsplash.com/photo-1572375995501-4b0894dbe0d1?w=120&auto=format&fit=crop&q=60",
    order_number: "HIST-001",
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1589987607627-616cac5c2c5a?w=150&auto=format&fit=crop&q=60"
    ]
  },
  {
    id: "rev-2",
    platform: "lazada",
    customer_name: "Phạm Thúy Vy",
    customer_phone: "0933445566",
    rating: 2,
    comment: "Giao hàng thì lâu mà thẻ QR bị trầy xước khá nhiều ở mặt sau. Nhìn hơi mất thẩm mỹ xíu nhưng quét mã vẫn dùng được. Shop xem lại khâu đóng gói sản phẩm giùm nha.",
    reply_content: null,
    product_name: "Card cảm ơn / Thank you card",
    product_sku: "PRD-CARD",
    product_image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=60",
    order_number: "HIST-002",
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=150&auto=format&fit=crop&q=60"
    ]
  },
  {
    id: "rev-3",
    platform: "tiktok",
    customer_name: "Vũ Hoàng Long",
    customer_phone: "0977889900",
    rating: 4,
    comment: "Bảng QR thiết kế rất đẹp, cứng cáp và sang trọng. Tuy nhiên góc dưới hơi bị móp nhẹ tí chắc do bên vận chuyển quăng quật mạnh quá. Quét mã nhạy, nên mua.",
    reply_content: null,
    product_name: "Combo Shop Mới Khởi Nghiệp",
    product_sku: "PRD-COMBO-NEW",
    product_image: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=120&auto=format&fit=crop&q=60",
    order_number: "HIST-003",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export function getLocalReviews(): ProductReview[] {
  const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(DEFAULT_SEED_REVIEWS));
    return DEFAULT_SEED_REVIEWS;
  }
  return JSON.parse(raw);
}

export function saveLocalReviews(reviews: ProductReview[]) {
  localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(reviews));
}

export function useProductReviews() {
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["product-reviews", companyId],
    queryFn: async (): Promise<ProductReview[]> => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalReviews();
      }

      if (!companyId) return [];

      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching product reviews:", error);
        throw error;
      }

      return data as ProductReview[];
    },
  });

  const replyReview = useMutation({
    mutationFn: async ({ id, replyContent }: { id: string; replyContent: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalReviews();
        const updated = local.map(r => {
          if (r.id === id) {
            return { ...r, reply_content: replyContent, updated_at: new Date().toISOString() };
          }
          return r;
        });
        saveLocalReviews(updated);
        return { id, reply_content: replyContent };
      }

      const { data, error } = await supabase
        .from("product_reviews")
        .update({ reply_content: replyContent, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", companyId] });
      toast.success("Đăng phản hồi khách hàng thành công!");
    },
    onError: (err) => {
      console.error("Error replying to review:", err);
      toast.error("Không thể đăng phản hồi. Vui lòng thử lại!");
    }
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalReviews();
        const updated = local.filter(r => r.id !== id);
        saveLocalReviews(updated);
        return id;
      }

      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", companyId] });
      toast.success("Xóa đánh giá thành công!");
    },
    onError: (err) => {
      console.error("Error deleting review:", err);
      toast.error("Không thể xóa đánh giá. Vui lòng thử lại!");
    }
  });

  const importReviews = useMutation({
    mutationFn: async (newReviews: Omit<ProductReview, "id" | "created_at" | "updated_at">[]) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalReviews();
        const formatted: ProductReview[] = newReviews.map(r => ({
          ...r,
          id: `rev-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        const combined = [...formatted, ...local];
        saveLocalReviews(combined);
        return combined;
      }

      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");

      const payload = newReviews.map(r => ({
        ...r,
        company_id: companyId,
      }));

      const { data, error } = await supabase
        .from("product_reviews")
        .insert(payload)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", companyId] });
      toast.success("Đã đồng bộ đánh giá mới thành công!");
    },
    onError: (err) => {
      console.error("Error importing reviews:", err);
      toast.error("Không thể đồng bộ đánh giá. Vui lòng thử lại!");
    }
  });

  return {
    reviews,
    isLoading,
    replyReview,
    deleteReview,
    importReviews,
  };
}
