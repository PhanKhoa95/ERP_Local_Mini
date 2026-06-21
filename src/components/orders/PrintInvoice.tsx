import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useShopSettings } from "@/hooks/useShopSettings";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  products?: { name: string; sku: string };
}

interface Order {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  subtotal: number;
  discount: number;
  voucher_discount?: number;
  shipping_fee: number;
  total: number;
  shipping_address?: string;
  notes?: string;
  partners?: { name: string; phone?: string; address?: string };
  sales_channels?: { name: string };
  order_items?: OrderItem[];
}

interface PrintInvoiceProps {
  order: Order;
}

export function PrintInvoice({ order }: PrintInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { bankInfo, shopInfo } = useShopSettings();

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hóa đơn ${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .info-block { flex: 1; }
            .info-block h3 { margin: 0 0 10px; font-size: 14px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-block p { margin: 3px 0; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
            th { background: #f5f5f5; font-weight: 600; }
            .text-right { text-align: right; }
            .summary { margin-top: 20px; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
            .summary-row.total { font-weight: bold; font-size: 16px; border-top: 2px solid #333; padding-top: 10px; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
            .qr-code { text-align: center; margin: 20px 0; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-2" />
        In hóa đơn
      </Button>

      {/* Hidden print content */}
      <div style={{ display: "none" }}>
        <div ref={printRef}>
          <div className="header">
            <h1>{shopInfo?.name || "CỬA HÀNG"}</h1>
            <p>{shopInfo?.address}</p>
            <p>Hotline: {shopInfo?.phone}</p>
          </div>

          <h2 style={{ textAlign: "center", margin: "20px 0" }}>HÓA ĐƠN BÁN HÀNG</h2>

          <div className="info">
            <div className="info-block">
              <h3>Thông tin đơn hàng</h3>
              <p><strong>Mã đơn:</strong> {order.order_number}</p>
              <p><strong>Ngày:</strong> {new Date(order.order_date).toLocaleDateString("vi-VN")}</p>
              <p><strong>Kênh:</strong> {order.sales_channels?.name || "N/A"}</p>
            </div>
            <div className="info-block">
              <h3>Thông tin khách hàng</h3>
              <p><strong>Tên:</strong> {order.partners?.name || "Khách lẻ"}</p>
              <p><strong>SĐT:</strong> {order.partners?.phone || "N/A"}</p>
              <p><strong>Địa chỉ:</strong> {order.shipping_address || order.partners?.address || "N/A"}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "40%" }}>Sản phẩm</th>
                <th style={{ width: "15%" }} className="text-right">Đơn giá</th>
                <th style={{ width: "10%" }} className="text-right">SL</th>
                <th style={{ width: "15%" }} className="text-right">Giảm</th>
                <th style={{ width: "15%" }} className="text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items?.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>
                    {item.products?.name}
                    <br />
                    <small style={{ color: "#666" }}>{item.products?.sku}</small>
                  </td>
                  <td className="text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{item.discount > 0 ? formatCurrency(item.discount) : "-"}</td>
                  <td className="text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="summary" style={{ maxWidth: "300px", marginLeft: "auto" }}>
            <div className="summary-row">
              <span>Tạm tính:</span>
              <span>{formatCurrency(order.subtotal || 0)}</span>
            </div>
            {(order.discount || 0) > 0 && (
              <div className="summary-row">
                <span>Giảm giá:</span>
                <span>-{formatCurrency(order.discount || 0)}</span>
              </div>
            )}
            {(order.voucher_discount || 0) > 0 && (
              <div className="summary-row">
                <span>Voucher:</span>
                <span>-{formatCurrency(order.voucher_discount || 0)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Phí vận chuyển:</span>
              <span>{formatCurrency(order.shipping_fee || 0)}</span>
            </div>
            <div className="summary-row total">
              <span>TỔNG CỘNG:</span>
              <span>{formatCurrency(order.total || 0)}</span>
            </div>
          </div>

          {order.notes && (
            <div style={{ marginTop: "20px", padding: "10px", background: "#f9f9f9", borderRadius: "4px" }}>
              <strong>Ghi chú:</strong> {order.notes}
            </div>
          )}

          {bankInfo && (
            <div style={{ marginTop: "20px", padding: "15px", background: "#f5f5f5", borderRadius: "4px" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: "14px" }}>Thông tin thanh toán:</h3>
              <p style={{ margin: "3px 0", fontSize: "13px" }}>Ngân hàng: {bankInfo.bank_name}</p>
              <p style={{ margin: "3px 0", fontSize: "13px" }}>STK: {bankInfo.account_number}</p>
              <p style={{ margin: "3px 0", fontSize: "13px" }}>Chủ TK: {bankInfo.account_holder}</p>
            </div>
          )}

          <div className="footer">
            <p>Cảm ơn quý khách đã mua hàng!</p>
            <p>In ngày: {new Date().toLocaleString("vi-VN")}</p>
          </div>
        </div>
      </div>
    </>
  );
}
