import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import {
  resolveIdentity,
  batchResolveIdentities,
  type ResolutionResult,
} from "@/lib/identityResolution";

/**
 * Hook for identity resolution operations in the Data Hub.
 */
export function useIdentityResolution() {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resolveSingle = useMutation({
    mutationFn: async ({
      rawEventId,
      phone,
      name,
      email,
    }: {
      rawEventId: string;
      phone?: string | null;
      name?: string | null;
      email?: string | null;
    }): Promise<ResolutionResult> => {
      if (!companyId) throw new Error("Missing company context");
      return resolveIdentity(companyId, rawEventId, { phone, name, email });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["data-hub"] });
      if (result.auto_linked) {
        toast({
          title: "Đã liên kết tự động",
          description: `Đã liên kết sự kiện với ${result.linked_entity_type} (${result.linked_entity_id?.slice(0, 8)}...)`,
        });
      } else if (result.candidates.length > 0) {
        toast({
          title: "Tìm thấy ứng viên",
          description: `${result.candidates.length} ứng viên phù hợp, cần xác nhận thủ công`,
        });
      } else {
        toast({
          title: "Không tìm thấy liên kết",
          description: "Không có đối tác hoặc đơn hàng nào khớp",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Lỗi Identity Resolution",
        description: error.message,
      });
    },
  });

  const resolveBatch = useMutation({
    mutationFn: async (
      events: Array<{
        id: string;
        phone?: string | null;
        name?: string | null;
        email?: string | null;
      }>
    ): Promise<ResolutionResult[]> => {
      if (!companyId) throw new Error("Missing company context");
      return batchResolveIdentities(companyId, events);
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["data-hub"] });
      const autoLinked = results.filter((r) => r.auto_linked).length;
      const withCandidates = results.filter(
        (r) => !r.auto_linked && r.candidates.length > 0
      ).length;
      toast({
        title: "Identity Resolution hoàn tất",
        description: `${autoLinked} tự động liên kết, ${withCandidates} cần xác nhận, ${results.length - autoLinked - withCandidates} không tìm thấy`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Lỗi Batch Resolution",
        description: error.message,
      });
    },
  });

  return {
    resolveSingle,
    resolveBatch,
  };
}
