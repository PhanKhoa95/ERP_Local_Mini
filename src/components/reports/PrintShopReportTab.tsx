import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Settings,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Calculator,
  Sliders,
  AlertTriangle,
  Layers,
  Percent,
  ClipboardList,
  Info,
  Sparkles,
  RefreshCw,
  Clock,
  Coins,
  ChevronRight,
  Activity,
  ThumbsUp,
  PercentIcon,
  Trash2,
  Plus,
  FileText,
} from "lucide-react";
import {
  printShopKpis,
  printShopProducts,
  printShopChannels,
  printShopMonthlyPlan,
  printShopScenarios,
  printShopCapex,
  printShopFixedCosts,
  printShopShopeeFees,
  printShopCapacityProducts,
  printShopSummary,
  type PrintShopCapexItem,
  type PrintShopChannel,
} from "@/lib/printShopReportModel";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import { startOfMonth } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAccounting } from "@/hooks/useAccounting";

const COLORS = ["hsl(var(--primary))", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];


export function PrintShopReportTab() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { orders } = useOrders();
  const { accounts, createManualEntry } = useAccounting();

  const handleSyncToAccounting = async (type: "capex" | "fixed", item: any) => {
    try {
      const cashAccount = accounts.find(a => a.code.startsWith("111") || a.code.startsWith("112")) || accounts[0];
      let targetAccount;
      if (type === "capex") {
        targetAccount = accounts.find(a => a.code.startsWith("211") || a.code.startsWith("153")) || accounts.find(a => a.code.startsWith("2")) || accounts[0];
      } else {
        targetAccount = accounts.find(a => a.code.startsWith("642") || a.code.startsWith("627") || a.code.startsWith("6")) || accounts[0];
      }

      if (!cashAccount || !targetAccount) {
        toast.error("Không tìm thấy tài khoản kế toán tương ứng. Hãy thiết lập danh mục tài khoản trước.");
        return;
      }

      const amount = type === "capex" ? item.baseCost : item.monthlyCost;
      const description = type === "capex" 
        ? `[CAPEX] Mua sắm đầu tư ban đầu: ${item.item}`
        : `[Định phí] Ghi nhận chi phí cố định: ${item.item}`;

      await createManualEntry.mutateAsync({
        description,
        lines: [
          {
            account_id: targetAccount.id,
            debit: amount,
            credit: 0,
            memo: description
          },
          {
            account_id: cashAccount.id,
            debit: 0,
            credit: amount,
            memo: description
          }
        ]
      });

      toast.success(`Đã ghi nhận thành công chi phí "${item.item}" vào Sổ nhật ký kế toán!`);
    } catch (err: any) {
      toast.error("Lỗi đồng bộ kế toán: " + err.message);
    }
  };

  const [subTab, setSubTab] = useState<"overview" | "pricing" | "calculator" | "cashflow" | "simulator" | "capex" | "capacity" | "settings">("overview");

  // Cash flow & Capacity assumptions
  const [assumedOrdersPerDay, setAssumedOrdersPerDay] = useState<number>(4);
  const [assumedAov, setAssumedAov] = useState<number>(150000);
  const [assumedMargin, setAssumedMargin] = useState<number>(55);
  const [assumedGrowthRate, setAssumedGrowthRate] = useState<number>(10);
  const [assumedMktCost, setAssumedMktCost] = useState<number>(5000000);
  const [assumedFixedCost, setAssumedFixedCost] = useState<number>(15000000);
  const [assumedMaxCapacity, setAssumedMaxCapacity] = useState<number>(50);
  const [month1DiffReason, setMonth1DiffReason] = useState<string>(
    "Shopee Shop mới setup chưa có traffic tự nhiên. Đơn hàng B2B in mica đang trong giai đoạn duyệt thiết kế mẫu, chưa chốt hợp đồng chính thức."
  );

  // State for quick pricing calculator
  const [calcPreset, setCalcPreset] = useState<string>("custom");
  const [calcSellingPrice, setCalcSellingPrice] = useState<number>(99000);
  const [calcMaterialCost, setCalcMaterialCost] = useState<number>(21000);
  const [calcInkCost, setCalcInkCost] = useState<number>(7000);
  const [calcProcessingCost, setCalcProcessingCost] = useState<number>(6000);
  const [calcLaborMinutes, setCalcLaborMinutes] = useState<number>(14);
  const [calcLaborRate, setCalcLaborRate] = useState<number>(35000);
  const [calcWastePercent, setCalcWastePercent] = useState<number>(5);

  // New pricing parameters
  const [calcDesignFee, setCalcDesignFee] = useState<number>(50000);
  const [calcRevisions, setCalcRevisions] = useState<number>(3);
  const [calcRevisionRate, setCalcRevisionRate] = useState<number>(10000);
  const [calcAdsFee, setCalcAdsFee] = useState<number>(10);

  // Shopee fee presets for calculator
  const [calcShopeeTxFee, setCalcShopeeTxFee] = useState<number>(6.0);
  const [calcShopeeCommFee, setCalcShopeeCommFee] = useState<number>(3.5);
  const [calcShopeeVoucherFee, setCalcShopeeVoucherFee] = useState<number>(1.5);
  const [calcShopeeFlatFee, setCalcShopeeFlatFee] = useState<number>(3000);
  const [calcShopeeCancelRate, setCalcShopeeCancelRate] = useState<number>(3.0);
  const [calcShopeeTaxRate, setCalcShopeeTaxRate] = useState<number>(4.5);
  const [calcShopeeTargetMargin, setCalcShopeeTargetMargin] = useState<number>(17.0);

  const handlePresetChange = (presetName: string) => {
    setCalcPreset(presetName);
    if (presetName === "custom") return;
    
    const presets: Record<string, {
      sellingPrice: number;
      materialCost: number;
      inkCost: number;
      processingCost: number;
      laborMinutes: number;
      laborRate: number;
      wastePercent: number;
    }> = {
      sticker: { sellingPrice: 99000, materialCost: 21000, inkCost: 7000, processingCost: 6000, laborMinutes: 14, laborRate: 35000, wastePercent: 5 },
      card: { sellingPrice: 119000, materialCost: 26000, inkCost: 12000, processingCost: 8000, laborMinutes: 14, laborRate: 35000, wastePercent: 5 },
      qr_board: { sellingPrice: 109000, materialCost: 30000, inkCost: 7000, processingCost: 3000, laborMinutes: 14, laborRate: 35000, wastePercent: 5 },
      qr_sticker: { sellingPrice: 69000, materialCost: 12000, inkCost: 5000, processingCost: 3000, laborMinutes: 8, laborRate: 35000, wastePercent: 5 },
      qr_card: { sellingPrice: 69000, materialCost: 16000, inkCost: 5000, processingCost: 1000, laborMinutes: 7, laborRate: 35000, wastePercent: 5 },
      combo: { sellingPrice: 349000, materialCost: 105000, inkCost: 22000, processingCost: 12000, laborMinutes: 45, laborRate: 35000, wastePercent: 5 },
      avatar: { sellingPrice: 149000, materialCost: 0, inkCost: 0, processingCost: 5000, laborMinutes: 60, laborRate: 35000, wastePercent: 0 },
      box: { sellingPrice: 179000, materialCost: 90000, inkCost: 5000, processingCost: 10000, laborMinutes: 15, laborRate: 35000, wastePercent: 5 },
    };

    const data = presets[presetName];
    if (data) {
      setCalcSellingPrice(data.sellingPrice);
      setCalcMaterialCost(data.materialCost);
      setCalcInkCost(data.inkCost);
      setCalcProcessingCost(data.processingCost);
      setCalcLaborMinutes(data.laborMinutes);
      setCalcLaborRate(data.laborRate);
      setCalcWastePercent(data.wastePercent);
    }
  };

  const calcResults = useMemo(() => {
    const laborCost = Math.round(calcLaborMinutes * (calcLaborRate / 60));
    const rawCost = calcMaterialCost + calcInkCost + calcProcessingCost + laborCost;
    const variableCost = Math.round(rawCost * (1 + calcWastePercent / 100));
    
    // Add Design + Revision cost
    const designCostTotal = calcDesignFee + (calcRevisions * calcRevisionRate);
    
    const grossProfit = calcSellingPrice - variableCost;
    const grossMargin = calcSellingPrice > 0 ? (grossProfit / calcSellingPrice) * 100 : 0;
    
    // Shopee price suggestion including Ads %, Design, revisions
    const rateSum = calcShopeeTxFee + calcShopeeCommFee + calcShopeeVoucherFee + calcShopeeCancelRate + calcShopeeTaxRate + calcShopeeTargetMargin + calcAdsFee;
    const shopeeDenom = 1 - rateSum / 100;
    const shopeePrice = shopeeDenom > 0 ? Math.round((variableCost + designCostTotal + calcShopeeFlatFee) / shopeeDenom) : 0;
    
    const shopeeTx = Math.round(shopeePrice * (calcShopeeTxFee / 100));
    const shopeeComm = Math.round(shopeePrice * (calcShopeeCommFee / 100));
    const shopeeVoucher = Math.round(shopeePrice * (calcShopeeVoucherFee / 100));
    const shopeeCancel = Math.round(shopeePrice * (calcShopeeCancelRate / 100));
    const shopeeTax = Math.round(shopeePrice * (calcShopeeTaxRate / 100));
    const shopeeAds = Math.round(shopeePrice * (calcAdsFee / 100));
    
    const shopeeNetProfit = shopeePrice - (shopeeTx + shopeeComm + shopeeVoucher + calcShopeeFlatFee + shopeeCancel + shopeeTax + shopeeAds + variableCost + designCostTotal);
    const shopeeNetMargin = shopeePrice > 0 ? (shopeeNetProfit / shopeePrice) * 100 : 0;

    return {
      laborCost,
      variableCost,
      designCostTotal,
      grossProfit,
      grossMargin,
      shopeePrice,
      shopeeTx,
      shopeeComm,
      shopeeVoucher,
      shopeeCancel,
      shopeeTax,
      shopeeAds,
      shopeeNetProfit,
      shopeeNetMargin
    };
  }, [
    calcLaborMinutes, calcLaborRate, calcMaterialCost, calcInkCost, calcProcessingCost, calcWastePercent, calcSellingPrice,
    calcShopeeTxFee, calcShopeeCommFee, calcShopeeVoucherFee, calcShopeeFlatFee, calcShopeeCancelRate, calcShopeeTaxRate, calcShopeeTargetMargin,
    calcDesignFee, calcRevisions, calcRevisionRate, calcAdsFee
  ]);

  // State for interactive simulator
  const [simOrderFactor, setSimOrderFactor] = useState(1.0);
  const [simPriceFactor, setSimPriceFactor] = useState(1.0);
  const [simCostFactor, setSimCostFactor] = useState(1.0);
  const [simMktFactor, setSimMktFactor] = useState(1.0);

  const resetSimulator = () => {
    setSimOrderFactor(1.0);
    setSimPriceFactor(1.0);
    setSimCostFactor(1.0);
    setSimMktFactor(1.0);
  };

  const [capexList, setCapexList] = useState<PrintShopCapexItem[]>(() => {
    const local = localStorage.getItem("erp-mini-printshop-capex");
    return local ? JSON.parse(local) : printShopCapex;
  });

  const [fixedCostsList, setFixedCostsList] = useState<any[]>(() => {
    const local = localStorage.getItem("erp-mini-printshop-fixed-costs");
    return local ? JSON.parse(local) : printShopFixedCosts;
  });

  const saveCapex = (newList: PrintShopCapexItem[]) => {
    setCapexList(newList);
    localStorage.setItem("erp-mini-printshop-capex", JSON.stringify(newList));
  };

  const saveFixedCosts = (newList: any[]) => {
    setFixedCostsList(newList);
    localStorage.setItem("erp-mini-printshop-fixed-costs", JSON.stringify(newList));
  };

  const liveProducts = useMemo(() => {
    if (!products || products.length === 0) {
      return printShopProducts;
    }
    
    return products.map(product => {
      const def = printShopProducts.find(p => p.name.toLowerCase().includes(product.name.toLowerCase()) || product.sku.includes(p.name)) || 
                  printShopProducts.find(p => product.name.toLowerCase().includes(p.name.toLowerCase())) || 
                  printShopProducts[0];
                  
      const directPrice = product.selling_price;
      const variableCost = product.cost_price;
      const grossProfit = directPrice - variableCost;
      const grossMargin = directPrice > 0 ? grossProfit / directPrice : 0;
      
      let shopeePrice = Math.round(directPrice * 1.15);
      if (product.sku === "PRD-STICKER") shopeePrice = 115000;
      else if (product.sku === "PRD-CARD") shopeePrice = 135000;
      else if (product.sku === "PRD-QR-BOARD") shopeePrice = 125000;
      else if (product.sku === "PRD-QR-STICKER") shopeePrice = 79000;
      else if (product.sku === "PRD-QR-CARD") shopeePrice = 79000;
      else if (product.sku === "PRD-COMBO-NEW") shopeePrice = 399000;
      else if (product.sku === "PRD-DESIGN-QR") shopeePrice = 169000;
      else if (product.sku === "PRD-BOX") shopeePrice = 205000;
      else {
        const ratio = def.shopeePrice / def.directPrice;
        shopeePrice = Math.round(directPrice * (ratio || 1.15));
      }
      
      const minPrice = Math.round(variableCost / (1 - 0.40));
      const status = grossMargin >= 0.50 ? "Trong vùng cạnh tranh" : "Theo dõi chặt";
      
      return {
        name: product.name,
        spec: product.description || def.spec,
        mix: def.mix,
        directPrice,
        shopeePrice,
        variableCost,
        grossProfit,
        grossMargin,
        minPrice,
        status,
        note: def.note
      };
    });
  }, [products]);

  const liveShopeeFees = useMemo(() => {
    return liveProducts.map(row => {
      const shopeeFeePercent = (row.shopeePrice * 0.11 + 3000 + row.shopeePrice * 0.03);
      const netProfit = row.shopeePrice - shopeeFeePercent - row.variableCost;
      const netMargin = row.shopeePrice > 0 ? netProfit / row.shopeePrice : 0;
      const minShopeePrice = Math.round((row.variableCost + 3000) / (1 - 0.11 - 0.03 - 0.35));
      const recommendation = netMargin >= 0.35 ? "Ổn" : "Theo dõi chặt";
      
      return {
        product: row.name,
        zaloPrice: row.directPrice,
        shopeePrice: row.shopeePrice,
        increaseRate: row.directPrice > 0 ? (row.shopeePrice - row.directPrice) / row.directPrice : 0.15,
        variableCost: row.variableCost,
        netProfit,
        netMargin,
        minShopeePrice,
        recommendation
      };
    });
  }, [liveProducts]);

  const liveSummary = useMemo(() => {
    const totalCapexBase = capexList.reduce((sum, item) => sum + item.baseCost, 0);
    const totalDepreciationPerMonth = capexList.reduce((sum, item) => sum + item.depreciationPerMonth, 0);
    const fixedCostWithOwnerSalary = fixedCostsList.reduce((sum, item) => sum + item.monthlyCost, 0);
    const fixedCostWithoutOwnerSalary = fixedCostsList
      .filter((item) => item.item !== "Lương/chủ shop tự trả tối thiểu")
      .reduce((sum, item) => sum + item.monthlyCost, 0);
    
    let weightedAov = 0;
    let weightedVariableCost = 0;
    let totalMix = 0;
    
    liveProducts.forEach(p => {
      weightedAov += p.directPrice * p.mix;
      weightedVariableCost += p.variableCost * p.mix;
      totalMix += p.mix;
    });
    
    if (totalMix > 0) {
      weightedAov = weightedAov / totalMix;
      weightedVariableCost = weightedVariableCost / totalMix;
    } else {
      weightedAov = printShopSummary.weightedAov;
      weightedVariableCost = printShopSummary.weightedVariableCost;
    }
    
    const feeRate = 0.023;
    const contributionPerOrder = weightedAov * (1 - feeRate) - weightedVariableCost;
    const breakEvenOrdersPerMonth = contributionPerOrder > 0 ? Math.ceil(fixedCostWithOwnerSalary / contributionPerOrder) : 0;
    const breakEvenOrdersPerDay = parseFloat((breakEvenOrdersPerMonth / 30).toFixed(1));
    const breakEvenRevenuePerMonth = Math.round(breakEvenOrdersPerMonth * weightedAov);
    
    return {
      weightedAov,
      weightedVariableCost,
      contributionPerOrder,
      breakEvenOrdersPerMonth,
      breakEvenOrdersPerDay,
      breakEvenRevenuePerMonth,
      totalCapexBase,
      totalDepreciationPerMonth,
      fixedCostWithOwnerSalary,
      fixedCostWithoutOwnerSalary,
      paybackMonth: printShopSummary.paybackMonth,
    };
  }, [liveProducts, capexList, fixedCostsList]);

  const liveKpis = useMemo(() => {
    return [
      { label: "AOV bình quân sau mix kênh", value: Math.round(liveSummary.weightedAov), unit: "VND/đơn", note: "Tính toán từ giá bán thực tế của các sản phẩm" },
      { label: "Biến phí sản xuất bình quân", value: Math.round(liveSummary.weightedVariableCost), unit: "VND/đơn", note: "Tính toán từ giá vốn sản phẩm" },
      { label: "Phí kênh bình quân", value: 0.023, unit: "% doanh thu", note: "Tỉ lệ ước tính theo mix kênh" },
      { label: "Biên lãi gộp sản xuất", value: parseFloat(((liveSummary.weightedAov - liveSummary.weightedVariableCost) / (liveSummary.weightedAov || 1)).toFixed(2)), unit: "%", note: "Mục tiêu tối thiểu 40%" },
      { label: "Lãi đóng góp/đơn", value: Math.round(liveSummary.contributionPerOrder), unit: "VND/đơn", note: "Sau khi khấu trừ biến phí và phí kênh" },
      { label: "Hòa vốn số đơn/ngày", value: liveSummary.breakEvenOrdersPerDay, unit: "đơn/ngày", note: "Số đơn cần đạt để hòa vốn chi phí cố định" },
      { label: "Doanh thu hòa vốn/tháng", value: liveSummary.breakEvenRevenuePerMonth, unit: "VND/tháng", note: "Doanh thu tối thiểu cần duy trì" },
      { label: "Vốn đầu tư thiết bị (CAPEX)", value: liveSummary.totalCapexBase, unit: "VND", note: "Tổng chi phí mua sắm thiết bị ban đầu" },
    ];
  }, [liveSummary]);

  const actualStatsThisMonth = useMemo(() => {
    const startStr = startOfMonth(new Date()).toISOString();
    const validOrders = (orders || []).filter((o: any) => {
      const date = o.order_date || o.created_at;
      return date >= startStr && ["delivered", "confirmed", "processing", "shipping"].includes(o.status);
    });
    
    const count = validOrders.length;
    const revenue = validOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    
    // Dynamic COGS calculation from BOM local
    const getProductCostPriceLocal = (productId: string, directCost?: number | null) => {
      const rawBom = localStorage.getItem("erp-mini-local-demo-product-bom");
      const bomItems = rawBom ? JSON.parse(rawBom) : [];
      const activeBom = bomItems.filter((b: any) => b.product_id === productId);
      if (activeBom.length > 0) {
        const productMap = new Map((products || []).map((p: any) => [p.id, p]));
        return activeBom.reduce((sum: number, b: any) => {
          const material = productMap.get(b.material_id);
          return sum + ((material?.cost_price || 0) * b.quantity);
        }, 0);
      }
      return directCost || 0;
    };

    let cogs = 0;
    validOrders.forEach((o: any) => {
      o.order_items?.forEach((item: any) => {
        const prod = products?.find((p: any) => p.id === item.product_id);
        cogs += getProductCostPriceLocal(item.product_id, prod ? prod.cost_price : 0) * item.quantity;
      });
    });
    
    return {
      orders: count,
      revenue,
      grossProfit: revenue - cogs,
    };
  }, [orders, products]);

  const liveMonthlyPlan = useMemo(() => {
    let prevEndingCash = 30000000;
    let prevCumulativeOcf = 0;
    
    return Array.from({ length: 24 }).map((_, index) => {
      const monthLabel = `Tháng ${index + 1}`;
      
      const rawOrdersPerDay = assumedOrdersPerDay * Math.pow(1 + assumedGrowthRate / 100, index);
      const planOrdersPerDay = Math.min(parseFloat(rawOrdersPerDay.toFixed(1)), assumedMaxCapacity);
      const planOrders = Math.round(planOrdersPerDay * 30);
      const planRevenue = planOrders * assumedAov;
      const planGrossProfit = planRevenue * (assumedMargin / 100);
      
      const planMarketing = assumedMktCost;
      const planFeesAndShipping = Math.round(planRevenue * 0.068 + planOrders * 3500);
      const planFixedCosts = assumedFixedCost;
      const planOperatingCashCost = planMarketing + planFixedCosts + planFeesAndShipping;
      
      let ocf = planGrossProfit - planMarketing - planFixedCosts - planFeesAndShipping;
      let revenue = planRevenue;
      let orders = planOrders;
      let grossProfit = planGrossProfit;
      let ordersPerDay = planOrdersPerDay;
      let operatingCashCost = planOperatingCashCost;

      if (index === 0) {
        revenue = actualStatsThisMonth.revenue > 0 ? actualStatsThisMonth.revenue : planRevenue;
        orders = actualStatsThisMonth.orders > 0 ? actualStatsThisMonth.orders : planOrders;
        grossProfit = actualStatsThisMonth.revenue > 0 ? actualStatsThisMonth.grossProfit : planGrossProfit;
        ordersPerDay = parseFloat((orders / 30).toFixed(1));
        
        const actualFeesAndShipping = Math.round(revenue * 0.068 + orders * 3500);
        operatingCashCost = planMarketing + planFixedCosts + actualFeesAndShipping;
        ocf = grossProfit - planMarketing - planFixedCosts - actualFeesAndShipping;
      }
      
      prevCumulativeOcf += ocf;
      const endingCash = prevEndingCash + ocf;
      prevEndingCash = endingCash;
      
      return {
        month: monthLabel,
        ordersPerDay,
        orders,
        revenue,
        grossProfit,
        marketing: planMarketing,
        operatingCashCost,
        operatingCashFlow: ocf,
        cumulativeOperatingCashFlow: prevCumulativeOcf,
        endingCash,
        capacityUse: parseFloat(((ordersPerDay / assumedMaxCapacity) * 100).toFixed(1))
      };
    });
  }, [
    assumedOrdersPerDay, assumedAov, assumedMargin, assumedGrowthRate, assumedMktCost, assumedFixedCost, assumedMaxCapacity, actualStatsThisMonth
  ]);

  // Recalculate Custom Scenario based on simulator factors
  const customScenario = useMemo(() => {
    const baseAov = liveSummary.weightedAov;
    const baseCost = liveSummary.weightedVariableCost;
    
    const newAov = baseAov * simPriceFactor;
    const newCost = baseCost * simCostFactor;
    
    // Total Year 1 calculations
    let totalRevenue = 0;
    let totalVariableCosts = 0;
    let totalMarketing = 0;
    let totalFixedCosts = 0;
    let totalTaxes = 0;
    let totalFees = 0;
    let totalShippingSupport = 0;
    let totalOperatingCashFlow = 0;
    
    // Simulate each of the first 12 months
    const simulatedMonths = liveMonthlyPlan.slice(0, 12).map((m, idx) => {
      const ordersCount = Math.round(m.orders * simOrderFactor);
      const mkt = m.marketing * simMktFactor;
      
      const rev = ordersCount * newAov;
      const varCost = ordersCount * newCost;
      
      // Taxes (4.5% of revenue)
      const tax = rev * 0.045;
      
      // Fees (weighted channel fee rate: Zalo 45% - 0.5%, FB 35% - 0.5%, Shopee 20% - 9.5% + 3k fixed fee)
      const fee = rev * 0.023 + ordersCount * 600;
      
      // Shipping support: 50% of orders get 7,000đ support -> 3,500đ average per order
      const shipSupport = ordersCount * 3500;
      
      // Fixed Cost (excluding owner salary + marketing)
      const baseFixed = 3550000;
      const ownerSalary = 5000000;
      
      // Part-time labor: triggers at high volume
      let partTimeLabor = 0;
      const dailyOrders = ordersCount / 26;
      if (dailyOrders >= 10 && dailyOrders < 15) {
        partTimeLabor = 2000000;
      } else if (dailyOrders >= 15 && dailyOrders < 19) {
        partTimeLabor = 2500000;
      } else if (dailyOrders >= 19) {
        partTimeLabor = 4500000;
      }
      
      const totalFixed = baseFixed + ownerSalary + partTimeLabor;
      
      // Cash flow = Revenue - Variable Costs - Tax - Fees - Ship Support - Marketing - Fixed Costs
      const ocf = rev - varCost - tax - fee - shipSupport - mkt - totalFixed;
      
      totalRevenue += rev;
      totalVariableCosts += varCost;
      totalMarketing += mkt;
      totalFixedCosts += totalFixed;
      totalTaxes += tax;
      totalFees += fee;
      totalShippingSupport += shipSupport;
      totalOperatingCashFlow += ocf;

      return {
        month: m.month,
        orders: ordersCount,
        revenue: rev,
        ocf,
      };
    });

    const capex = 51900000; // base CAPEX
    let paybackMonth = "Chưa hoàn vốn";
    let cumulative = 0;
    
    for (let i = 0; i < 12; i++) {
      cumulative += simulatedMonths[i].ocf;
      if (cumulative >= capex) {
        paybackMonth = `Tháng ${i + 1}`;
        break;
      }
    }

    let decision = "Có thể mở rộng có kiểm soát";
    if (totalOperatingCashFlow < 0) {
      decision = "Không nên triển khai / Cần tối ưu chi phí";
    } else if (totalOperatingCashFlow < 30000000) {
      decision = "Thận trọng, giữ quy mô nhỏ và tối ưu biến phí";
    } else if (totalOperatingCashFlow > 120000000) {
      decision = "Cực kỳ khả thi, đẩy mạnh marketing và tự động hóa";
    }

    return {
      t12OrdersPerDay: (liveMonthlyPlan[11].ordersPerDay * simOrderFactor).toFixed(1),
      aov: newAov,
      variableCost: newCost,
      yearOneRevenue: totalRevenue,
      yearOneOperatingCashFlow: totalOperatingCashFlow,
      payback: paybackMonth,
      decision,
      months: simulatedMonths,
    };
  }, [simOrderFactor, simPriceFactor, simCostFactor, simMktFactor, liveSummary, liveMonthlyPlan]);


  // Operational Risk Thresholds
  const riskThresholds = [
    {
      domain: "Shopee",
      safeLimit: "≤20% doanh thu 6T đầu",
      reading: "Nếu phí/voucher làm biên ròng <20% thì tăng giá hoặc ngừng voucher",
      status: "Theo dõi",
      sheet: "11_Phi_Shopee",
      action: "Tăng giá Shopee 15-20%, giảm voucher",
      note: "Shopee kéo khách mới, không làm kênh chính",
      variant: "outline" as const,
    },
    {
      domain: "Hủy/Hoàn/COD",
      safeLimit: "Hủy + hoàn ≤5% đơn",
      reading: "Nếu tiền treo COD tăng, bắt buộc tăng cọc đơn custom",
      status: "Theo dõi",
      sheet: "12_Huy_Hoan_COD",
      action: "Tăng cọc, chặn đơn rủi ro, xác nhận file trước in",
      note: "Đơn in theo yêu cầu cần cọc rõ ràng",
      variant: "outline" as const,
    },
    {
      domain: "Công suất",
      safeLimit: "Utilization ≤85%",
      reading: "Trên 85% kéo dài 2-3 tuần thì cần hỗ trợ bán thời gian",
      status: "Theo dõi",
      sheet: "13_Cong_suat",
      action: "Thuê part-time hoặc giảm sản phẩm tốn công",
      note: "Tránh vỡ đơn khi tăng đơn hàng nhanh",
      variant: "secondary" as const,
    },
    {
      domain: "CAC / Quay lại",
      safeLimit: "CAC ≤35% đóng góp/đơn",
      reading: "CAC tăng mà tỷ lệ quay lại thấp là dấu hiệu đốt tiền",
      status: "Theo dõi",
      sheet: "14_CAC_Quay_lai",
      action: "Giảm ads, chuyển hướng referral/nhóm địa phương",
      note: "Không tăng ads khi chưa có ảnh thật/feedback",
      variant: "outline" as const,
    },
    {
      domain: "Giá cạnh tranh",
      safeLimit: "Biên ròng mục tiêu ≥20%",
      reading: "Sản phẩm dưới giá sàn phải tăng giá, bán combo hoặc bỏ",
      status: "Theo dõi",
      sheet: "15_Gia_Canh_tranh",
      action: "Tăng giá, gom combo, outsource có kiểm soát",
      note: "Không bán phá giá dưới giá sản xuất",
      variant: "outline" as const,
    },
  ];

  // Helper to format currency
  const fmtVnd = (val: number) => {
    return val.toLocaleString("vi-VN") + " đ";
  };

  const fmtVndShort = (val: number) => {
    if (Math.abs(val) >= 1000000) {
      return (val / 1000000).toFixed(1) + "M";
    }
    return val.toLocaleString("vi-VN");
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={subTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSubTab("overview")}
          className="gap-1.5"
        >
          <ClipboardList className="h-4 w-4" />
          Tổng quan & Vận hành
        </Button>
        <Button
          variant={subTab === "pricing" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSubTab("pricing")}
          className="gap-1.5"
        >
          <PercentIcon className="h-4 w-4" />
          Chiết tính & Phí Shopee
        </Button>
        <Button
          variant={subTab === "calculator" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSubTab("calculator")}
          className="gap-1.5"
        >
          <Calculator className="h-4 w-4" />
          Tính giá nhanh
        </Button>
        <Button
          variant={subTab === "cashflow" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSubTab("cashflow")}
          className="gap-1.5"
        >
          <TrendingUp className="h-4 w-4" />
          Dòng tiền 24 Tháng
        </Button>
        <Button
          variant={subTab === "simulator" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSubTab("simulator")}
          className="gap-1.5"
        >
          <Sliders className="h-4 w-4" />
          Mô phỏng Kịch bản
        </Button>
        <Button
          variant={subTab === "capex" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSubTab("capex")}
          className="gap-1.5"
        >
          <Coins className="h-4 w-4" />
          CAPEX & Chi phí cố định
        </Button>
        <Button
          variant={subTab === "capacity" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSubTab("capacity")}
          className="gap-1.5"
        >
          <Activity className="h-4 w-4" />
          Phân tích Công suất
        </Button>
        <Button
          variant={subTab === "settings" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSubTab("settings")}
          className="gap-1.5"
        >
          <Settings className="h-4 w-4" />
          Cấu hình & Thiết lập
        </Button>
      </div>

      {/* OVERVIEW SUBTAB */}
      {subTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/orders?view=list")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">AOV Bình Quân</span>
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xl font-bold text-foreground mt-2">{fmtVnd(liveSummary.weightedAov)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Đã tính tỷ lệ mix kênh</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 border-indigo-500/20 cursor-pointer hover:border-indigo-500/50 transition-all hover:bg-muted/5" onClick={() => navigate("/inventory")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Biên Lãi Gộp SX</span>
                  <PercentIcon className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-xl font-bold text-foreground mt-2">
                  {(((liveSummary.weightedAov - liveSummary.weightedVariableCost) / (liveSummary.weightedAov || 1)) * 100).toFixed(1)}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Mục tiêu an toàn: ≥ 40%</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20 cursor-pointer hover:border-emerald-500/50 transition-all hover:bg-muted/5" onClick={() => navigate("/accounting")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Hòa Vốn Đơn Hàng</span>
                  <Calculator className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-xl font-bold text-foreground mt-2">{liveSummary.breakEvenOrdersPerDay} đơn/ngày</p>
                <p className="text-[10px] text-muted-foreground mt-1">DT hòa vốn: {fmtVndShort(liveSummary.breakEvenRevenuePerMonth)}/tháng</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20 cursor-pointer hover:border-amber-500/50 transition-all hover:bg-muted/5" onClick={() => navigate("/accounting")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Hoàn Vốn CAPEX</span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-xl font-bold text-foreground mt-2">{liveSummary.paybackMonth} tháng</p>
                <p className="text-[10px] text-muted-foreground mt-1">Lũy kế dòng tiền thực tế</p>
              </CardContent>
            </Card>
          </div>


          {/* executive summaries & advice */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Mảng kiểm soát vận hành & Ngưỡng an toàn (Operational Thresholds)
                </CardTitle>
                <CardDescription>Các chỉ số sinh mạng cần theo dõi chặt chẽ để đảm bảo mô hình kinh doanh tại nhà có lãi ròng.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-xs">
                        <th className="text-left p-3 font-medium text-muted-foreground">Mảng theo dõi</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Ngưỡng an toàn</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Cách đọc cảnh báo</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Hành động khi vượt ngưỡng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskThresholds.map((row) => (
                        <tr
                          key={row.domain}
                          className="border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer"
                          onClick={() => {
                            if (row.domain === "Shopee") {
                              navigate("/orders?view=list&search=shopee");
                            } else if (row.domain === "Hủy/Hoàn/COD") {
                              navigate("/orders?view=list&status=cancelled");
                            } else if (row.domain === "CAC / Quay lại") {
                              navigate("/orders?view=list");
                            } else if (row.domain === "Công suất") {
                              navigate("/inventory?tab=production");
                            } else if (row.domain === "Giá cạnh tranh") {
                              navigate("/inventory?stock=low");
                            }
                          }}
                        >
                          <td className="p-3 font-semibold text-foreground">{row.domain}</td>
                          <td className="p-3 text-xs text-muted-foreground">
                            <Badge variant={row.variant}>{row.safeLimit}</Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{row.reading}</td>
                          <td className="p-3 text-xs font-medium text-primary">{row.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Kết luận điều hành V5
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">1</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Mặt bằng tại nhà giúp giảm mạnh chi phí cố định: <strong>không tính tiền thuê/cọc</strong>, nhưng vẫn phải tính điện, công cụ số, bảo trì và công chủ shop.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">2</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Kênh chính nên là <strong>Zalo + Facebook</strong> để giữ biên lợi nhuận cao; Shopee dùng để mở rộng tệp nhưng bắt buộc phải có giá bán riêng cao hơn 10-15%.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">3</div>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Không miễn phí giao hàng toàn bộ</strong>. Chỉ hỗ trợ bình quân 7.000đ cho khoảng 50% số đơn hàng để tránh bào mòn hết phần lãi.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">4</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Vốn an toàn chuẩn bị khoảng <strong>85 triệu đồng</strong>. Khi vượt 12-15 đơn/ngày mới nên tuyển hỗ trợ bán thời gian để tránh quá tải.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* QUICK CALCULATOR SUBTAB */}
      {subTab === "calculator" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Input Card */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Thông số chi phí & cấu hình tính giá nhanh
                </CardTitle>
                <CardDescription>
                  Chọn mẫu sản phẩm định sẵn hoặc tự chỉnh sửa các chi phí vật tư, nhân công để tính toán biên lợi nhuận trực tiếp và giá sàn Shopee tối ưu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Preset Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="preset-select" className="font-semibold text-xs">Mẫu sản phẩm định sẵn</Label>
                  <select
                    id="preset-select"
                    value={calcPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="custom">-- Tự cấu hình (Custom Product) --</option>
                    <option value="sticker">Sticker Logo Decal giấy (100 tem)</option>
                    <option value="card">Card cảm ơn (100 card)</option>
                    <option value="qr_board">Bảng QR để bàn mica</option>
                    <option value="qr_sticker">Tem QR thanh toán (50 tem)</option>
                    <option value="qr_card">Thẻ QR cá nhân</option>
                    <option value="combo">Combo Shop mới khởi nghiệp</option>
                    <option value="avatar">Dịch vụ thiết kế Avatar & QR</option>
                    <option value="box">Bao bì/Hộp gia công nhỏ</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Direct pricing inputs */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Thông số biến phí sản xuất</h4>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="calc-sell-price" className="text-xs">Giá bán trực tiếp Zalo/FB (đ)</Label>
                      <Input
                        id="calc-sell-price"
                        type="number"
                        min="0"
                        step="1000"
                        value={calcSellingPrice}
                        onChange={(e) => setCalcSellingPrice(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="calc-mat-cost" className="text-xs">Chi phí vật tư trực tiếp (đ)</Label>
                      <Input
                        id="calc-mat-cost"
                        type="number"
                        min="0"
                        step="500"
                        value={calcMaterialCost}
                        onChange={(e) => setCalcMaterialCost(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="calc-ink-cost" className="text-xs">Mực in & hao mòn máy móc (đ)</Label>
                      <Input
                        id="calc-ink-cost"
                        type="number"
                        min="0"
                        step="500"
                        value={calcInkCost}
                        onChange={(e) => setCalcInkCost(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="calc-proc-cost" className="text-xs">Gia công & đóng gói (đ)</Label>
                      <Input
                        id="calc-proc-cost"
                        type="number"
                        min="0"
                        step="500"
                        value={calcProcessingCost}
                        onChange={(e) => setCalcProcessingCost(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="calc-labor-mins" className="text-xs">Thời gian (phút)</Label>
                        <Input
                          id="calc-labor-mins"
                          type="number"
                          min="0"
                          value={calcLaborMinutes}
                          onChange={(e) => setCalcLaborMinutes(Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="calc-waste-rate" className="text-xs">Tỷ lệ hao hụt (%)</Label>
                        <Input
                          id="calc-waste-rate"
                          type="number"
                          min="0"
                          max="50"
                          value={calcWastePercent}
                          onChange={(e) => setCalcWastePercent(Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="calc-labor-rate" className="text-xs">Lương chủ shop/giờ (đ/giờ)</Label>
                      <Input
                        id="calc-labor-rate"
                        type="number"
                        min="0"
                        step="1000"
                        value={calcLaborRate}
                        onChange={(e) => setCalcLaborRate(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="calc-design-fee" className="text-xs">Công thiết kế ban đầu (đ)</Label>
                      <Input
                        id="calc-design-fee"
                        type="number"
                        min="0"
                        step="10000"
                        value={calcDesignFee}
                        onChange={(e) => setCalcDesignFee(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="calc-revisions" className="text-xs">Số lần sửa mẫu</Label>
                        <Input
                          id="calc-revisions"
                          type="number"
                          min="0"
                          value={calcRevisions}
                          onChange={(e) => setCalcRevisions(Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="calc-rev-rate" className="text-xs">Phí/lần sửa (đ)</Label>
                        <Input
                          id="calc-rev-rate"
                          type="number"
                          min="0"
                          step="5000"
                          value={calcRevisionRate}
                          onChange={(e) => setCalcRevisionRate(Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Shopee fees configuration */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-destructive uppercase tracking-wider">Thông số phí sàn Shopee</h4>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="calc-shopee-tx" className="text-xs">Phí GD Shopee (%)</Label>
                        <Input
                          id="calc-shopee-tx"
                          type="number"
                          min="0"
                          max="20"
                          step="0.1"
                          value={calcShopeeTxFee}
                          onChange={(e) => setCalcShopeeTxFee(Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="calc-shopee-comm" className="text-xs">Phí cố định (%)</Label>
                        <Input
                          id="calc-shopee-comm"
                          type="number"
                          min="0"
                          max="20"
                          step="0.1"
                          value={calcShopeeCommFee}
                          onChange={(e) => setCalcShopeeCommFee(Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="calc-shopee-voucher" className="text-xs">Voucher/Freeship (%)</Label>
                        <Input
                          id="calc-shopee-voucher"
                          type="number"
                          min="0"
                          max="20"
                          step="0.1"
                          value={calcShopeeVoucherFee}
                          onChange={(e) => setCalcShopeeVoucherFee(Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="calc-shopee-flat" className="text-xs">Phí hạ tầng (đ/đơn)</Label>
                        <Input
                          id="calc-shopee-flat"
                          type="number"
                          min="0"
                          step="500"
                          value={calcShopeeFlatFee}
                          onChange={(e) => setCalcShopeeFlatFee(Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="calc-shopee-cancel" className="text-xs">Hoàn/Hủy Shopee (%)</Label>
                        <Input
                          id="calc-shopee-cancel"
                          type="number"
                          min="0"
                          max="20"
                          step="0.1"
                          value={calcShopeeCancelRate}
                          onChange={(e) => setCalcShopeeCancelRate(Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="calc-shopee-tax" className="text-xs">Thuế trực tiếp (%)</Label>
                        <Input
                          id="calc-shopee-tax"
                          type="number"
                          min="0"
                          max="20"
                          step="0.1"
                          value={calcShopeeTaxRate}
                          onChange={(e) => setCalcShopeeTaxRate(Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="calc-shopee-target" className="text-xs">Biên ròng mục tiêu (%)</Label>
                        <Input
                          id="calc-shopee-target"
                          type="number"
                          min="0"
                          max="80"
                          value={calcShopeeTargetMargin}
                          onChange={(e) => setCalcShopeeTargetMargin(Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="calc-ads-fee" className="text-xs font-semibold text-primary">Chi phí Ads (%)</Label>
                        <Input
                          id="calc-ads-fee"
                          type="number"
                          min="0"
                          max="50"
                          step="0.5"
                          value={calcAdsFee}
                          onChange={(e) => setCalcAdsFee(Number(e.target.value))}
                          className="h-8 text-xs font-mono border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Results Column */}
            <div className="space-y-6">
              
              {/* WARNING BOX FOR LOW MARGIN PROCESSING PRODUCTS */}
              {calcPreset === "box" && calcResults.grossMargin < 35 && (
                <div className="p-3.5 rounded-lg border border-yellow-200 bg-yellow-50 text-xs text-yellow-800 leading-relaxed space-y-1 shadow-xs">
                  <div className="font-semibold flex items-center gap-1.5 text-yellow-900">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                    Cảnh báo: Sản phẩm biên lợi nhuận thấp
                  </div>
                  <p className="text-yellow-800/90 text-[11px] leading-tight">
                    Sản phẩm bao bì/hộp gia công nhỏ có biên gộp hiện tại là <span className="font-semibold">{calcResults.grossMargin.toFixed(1)}%</span> (dưới ngưỡng tối thiểu 35%). 
                    <span className="font-semibold text-yellow-900 block mt-1">✓ Chỉ nhận đơn khi có cọc 50%+ và đủ điều kiện lợi nhuận quy định.</span>
                  </p>
                </div>
              )}
              
              {/* Direct selling margin card */}
              <Card className="border border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Kênh trực tiếp (Facebook / Zalo)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Biên lợi nhuận gộp trực tiếp</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className={`text-2xl font-bold ${calcResults.grossMargin >= 50 ? "text-success" : calcResults.grossMargin >= 40 ? "text-amber-500" : "text-destructive"}`}>
                        {calcResults.grossMargin.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground">Lãi: {fmtVnd(calcResults.grossProfit)}</span>
                    </div>
                    <Progress 
                      value={Math.min(100, Math.max(0, calcResults.grossMargin))} 
                      className="h-2 mt-2 bg-secondary"
                    />
                  </div>

                  <div className="space-y-2 text-xs border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chi phí lao động:</span>
                      <span className="font-mono">{fmtVnd(calcResults.laborCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tổng biến phí SX / đơn:</span>
                      <span className="font-mono font-semibold">{fmtVnd(calcResults.variableCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Giá tối thiểu hòa vốn:</span>
                      <span className="font-mono text-muted-foreground">{fmtVnd(Math.round(calcResults.variableCost / 0.6))} (Biên 40%)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-md text-[11px] leading-relaxed bg-slate-50 border border-slate-100">
                    {calcResults.grossMargin >= 50 ? (
                      <p className="text-success font-medium">
                        ✓ Biên lãi gộp tối ưu! Kênh trực tiếp này vô cùng khỏe, đảm bảo an toàn cho chi phí cố định.
                      </p>
                    ) : calcResults.grossMargin >= 40 ? (
                      <p className="text-amber-500 font-medium">
                        ! Biên khá. Cân nhắc bán theo combo để nâng giá trị trung bình đơn (AOV) nhằm giảm áp lực.
                      </p>
                    ) : (
                      <p className="text-destructive font-medium">
                        ⚠ Cảnh báo biên thấp! Bạn cần tăng giá bán hoặc giảm hao hụt/vật tư để tránh lỗ vốn vận hành.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Shopee pricing suggestion card */}
              <Card className="border border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                    <ShoppingCart className="h-4 w-4" />
                    Kênh Sàn Shopee Đề Xuất
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Giá bán Shopee tối thiểu đề xuất</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl font-bold text-destructive">
                        {fmtVnd(calcResults.shopeePrice)}
                      </span>
                      <span className="text-xs text-success font-semibold">Lãi ròng: {fmtVnd(calcResults.shopeeNetProfit)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-t border-destructive/10 pt-3">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Phí xử lý giao dịch ({calcShopeeTxFee}%):</span>
                      <span className="font-mono">-{fmtVnd(calcResults.shopeeTx)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Phí cố định ngành hàng ({calcShopeeCommFee}%):</span>
                      <span className="font-mono">-{fmtVnd(calcResults.shopeeComm)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Voucher / Gói FS ({calcShopeeVoucherFee}%):</span>
                      <span className="font-mono">-{fmtVnd(calcResults.shopeeVoucher)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Phí cố định khác / đơn:</span>
                      <span className="font-mono">-{fmtVnd(calcShopeeFlatFee)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground font-semibold text-primary">
                      <span>Chi phí Quảng cáo Ads ({calcAdsFee}%):</span>
                      <span className="font-mono">-{fmtVnd(calcResults.shopeeAds)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-amber-600">
                      <span>Công thiết kế & Sửa mẫu:</span>
                      <span className="font-mono">-{fmtVnd(calcResults.designCostTotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Phòng ngừa hoàn hủy ({calcShopeeCancelRate}%):</span>
                      <span className="font-mono">-{fmtVnd(calcResults.shopeeCancel)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Thuế trực tiếp nhà nước ({calcShopeeTaxRate}%):</span>
                      <span className="font-mono">-{fmtVnd(calcResults.shopeeTax)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-dashed pt-2 text-foreground">
                      <span>Biên ròng Shopee thực tế:</span>
                      <span>{calcResults.shopeeNetMargin.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-md text-[11px] leading-relaxed bg-white/70 dark:bg-black/20 border border-destructive/10">
                    <p className="text-muted-foreground">
                      * Shopee thu tổng phí trung bình khoảng <strong>{calcResults.shopeePrice > 0 ? ((calcResults.shopeeTx + calcResults.shopeeComm + calcResults.shopeeVoucher + calcShopeeFlatFee + calcResults.shopeeCancel + calcResults.shopeeTax) / calcResults.shopeePrice * 100).toFixed(1) : 0}%</strong> trên đơn hàng này. Bắt buộc phải nâng giá bán riêng so với Zalo/FB để hấp thụ phí sàn!
                    </p>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>
        </div>
      )}

      {/* PRICING & SHOPEE FEES SUBTAB */}
      {subTab === "pricing" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Chiết tính giá sản phẩm & So sánh biên lợi nhuận
              </CardTitle>
              <CardDescription>
                So sánh giá trực tiếp (Zalo/FB) và giá Shopee đề xuất sau khi hấp thụ toàn bộ biến phí (vật tư, mực in, đóng gói, lao động, tỷ lệ hao hụt).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs">
                      <th className="text-left p-3 font-medium text-muted-foreground">Sản phẩm</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Quy cách</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Tỷ trọng</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Giá trực tiếp</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Giá Shopee</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Biến phí SX</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Lãi gộp TT</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Biên gộp TT</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Giá sàn GM mục tiêu</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveProducts.map((row) => (
                      <tr
                        key={row.name}
                        className="border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer"
                        onClick={() => navigate(`/inventory?search=${encodeURIComponent(row.name)}`)}
                      >
                        <td className="p-3 font-medium text-foreground">{row.name}</td>
                        <td className="p-3 text-xs text-muted-foreground">{row.spec}</td>
                        <td className="p-3 text-right text-xs">{(row.mix * 100).toFixed(0)}%</td>
                        <td className="p-3 text-right font-medium">{fmtVnd(row.directPrice)}</td>
                        <td className="p-3 text-right text-primary font-medium">{fmtVnd(row.shopeePrice)}</td>
                        <td className="p-3 text-right text-xs text-muted-foreground">{fmtVnd(row.variableCost)}</td>
                        <td className="p-3 text-right text-xs text-success font-semibold">{fmtVnd(row.grossProfit)}</td>
                        <td className="p-3 text-right text-xs font-semibold">{(row.grossMargin * 100).toFixed(1)}%</td>
                        <td className="p-3 text-right text-xs text-muted-foreground">{fmtVnd(row.minPrice)}</td>
                        <td className="p-3 text-center">
                          <Badge variant={row.status === "Trong vùng cạnh tranh" ? "default" : "destructive"} className="text-[10px]">
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PercentIcon className="h-5 w-5 text-primary" />
                  Bóc tách Phí Sàn Shopee & Biên ròng thực nhận
                </CardTitle>
                <CardDescription>
                  Shopee tính phí cố định, phí thanh toán, voucher và flat fee trên từng đơn hàng. Nếu không nâng giá bán riêng, lợi nhuận sẽ bị ăn mòn nghiêm trọng.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-xs">
                        <th className="text-left p-3 font-medium text-muted-foreground">Sản phẩm</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Giá Shopee</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Mức tăng giá</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Phí sàn ước tính</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Lãi ròng Shopee</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Biên ròng Shopee</th>
                        <th className="text-center p-3 font-medium text-muted-foreground">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveShopeeFees.map((row) => {
                        const shopeeFeePercent = (row.shopeePrice * 0.11 + 3000 + row.shopeePrice * 0.03);
                        return (
                          <tr
                            key={row.product}
                            className="border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer"
                            onClick={() => navigate(`/inventory?search=${encodeURIComponent(row.product)}`)}
                          >
                            <td className="p-3 font-medium text-foreground">{row.product}</td>
                            <td className="p-3 text-right font-medium text-primary">{fmtVnd(row.shopeePrice)}</td>
                            <td className="p-3 text-right text-xs text-muted-foreground">+{(row.increaseRate * 100).toFixed(1)}%</td>
                            <td className="p-3 text-right text-xs text-destructive">{fmtVnd(Math.round(shopeeFeePercent))}</td>
                            <td className="p-3 text-right text-xs text-success font-semibold">{fmtVnd(Math.round(row.netProfit))}</td>
                            <td className="p-3 text-right text-xs font-semibold">{(row.netMargin * 100).toFixed(1)}%</td>
                            <td className="p-3 text-center">
                              <Badge variant={row.recommendation === "Ổn" ? "secondary" : "destructive"} className="text-[10px]">
                                {row.recommendation}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Cấu trúc phí sàn cấu hình
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="flex justify-between font-medium">
                    <span>Phí xử lý giao dịch:</span>
                    <span className="text-destructive">6.0%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Phí cố định của sàn áp dụng cho thẻ/COD/chuyển khoản.</p>
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between font-medium">
                    <span>Phí cố định ngành hàng:</span>
                    <span className="text-destructive">3.5%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Phí commission tùy ngành hàng in ấn/quà tặng.</p>
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between font-medium">
                    <span>Voucher & Freeship Xtra:</span>
                    <span className="text-destructive">1.5%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Dự phòng tham gia các gói hỗ trợ kéo traffic.</p>
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between font-medium">
                    <span>Phí hạ tầng / đơn:</span>
                    <span className="text-destructive">3.000 đ</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Phí flat fee cố định tính trên mỗi đơn hàng.</p>
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between font-medium">
                    <span>Tỷ lệ hoàn hủy COD:</span>
                    <span className="text-destructive">3.0%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Dự phòng rủi ro khách bùng hàng/hoàn đơn.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 24-MONTH CASH FLOW SUBTAB */}
      {subTab === "cashflow" && (
        <div className="space-y-6">
          {/* ASSUMPTIONS PANEL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                Thông số giả định lập Kế hoạch Dòng tiền & Công suất
              </CardTitle>
              <CardDescription>
                Điều chỉnh các thông số giả định để hệ thống tự động lập và mô phỏng kế hoạch dòng tiền 24 tháng.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Đơn/Ngày ban đầu</Label>
                  <Input type="number" value={assumedOrdersPerDay} onChange={e => setAssumedOrdersPerDay(Number(e.target.value))} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Giá trị đơn TB (AOV - đ)</Label>
                  <Input type="number" value={assumedAov} onChange={e => setAssumedAov(Number(e.target.value))} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Biên lãi gộp (%)</Label>
                  <Input type="number" value={assumedMargin} onChange={e => setAssumedMargin(Number(e.target.value))} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tăng trưởng đơn/tháng (%)</Label>
                  <Input type="number" value={assumedGrowthRate} onChange={e => setAssumedGrowthRate(Number(e.target.value))} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Marketing hằng tháng (đ)</Label>
                  <Input type="number" value={assumedMktCost} onChange={e => setAssumedMktCost(Number(e.target.value))} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Vận hành cố định (đ)</Label>
                  <Input type="number" value={assumedFixedCost} onChange={e => setAssumedFixedCost(Number(e.target.value))} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Công suất tối đa (đơn/ngày)</Label>
                  <Input type="number" value={assumedMaxCapacity} onChange={e => setAssumedMaxCapacity(Number(e.target.value))} className="h-8 text-xs font-mono" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PLAN VS ACTUAL COMPARISON TABLE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                So sánh Kế hoạch vs Thực hiện (Tháng 1)
              </CardTitle>
              <CardDescription>
                Bảng đối chiếu kết quả thực tế từ hệ thống với kịch bản kế hoạch dòng tiền giả định.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/60 text-muted-foreground border-b text-left">
                    <th className="p-3 font-medium">Chỉ tiêu</th>
                    <th className="text-right p-3 font-medium">Kế hoạch giả định</th>
                    <th className="text-right p-3 font-medium">Thực tế hệ thống</th>
                    <th className="text-right p-3 font-medium">Chênh lệch</th>
                    <th className="text-right p-3 font-medium">Tỷ lệ chênh lệch</th>
                    <th className="p-3 font-medium">Nguyên nhân & Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Số đơn hàng</td>
                    <td className="p-3 text-right font-mono">{Math.round(assumedOrdersPerDay * 30)} đơn</td>
                    <td className="p-3 text-right font-mono font-semibold text-primary">{actualStatsThisMonth.orders} đơn</td>
                    <td className="p-3 text-right font-mono text-rose-600">
                      {actualStatsThisMonth.orders - Math.round(assumedOrdersPerDay * 30)} đơn
                    </td>
                    <td className="p-3 text-right font-mono text-rose-600">
                      {Math.round(assumedOrdersPerDay * 30) > 0 
                        ? (((actualStatsThisMonth.orders - Math.round(assumedOrdersPerDay * 30)) / Math.round(assumedOrdersPerDay * 30)) * 100).toFixed(1) 
                        : "0.0"}%
                    </td>
                    <td className="p-3" rowSpan={4}>
                      <textarea
                        value={month1DiffReason}
                        onChange={e => setMonth1DiffReason(e.target.value)}
                        className="w-full h-24 p-2 text-xs border rounded bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Nhập lý do chênh lệch hoặc hành động khắc phục..."
                      />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Doanh thu</td>
                    <td className="p-3 text-right font-mono">{fmtVnd(Math.round(assumedOrdersPerDay * 30) * assumedAov)}</td>
                    <td className="p-3 text-right font-mono font-semibold text-primary">{fmtVnd(actualStatsThisMonth.revenue)}</td>
                    <td className="p-3 text-right font-mono text-rose-600">
                      {fmtVnd(actualStatsThisMonth.revenue - Math.round(assumedOrdersPerDay * 30) * assumedAov)}
                    </td>
                    <td className="p-3 text-right font-mono text-rose-600">
                      {Math.round(assumedOrdersPerDay * 30) * assumedAov > 0 
                        ? (((actualStatsThisMonth.revenue - Math.round(assumedOrdersPerDay * 30) * assumedAov) / (Math.round(assumedOrdersPerDay * 30) * assumedAov)) * 100).toFixed(1) 
                        : "0.0"}%
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Lợi nhuận gộp</td>
                    <td className="p-3 text-right font-mono">{fmtVnd(Math.round(assumedOrdersPerDay * 30) * assumedAov * (assumedMargin / 100))}</td>
                    <td className="p-3 text-right font-mono font-semibold text-primary">{fmtVnd(actualStatsThisMonth.grossProfit)}</td>
                    <td className="p-3 text-right font-mono text-rose-600">
                      {fmtVnd(actualStatsThisMonth.grossProfit - Math.round(assumedOrdersPerDay * 30) * assumedAov * (assumedMargin / 100))}
                    </td>
                    <td className="p-3 text-right font-mono text-rose-600">
                      {Math.round(assumedOrdersPerDay * 30) * assumedAov * (assumedMargin / 100) > 0 
                        ? (((actualStatsThisMonth.grossProfit - Math.round(assumedOrdersPerDay * 30) * assumedAov * (assumedMargin / 100)) / (Math.round(assumedOrdersPerDay * 30) * assumedAov * (assumedMargin / 100))) * 100).toFixed(1) 
                        : "0.0"}%
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Biên lợi nhuận gộp</td>
                    <td className="p-3 text-right font-mono">{assumedMargin.toFixed(1)}%</td>
                    <td className="p-3 text-right font-mono font-semibold text-primary">
                      {actualStatsThisMonth.revenue > 0 ? ((actualStatsThisMonth.grossProfit / actualStatsThisMonth.revenue) * 100).toFixed(1) : "0.0"}%
                    </td>
                    <td className="p-3 text-right font-mono text-rose-600">
                      {(actualStatsThisMonth.revenue > 0 ? (actualStatsThisMonth.grossProfit / actualStatsThisMonth.revenue * 100) - assumedMargin : -assumedMargin).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-mono text-rose-600">—</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Biểu đồ Dự báo Dòng tiền 24 Tháng (Kịch bản cơ sở)
              </CardTitle>
              <CardDescription>
                Mô tả dòng tiền vận hành (hằng tháng), số dư tiền cuối kỳ tích lũy dựa trên kế hoạch tăng trưởng từ 4 đơn/ngày lên 35 đơn/ngày.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveMonthlyPlan}>
                    <defs>
                      <linearGradient id="colorOcf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v/1000000}M`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [fmtVnd(value), ""]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorOcf)" name="Doanh thu/tháng" />
                    <Area type="monotone" dataKey="operatingCashFlow" stroke="#3B82F6" strokeWidth={2} fillOpacity={0} name="Dòng tiền VH" />
                    <Area type="monotone" dataKey="endingCash" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCash)" name="Số dư tiền mặt" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bảng dòng tiền chi tiết 24 tháng</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background border-b border-border z-10">
                    <tr className="bg-muted/60 text-muted-foreground">
                      <th className="text-left p-3 font-medium">Tháng</th>
                      <th className="text-right p-3 font-medium">Đơn/ngày</th>
                      <th className="text-right p-3 font-medium">Số đơn/tháng</th>
                      <th className="text-right p-3 font-medium">Doanh thu</th>
                      <th className="text-right p-3 font-medium">Lãi gộp SX</th>
                      <th className="text-right p-3 font-medium">Marketing</th>
                      <th className="text-right p-3 font-medium">Phí kênh & ship</th>
                      <th className="text-right p-3 font-medium">Fixed Cost + Lương</th>
                      <th className="text-right p-3 font-medium">Dòng tiền VH</th>
                      <th className="text-right p-3 font-medium">Lũy kế VH</th>
                      <th className="text-right p-3 font-medium">Số dư cuối kỳ</th>
                      <th className="text-center p-3 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveMonthlyPlan.map((row) => {
                      const isLowCash = row.endingCash < 20000000;
                      const hasPayback = row.cumulativeOperatingCashFlow >= 51900000;
                      return (
                        <tr key={row.month} className="border-b border-border hover:bg-secondary/20 transition-colors">
                          <td className="p-3 font-semibold text-foreground">{row.month}</td>
                          <td className="p-3 text-right">{row.ordersPerDay}</td>
                          <td className="p-3 text-right">{row.orders}</td>
                          <td className="p-3 text-right font-medium">{fmtVnd(row.revenue)}</td>
                          <td className="p-3 text-right text-success">{fmtVnd(row.grossProfit)}</td>
                          <td className="p-3 text-right text-destructive">{fmtVnd(row.marketing)}</td>
                          <td className="p-3 text-right text-muted-foreground">
                            {fmtVnd(Math.round(row.revenue * 0.068 + row.orders * 3500))}
                          </td>
                          <td className="p-3 text-right text-muted-foreground">{fmtVnd(row.operatingCashCost - row.marketing - Math.round(row.revenue * 0.068 + row.orders * 3500))}</td>
                          <td className="p-3 text-right font-semibold text-foreground">{fmtVnd(row.operatingCashFlow)}</td>
                          <td className="p-3 text-right text-muted-foreground">{fmtVnd(row.cumulativeOperatingCashFlow)}</td>
                          <td className={`p-3 text-right font-semibold ${isLowCash ? "text-destructive" : "text-emerald-600"}`}>
                            {fmtVnd(row.endingCash)}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={isLowCash ? "destructive" : hasPayback ? "default" : "secondary"} className="text-[9px]">
                              {isLowCash ? "Cảnh báo thanh khoản" : hasPayback ? "Đã hòa vốn CAPEX" : "Đang vận hành"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SIMULATOR SUBTAB */}
      {subTab === "simulator" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-primary" />
                  Biến số Mô phỏng Thực tế
                </CardTitle>
                <CardDescription>
                  Điều chỉnh các thanh trượt bên dưới để lập tức xem tác động dây chuyền tới doanh thu năm 1, lãi ròng và thời gian hoàn vốn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order factor */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label htmlFor="order-factor" className="font-semibold">Hệ số đơn hàng (Sales Vol):</Label>
                    <span className="font-bold text-primary">{simOrderFactor.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    id="order-factor"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={simOrderFactor}
                    onChange={(e) => setSimOrderFactor(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Thận trọng (0.7x)</span>
                    <span>Cơ sở (1.0x)</span>
                    <span>Tăng trưởng (1.3x)</span>
                  </div>
                </div>

                {/* Price factor */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label htmlFor="price-factor" className="font-semibold">Hệ số giá bán (Pricing):</Label>
                    <span className="font-bold text-primary">{simPriceFactor.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    id="price-factor"
                    min="0.8"
                    max="1.2"
                    step="0.02"
                    value={simPriceFactor}
                    onChange={(e) => setSimPriceFactor(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Giảm giá/Khuyến mãi (0.8x)</span>
                    <span>Chuẩn (1.0x)</span>
                    <span>Tăng giá trị/Combo (1.2x)</span>
                  </div>
                </div>

                {/* Cost factor */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label htmlFor="cost-factor" className="font-semibold">Hệ số biến phí SX (COGS):</Label>
                    <span className="font-bold text-primary">{simCostFactor.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    id="cost-factor"
                    min="0.8"
                    max="1.3"
                    step="0.02"
                    value={simCostFactor}
                    onChange={(e) => setSimCostFactor(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Tối ưu vật tư (0.8x)</span>
                    <span>Chuẩn (1.0x)</span>
                    <span>Giá vật tư tăng/Lỗi in (1.3x)</span>
                  </div>
                </div>

                {/* Marketing factor */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label htmlFor="mkt-factor" className="font-semibold">Hệ số marketing (Budget):</Label>
                    <span className="font-bold text-primary">{simMktFactor.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    id="mkt-factor"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={simMktFactor}
                    onChange={(e) => setSimMktFactor(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Cắt giảm ads (0.5x)</span>
                    <span>Chuẩn (1.0x)</span>
                    <span>Tăng ngân sách ads (2.0x)</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={resetSimulator}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Thiết lập lại ban đầu
                </Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              {/* Simulator results comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground font-medium">Doanh thu năm 1</p>
                    <p className="text-xl font-bold mt-1 text-foreground">{fmtVnd(customScenario.yearOneRevenue)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      So với kịch bản cơ sở:{" "}
                      {customScenario.yearOneRevenue >= 519833600 ? (
                        <span className="text-success font-semibold">+{((customScenario.yearOneRevenue / 519833600 - 1) * 100).toFixed(1)}%</span>
                      ) : (
                        <span className="text-destructive font-semibold">-{((1 - customScenario.yearOneRevenue / 519833600) * 100).toFixed(1)}%</span>
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 border-indigo-500/20">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground font-medium">Dòng tiền vận hành năm 1</p>
                    <p className={`text-xl font-bold mt-1 ${customScenario.yearOneOperatingCashFlow >= 0 ? "text-success" : "text-destructive"}`}>
                      {fmtVnd(customScenario.yearOneOperatingCashFlow)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Đã trừ thuế, phí kênh và lương chủ shop
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground font-medium">Thời gian hoàn vốn CAPEX</p>
                    <p className="text-xl font-bold mt-1 text-foreground">{customScenario.payback}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Mức đầu tư ban đầu: 51.9M</p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart comparing custom scenario vs templates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    So sánh kịch bản tùy chỉnh và 3 kịch bản lý thuyết
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: "Thận trọng", revenue: 356605850, ocf: -8817769 },
                        { name: "Cơ sở", revenue: 519833600, ocf: 67725747 },
                        { name: "Custom", revenue: customScenario.yearOneRevenue, ocf: customScenario.yearOneOperatingCashFlow },
                        { name: "Tăng trưởng", revenue: 696057190, ocf: 151393757 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [fmtVnd(value), ""]}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Doanh thu năm 1" />
                        <Bar dataKey="ocf" fill="#10B981" radius={[4, 4, 0, 0]} name="Dòng tiền VH năm 1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border flex gap-3 items-start">
                    <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Đánh giá khả thi của kịch bản hiện tại:</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {customScenario.decision}. Đơn hàng T12 dự báo đạt <strong>{customScenario.t12OrdersPerDay} đơn/ngày</strong>. 
                        AOV bình quân <strong>{fmtVnd(Math.round(customScenario.aov))}</strong>, 
                        biến phí sản xuất <strong>{fmtVnd(Math.round(customScenario.variableCost))}</strong>.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* CAPEX & FIXED COST SUBTAB */}
      {subTab === "capex" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Bảng kê Chi phí đầu tư ban đầu (CAPEX)
                </CardTitle>
                <CardDescription>
                  Tối ưu cho cơ sở in ấn nhỏ tại nhà, tận dụng máy tính sẵn có, đầu tư máy in, máy bế decal, máy cán màng và quỹ dự phòng.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                        <th className="p-3 font-medium">Hạng mục</th>
                        <th className="p-3 font-medium">Mục đích</th>
                        <th className="p-3 font-medium text-right">Chi phí cơ sở</th>
                        <th className="p-3 font-medium text-right">Khấu hao/tháng</th>
                        <th className="p-3 font-medium">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capexList.map((row) => (
                        <tr
                          key={row.item}
                          className="border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer"
                          onClick={() => navigate("/accounting")}
                        >
                          <td className="p-3 font-medium text-foreground">{row.item}</td>
                          <td className="p-3 text-muted-foreground">{row.purpose}</td>
                          <td className="p-3 text-right font-medium">{fmtVnd(row.baseCost)}</td>
                          <td className="p-3 text-right text-muted-foreground">
                            {row.depreciationPerMonth > 0 ? fmtVnd(Math.round(row.depreciationPerMonth)) : "—"}
                          </td>
                          <td className="p-3 text-muted-foreground text-[10px]">{row.note}</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/40 font-bold border-t">
                        <td className="p-3" colSpan={2}>Tổng CAPEX ban đầu</td>
                        <td className="p-3 text-right text-primary">{fmtVnd(liveSummary.totalCapexBase)}</td>
                        <td className="p-3 text-right text-primary">{fmtVnd(Math.round(liveSummary.totalDepreciationPerMonth))}</td>
                        <td className="p-3">Số dư tối thiểu an toàn: {fmtVnd(20000000)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Chi phí cố định hàng tháng (Fixed Costs)
                </CardTitle>
                <CardDescription>
                  Tính toán chi phí bắt buộc phải trả hằng tháng cho vận hành dù có phát sinh đơn hàng hay không.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                        <th className="p-3 font-medium">Nhóm</th>
                        <th className="p-3 font-medium">Khoản mục chi tiết</th>
                        <th className="p-3 font-medium text-right">Chi phí/tháng</th>
                        <th className="p-3 font-medium">Tính bắt buộc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fixedCostsList.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer"
                          onClick={() => navigate("/accounting")}
                        >
                          <td className="p-3 font-medium text-foreground">{row.group}</td>
                          <td className="p-3 text-muted-foreground">{row.item}</td>
                          <td className="p-3 text-right font-medium">{fmtVnd(row.monthlyCost)}</td>
                          <td className="p-3">
                            <Badge variant={row.required ? "default" : "secondary"} className="text-[9px]">
                              {row.required ? "Bắt buộc" : "Không bắt buộc"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/40 font-bold border-t">
                        <td className="p-3" colSpan={2}>Tổng CP cố định (gồm lương chủ shop)</td>
                        <td className="p-3 text-right text-primary">{fmtVnd(liveSummary.fixedCostWithOwnerSalary)}</td>
                        <td className="p-3 text-muted-foreground text-[10px]">Chủ shop tự trả: {fmtVnd(5000000)}</td>
                      </tr>
                      <tr className="bg-muted/20 font-bold">
                        <td className="p-3" colSpan={2}>Tổng CP cố định (không gồm lương chủ)</td>
                        <td className="p-3 text-right text-primary">{fmtVnd(liveSummary.fixedCostWithoutOwnerSalary)}</td>
                        <td className="p-3 text-muted-foreground text-[10px]">Mức tối thiểu để không âm túi</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* CAPACITY SUBTAB */}
      {subTab === "capacity" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Đo lường thời gian lao động & Năng lực sản xuất
              </CardTitle>
              <CardDescription>
                Phân tích số phút lao động cần thiết để hoàn thành 1 đơn hàng (bao gồm thiết kế, chế bản, in, cắt bế, cán màng, gia công, đóng gói) để nhận diện nút thắt cổ chai.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs">
                      <th className="text-left p-3 font-medium text-muted-foreground">Sản phẩm</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Tỷ trọng đơn</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Số phút SX thực tế</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Tổng phút gồm đóng gói</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Giới hạn đơn/ngày kịch trần</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Độ rủi ro/Mất công</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Ghi chú vận hành</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printShopCapacityProducts.map((row) => {
                      const isHighRisk = row.risk === "Rất mất công" || row.risk === "Mất công";
                      return (
                        <tr key={row.product} className="border-b border-border hover:bg-secondary/20 transition-colors">
                          <td className="p-3 font-medium text-foreground">{row.product}</td>
                          <td className="p-3 text-right text-xs">{(row.mix * 100).toFixed(0)}%</td>
                          <td className="p-3 text-right text-xs">{row.productionMinutes} phút</td>
                          <td className="p-3 text-right text-xs font-semibold">{row.totalMinutes} phút</td>
                          <td className="p-3 text-right font-medium text-primary">{row.ordersPerDayAtCapacity} đơn/ngày</td>
                          <td className="p-3">
                            <Badge variant={isHighRisk ? "destructive" : "secondary"} className="text-[10px]">
                              {row.risk}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{row.note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Cảnh báo thắt nút cổ chai (Bottlenecks)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs leading-relaxed">
                  <strong>Khuyến nghị vận hành:</strong> Các sản phẩm như <strong>Combo shop mới</strong> và <strong>Avatar/thiết kế QR</strong> cực kỳ tốn thời gian thiết kế (45-60 phút/đơn). 
                  Khi tổng số đơn vượt quá 10 đơn/ngày, chủ shop sẽ bị quá tải hoàn toàn nếu tự làm thiết kế mà không có thư viện mẫu sẵn hoặc cộng tác viên.
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Mức độ căng thẳng công việc (Tháng 1-5: 4-8 đơn/ngày)</span>
                    <span className="text-success font-bold">An toàn (35% - 70%)</span>
                  </div>
                  <Progress value={53} className="h-2 bg-secondary" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Mức độ căng thẳng công việc (Tháng 6-9: 10-14 đơn/ngày)</span>
                    <span className="text-amber-500 font-bold">Căng / Theo dõi sát (88% - 120%)</span>
                  </div>
                  <Progress value={95} className="h-2 bg-secondary" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Mức độ căng thẳng công việc (Tháng 10-12: 15-18 đơn/ngày)</span>
                    <span className="text-destructive font-bold">Quá tải / Cần tuyển part-time (130% - 150%)</span>
                  </div>
                  <Progress value={100} className="h-2 bg-secondary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-primary" />
                  Quy trình giảm tải & Tự động hóa đề xuất
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex gap-2.5">
                  <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Tạo thư viện thiết kế sẵn (Template Bank)</strong>: Chuẩn bị trước 50 mẫu Sticker/Card cảm ơn để khách chọn nhanh, chỉ thay logo/tên thay vị trí cũ.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Xác nhận file in tự động qua Zalo</strong>: Dùng chatbot gửi link duyệt file PDF hoặc ảnh mô phỏng. Khách nhấn "Xác nhận in" mới đưa vào hàng đợi sản xuất để giảm lỗi in sai.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Gom nhóm in (Batching)</strong>: gom các đơn hàng in cùng chất liệu decal/card để in và bế một lần trong ngày, thay vì in lẻ tẻ từng đơn để tiết kiệm mực và giảm Setup.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {subTab === "settings" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Cấu hình tham số mô hình tài chính (Print Shop Setup)
              </CardTitle>
              <CardDescription>
                Thay đổi các tham số đầu vào của mô hình tài chính. Số liệu tại tất cả các tab khác sẽ tự động cập nhật ngay lập tức.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CAPEX Settings */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-primary" />
                  Đầu tư ban đầu (CAPEX)
                </h3>
                <div className="space-y-3">
                  {capexList.map((item, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3 p-3 border border-border rounded-lg bg-muted/20">
                      <div className="flex-1 min-w-[200px]">
                        <Label className="text-[10px] text-muted-foreground">Tên hạng mục</Label>
                        <Input
                          value={item.item}
                          onChange={(e) => {
                            const newCapex = [...capexList];
                            newCapex[idx].item = e.target.value;
                            saveCapex(newCapex);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="w-[120px]">
                        <Label className="text-[10px] text-muted-foreground">Chi phí (đ)</Label>
                        <Input
                          type="number"
                          value={item.baseCost}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const newCapex = [...capexList];
                            newCapex[idx].baseCost = val;
                            newCapex[idx].depreciationPerMonth = val / (newCapex[idx].usefulMonths || 1);
                            saveCapex(newCapex);
                          }}
                          className="h-8 text-xs text-right"
                        />
                      </div>
                      <div className="w-[80px]">
                        <Label className="text-[10px] text-muted-foreground">Tháng KH</Label>
                        <Input
                          type="number"
                          value={item.usefulMonths}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const newCapex = [...capexList];
                            newCapex[idx].usefulMonths = val;
                            newCapex[idx].depreciationPerMonth = newCapex[idx].baseCost / (val || 1);
                            saveCapex(newCapex);
                          }}
                          className="h-8 text-xs text-center"
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <Label className="text-[10px] text-muted-foreground">Mục đích</Label>
                        <Input
                          value={item.purpose}
                          onChange={(e) => {
                            const newCapex = [...capexList];
                            newCapex[idx].purpose = e.target.value;
                            saveCapex(newCapex);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 text-primary hover:bg-primary/10 h-8 gap-1"
                        onClick={() => handleSyncToAccounting("capex", item)}
                      >
                        <FileText className="h-4 w-4" />
                        Ghi sổ
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                        onClick={() => {
                          const newCapex = capexList.filter((_, i) => i !== idx);
                          saveCapex(newCapex);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => {
                      const newItem: PrintShopCapexItem = {
                        item: "Hạng mục mới",
                        purpose: "Nhập mục đích...",
                        baseCost: 1000000,
                        usefulMonths: 12,
                        depreciationPerMonth: 1000000 / 12,
                        spendMonth: 1,
                        note: ""
                      };
                      saveCapex([...capexList, newItem]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Thêm hạng mục CAPEX
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Fixed Costs Settings */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" />
                  Định phí hàng tháng (Fixed Costs)
                </h3>
                <div className="space-y-3">
                  {fixedCostsList.map((item, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3 p-3 border border-border rounded-lg bg-muted/20">
                      <div className="w-[120px]">
                        <Label className="text-[10px] text-muted-foreground">Nhóm</Label>
                        <Input
                          value={item.group}
                          onChange={(e) => {
                            const newFixed = [...fixedCostsList];
                            newFixed[idx].group = e.target.value;
                            saveFixedCosts(newFixed);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <Label className="text-[10px] text-muted-foreground">Khoản mục chi tiết</Label>
                        <Input
                          value={item.item}
                          onChange={(e) => {
                            const newFixed = [...fixedCostsList];
                            newFixed[idx].item = e.target.value;
                            saveFixedCosts(newFixed);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="w-[150px]">
                        <Label className="text-[10px] text-muted-foreground">Chi phí/tháng (đ)</Label>
                        <Input
                          type="number"
                          value={item.monthlyCost}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const newFixed = [...fixedCostsList];
                            newFixed[idx].monthlyCost = val;
                            saveFixedCosts(newFixed);
                          }}
                          className="h-8 text-xs text-right"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 text-primary hover:bg-primary/10 h-8 gap-1"
                        onClick={() => handleSyncToAccounting("fixed", item)}
                      >
                        <FileText className="h-4 w-4" />
                        Ghi sổ
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                        onClick={() => {
                          const newFixed = fixedCostsList.filter((_, i) => i !== idx);
                          saveFixedCosts(newFixed);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => {
                      const newItem = {
                        group: "Khác",
                        item: "Khoản chi phí mới",
                        monthlyCost: 500000,
                        required: true
                      };
                      saveFixedCosts([...fixedCostsList, newItem]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Thêm khoản chi phí cố định
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Calculator & Shopee fee settings */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-primary" />
                  Cài đặt phí sàn Shopee & Biên ròng mục tiêu
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">Phí giao dịch (%)</Label>
                    <Input
                      type="number"
                      value={calcShopeeTxFee}
                      onChange={(e) => setCalcShopeeTxFee(Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phí cố định (%)</Label>
                    <Input
                      type="number"
                      value={calcShopeeCommFee}
                      onChange={(e) => setCalcShopeeCommFee(Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phí Voucher (%)</Label>
                    <Input
                      type="number"
                      value={calcShopeeVoucherFee}
                      onChange={(e) => setCalcShopeeVoucherFee(Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phí cố định đơn (đ)</Label>
                    <Input
                      type="number"
                      value={calcShopeeFlatFee}
                      onChange={(e) => setCalcShopeeFlatFee(Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phí chạy Ads (%)</Label>
                    <Input
                      type="number"
                      value={calcAdsFee}
                      onChange={(e) => setCalcAdsFee(Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tỷ lệ hủy/hoàn (%)</Label>
                    <Input
                      type="number"
                      value={calcShopeeCancelRate}
                      onChange={(e) => setCalcShopeeCancelRate(Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tỷ lệ thuế (%)</Label>
                    <Input
                      type="number"
                      value={calcShopeeTaxRate}
                      onChange={(e) => setCalcShopeeTaxRate(Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Biên ròng mục tiêu (%)</Label>
                    <Input
                      type="number"
                      value={calcShopeeTargetMargin}
                      onChange={(e) => setCalcShopeeTargetMargin(Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
