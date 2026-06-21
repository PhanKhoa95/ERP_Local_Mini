import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePlatformSync } from "@/hooks/usePlatformSync";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PlatformCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeToken } = usePlatformSync();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // channelId stored in state
    const channelId = state || searchParams.get("channel_id") || "";

    if (!code || !channelId) {
      setStatus("error");
      setErrorMsg("Thiếu thông tin xác thực từ sàn. Vui lòng thử lại.");
      return;
    }

    exchangeToken.mutate(
      {
        channelId,
        code,
        redirectUri: window.location.origin + "/platform-callback",
      },
      {
        onSuccess: () => setStatus("success"),
        onError: (err) => {
          setStatus("error");
          setErrorMsg(err.message || "Lỗi kết nối sàn");
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md p-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Đang kết nối sàn...</h2>
            <p className="text-muted-foreground">Vui lòng chờ trong giây lát</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Kết nối thành công!</h2>
            <p className="text-muted-foreground">Sàn đã được kết nối. Bạn có thể đồng bộ đơn hàng ngay.</p>
            <Button onClick={() => navigate("/settings")} className="mt-4">
              Quay về Cài đặt
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Kết nối thất bại</h2>
            <p className="text-muted-foreground">{errorMsg}</p>
            <Button onClick={() => navigate("/settings")} variant="outline" className="mt-4">
              Quay về Cài đặt
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PlatformCallback;
