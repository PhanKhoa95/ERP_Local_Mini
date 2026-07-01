export interface PrintShopKpi {
  label: string;
  value: number;
  unit: string;
  note: string;
}

export interface PrintShopProduct {
  name: string;
  spec: string;
  mix: number;
  directPrice: number;
  shopeePrice: number;
  variableCost: number;
  grossProfit: number;
  grossMargin: number;
  minPrice: number;
  status: string;
  note: string;
}

export interface PrintShopChannel {
  name: string;
  revenueShare: number;
  totalFeeRate: number;
  fixedFeePerOrder: number;
  note: string;
}

export interface PrintShopMonthlyPlan {
  month: string;
  ordersPerDay: number;
  orders: number;
  revenue: number;
  grossProfit: number;
  marketing: number;
  operatingCashCost: number;
  operatingCashFlow: number;
  riskAdjustedCashFlow: number;
  endingCash: number;
  cumulativeOperatingCashFlow: number;
  capacityUse: number;
  capacityStatus: string;
  recommendation: string;
  cac: number;
  maxCac: number;
  repeatOrders: number;
  repeatRevenue: number;
}

export interface PrintShopScenario {
  name: string;
  orderFactor: number;
  priceFactor: number;
  variableCostFactor: number;
  marketingFactor: number;
  t12OrdersPerDay: number;
  aov: number;
  variableCost: number;
  yearOneRevenue: number;
  yearOneOperatingCashFlow: number;
  payback: string;
  decision: string;
}

export interface PrintShopCapexItem {
  item: string;
  purpose: string;
  baseCost: number;
  usefulMonths: number;
  depreciationPerMonth: number;
  spendMonth: number;
  note: string;
}

export interface PrintShopShopeeFee {
  product: string;
  zaloPrice: number;
  shopeePrice: number;
  increaseRate: number;
  variableCost: number;
  netProfit: number;
  netMargin: number;
  minShopeePrice: number;
  recommendation: string;
}

export interface PrintShopCapacityProduct {
  product: string;
  mix: number;
  productionMinutes: number;
  totalMinutes: number;
  ordersPerDayAtCapacity: number;
  risk: string;
  note: string;
}

export const printShopSource = {
  workbook: "Nha_In_Nho_Bang_Chiet_Tinh_Dong_Tien_V5.xlsx",
  title: "Nhà in nhỏ - dashboard V5 thực chiến: tại nhà + Shopee/FB/Zalo",
  sheetsUsed: [
    "01_Tong_quan",
    "03_Chiet_tinh_SP",
    "04_Kenh_ban",
    "05_Chi_phi_co_dinh",
    "06_CAPEX",
    "07_Dong_tien_24T",
    "08_Kich_ban",
    "09_Hoa_von",
    "11_Phi_Shopee",
    "12_Huy_Hoan_COD",
    "13_Cong_suat",
    "14_CAC_Quay_lai",
    "15_Gia_Canh_tranh",
  ],
};

export const printShopKpis: PrintShopKpi[] = [
  { label: "AOV bình quân sau mix kênh", value: 156200, unit: "VND/đơn", note: "Đã gồm giá Shopee cao hơn trực tiếp" },
  { label: "Biến phí sản xuất bình quân", value: 71369, unit: "VND/đơn", note: "Vật tư, mực, đóng gói, lao động và lỗi" },
  { label: "Phí kênh bình quân", value: 0.023, unit: "% doanh thu", note: "Weighted Shopee/Facebook/Zalo" },
  { label: "Biên lãi gộp sản xuất", value: 0.53, unit: "%", note: "Mục tiêu tối thiểu 40%" },
  { label: "Lãi đóng góp/đơn", value: 70110, unit: "VND/đơn", note: "Sau thuế, phí kênh và hỗ trợ giao hàng" },
  { label: "Hòa vốn số đơn/ngày", value: 7.3, unit: "đơn/ngày", note: "Mốc không âm vận hành" },
  { label: "Doanh thu hòa vốn/tháng", value: 29631479, unit: "VND/tháng", note: "Cần theo dõi trong báo cáo dòng tiền" },
  { label: "Vốn cần chuẩn bị", value: 85000000, unit: "VND", note: "CAPEX + dự phòng 3-4 tháng" },
];

