import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BookOpen,
  ClipboardList,
  Database,
  HelpCircle,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  Monitor,
  Package,
  Phone,
  Printer,
  ReceiptText,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Utensils,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HelpItem = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  links: string[];
};

type HelpGroup = {
  eyebrow: string;
  title: string;
  description?: string;
  items: HelpItem[];
};

const guideGroups: HelpGroup[] = [
  {
    eyebrow: "Tài liệu vận hành",
    title: "Quản lý bán hàng hợp kênh",
    description: "Hướng dẫn triển khai các quy trình bán hàng, kho, khách hàng và báo cáo trong một hệ thống.",
    items: [
      {
        title: "Thiết lập cửa hàng",
        description: "Tài khoản, chi nhánh, nhân viên, vai trò và dữ liệu ban đầu.",
        icon: Store,
        accent: "bg-blue-50 text-blue-700 border-blue-100",
        links: ["Tài khoản và dữ liệu", "Thiết lập công ty", "Phân quyền nhân viên"],
      },
      {
        title: "Kênh bán hàng",
        description: "Cửa hàng, website, sàn thương mại điện tử và kênh mạng xã hội.",
        icon: ShoppingCart,
        accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
        links: ["POS tại quầy", "Website đặt hàng", "Shopee, Lazada, TikTok Shop"],
      },
      {
        title: "Sản phẩm và kho hàng",
        description: "Quản lý SKU, tồn kho, định mức, nhập xuất và cảnh báo thiếu hàng.",
        icon: Package,
        accent: "bg-amber-50 text-amber-700 border-amber-100",
        links: ["Danh mục sản phẩm", "Kho và tồn kho", "Định mức BOM"],
      },
      {
        title: "Đơn hàng",
        description: "Tạo đơn, xử lý trạng thái, thanh toán, giao hàng và đổi trả.",
        icon: ClipboardList,
        accent: "bg-indigo-50 text-indigo-700 border-indigo-100",
        links: ["Tạo đơn hàng", "Nhập đơn từ Excel", "Theo dõi giao hàng"],
      },
      {
        title: "Khách hàng và công nợ",
        description: "Hồ sơ đối tác, nhóm khách hàng, lịch sử mua và hạn mức nợ.",
        icon: Users,
        accent: "bg-rose-50 text-rose-700 border-rose-100",
        links: ["Hồ sơ khách hàng", "Nhóm khách hàng", "Báo cáo công nợ"],
      },
      {
        title: "Báo cáo và tài chính",
        description: "Doanh thu, dòng tiền, kế toán, đối soát và cảnh báo bất thường.",
        icon: BarChart3,
        accent: "bg-cyan-50 text-cyan-700 border-cyan-100",
        links: ["Báo cáo bán hàng", "Dự báo dòng tiền", "Sổ cái kế toán"],
      },
    ],
  },
  {
    eyebrow: "AI và tự động hóa",
    title: "Trợ lý, workflow và Data Hub",
    description: "Tài liệu cho các tính năng AI, nhập liệu đa kênh và tự động hóa nghiệp vụ.",
    items: [
      {
        title: "Cấu hình AI",
        description: "Thiết lập OpenRouter, Gemini fallback và quyền truy cập AI Agent.",
        icon: Bot,
        accent: "bg-violet-50 text-violet-700 border-violet-100",
        links: ["OpenRouter API key", "Model mặc định", "Phân quyền AI Agent"],
      },
      {
        title: "Workflow tự động",
        description: "Tạo luồng xử lý đơn hàng, phê duyệt, nhắc việc và gọi webhook.",
        icon: Settings,
        accent: "bg-slate-50 text-slate-700 border-slate-100",
        links: ["Trình kéo thả workflow", "AI tạo workflow", "Nhật ký thực thi"],
      },
      {
        title: "Data Hub",
        description: "Thu thập dữ liệu thô, kiểm tra chất lượng và liên kết định danh.",
        icon: Database,
        accent: "bg-teal-50 text-teal-700 border-teal-100",
        links: ["Nguồn dữ liệu", "Raw events", "Identity resolution"],
      },
    ],
  },
];

