# Customer Stress Scenarios

Các kịch bản này dùng để kiểm tra cách hệ thống xử lý khách hàng khó tính, nóng vội hoặc cung cấp dữ liệu thiếu nhất quán. Phần tự động nằm trong `src/hooks/__tests__/customerStressScenarios.test.ts`; phần thủ công dùng khi QA giao diện.

## Automated Scenarios

| ID | Tình huống | Điều kiện cần giữ |
| --- | --- | --- |
| #101 | Khách hối giao ngay nhưng không cung cấp số điện thoại/địa chỉ | Không cho xác nhận đơn, chất lượng dữ liệu bị hạ điểm |
| #102 | Khách đổi địa chỉ giao vào phút cuối | Địa chỉ giao mới được ưu tiên khi hiển thị/xuất đơn |
| #103 | Khách cũ quay lại nhưng đơn thiếu thông tin liên hệ | Hệ thống fallback sang hồ sơ khách đã lưu |
| #104 | Khách gửi số điện thoại lộn xộn qua chat/sàn | Chuẩn hóa được số điện thoại để tìm khách |
| #105 | Khách gây áp lực chốt COD nhưng thiếu kho/phương thức thanh toán | Không cho xác nhận đơn khi thiếu dữ liệu vận hành |
| #106 | Khách chỉ cung cấp tên ngắn/mơ hồ | Không tự nhận diện quá mức từ dữ liệu yếu |

Chạy riêng:

```sh
npx vitest run src/hooks/__tests__/customerStressScenarios.test.ts
```

Chạy cùng bộ test chính:

```sh
npm run test
```

## Manual UI Checklist

1. Đăng nhập local bằng `admin/admin`.
2. Mở `/orders`, tạo đơn mới với khách không nhập số điện thoại và địa chỉ.
3. Xác nhận hệ thống báo thiếu dữ liệu thay vì tạo đơn im lặng.
4. Tạo đơn với khách cũ, sau đó nhập địa chỉ giao khác địa chỉ hồ sơ.
5. Mở chi tiết đơn và xuất dữ liệu, kiểm tra địa chỉ giao mới là địa chỉ được dùng.
6. Tạo đơn thiếu kho hoặc thiếu phương thức thanh toán, kiểm tra hệ thống chặn xác nhận.
7. Mở `/tracking`, tìm bằng số điện thoại đã chuẩn hóa nếu đơn có dữ liệu hợp lệ.

## Expected QA Notes

- Không xác nhận đơn khi thiếu phone, địa chỉ giao, kho hoặc phương thức thanh toán.
- Không dùng địa chỉ hồ sơ cũ nếu đơn đã có `shipping_address` mới.
- Không tự ghép khách khi chỉ có tên quá ngắn hoặc số điện thoại không đủ độ tin cậy.
- Luôn giữ dữ liệu khách hàng rõ ràng để Sales Agent hoặc nhân viên có thể trả lời khi khách đang bức xúc.
