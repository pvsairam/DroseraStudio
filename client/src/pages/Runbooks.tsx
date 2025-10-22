import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Book, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Runbook } from "@shared/schema";

export default function Runbooks() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRunbook, setEditingRunbook] = useState<Runbook | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: [] as string[],
    trapTypeId: null as string | null,
  });

  const { toast } = useToast();

  const { data: runbooks = [], isLoading } = useQuery<Runbook[]>({
    queryKey: ["/api/runbooks"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Runbook>) => apiRequest("POST", "/api/runbooks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/runbooks"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Runbook created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create runbook", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Runbook> }) =>
      apiRequest("PATCH", `/api/runbooks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/runbooks"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Runbook updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update runbook", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/runbooks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/runbooks"] });
      toast({ title: "Runbook deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete runbook", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      tags: [],
      trapTypeId: null,
    });
    setEditingRunbook(null);
  };

  const handleEdit = (runbook: Runbook) => {
    setEditingRunbook(runbook);
    setFormData({
      title: runbook.title,
      content: runbook.content,
      tags: (runbook.tags as string[]) || [],
      trapTypeId: runbook.trapTypeId,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRunbook) {
      updateMutation.mutate({ id: editingRunbook.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this runbook?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
      data-testid="page-runbooks"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Runbooks</h1>
          <p className="text-muted-foreground mt-1">
            Operational playbooks and incident response procedures
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-runbook">
              <Plus className="w-4 h-4 mr-2" />
              Add Runbook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRunbook ? "Edit Runbook" : "Create Runbook"}</DialogTitle>
              <DialogDescription>
                Document operational procedures and incident response steps
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Critical Trap Event Response"
                  required
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="content">Content (Markdown supported)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="## Steps&#10;1. First step&#10;2. Second step&#10;..."
                  rows={12}
                  required
                  data-testid="input-content"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(", ")}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  placeholder="critical, security, monitoring"
                  data-testid="input-tags"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {editingRunbook ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-muted-foreground">Loading runbooks...</div>
        </div>
      ) : runbooks.length === 0 ? (
        <Card className="p-8 text-center">
          <Book className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No runbooks created yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first runbook to document procedures</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {runbooks.map((runbook) => (
            <Card key={runbook.id} className="p-4 hover-elevate" data-testid={`card-runbook-${runbook.id}`}>
              <div className="flex items-start gap-3 mb-3">
                <Book className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">{runbook.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {runbook.content.split('\n')[0]}
                  </p>
                </div>
              </div>

              {(runbook.tags as string[]).length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {(runbook.tags as string[]).slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs" data-testid="badge-tag">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {(runbook.tags as string[]).length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{(runbook.tags as string[]).length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground mb-3">
                Updated {new Date(runbook.updatedAt).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(runbook)}
                  className="flex-1"
                  data-testid="button-edit"
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(runbook.id)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