const operationGroups: HelpGroup[] = [
  {
    eyebrow: "Thiết bị bán hàng",
    title: "Phần cứng và điểm bán",
    items: [
      {
        title: "Máy tính tiền",
        description: "Bán hàng và thanh toán nhanh tại quầy.",
        icon: Monitor,
        accent: "bg-blue-50 text-blue-700 border-blue-100",
        links: ["Kết nối thiết bị", "Màn hình thu ngân"],
      },
      {
        title: "Máy in hóa đơn",
        description: "Thiết lập mẫu in, khổ giấy và máy in mặc định.",
        icon: Printer,
        accent: "bg-orange-50 text-orange-700 border-orange-100",
        links: ["Mẫu hóa đơn", "Cấu hình máy in"],
      },
      {
        title: "Máy quét mã vạch",
        description: "Quét SKU nhanh khi bán hàng, nhập kho và kiểm kho.",
        icon: ScanLine,
        accent: "bg-lime-50 text-lime-700 border-lime-100",
        links: ["Quét sản phẩm", "Quy ước mã vạch"],
      },
    ],
  },
  {
    eyebrow: "Sản phẩm mở rộng",
    title: "Dịch vụ và vận hành bổ sung",
    items: [
      {
        title: "Hóa đơn điện tử",
        description: "Phát hành, tra cứu và đồng bộ hóa đơn sau bán hàng.",
        icon: ReceiptText,
        accent: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
        links: ["Cấu hình hóa đơn", "Đồng bộ dữ liệu thuế"],
      },
      {
        title: "Vận chuyển",
        description: "Thiết lập hãng vận chuyển, vùng giao và phí giao hàng.",
        icon: Truck,
        accent: "bg-sky-50 text-sky-700 border-sky-100",
        links: ["Hãng vận chuyển", "Khu vực giao hàng"],
      },
      {
        title: "Nhà hàng và dịch vụ",
        description: "Đặt bàn, QR order, thực đơn và quy trình phục vụ.",
        icon: Utensils,
        accent: "bg-red-50 text-red-700 border-red-100",
        links: ["Đặt bàn", "QR order", "Thu ngân"],
      },
    ],
  },
];

const allGroups: HelpGroup[] = [...guideGroups, ...operationGroups];

