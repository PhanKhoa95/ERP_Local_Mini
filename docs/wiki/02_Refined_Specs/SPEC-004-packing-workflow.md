---
id: SPEC-004-packing-workflow
type: spec
status: approved
target_agent: BA_Agent
created_at: 2026-07-15
source_ids:
  - RAW-004-packing-workflow
approved_by: Human_Owner
approved_at: 2026-07-15
---

# Đặc tả tính năng: Quy trình Đóng hàng Pancake POS và Thanh Bulk Action Bar

## Mục tiêu và phi mục tiêu
- **Mục tiêu**: Tối ưu hóa hiệu suất đóng gói đơn hàng tại kho bằng cách cho phép nhân viên vận hành xử lý hàng loạt đơn hàng, nhặt hàng (picking) có kiểm tra chéo bằng giao diện trực quan và tự động in ấn nhãn dán đơn hàng.
- **Phi mục tiêu**: Kết nối API trực tiếp với các đơn vị vận chuyển bên thứ ba (chỉ cập nhật trạng thái nội bộ trong ERP).

## User stories
- **US1**: Là nhân viên đóng hàng, tôi muốn chọn nhiều đơn hàng và mở màn hình đóng gói liên tục để tôi có thể đóng gói hàng loạt đơn hàng mà không cần click mở lại biểu mẫu nhiều lần.
- **US2**: Là thủ kho, tôi muốn sản phẩm sau khi được đóng gói hoàn tất sẽ tự động được trừ tồn kho tại kho tương ứng của đơn hàng đó.

## Acceptance criteria
1. **Bulk Action Bar**: Hiển thị ở đầu bảng danh sách đơn hàng khi checkbox chọn ít nhất 1 đơn được tích.
2. **Quét mã vạch**: Hộp thoại đóng hàng có ô input tìm kiếm/quét mã đơn hàng nhanh bằng mã đơn hàng.
3. **Danh sách sản phẩm nhặt**: Hiển thị trực quan danh sách sản phẩm cần nhặt kèm số lượng, cho phép tích chọn để đánh dấu nhặt đủ.
4. **Cập nhật trạng thái**: Khi xác nhận hoàn tất (bấm "Đã đủ hàng" hoặc quét đủ sản phẩm), đơn hàng tự động chuyển sang `waiting_transfer`, trừ tồn kho của sản phẩm tại kho được chỉ định của đơn hàng đó.
5. **In hóa đơn K80**: Hỗ trợ tùy chọn tự động in nhãn dán/hóa đơn bán lẻ (mở print window) ngay sau khi đơn hàng được đóng gói xong.
6. **Chuyển tiếp thông minh**: Khi đóng gói xong một đơn, hệ thống tự động tải thông tin đơn hàng tiếp theo trong danh sách đã chọn.
