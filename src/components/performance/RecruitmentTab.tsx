import { useState } from "react";
import { useRecruitment } from "@/hooks/useRecruitment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Briefcase, Users, Brain, Star, Eye, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Nháp", color: "bg-muted text-muted-foreground" },
  open: { label: "Đang tuyển", color: "bg-green-100 text-green-700" },
  closed: { label: "Đã đóng", color: "bg-red-100 text-red-700" },
  new: { label: "Mới", color: "bg-blue-100 text-blue-700" },
  screening: { label: "Đang sàng lọc", color: "bg-yellow-100 text-yellow-700" },
  interview: { label: "Phỏng vấn", color: "bg-purple-100 text-purple-700" },
  offered: { label: "Đã offer", color: "bg-orange-100 text-orange-700" },
  accepted: { label: "Đã nhận", color: "bg-green-100 text-green-700" },
  rejected: { label: "Từ chối", color: "bg-red-100 text-red-700" },
};

const RECOMMENDATION_MAP: Record<string, { label: string; color: string }> = {
  highly_recommended: { label: "Rất phù hợp", color: "bg-green-100 text-green-700" },
  recommended: { label: "Phù hợp", color: "bg-blue-100 text-blue-700" },
  consider: { label: "Cân nhắc", color: "bg-yellow-100 text-yellow-700" },
  not_recommended: { label: "Không phù hợp", color: "bg-red-100 text-red-700" },
};