export const printShopProducts: PrintShopProduct[] = [
  { name: "Sticker logo", spec: "100 tem tròn/vuông decal giấy", mix: 0.25, directPrice: 99000, shopeePrice: 115000, variableCost: 44275, grossProfit: 54725, grossMargin: 0.553, minPrice: 73792, status: "Trong vùng cạnh tranh", note: "Sản phẩm mồi; bán theo combo để tăng AOV" },
  { name: "Card cảm ơn", spec: "100 card C250/C300 cắt sẵn", mix: 0.18, directPrice: 119000, shopeePrice: 135000, variableCost: 56875, grossProfit: 62125, grossMargin: 0.522, minPrice: 94792, status: "Trong vùng cạnh tranh", note: "Nhu cầu đều từ shop online" },
  { name: "Bảng QR để bàn", spec: "01 bảng QR mica/formex để bàn", mix: 0.12, directPrice: 109000, shopeePrice: 125000, variableCost: 50575, grossProfit: 58425, grossMargin: 0.536, minPrice: 84292, status: "Trong vùng cạnh tranh", note: "Nên bán kèm tem QR/card" },
  { name: "Tem QR thanh toán", spec: "50 tem QR decal", mix: 0.08, directPrice: 69000, shopeePrice: 79000, variableCost: 25900, grossProfit: 43100, grossMargin: 0.625, minPrice: 43167, status: "Trong vùng cạnh tranh", note: "Giá mồi cho quán/shipper/hộ kinh doanh" },
  { name: "Thẻ QR cá nhân", spec: "01 thẻ QR cá nhân/cửa hàng", mix: 0.07, directPrice: 69000, shopeePrice: 79000, variableCost: 27388, grossProfit: 41613, grossMargin: 0.603, minPrice: 45646, status: "Trong vùng cạnh tranh", note: "Biên tốt, dễ upsell" },
  { name: "Combo shop mới", spec: "100 tem + 100 card + 01 bảng QR + avatar", mix: 0.18, directPrice: 349000, shopeePrice: 399000, variableCost: 173513, grossProfit: 175488, grossMargin: 0.503, minPrice: 289188, status: "Trong vùng cạnh tranh", note: "Sản phẩm chiến lược; tăng doanh thu/đơn" },
  { name: "Avatar/thiết kế QR", spec: "01 gói file số dùng Zalo/Facebook/Shopee", mix: 0.07, directPrice: 149000, shopeePrice: 169000, variableCost: 40000, grossProfit: 109000, grossMargin: 0.732, minPrice: 66667, status: "Trong vùng cạnh tranh", note: "Giới hạn số lần sửa để tránh lỗ công" },
  { name: "Bao bì/hộp gia công", spec: "01 đơn nhỏ gia công hộp/túi/nhãn", mix: 0.05, directPrice: 179000, shopeePrice: 205000, variableCost: 119438, grossProfit: 59563, grossMargin: 0.333, minPrice: 199063, status: "Theo dõi chặt", note: "Biên thấp, chỉ nhận khi có cọc và quy trình rõ" },
];

export const printShopChannels: PrintShopChannel[] = [
  { name: "Zalo", revenueShare: 0.45, totalFeeRate: 0.005, fixedFeePerOrder: 0, note: "Kênh chốt đơn chính; dùng QR/Zalo OA/cá nhân" },
  { name: "Facebook", revenueShare: 0.35, totalFeeRate: 0.005, fixedFeePerOrder: 0, note: "Kênh kéo khách địa phương; phí chính nằm ở quảng cáo" },
  { name: "Shopee", revenueShare: 0.2, totalFeeRate: 0.095, fixedFeePerOrder: 3000, note: "Kênh mở rộng; cần giá riêng để hấp thụ phí sàn" },
];

