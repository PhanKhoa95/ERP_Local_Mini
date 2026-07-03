import { useState, useEffect } from "react";
import { Scale, CreditCard, Gift, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DisplayItem {
  id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function CustomerDisplay() {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const [pointsUsed, setPointsUsed] = useState<number>(0);
  const [pointDiscount, setPointDiscount] = useState<number>(0);
  const [referralDiscount, setReferralDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [shopName, setShopName] = useState<string>("Pancake POS Store");

  useEffect(() => {
    const channel = new BroadcastChannel("erp_customer_display");

    channel.onmessage = (event) => {
      const { 
        items: newItems, 
        total: newTotal, 
        subtotal: newSubtotal,
        voucherDiscount: newVoucherDiscount,
        pointsUsed: newPointsUsed,
        pointDiscount: newPointDiscount,
        referralDiscount: newReferralDiscount,
        paymentMethod: newMethod 
      } = event.data;
      if (newItems) setItems(newItems);
      if (newTotal !== undefined) setTotal(newTotal);
      if (newSubtotal !== undefined) setSubtotal(newSubtotal);
      if (newVoucherDiscount !== undefined) setVoucherDiscount(newVoucherDiscount);
      if (newPointsUsed !== undefined) setPointsUsed(newPointsUsed);
      if (newPointDiscount !== undefined) setPointDiscount(newPointDiscount);
      if (newReferralDiscount !== undefined) setReferralDiscount(newReferralDiscount);
      if (newMethod) setPaymentMethod(newMethod);
    };

    channel.postMessage({ type: "REQUEST_CURRENT_STATE" });

    return () => {
      channel.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      {/* Top Banner */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20">
            P
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              {shopName}
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
              Màn hình hiển thị cho khách hàng
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse font-bold text-[10px] px-2 py-0.5">
            ● ĐỒNG BỘ REALTIME
          </Badge>
        </div>
      </header>

      {/* Main split display */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Side: Order items list */}
        <section className="lg:col-span-7 bg-slate-950/40 p-6 flex flex-col overflow-y-auto border-r border-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
            <span>🛒 Chi tiết giỏ hàng</span>
            <span className="text-xs text-blue-400 font-semibold lowercase">({items.length} mặt hàng)</span>
          </h2>

          <div className="flex-1 space-y-3.5">
            {items.map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/60 rounded-xl transition-all"
              >
                <div className="space-y-1 pr-3 flex-1">
                  <div className="font-bold text-sm text-slate-100 line-clamp-1">{item.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                    <span>Số lượng:</span>
                    <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded">
                      {item.quantity}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span>Đơn giá:</span>
                    <span className="text-slate-300 font-semibold">
                      {item.unit_price.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
                <div className="text-right font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 shrink-0">
                  {item.total.toLocaleString("vi-VN")}đ
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-blue-500 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-200">Chào mừng quý khách!</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
                    Vui lòng theo dõi chi tiết đơn hàng và quét mã QR thanh toán hiển thị tại đây.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Total pay & QR code billing */}
        <section className="lg:col-span-5 bg-slate-900/20 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
          {/* Total Pay Box */}
          <div className="bg-gradient-to-tr from-slate-900 to-indigo-950/20 border border-slate-800 p-5 rounded-2xl space-y-3.5 shadow-xl shadow-indigo-950/10">
            <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest block mb-2">CHI TIẾT THANH TOÁN</span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tiền hàng:</span>
                <span className="font-semibold">{subtotal.toLocaleString("vi-VN")}đ</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Voucher giảm giá:</span>
                  <span className="font-semibold">-{voucherDiscount.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              {pointDiscount > 0 && (
                <div className="flex justify-between text-indigo-400">
                  <span>Tiêu {pointsUsed} điểm tích lũy:</span>
                  <span className="font-semibold">-{pointDiscount.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              {referralDiscount > 0 && (
                <div className="flex justify-between text-pink-400">
                  <span>Chiết khấu mã giới thiệu:</span>
                  <span className="font-semibold">-{referralDiscount.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-200">TỔNG THANH TOÁN:</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-indigo-400 font-mono">
                  {total.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-800 pt-2 flex justify-between">
              <span>Hình thức thanh toán:</span>
              <span className="font-extrabold text-indigo-400 uppercase">
                {paymentMethod === "cod" ? "💵 Tiền mặt (COD)" : "💳 Chuyển khoản (Mã QR)"}
              </span>
            </div>
          </div>

          {/* VietQR Dynamic billing */}
          {paymentMethod === "bank" && total > 0 ? (
            <div className="bg-white text-slate-900 p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xl flex flex-col items-center">
              <div className="flex items-center gap-1.5 justify-center border-b pb-2 w-full">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-black tracking-wider text-slate-700 uppercase">
                  QUÉT QR CHUYỂN KHOẢN TỰ ĐỘNG
                </span>
              </div>
              
              {/* VietQR QR Image */}
              <div className="w-44 h-44 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 p-1">
                <img 
                  src={`https://api.vietqr.io/image/970422-123456789-Q4zJb1y.jpg?accountName=Pancake%20POS%20Store&amount=${total}&addInfo=PANCAKE%20POS%2520ORDER`} 
                  alt="VietQR Billing" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-center space-y-1">
                <div className="text-[10px] font-bold text-slate-500">
                  NHÂN HÀNG QUÂN ĐỘI (MB)
                </div>
                <div className="text-[11px] font-extrabold text-slate-800">
                  STK: 123456789
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  Hệ thống tự động xác nhận sau khi quét thành công
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-slate-900/40 border border-dashed border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-500 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Cảm ơn quý khách đã mua sắm!</h4>
                <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto mt-1">
                  Vui lòng kiểm tra lại giỏ hàng và thanh toán trực tiếp tại quầy thu ngân.
                </p>
              </div>
            </div>
          )}

          {/* Footer branding */}
          <footer className="text-center text-[9px] text-slate-600 font-semibold tracking-wider uppercase border-t border-slate-800/40 pt-4">
            Powered by Pancake POS ERP Mini
          </footer>
        </section>
      </main>
    </div>
  );
}
