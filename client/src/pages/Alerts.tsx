import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Bell, BellOff, ExternalLink } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AlertRule } from "@shared/schema";

const triggerTypes = [
  { value: "frequency", label: "Frequency" },
  { value: "condition", label: "Condition" },
  { value: "anomaly", label: "Anomaly" },
  { value: "status_change", label: "Status Change" },
  { value: "sla_breach", label: "SLA Breach" },
];

export default function Alerts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    triggerType: "frequency",
    conditions: {} as Record<string, any>,
    actions: [] as string[],
    isActive: true,
  });

  const { toast } = useToast();

  const { data: alerts = [], isLoading } = useQuery<AlertRule[]>({
    queryKey: ["/api/alert-rules"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<AlertRule>) => apiRequest("POST", "/api/alert-rules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alert-rules"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Alert rule created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create alert rule", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AlertRule> }) =>
      apiRequest("PATCH", `/api/alert-rules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alert-rules"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Alert rule updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update alert rule", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/alert-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alert-rules"] });
      toast({ title: "Alert rule deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete alert rule", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      triggerType: "frequency",
      conditions: {} as Record<string, any>,
      actions: [] as string[],
      isActive: true,
    });
    setEditingAlert(null);
  };

  const handleEdit = (alert: AlertRule) => {
    setEditingAlert(alert);
    setFormData({
      name: alert.name,
      triggerType: alert.triggerType,
      conditions: alert.conditions as object,
      actions: alert.actions as string[],
      isActive: alert.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAlert) {
      updateMutation.mutate({ id: editingAlert.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this alert rule?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
      data-testid="page-alerts"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alert Rules</h1>
          <p className="text-muted-foreground mt-1">
            Configure automated alerts for trap events and system monitoring
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-alert">
              <Plus className="w-4 h-4 mr-2" />
              Add Alert Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAlert ? "Edit Alert Rule" : "Create Alert Rule"}</DialogTitle>
              <DialogDescription>
                Define conditions and actions for automated alerting
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., High Severity Alert"
                  required
                  data-testid="input-name"
                />
              </div>

              <div>
                <Label htmlFor="triggerType">Trigger Type</Label>
                <select
                  id="triggerType"
                  value={formData.triggerType}
                  onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>option]:bg-background [&>option]:text-foreground"
                  data-testid="select-trigger-type"
                >
                  {triggerTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="conditions">Conditions (JSON)</Label>
                <Textarea
                  id="conditions"
                  value={JSON.stringify(formData.conditions, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, conditions: parsed });
                    } catch {
                      // Invalid JSON, keep the text
                    }
                  }}
                  placeholder='{"severity": "critical", "chainId": 17000}'
                  rows={4}
                  data-testid="input-conditions"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Filter events by severity, chainId, contractAddress, etc. Leave as {} for all events.
                </p>
              </div>

              <div>
                <Label htmlFor="actions">Actions (comma-separated)</Label>
                <Input
                  id="actions"
                  value={(formData.actions as string[]).join(", ")}
                  onChange={(e) => setFormData({ ...formData, actions: e.target.value.split(",").map(s => s.trim()) })}
                  placeholder="discord, telegram, email"
                  data-testid="input-actions"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="switch-active"
                />
                <Label htmlFor="isActive">Active</Label>
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
                  {editingAlert ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Telegram Notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This is a shared team tool. All alerts are sent to the configured Telegram bot.
            </p>
            <a
              href="https://t.me/droseraProtocol_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              data-testid="link-telegram-bot"
            >
              Open Telegram Bot
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-muted-foreground">Loading alert rules...</div>
        </div>
      ) : alerts.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No alert rules configured yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first alert rule to get started</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-4 hover-elevate" data-testid={`card-alert-${alert.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {alert.isActive ? (
                    <Bell className="w-5 h-5 text-primary" />
                  ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  )}
                  <h3 className="font-semibold text-foreground">{alert.name}</h3>
                </div>
                <Badge variant={alert.isActive ? "default" : "secondary"} data-testid="badge-status">
                  {alert.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Trigger: </span>
                  <span className="text-foreground">{alert.triggerType}</span>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Actions: </span>
                  <span className="text-foreground">
                    {(alert.actions as string[]).join(", ") || "None"}
                  </span>
                </div>

                {alert.rateLimit && (
                  <div>
                    <span className="text-muted-foreground">Rate Limit: </span>
                    <span className="text-foreground">{alert.rateLimit}/hour</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(alert)}
                  className="flex-1"
                  data-testid="button-edit"
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(alert.id)}
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