const popularArticles = [
  "Tạo đơn hàng đầu tiên từ POS",
  "Nhập sản phẩm và tồn kho bằng Excel",
  "Thiết lập OpenRouter cho AI Agent",
  "Theo dõi đơn hàng công khai bằng số điện thoại",
  "Khởi tạo nguồn dữ liệu trong Data Hub",
  "Phân quyền quản lý cho nhân viên",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function itemMatches(item: HelpItem, query: string) {
  if (!query) return true;
  const haystack = normalize([item.title, item.description, ...item.links].join(" "));
  return haystack.includes(normalize(query));
}

function HelpCard({ item }: { item: HelpItem }) {
  const Icon = item.icon;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${item.accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
        {item.links.map((link) => (
          <a
            key={link}
            href="#popular-articles"
            className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-blue-700"
          >
            <span>{link}</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        ))}
      </div>
    </article>
  );
}

function HelpGroupSection({ group, query }: { group: HelpGroup; query: string }) {
  const items = group.items.filter((item) => itemMatches(item, query));

  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{group.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">{group.title}</h2>
          {group.description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{group.description}</p>}
        </div>
        <Button variant="outline" className="w-full justify-center md:w-auto" asChild>
          <a href="#popular-articles">
            Xem tất cả
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <HelpCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}

export default function HelpCenter() {
  const [query, setQuery] = useState("");
  const visibleCount = useMemo(
    () => allGroups.flatMap((group) => group.items).filter((item) => itemMatches(item, query)).length,
    [query],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/help" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-950">Multi Sale Help</p>
              <p className="hidden text-xs text-slate-500 sm:block">Trung tâm trợ giúp</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
            <a className="hover:text-blue-700" href="#guides">Tài liệu hướng dẫn</a>
            <a className="hover:text-blue-700" href="#updates">Cập nhật mới</a>
            <a className="hover:text-blue-700" href="#support">Gửi hỗ trợ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <Link to="/auth">Đăng nhập</Link>
            </Button>
            <Button asChild>
              <a href="#support">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Hỗ trợ
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-slate-950">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1800&q=80"
            alt="Nhóm hỗ trợ đang làm việc với tài liệu vận hành"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.92),rgba(15,23,42,0.68),rgba(30,64,175,0.55))]" />
          <div className="relative mx-auto flex min-h-[380px] max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-200">Trung tâm trợ giúp</p>
            <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight text-white sm:text-5xl">
              Trung tâm trợ giúp Khách hàng Multi Sale Organizer
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
              Tìm hướng dẫn thiết lập, vận hành bán hàng hợp kênh, quản lý kho, AI Agent, Data Hub và các quy trình hỗ trợ.
            </p>
            <div className="mt-8 max-w-2xl">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-14 rounded-lg border-white/20 bg-white pl-12 pr-4 text-base text-slate-950 shadow-xl placeholder:text-slate-400"
                  placeholder="Tìm kiếm: đơn hàng, kho, OpenRouter, Data Hub..."
                />
              </div>
              {query && (
                <p className="mt-3 text-sm text-slate-200">
                  Tìm thấy {visibleCount} nhóm hướng dẫn phù hợp với "{query}".
                </p>
              )}
            </div>
          </div>
        </section>

        <section id="updates" className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 md:grid-cols-3 lg:px-8">
            <a href="#guides" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/60">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-slate-800">Bắt đầu nhanh cho tài khoản mới</span>
            </a>
            <a href="#guides" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/60">
              <Bot className="h-5 w-5 text-violet-600" />
              <span className="text-sm font-medium text-slate-800">Cập nhật cấu hình OpenRouter AI</span>
            </a>
            <a href="#support" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/60">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-800">Liên hệ đội hỗ trợ vận hành</span>
            </a>
          </div>
        </section>

        <div id="guides" className="py-4">
          {allGroups.map((group) => (
            <HelpGroupSection key={group.title} group={group} query={query} />
          ))}
        </div>

        <section id="popular-articles" className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Bài viết phổ biến</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Các hướng dẫn được xem nhiều</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {popularArticles.map((article) => (
                  <a
                    key={article}
                    href="#support"
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span>{article}</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
            <aside className="rounded-lg border border-blue-100 bg-blue-50 p-5">
              <BookOpen className="h-8 w-8 text-blue-700" />
              <h3 className="mt-4 text-lg font-semibold text-slate-950">Không tìm thấy nội dung?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Gửi yêu cầu hỗ trợ kèm mô tả nghiệp vụ, ảnh màn hình và tài khoản đang gặp lỗi để đội vận hành kiểm tra nhanh hơn.
              </p>
              <Button className="mt-5 w-full" asChild>
                <a href="#support">
                  Gửi yêu cầu
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </aside>
          </div>
        </section>
      </main>

      <footer id="support" className="bg-slate-950 text-slate-200">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Warehouse className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Multi Sale Organizer</p>
                <p className="text-xs text-slate-400">Help Center</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Tài liệu hỗ trợ triển khai hệ thống bán hàng, kho, tài chính, nhân sự và AI vận hành.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white">Tài liệu</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li><a className="hover:text-white" href="#guides">Quản lý bán hàng</a></li>
              <li><a className="hover:text-white" href="#guides">AI và Workflow</a></li>
              <li><a className="hover:text-white" href="#guides">Data Hub</a></li>
              <li><a className="hover:text-white" href="#guides">Thiết bị bán hàng</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Thông tin hỗ trợ</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Chat trong phần mềm</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> 1900 0000</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@multisale.local</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Văn phòng</h4>
            <p className="mt-4 flex gap-2 text-sm leading-6 text-slate-400">
              <MapPin className="mt-1 h-4 w-4 shrink-0" />
              Trung tâm vận hành, TP. Hồ Chí Minh
            </p>
            <Button variant="secondary" className="mt-5 w-full" asChild>
              <Link to="/auth">Đăng nhập hệ thống</Link>
            </Button>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
          Copyright © 2026 Multi Sale Organizer. Help center layout inspired by modern customer support portals.
        </div>
      </footer>
    </div>
  );
}