const months = Array.from({ length: 24 }, (_, index) => `T${index + 1}`);
const ordersPerDay = [4, 5, 6, 7, 8, 10, 12, 13, 14, 15, 16, 18, 18, 20, 22, 24, 25, 26, 27, 28, 30, 32, 34, 35];
const orders = [104, 130, 156, 182, 208, 260, 312, 338, 364, 390, 416, 468, 468, 520, 572, 624, 650, 676, 702, 728, 780, 832, 884, 910];
const revenue = [16244800, 20306000, 24367200, 28428400, 32489600, 40612000, 48734400, 52795600, 56856800, 60918000, 64979200, 73101600, 73101600, 81224000, 89346400, 97468800, 101530000, 105591200, 109652400, 113713600, 121836000, 129958400, 138080800, 142142000];
const grossProfit = [8822476, 11028095, 13233714, 15439333, 17644952, 22056190, 26467428, 28673047, 30878666, 33084285, 35289904, 39701142, 39701142, 44112380, 48523618, 52934856, 55140475, 57346094, 59551713, 61757332, 66168570, 70579808, 74991046, 77196665];
const marketing = [2000000, 2500000, 3000000, 3500000, 4000000, 4500000, 5000000, 5500000, 6000000, 6500000, 7000000, 7500000, 8000000, 8500000, 9000000, 9500000, 10000000, 10500000, 11000000, 11500000, 12000000, 12500000, 13000000, 13500000];
const operatingCashCost = [12081046, 12963808, 13846570, 14729331, 15612093, 16877616, 18143139, 19025901, 19908662, 22791424, 23674186, 24939709, 25439709, 26705232, 28470755, 29736278, 30619040, 31501802, 34384563, 35267325, 36532848, 37798371, 39063894, 39946656];
const operatingCashFlow = [-3258570, -1935713, -612856, 710002, 2032859, 5178574, 8324289, 9647146, 10970004, 10292861, 11615718, 14761433, 14261433, 17407148, 20052863, 23198578, 24521435, 25844292, 25167150, 26490007, 29635722, 32781437, 35927152, 37250009];
const riskAdjustedCashFlow = [-3616199, -2382748, -1149298, 105992, 1342563, 4315703, 7288844, 8525414, 9761985, 8998555, 10235125, 13208266, 12764426, 15743807, 18223187, 21202568, 22442258, 23681949, 22921639, 24161329, 27140710, 30120091, 33099471, 34339162];
const endingCash = [29841430, 27905717, 27292861, 28002863, 30035722, 35214296, 43538585, 53185731, 64155735, 74448596, 86064314, 100825747, 115087180, 132494328, 152547191, 175745769, 200267204, 226111496, 251278646, 277768653, 307404375, 340185812, 376112964, 413362973];
const cumulativeOperating = [-3258570, -5194283, -5807139, -5097137, -3064278, 2114296, 10438585, 20085731, 31055735, 41348596, 52964314, 67725747, 81987180, 99394328, 119447191, 142645769, 167167204, 193011496, 218178646, 244668653, 274304375, 307085812, 343012964, 380262973];
const capacityUse = [0.354, 0.443, 0.531, 0.62, 0.708, 0.886, 1.063, 1.151, 1.24, 0.797, 0.85, 0.956, 0.956, 1.063, 1.169, 1.275, 1.328, 1.381, 1.025, 1.063, 1.139, 1.214, 1.29, 1.328];
const capacityStatus = ["Ổn", "Ổn", "Ổn", "Ổn", "Theo dõi", "Căng", "Quá tải", "Quá tải", "Quá tải", "Theo dõi", "Căng", "Căng", "Căng", "Quá tải", "Quá tải", "Quá tải", "Quá tải", "Quá tải", "Quá tải", "Quá tải", "Quá tải", "Quá tải", "Quá tải", "Quá tải"];
const recommendations = ["Duy trì", "Duy trì", "Duy trì", "Duy trì", "Chuẩn hóa mẫu", "Chuẩn bị part-time", "Giảm nhận đơn/tuyển ngay", "Giảm nhận đơn/tuyển ngay", "Giảm nhận đơn/tuyển ngay", "Chuẩn hóa mẫu", "Chuẩn bị part-time", "Chuẩn bị part-time", "Chuẩn bị part-time", "Giảm nhận đơn/tuyển ngay", "Giảm nhận đơn/tuyển ngay", "Giảm nhận đơn/tuyển ngay", "Giảm nhận đơn/tuyển ngay", "Giảm nhận đơn/tuyển ngay", "Giảm nhận đơn/tuyển ngay", "Giảm nhận đơn/tuyển ngay", "Giảm nhận đơn/tuyển ngay", "Giảm nhận đơn/tuyển ngay", "Giảm nhận đơn/tuyển ngay", "Giảm nhận đơn/tuyển ngay"];
const cac = [25641, 25641, 25641, 29586, 29586, 26627, 24655, 25034, 25359, 25641, 25888, 24655, 31080, 29720, 28608, 27681, 27972, 28241, 28490, 28721, 27972, 27316, 26738, 26973];
const repeatOrders = [26, 33, 39, 64, 73, 91, 109, 118, 127, 137, 146, 164, 211, 234, 257, 281, 293, 304, 316, 328, 351, 374, 398, 410];
const repeatRevenue = [4061200, 5076500, 6091800, 9949940, 11371360, 14214200, 17057040, 18478460, 19899880, 21321300, 22742720, 25585560, 32895720, 36550800, 40205880, 43860960, 45688500, 47516040, 49343580, 51171120, 54826200, 58481280, 62136360, 63963900];

