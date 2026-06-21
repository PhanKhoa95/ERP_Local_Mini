import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useContracts, SmartContract } from "@/hooks/useContracts";
import { ContractDialog } from "@/components/contracts/ContractDialog";
import { ContractSignDialog } from "@/components/contracts/ContractSignDialog";
import { ContractMilestones } from "@/components/contracts/ContractMilestones";
import { Plus, Search, FileSignature, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "Nháp", color: "bg-muted text-muted-foreground" },
  pending_signature: { label: "Chờ ký", color: "bg-yellow-100 text-yellow-800" },
  active: { label: "Hiệu lực", color: "bg-green-100 text-green-800" },
  completed: { label: "Hoàn thành", color: "bg-blue-100 text-blue-800" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
};

const industryMap: Record<string, string> = {
  real_estate: "BĐS", manufacturing: "Sản xuất", retail: "Bán lẻ",
  services: "Dịch vụ", tech: "Công nghệ", construction: "Xây dựng", healthcare: "Y tế",
};

export default function Contracts() {
  const { contracts, isLoading } = useContracts();
  const [createOpen, setCreateOpen] = useState(false);
  const [signContract, setSignContract] = useState<SmartContract | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = contracts.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.contract_number.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Hợp đồng thông minh</h1>
            <p className="text-muted-foreground">Quản lý hợp đồng đa ngành với AI Templates & Token hóa</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Tạo hợp đồng
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Tìm hợp đồng..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Số HĐ</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Ngành</TableHead>
                  <TableHead>Giá trị</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <>
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                      <TableCell>
                        {expandedId === c.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{c.contract_number}</TableCell>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell><Badge variant="outline">{industryMap[c.industry] || c.industry}</Badge></TableCell>
                      <TableCell>{c.total_value.toLocaleString("vi-VN")}đ</TableCell>
                      <TableCell>
                        <Badge className={statusMap[c.status]?.color || ""}>{statusMap[c.status]?.label || c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(c.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        {c.status === "draft" && (
                          <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setSignContract(c); }} className="gap-1">
                            <FileSignature className="h-4 w-4" /> Ký
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedId === c.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/30 p-4">
                          <ContractMilestones contractId={c.id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {isLoading ? "Đang tải..." : "Chưa có hợp đồng nào"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <ContractDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ContractSignDialog open={!!signContract} onOpenChange={o => !o && setSignContract(null)} contract={signContract} />
    </MainLayout>
  );
}
