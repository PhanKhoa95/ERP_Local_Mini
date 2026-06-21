import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, Download, ExternalLink, Clock, 
  History, Eye, Loader2, FileSpreadsheet, FileType,
  CheckCircle2, XCircle, RefreshCw, Database
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Document } from "@/hooks/useDocuments";
import { DocumentMetadataTab } from "./DocumentMetadataTab";

interface DocumentPreviewDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DocumentHistory {
  id: string;
  document_id: string;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  created_at: string;
}

const getFileIcon = (type: string) => {
  if (type === "pdf") return <FileText className="h-8 w-8 text-red-500" />;
  if (["doc", "docx"].includes(type)) return <FileType className="h-8 w-8 text-blue-500" />;
  if (["xls", "xlsx"].includes(type)) return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
  return <FileText className="h-8 w-8" />;
};

const getActionBadge = (action: string) => {
  switch (action) {
    case "created":
      return <Badge variant="default" className="bg-green-500">Tạo mới</Badge>;
    case "updated":
      return <Badge variant="secondary">Cập nhật</Badge>;
    case "deleted":
      return <Badge variant="destructive">Xóa</Badge>;
    default:
      return <Badge variant="outline">{action}</Badge>;
  }
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DocumentPreviewDialog({ document, open, onOpenChange }: DocumentPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState("preview");

  const canPreview = document ? ["pdf", "txt", "png", "jpg", "jpeg", "gif", "webp"].includes(document.file_type.toLowerCase()) : false;
  const isImage = document ? ["png", "jpg", "jpeg", "gif", "webp"].includes(document.file_type.toLowerCase()) : false;

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["document-history", document?.id],
    queryFn: async () => {
      if (!document?.id) return [];
      const { data, error } = await supabase
        .from("document_history")
        .select("*")
        .eq("document_id", document.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DocumentHistory[];
    },
    enabled: !!document?.id && open,
  });

  const { data: signedUrl, isLoading: urlLoading } = useQuery({
    queryKey: ["document-signed-url", document?.id],
    queryFn: async () => {
      if (!document) return null;
      const { data, error } = await supabase.storage
        .from("company-documents")
        .createSignedUrl(document.file_path, 3600, {
          download: false,
        });
      if (error) throw error;
      return data?.signedUrl || null;
    },
    enabled: !!document?.id && open,
  });

  if (!document) return null;

  const hasMetadata = document.category || document.extracted_metadata;

  const handleDownload = async () => {
    const { data, error } = await supabase.storage
      .from("company-documents")
      .download(document.file_path);
    if (error || !data) return;
    const url = URL.createObjectURL(data);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = document.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenExternal = async () => {
    const { data } = await supabase.storage
      .from("company-documents")
      .createSignedUrl(document.file_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getFileIcon(document.file_type)}
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">{document.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {document.file_type.toUpperCase()} • {formatFileSize(document.file_size)} • {document.chunk_count || 0} chunks
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" /> Tải về
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                <ExternalLink className="h-4 w-4 mr-1" /> Mở
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" /> Xem trước
            </TabsTrigger>
            <TabsTrigger value="metadata" className="gap-2">
              <Database className="h-4 w-4" /> Metadata
              {hasMetadata && <span className="ml-1 h-2 w-2 rounded-full bg-primary inline-block" />}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" /> Lịch sử ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 min-h-0 mt-4">
            {urlLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : canPreview && document.file_type === "pdf" && signedUrl ? (
              <div className="w-full h-full relative">
                <object
                  data={signedUrl}
                  type="application/pdf"
                  className="w-full h-full rounded-lg border"
                  title={document.name}
                >
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                    <FileText className="h-12 w-12 opacity-50" />
                    <p>Trình duyệt không hỗ trợ xem PDF trực tiếp</p>
                    <div className="flex gap-2">
                      <Button onClick={() => window.open(signedUrl, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-2" /> Mở trong tab mới
                      </Button>
                      <Button variant="outline" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" /> Tải về
                      </Button>
                    </div>
                  </div>
                </object>
              </div>
            ) : canPreview && document.file_type === "txt" ? (
              <TextFilePreview filePath={document.file_path} />
            ) : canPreview && isImage && signedUrl ? (
              <div className="flex items-center justify-center h-full">
                <img src={signedUrl} alt={document.name} className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                {getFileIcon(document.file_type)}
                <p className="mt-4">Không thể xem trước định dạng này</p>
                <p className="text-sm">Vui lòng tải về hoặc mở trong ứng dụng phù hợp</p>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleDownload}><Download className="h-4 w-4 mr-2" /> Tải về</Button>
                  <Button variant="outline" onClick={handleOpenExternal}><ExternalLink className="h-4 w-4 mr-2" /> Mở bằng trình duyệt</Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="metadata" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-full pr-4">
              <DocumentMetadataTab document={document} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-full pr-4">
              {historyLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có lịch sử thay đổi</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {item.action === "created" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                          {item.action === "updated" && <RefreshCw className="h-5 w-5 text-blue-500" />}
                          {item.action === "deleted" && <XCircle className="h-5 w-5 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getActionBadge(item.action)}
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(item.created_at), "HH:mm dd/MM/yyyy", { locale: vi })}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })})
                            </span>
                          </div>
                          {item.action === "updated" && item.old_data && item.new_data && (
                            <div className="mt-2 text-sm space-y-1">
                              {Object.keys(item.new_data).map((key) => {
                                const oldVal = (item.old_data as Record<string, unknown>)?.[key];
                                const newVal = (item.new_data as Record<string, unknown>)?.[key];
                                if (JSON.stringify(oldVal) !== JSON.stringify(newVal) && !["updated_at", "created_at"].includes(key)) {
                                  return (
                                    <div key={key} className="bg-muted/50 p-2 rounded">
                                      <span className="font-medium">{key}:</span>
                                      <span className="text-red-500 line-through ml-2">{String(oldVal || "-")}</span>
                                      <span className="text-green-500 ml-2">→ {String(newVal || "-")}</span>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          )}
                          {item.action === "created" && item.new_data && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Tạo tài liệu: {(item.new_data as Record<string, unknown>).name as string}
                            </p>
                          )}
                        </div>
                      </div>
                      {index < history.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function TextFilePreview({ filePath }: { filePath: string }) {
  const { data: content, isLoading } = useQuery({
    queryKey: ["text-file", filePath],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("company-documents").download(filePath);
      if (error || !data) throw error;
      return await data.text();
    },
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <ScrollArea className="h-full">
      <pre className="p-4 text-sm whitespace-pre-wrap font-mono bg-muted rounded-lg">{content}</pre>
    </ScrollArea>
  );
}
