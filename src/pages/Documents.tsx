import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDocuments, Document } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useProjects } from "@/hooks/useProjects";
import { DocumentPreviewDialog } from "@/components/documents/DocumentPreviewDialog";
import { ExpiringDocumentsWidget } from "@/components/documents/ExpiringDocumentsWidget";
import { 
  Upload, FileText, Trash2, Search, Loader2, 
  CheckCircle2, XCircle, Clock, FileSpreadsheet, FileType, Eye, AlertCircle,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categoryLabels: Record<string, string> = {
  invoice: "Hóa đơn",
  contract: "Hợp đồng",
  drawing: "Bản vẽ",
  report: "Báo cáo",
  other: "Khác",
};

const categoryColors: Record<string, string> = {
  invoice: "bg-blue-500/10 text-blue-600",
  contract: "bg-purple-500/10 text-purple-600",
  drawing: "bg-orange-500/10 text-orange-600",
  report: "bg-green-500/10 text-green-600",
  other: "bg-muted text-muted-foreground",
};

const getFileIcon = (type: string) => {
  if (type === "pdf") return <FileText className="h-5 w-5 text-red-500" />;
  if (["doc", "docx"].includes(type)) return <FileType className="h-5 w-5 text-blue-500" />;
  if (["xls", "xlsx"].includes(type)) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  return <FileText className="h-5 w-5" />;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
    case "processed":
      return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Hoàn thành</Badge>;
    case "processing":
      return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Đang xử lý</Badge>;
    case "failed":
    case "error":
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Lỗi</Badge>;
    default:
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Chờ xử lý</Badge>;
  }
};

export default function Documents() {
  const { user } = useAuth();
  const { companyId, loading: companyLoading } = useCompanyContext();
  const { documents, isLoading, uploadDocument, deleteDocument, expiringDocuments } = useDocuments(companyId || undefined);
  const { projects } = useProjects();
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [selectedProjectForUpload, setSelectedProjectForUpload] = useState<string>("");
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = documents.filter(doc => {
    if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && doc.category !== categoryFilter) return false;
    if (projectFilter !== "all") {
      if (projectFilter === "none" && doc.project_id) return false;
      if (projectFilter !== "none" && doc.project_id !== projectFilter) return false;
    }
    return true;
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !companyId) return;
    for (const file of Array.from(files)) {
      await uploadDocument.mutateAsync({ 
        file, 
        companyId,
        projectId: selectedProjectForUpload && selectedProjectForUpload !== "none" ? selectedProjectForUpload : undefined,
      });
    }
    e.target.value = "";
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (companyLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Bạn cần đăng nhập để sử dụng tính năng này.</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  if (!companyId) {
    return (
      <MainLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Bạn chưa được gán vào công ty nào. Vui lòng liên hệ quản trị viên.</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header 
        title="Quản lý tài liệu" 
        subtitle="Upload và quản lý tài liệu — AI tự động phân loại, trích xuất metadata"
        actions={
          <div className="flex items-center gap-2">
            {/* Project selector for upload */}
            <Select value={selectedProjectForUpload} onValueChange={setSelectedProjectForUpload}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Gắn dự án..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không gắn dự án</SelectItem>
                {projects?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
              multiple
              onChange={handleFileSelect}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploadDocument.isPending}>
              {uploadDocument.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload tài liệu
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm tài liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Phân loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="invoice">Hóa đơn</SelectItem>
              <SelectItem value="contract">Hợp đồng</SelectItem>
              <SelectItem value="drawing">Bản vẽ</SelectItem>
              <SelectItem value="report">Báo cáo</SelectItem>
              <SelectItem value="other">Khác</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Dự án" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả dự án</SelectItem>
              <SelectItem value="none">Không gắn dự án</SelectItem>
              {projects?.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats + Expiring Widget */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{documents.length}</div>
              <p className="text-muted-foreground text-sm">Tổng tài liệu</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">
                {documents.filter(d => d.status === "completed" || d.status === "processed").length}
              </div>
              <p className="text-muted-foreground text-sm">Đã xử lý</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-500">
                {documents.filter(d => d.status === "processing").length}
              </div>
              <p className="text-muted-foreground text-sm">Đang xử lý</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-500">
                {documents.filter(d => d.status === "failed" || d.status === "error").length}
              </div>
              <p className="text-muted-foreground text-sm">Lỗi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-500">
                {expiringDocuments.length}
              </div>
              <p className="text-muted-foreground text-sm">Sắp hết hạn</p>
            </CardContent>
          </Card>
        </div>

        {/* Expiring Documents Alert */}
        {expiringDocuments.length > 0 && <ExpiringDocumentsWidget />}

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách tài liệu</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có tài liệu nào</p>
                <p className="text-sm">Upload tài liệu để bắt đầu</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên tài liệu</TableHead>
                    <TableHead>Phân loại</TableHead>
                    <TableHead>Kích thước</TableHead>
                    <TableHead>Metadata</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.map((doc) => (
                    <TableRow 
                      key={doc.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getFileIcon(doc.file_type)}
                          <span className="truncate max-w-[200px]">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.category ? (
                          <Badge variant="outline" className={categoryColors[doc.category] || ""}>
                            {categoryLabels[doc.category] || doc.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          {doc.extracted_metadata?.vendor_name && (
                            <div className="text-muted-foreground truncate max-w-[120px]">
                              {doc.extracted_metadata.vendor_name}
                            </div>
                          )}
                          {doc.extracted_metadata?.total_amount != null && (
                            <div className="font-medium">
                              {new Intl.NumberFormat("vi-VN").format(doc.extracted_metadata.total_amount)}
                              {doc.extracted_metadata?.currency ? ` ${doc.extracted_metadata.currency}` : "đ"}
                            </div>
                          )}
                          {!doc.extracted_metadata?.vendor_name && doc.extracted_metadata?.total_amount == null && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: vi })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteDoc(doc); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tài liệu?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa "{deleteDoc?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteDoc) {
                  deleteDocument.mutate(deleteDoc);
                  setDeleteDoc(null);
                }
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DocumentPreviewDialog 
        document={previewDoc}
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      />
    </MainLayout>
  );
}
