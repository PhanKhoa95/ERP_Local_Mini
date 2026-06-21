import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2, Search } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Bookmarks() {
  const { bookmarks, isLoading, removeBookmark } = useBookmarks();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-500" />
            Bookmarks của tôi
          </h1>
          <p className="text-muted-foreground">Các câu hỏi và câu trả lời đã lưu</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm trong bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : filteredBookmarks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Chưa có bookmark nào</p>
              <p className="text-sm">Lưu các câu trả lời hữu ích từ trang Tra cứu tài liệu</p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-4">
              {filteredBookmarks.map((bookmark) => (
                <Card key={bookmark.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-medium">{bookmark.question}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeBookmark.mutate(bookmark.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {bookmark.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {bookmark.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {bookmark.answer}
                    </p>
                    {bookmark.citations?.length > 0 && (
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                        <p className="font-medium">Nguồn:</p>
                        {bookmark.citations.map((c: any, i: number) => (
                          <p key={i}>• {c.document_name}</p>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(bookmark.created_at).toLocaleDateString("vi-VN")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </MainLayout>
  );
}
