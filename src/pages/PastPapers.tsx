import { useEffect, useMemo, useState } from "react";
import { useLibrary } from "@/contexts/LibraryContext";
import { api } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type ExamPaper = {
  id: string;
  title: string;
  course?: string;
  year?: number;
  semester?: string;
  fileUrl: string;
  isApproved: boolean;
  uploadedByName?: string;
  uploadedAt: string;
};

export default function PastPapers() {
  const { currentUser } = useLibrary();
  const canManage = currentUser?.role === "admin" || currentUser?.role === "librarian";

  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const resp = await api.getExamPapers(canManage);
    setIsLoading(false);
    if (!resp.success || !resp.data) {
      toast.error(resp.error || "Failed to load past papers");
      return;
    }
    setPapers(resp.data as ExamPaper[]);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter(p => {
      return (
        p.title.toLowerCase().includes(q) ||
        (p.course || "").toLowerCase().includes(q) ||
        String(p.year || "").includes(q) ||
        (p.semester || "").toLowerCase().includes(q)
      );
    });
  }, [papers, filter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (!file) {
      toast.error("Please choose a PDF file");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("title", title.trim());
    if (course.trim()) fd.append("course", course.trim());
    if (year.trim()) fd.append("year", year.trim());
    if (semester.trim()) fd.append("semester", semester.trim());
    fd.append("pdfFile", file);

    const resp = await api.uploadExamPaper(fd);
    setUploading(false);
    if (!resp.success) {
      toast.error(resp.error || "Upload failed");
      return;
    }

    toast.success("Uploaded. Waiting for approval.");
    setTitle("");
    setCourse("");
    setYear("");
    setSemester("");
    setFile(null);
    await fetchData();
  };

  const setApproved = async (id: string, approved: boolean) => {
    const resp = await api.approveExamPaper(id, approved);
    if (!resp.success) {
      toast.error(resp.error || "Failed to update approval");
      return;
    }
    toast.success(approved ? "Approved" : "Unapproved");
    await fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Past Exam Papers</h1>
          <p className="text-muted-foreground mt-1">Browse and download approved past papers</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search by title, course, year, semester..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Upload a paper (PDF)</CardTitle>
            <CardDescription>Admin/Librarian can upload. Approve to make it visible to students.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Database Systems Final" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course (optional)</label>
                  <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. DBMS" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year (optional)</label>
                  <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2024" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Semester (optional)</label>
                  <Input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. 1" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">PDF file</label>
                <Input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <Button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => (
          <Card key={p.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base line-clamp-2">{p.title}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {[p.course, p.year, p.semester ? `Sem ${p.semester}` : undefined].filter(Boolean).join(" • ") || "—"}
                  </CardDescription>
                </div>
                <Badge variant={p.isApproved ? "secondary" : "outline"}>
                  {p.isApproved ? "Approved" : "Pending"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Uploaded {new Date(p.uploadedAt).toLocaleDateString()}
                {p.uploadedByName ? ` • by ${p.uploadedByName}` : ""}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" disabled={!p.isApproved && !canManage}>
                  <a
                    href={resolveUploadUrl(p.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    download={`${p.title.replace(/[^\w.-]+/g, "_")}.pdf`}
                  >
                    Download
                  </a>
                </Button>

                {canManage && (
                  <Button
                    size="sm"
                    onClick={() => setApproved(p.id, !p.isApproved)}
                    variant={p.isApproved ? "outline" : "default"}
                  >
                    {p.isApproved ? "Unapprove" : "Approve"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <h3 className="text-lg font-medium">No papers found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or upload a new paper.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

