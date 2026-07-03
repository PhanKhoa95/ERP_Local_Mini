import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Keyboard, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua phím tắt khi người dùng đang nhập liệu trong input, textarea hoặc select
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      // Nhấn "?" (hoặc Shift + /) để mở bảng hướng dẫn phím tắt
      if (e.key === "?" || e.key === "/") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Các phím tắt điều hướng nhanh (Shift + Phím chữ)
      if (e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "h":
            e.preventDefault();
            navigate("/");
            break;
          case "p":
            e.preventDefault();
            navigate("/pos");
            break;
          case "o":
            e.preventDefault();
            navigate("/orders");
            break;
          case "i":
            e.preventDefault();
            navigate("/inventory");
            break;
          case "c":
            e.preventDefault();
            navigate("/partners");
            break;
          case "a":
            e.preventDefault();
            navigate("/accounting");
            break;
          case "s":
            e.preventDefault();
            navigate("/settings");
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground h-9 w-9"
        title="Phím tắt hệ thống (Nhấn ?)"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              ⌨️ Phím tắt hệ thống
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sử dụng các phím tắt bên dưới để điều hướng và thao tác cực nhanh trong hệ thống ERP Mini.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">Điều hướng nhanh</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">Về Bảng điều khiển (Dashboard)</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⇧</span> Shift + H
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">Mở POS Bán hàng</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⇧</span> Shift + P
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">Quản lý Đơn hàng</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⇧</span> Shift + O
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">Sản phẩm & Kho hàng</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⇧</span> Shift + I
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">Khách hàng & Đối tác</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⇧</span> Shift + C
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">Sổ sách Kế toán</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⇧</span> Shift + A
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">Cài đặt hệ thống</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⇧</span> Shift + S
                  </kbd>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">Thao tác chung</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">Bật/Tắt hướng dẫn phím tắt này</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    ?
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