export const printShopMonthlyPlan: PrintShopMonthlyPlan[] = months.map((month, index) => ({
  month,
  ordersPerDay: ordersPerDay[index],
  orders: orders[index],
  revenue: revenue[index],
  grossProfit: grossProfit[index],
  marketing: marketing[index],
  operatingCashCost: operatingCashCost[index],
  operatingCashFlow: operatingCashFlow[index],
  riskAdjustedCashFlow: riskAdjustedCashFlow[index],
  endingCash: endingCash[index],
  cumulativeOperatingCashFlow: cumulativeOperating[index],
  capacityUse: capacityUse[index],
  capacityStatus: capacityStatus[index],
  recommendation: recommendations[index],
  cac: cac[index],
  maxCac: 24538,
  repeatOrders: repeatOrders[index],
  repeatRevenue: repeatRevenue[index],
}));

export const printShopScenarios: PrintShopScenario[] = [
  { name: "Thận trọng", orderFactor: 0.7, priceFactor: 0.98, variableCostFactor: 1.05, marketingFactor: 0.85, t12OrdersPerDay: 12.6, aov: 153076, variableCost: 74937, yearOneRevenue: 356605850, yearOneOperatingCashFlow: -8817769, payback: "Không hoàn vốn", decision: "Không mở rộng" },
  { name: "Cơ sở", orderFactor: 1, priceFactor: 1, variableCostFactor: 1, marketingFactor: 1, t12OrdersPerDay: 18, aov: 156200, variableCost: 71369, yearOneRevenue: 519833600, yearOneOperatingCashFlow: 67725747, payback: "9.2 tháng", decision: "Có thể mở rộng có kiểm soát" },
  { name: "Tăng trưởng", orderFactor: 1.3, priceFactor: 1.03, variableCostFactor: 0.98, marketingFactor: 1.2, t12OrdersPerDay: 23.4, aov: 160886, variableCost: 69941, yearOneRevenue: 696057190, yearOneOperatingCashFlow: 151393757, payback: "4.1 tháng", decision: "Có thể mở rộng có kiểm soát" },
];

