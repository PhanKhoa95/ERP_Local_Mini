import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useApiGateway } from "@/hooks/useApiGateway";
import { Key, Copy, Plus, Ban, CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const AVAILABLE_SCOPES = [
  { value: "read:orders", label: "Đọc đơn hàng" },
  { value: "read:inventory", label: "Đọc tồn kho" },
  { value: "write:orders", label: "Ghi đơn hàng" },
  { value: "write:tokens", label: "Ghi Token" },
  { value: "read:partners", label: "Đọc đối tác" },
  { value: "write:shares", label: "Ghi Cổ phiếu" },
];

const PARTNER_TYPES = [
  { value: "sapo", label: "Sapo POS" },
  { value: "kiotviet", label: "KiotViet" },
  { value: "custom", label: "Custom ERP" },
];

export function ApiKeyManagementPanel() {
  const { apiKeys, isLoading, generateKey, revokeKey } = useApiGateway();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [partnerType, setPartnerType] = useState("custom");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["read:orders", "read:inventory"]);
  const [allowedIps, setAllowedIps] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();

  const handleGenerate = () => {
    if (!name) return;
    generateKey.mutate(
      {
        key_name: name,
        partner_type: partnerType,
        scopes: selectedScopes,
        allowed_ips: allowedIps ? allowedIps.split(",").map((ip) => ip.trim()).filter(Boolean) : [],
        expires_at: expiryDate ? expiryDate.toISOString() : null,
      },
      {
        onSuccess: () => {
          setName("");
          setAllowedIps("");
          setExpiryDate(undefined);
          setSelectedScopes(["read:orders", "read:inventory"]);
        },
      }
    );
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã copy vào khay nhớ tạm" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" /> Quản lý Scoped-Identity Keys
        </CardTitle>
        <CardDescription>Tạo API Key với phân quyền chi tiết, IP whitelist và hạn sử dụng</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Name + Partner Type */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Tên Key / Ứng dụng</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: KiotViet Sync" />
          </div>
          <div className="grid gap-2">
            <Label>Loại đối tác</Label>
            <Select value={partnerType} onValueChange={setPartnerType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PARTNER_TYPES.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Scopes */}
        <div className="grid gap-2">
          <Label>Phạm vi quyền (Scopes)</Label>
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_SCOPES.map((scope) => (
              <label key={scope.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={selectedScopes.includes(scope.value)}
                  onCheckedChange={() => toggleScope(scope.value)}
                />
                <span>{scope.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* IP Whitelist + Expiry */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>IP Whitelist (phân cách bởi dấu phẩy)</Label>
            <Input
              value={allowedIps}
              onChange={(e) => setAllowedIps(e.target.value)}
              placeholder="VD: 103.1.2.3, 10.0.0.0/24"
            />
          </div>
          <div className="grid gap-2">
            <Label>Ngày hết hạn</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiryDate ? format(expiryDate, "dd/MM/yyyy") : "Không giới hạn"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={expiryDate} onSelect={setExpiryDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={generateKey.isPending || !name}>
          <Plus className="h-4 w-4 mr-2" /> Tạo Scoped Key
        </Button>

        {/* Keys Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Key</TableHead>
                <TableHead>Đối tác</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Key Hash</TableHead>
                <TableHead>Hết hạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center">Đang tải...</TableCell></TableRow>
              ) : apiKeys.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Chưa có API Key nào</TableCell></TableRow>
              ) : (
                apiKeys.map((key: any) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.key_name}</TableCell>
                    <TableCell>{key.partner_type}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(key.scopes) ? key.scopes : []).map((s: string) => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[120px] truncate">{key.api_key_hash}</TableCell>
                    <TableCell className="text-xs">
                      {key.expires_at ? format(new Date(key.expires_at), "dd/MM/yyyy") : "∞"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${key.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {key.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(key.api_key_hash)} title="Copy Key">
                          <Copy className="h-4 w-4" />
                        </Button>
                        {key.is_active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => revokeKey.mutate(key.id)}
                            title="Thu hồi Key"
                            className="text-destructive hover:text-destructive"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
