import { useState } from "react";
import { useTraining } from "@/hooks/useTraining";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Award, Calendar, BookOpen, User, Plus, CheckCircle, Clock } from "lucide-react";

interface Props {
  isManager?: boolean;
}

export function TrainingProgramsTab({ isManager = false }: Props) {
  const { programs = [], programsLoading, createProgram } = useTraining();
  const [createOpen, setCreateOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Kỹ năng mềm");
  const [duration, setDuration] = useState("8");
  const [instructor, setInstructor] = useState("");

  const handleCreate = async () => {
    if (!title) return;
    await createProgram.mutateAsync({
      title,
      description,
      category,
      duration_hours: Number(duration),
      instructor,
      materials_url: "",
      is_mandatory: false
    });
    setCreateOpen(false);
    setTitle("");
    setDescription("");
    setInstructor("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Đào tạo & Phát triển năng lực
          </h2>
          <p className="text-muted-foreground text-sm">
            Tạo và quản lý các chương trình đào tạo nội bộ nâng cao kỹ năng đội ngũ
          </p>
        </div>

        {isManager && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm khóa đào tạo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tạo chương trình đào tạo mới</DialogTitle>
                <DialogDescription>Nhập thông tin khóa học để triển khai cho nhân sự</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>Tên khóa đào tạo</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Kỹ năng đàm phán Sales..." />
                </div>
                
                <div className="space-y-1">
                  <Label>Mô tả ngắn</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả mục tiêu khóa học..." />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Phân loại</Label>
                    <select
                      className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Kỹ năng mềm">Kỹ năng mềm</option>
                      <option value="Kỹ thuật & ERP">Kỹ thuật & ERP</option>
                      <option value="Quản trị & Lãnh đạo">Quản trị & Lãnh đạo</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label>Thời lượng (Giờ)</Label>
                    <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Giảng viên / Diễn giả</Label>
                  <Input value={instructor} onChange={(e) => setInstructor(e.target.value)} placeholder="VD: Nguyễn Văn A..." />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
                    Hủy
                  </Button>
                  <Button size="sm" onClick={handleCreate} disabled={createProgram.isPending}>
                    {createProgram.isPending ? "Đang tạo..." : "Tạo khóa học"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programsLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-44 rounded-lg" />)
        ) : programs.length === 0 ? (
          <Card className="col-span-full py-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Chưa có chương trình đào tạo nào được thiết lập</p>
          </Card>
        ) : (
          programs.map((prog: any) => (
            <Card key={prog.id} className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="secondary">{prog.category}</Badge>
                    <Badge variant="outline" className="text-muted-foreground gap-1">
                      <Clock className="h-3 w-3" />
                      {prog.duration_hours} giờ
                    </Badge>
                  </div>
                  <CardTitle className="text-base line-clamp-1">{prog.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">{prog.description || "Không có mô tả"}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>Giảng viên: <strong>{prog.instructor || "Nội bộ"}</strong></span>
                  </div>
                </CardContent>
              </div>
              <div className="p-4 pt-0 border-t mt-4 flex items-center justify-between bg-muted/10 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Tạo ngày: {prog.created_at ? prog.created_at.split("T")[0] : "—"}
                </span>
                <Badge variant={prog.is_mandatory ? "destructive" : "outline"} className="text-[10px]">
                  {prog.is_mandatory ? "Bắt buộc" : "Tự nguyện"}
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