export const printShopCapex: PrintShopCapexItem[] = [
  { item: "Máy in Epson L8050", purpose: "In ảnh/màu A4, tem/card số lượng nhỏ", baseCost: 7000000, usefulMonths: 36, depreciationPerMonth: 194444, spendMonth: 1, note: "Có thể thay bằng máy tương đương nếu giá tốt" },
  { item: "Máy cắt/bế tem 60cm", purpose: "Bế tem, cắt decal, giảm thuê ngoài", baseCost: 9900000, usefulMonths: 48, depreciationPerMonth: 206250, spendMonth: 1, note: "Không mua máy quá lớn trong 3 tháng đầu" },
  { item: "Máy cán màng/laminate", purpose: "Tăng độ bền tem/card", baseCost: 2500000, usefulMonths: 36, depreciationPerMonth: 69444, spendMonth: 1, note: "Chọn loại vừa khổ A3/A4" },
  { item: "Máy cắt giấy/bàn cắt/dao", purpose: "Cắt card/tem/giấy", baseCost: 3500000, usefulMonths: 36, depreciationPerMonth: 97222, spendMonth: 1, note: "Ưu tiên độ chuẩn để giảm lỗi" },
  { item: "Bo góc/ép plastic/dập lỗ", purpose: "Thành phẩm thẻ/card/QR", baseCost: 2000000, usefulMonths: 36, depreciationPerMonth: 55556, spendMonth: 1, note: "Bổ trợ tăng giá trị thành phẩm" },
  { item: "Đèn chụp/hộp chụp/nền ảnh", purpose: "Chụp sản phẩm thật để bán online", baseCost: 1500000, usefulMonths: 36, depreciationPerMonth: 41667, spendMonth: 1, note: "Tăng tỷ lệ chốt đơn trên FB/Shopee" },
  { item: "Vật tư giấy/decal/mực ban đầu", purpose: "Đủ chạy 30-45 ngày đầu", baseCost: 10000000, usefulMonths: 1, depreciationPerMonth: 0, spendMonth: 1, note: "Không ôm quá nhiều vật tư lạ" },
  { item: "Bao bì đóng gói/kệ/khay", purpose: "Đóng gói giao hàng và lưu kho", baseCost: 2500000, usefulMonths: 24, depreciationPerMonth: 104167, spendMonth: 1, note: "Cần cho bán Shopee/ship" },
  { item: "Branding/setup mẫu", purpose: "20-50 mẫu thiết kế sẵn, bảng giá, QR", baseCost: 2000000, usefulMonths: 24, depreciationPerMonth: 83333, spendMonth: 1, note: "Có thể tự làm để giảm chi phí" },
  { item: "Quỹ sửa chữa/đầu phun/dao cắt", purpose: "Dự phòng sự cố kỹ thuật", baseCost: 3000000, usefulMonths: 1, depreciationPerMonth: 0, spendMonth: 1, note: "Bắt buộc nếu muốn giao đúng hẹn" },
  { item: "Quỹ nhập vật tư vòng 1", purpose: "Mua vật tư theo đơn khi có nhu cầu", baseCost: 8000000, usefulMonths: 1, depreciationPerMonth: 0, spendMonth: 1, note: "Không dùng hết vốn vào máy móc" },
];

export const printShopFixedCosts = [
  { group: "Mặt bằng tại nhà", item: "Điện/nước/khu vực làm việc", monthlyCost: 800000, required: true },
  { group: "Công cụ số", item: "Internet, điện thoại", monthlyCost: 350000, required: true },
  { group: "Công cụ số", item: "Zalo OA/Shopee shop/công cụ chat", monthlyCost: 500000, required: false },
  { group: "Phần mềm", item: "Canva/thiết kế/font/kho ảnh", monthlyCost: 300000, required: false },
  { group: "Vật tư phụ", item: "Băng keo, túi, hộp, khăn lau", monthlyCost: 500000, required: true },
  { group: "Bảo trì", item: "Đầu phun, dao cắt, mực test, bảo trì máy", monthlyCost: 500000, required: true },
  { group: "Kế toán/thuế", item: "Hóa đơn/kê khai/hồ sơ hộ kinh doanh", monthlyCost: 400000, required: true },
  { group: "Quản trị", item: "Văn phòng phẩm, lưu trữ file, sao lưu dữ liệu", monthlyCost: 200000, required: true },
  { group: "Nhân sự", item: "Lương/chủ shop tự trả tối thiểu", monthlyCost: 5000000, required: true },
];

export const printShopShopeeFees: PrintShopShopeeFee[] = [
  { product: "Sticker logo", zaloPrice: 99000, shopeePrice: 115000, increaseRate: 0.162, variableCost: 44275, netProfit: 48482, netMargin: 0.422, minShopeePrice: 73295, recommendation: "Ổn" },
  { product: "Card cảm ơn", zaloPrice: 119000, shopeePrice: 135000, increaseRate: 0.134, variableCost: 56875, netProfit: 52404, netMargin: 0.388, minShopeePrice: 92829, recommendation: "Ổn" },
  { product: "Bảng QR để bàn", zaloPrice: 109000, shopeePrice: 125000, increaseRate: 0.147, variableCost: 50575, netProfit: 50443, netMargin: 0.404, minShopeePrice: 83062, recommendation: "Ổn" },
  { product: "Tem QR thanh toán", zaloPrice: 69000, shopeePrice: 79000, increaseRate: 0.145, variableCost: 25900, netProfit: 36988, netMargin: 0.468, minShopeePrice: 44806, recommendation: "Ổn" },
  { product: "Thẻ QR cá nhân", zaloPrice: 69000, shopeePrice: 79000, increaseRate: 0.145, variableCost: 27388, netProfit: 35456, netMargin: 0.449, minShopeePrice: 47112, recommendation: "Ổn" },
  { product: "Combo shop mới", zaloPrice: 349000, shopeePrice: 399000, increaseRate: 0.143, variableCost: 173513, netProfit: 155347, netMargin: 0.389, minShopeePrice: 273663, recommendation: "Ổn" },
  { product: "Avatar/thiết kế QR", zaloPrice: 149000, shopeePrice: 169000, increaseRate: 0.134, variableCost: 40000, netProfit: 98515, netMargin: 0.583, minShopeePrice: 66667, recommendation: "Ổn" },
  { product: "Bao bì/hộp gia công", zaloPrice: 179000, shopeePrice: 205000, increaseRate: 0.145, variableCost: 119438, netProfit: 47114, netMargin: 0.23, minShopeePrice: 189826, recommendation: "Theo dõi chặt" },
];