export function RecruitmentTab() {
  const { postings, applications, createPosting, createApplication, updatePosting, updateApplication } = useRecruitment();
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState<any>(null);
  const [screening, setScreening] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState({ title: "", department: "", description: "", salary_range: "", location: "" });
  const [candidateForm, setCandidateForm] = useState({ candidate_name: "", candidate_email: "", candidate_phone: "", notes: "" });

  const handleCreateJob = () => {
    if (!jobForm.title.trim()) return;
    createPosting.mutate(jobForm, { onSuccess: () => { setShowCreateJob(false); setJobForm({ title: "", department: "", description: "", salary_range: "", location: "" }); } });
  };

  const handleAddCandidate = () => {
    if (!candidateForm.candidate_name.trim() || !showAddCandidate) return;
    createApplication.mutate({ ...candidateForm, posting_id: showAddCandidate }, {
      onSuccess: () => { setShowAddCandidate(null); setCandidateForm({ candidate_name: "", candidate_email: "", candidate_phone: "", notes: "" }); },
    });
  };

  const handleScreenCV = async (app: any) => {
    const posting = postings.find((p: any) => p.id === app.posting_id);
    if (!posting?.description) {
      toast.error("Tin tuyển dụng chưa có mô tả công việc");
      return;
    }
    setScreening(app.id);
    try {
      const { data, error } = await supabase.functions.invoke("ai-screen-cv", {
        body: {
          application_id: app.id,
          cv_text: app.notes || `Ứng viên: ${app.candidate_name}. ${app.notes || ""}`,
          job_description: posting.description,
        },
      });
      if (error) throw error;
      if (data?.analysis) {
        setShowAnalysis(data.analysis);
        toast.success("Đã phân tích CV xong!");
      }
    } catch (e: any) {
      toast.error(e.message || "Lỗi phân tích CV");
    } finally {
      setScreening(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = STATUS_MAP[status] || { label: status, color: "bg-muted text-muted-foreground" };
    return <Badge className={`${s.color} border-0`}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="postings">
        <TabsList>
          <TabsTrigger value="postings" className="gap-2">
            <Briefcase className="h-4 w-4" /> Tin tuyển dụng
          </TabsTrigger>
          <TabsTrigger value="candidates" className="gap-2">
            <Users className="h-4 w-4" /> Ứng viên
          </TabsTrigger>
        </TabsList>

        <TabsContent value="postings" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateJob(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Tạo tin tuyển dụng
            </Button>
          </div>

          {postings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Chưa có tin tuyển dụng nào</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {postings.map((job: any) => {
                const jobApps = applications.filter((a: any) => a.posting_id === job.id);
                return (
                  <Card key={job.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{job.title}</CardTitle>
                          <CardDescription>{job.department || "Chưa có phòng ban"}{job.location ? ` • ${job.location}` : ""}</CardDescription>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {job.salary_range && <p className="text-sm text-muted-foreground">💰 {job.salary_range}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{jobApps.length} ứng viên</span>
                        <div className="flex gap-2">
                          {job.status === "draft" && (
                            <Button size="sm" variant="outline" onClick={() => updatePosting.mutate({ id: job.id, status: "open" })}>
                              Mở tuyển
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setShowAddCandidate(job.id)} className="gap-1">
                            <Plus className="h-3 w-3" /> Thêm UV
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="candidates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách ứng viên</CardTitle>
              <CardDescription>Quản lý và sàng lọc ứng viên bằng AI</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  Chưa có ứng viên
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ứng viên</TableHead>
                      <TableHead>Vị trí</TableHead>
                      <TableHead>Điểm AI</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app: any) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.candidate_name}</p>
                            <p className="text-xs text-muted-foreground">{app.candidate_email || app.candidate_phone || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{app.job_postings?.title || "—"}</TableCell>
                        <TableCell>
                          {app.ai_score != null ? (
                            <div className="flex items-center gap-1.5">
                              <Star className="h-3.5 w-3.5 text-yellow-500" />
                              <span className="font-semibold">{app.ai_score}</span>
                              {app.ai_analysis?.recommendation && (
                                <Badge className={`${RECOMMENDATION_MAP[app.ai_analysis.recommendation]?.color || ""} border-0 text-[10px] ml-1`}>
                                  {RECOMMENDATION_MAP[app.ai_analysis.recommendation]?.label}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Chưa chấm</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => handleScreenCV(app)} disabled={screening === app.id} className="gap-1 text-xs">
                              <Brain className="h-3 w-3" /> {screening === app.id ? "Đang..." : "AI Sàng lọc"}
                            </Button>
                            {app.ai_analysis && (
                              <Button size="sm" variant="ghost" onClick={() => setShowAnalysis(app.ai_analysis)} className="gap-1 text-xs">
                                <Eye className="h-3 w-3" /> Xem
                              </Button>
                            )}
                            {app.status !== "accepted" && (
                              <Select onValueChange={(v) => updateApplication.mutate({ id: app.id, status: v })}>
                                <SelectTrigger className="h-7 w-auto text-xs">
                                  <ChevronRight className="h-3 w-3" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="screening">Sàng lọc</SelectItem>
                                  <SelectItem value="interview">Phỏng vấn</SelectItem>
                                  <SelectItem value="offered">Offer</SelectItem>
                                  <SelectItem value="accepted">Nhận việc</SelectItem>
                                  <SelectItem value="rejected">Từ chối</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Job Dialog */}
      <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo tin tuyển dụng</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vị trí *</Label>
              <Input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="VD: Frontend Developer" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phòng ban</Label>
                <Input value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} placeholder="VD: Engineering" />
              </div>
              <div>
                <Label>Địa điểm</Label>
                <Input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} placeholder="VD: Hà Nội" />
              </div>
            </div>
            <div>
              <Label>Mức lương</Label>
              <Input value={jobForm.salary_range} onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })} placeholder="VD: 15-25 triệu" />
            </div>
            <div>
              <Label>Mô tả công việc (dùng cho AI sàng lọc)</Label>
              <Textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} rows={5} placeholder="Mô tả chi tiết yêu cầu, kỹ năng, kinh nghiệm..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateJob(false)}>Hủy</Button>
            <Button onClick={handleCreateJob} disabled={createPosting.isPending}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Candidate Dialog */}
      <Dialog open={!!showAddCandidate} onOpenChange={() => setShowAddCandidate(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm ứng viên</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Họ tên *</Label>
              <Input value={candidateForm.candidate_name} onChange={(e) => setCandidateForm({ ...candidateForm, candidate_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={candidateForm.candidate_email} onChange={(e) => setCandidateForm({ ...candidateForm, candidate_email: e.target.value })} />
              </div>
              <div>
                <Label>Điện thoại</Label>
                <Input value={candidateForm.candidate_phone} onChange={(e) => setCandidateForm({ ...candidateForm, candidate_phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Ghi chú / Nội dung CV</Label>
              <Textarea value={candidateForm.notes} onChange={(e) => setCandidateForm({ ...candidateForm, notes: e.target.value })} rows={4} placeholder="Dán nội dung CV hoặc ghi chú về ứng viên..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCandidate(null)}>Hủy</Button>
            <Button onClick={handleAddCandidate} disabled={createApplication.isPending}>Thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Analysis Dialog */}
      <Dialog open={!!showAnalysis} onOpenChange={() => setShowAnalysis(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Brain className="h-5 w-5" /> Kết quả sàng lọc AI</DialogTitle></DialogHeader>
          {showAnalysis && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{showAnalysis.overall_score}</p>
                  <p className="text-xs text-muted-foreground">Điểm tổng</p>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded-lg bg-muted">
                    <p className="text-muted-foreground">Kỹ năng</p>
                    <p className="font-semibold">{showAnalysis.skill_match}/100</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <p className="text-muted-foreground">Kinh nghiệm</p>
                    <p className="font-semibold">{showAnalysis.experience_match}/100</p>
                  </div>
                </div>
              </div>
              {showAnalysis.recommendation && (
                <Badge className={`${RECOMMENDATION_MAP[showAnalysis.recommendation]?.color || ""} border-0`}>
                  {RECOMMENDATION_MAP[showAnalysis.recommendation]?.label}
                </Badge>
              )}
              <p className="text-sm">{showAnalysis.summary}</p>
              {showAnalysis.strengths?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-green-600 mb-1">✅ Điểm mạnh</p>
                  <ul className="text-sm space-y-1">{showAnalysis.strengths.map((s: string, i: number) => <li key={i}>• {s}</li>)}</ul>
                </div>
              )}
              {showAnalysis.weaknesses?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-1">⚠️ Điểm yếu</p>
                  <ul className="text-sm space-y-1">{showAnalysis.weaknesses.map((s: string, i: number) => <li key={i}>• {s}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