export const printShopCapacityProducts: PrintShopCapacityProduct[] = [
  { product: "Sticker logo", mix: 0.25, productionMinutes: 14, totalMinutes: 24, ordersPerDayAtCapacity: 15, risk: "Ổn", note: "Có thể bán thường xuyên" },
  { product: "Card cảm ơn", mix: 0.18, productionMinutes: 14, totalMinutes: 24, ordersPerDayAtCapacity: 15, risk: "Ổn", note: "Có thể bán thường xuyên" },
  { product: "Bảng QR để bàn", mix: 0.12, productionMinutes: 14, totalMinutes: 24, ordersPerDayAtCapacity: 15, risk: "Ổn", note: "Có thể bán thường xuyên" },
  { product: "Tem QR thanh toán", mix: 0.08, productionMinutes: 8, totalMinutes: 18, ordersPerDayAtCapacity: 20, risk: "Ổn", note: "Có thể bán thường xuyên" },
  { product: "Thẻ QR cá nhân", mix: 0.07, productionMinutes: 7, totalMinutes: 17, ordersPerDayAtCapacity: 21.2, risk: "Ổn", note: "Có thể bán thường xuyên" },
  { product: "Combo shop mới", mix: 0.18, productionMinutes: 45, totalMinutes: 55, ordersPerDayAtCapacity: 6.5, risk: "Mất công", note: "Bán theo lịch hẹn" },
  { product: "Avatar/thiết kế QR", mix: 0.07, productionMinutes: 60, totalMinutes: 70, ordersPerDayAtCapacity: 5.1, risk: "Rất mất công", note: "Giới hạn số lần sửa/đẩy giá" },
  { product: "Bao bì/hộp gia công", mix: 0.05, productionMinutes: 15, totalMinutes: 25, ordersPerDayAtCapacity: 14.4, risk: "Ổn", note: "Có thể bán thường xuyên" },
];

const yearOneMonths = printShopMonthlyPlan.slice(0, 12);

export const printShopSummary = {
  weightedAov: 156200,
  weightedVariableCost: 71369,
  contributionPerOrder: 70110,
  breakEvenOrdersPerMonth: 190,
  breakEvenOrdersPerDay: 7.3,
  breakEvenRevenuePerMonth: 29631479,
  yearOneRevenue: yearOneMonths.reduce((sum, month) => sum + month.revenue, 0),
  yearOneOperatingCashFlow: yearOneMonths.reduce((sum, month) => sum + month.operatingCashFlow, 0),
  endingCashT12: printShopMonthlyPlan[11].endingCash,
  paybackMonth: printShopMonthlyPlan.find((month) => month.cumulativeOperatingCashFlow >= 51900000)?.month || "Chưa",
  totalCapexBase: printShopCapex.reduce((sum, item) => sum + item.baseCost, 0),
  totalDepreciationPerMonth: printShopCapex.reduce((sum, item) => sum + item.depreciationPerMonth, 0),
  fixedCostWithOwnerSalary: printShopFixedCosts.reduce((sum, item) => sum + item.monthlyCost, 0),
  fixedCostWithoutOwnerSalary: printShopFixedCosts
    .filter((item) => item.item !== "Lương/chủ shop tự trả tối thiểu")
    .reduce((sum, item) => sum + item.monthlyCost, 0),
};
